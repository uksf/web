#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${UKSF_WEB_DIR:-$(git -C "$SCRIPTS" rev-parse --show-toplevel)}" && pwd -P)"
VERIFY_HOME="${UKSF_VERIFY_HOME:-$HOME/.uksf-verify}"
mkdir -p "$VERIFY_HOME"
VERIFY_HOME="$(cd "$VERIFY_HOME" && pwd -P)"
LOCK="${TMPDIR:-/tmp}/uksf-verify.lock"
API_PORT=5500
WEB_PORT=4200
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="$DOTNET_ROOT:$HOME/.bun/bin:$PATH"

current_run() {
  [[ -f "$VERIFY_HOME/current" ]] || { echo "no verify run is active in $VERIFY_HOME" >&2; exit 1; }
  cat "$VERIFY_HOME/current"
}

run_dir() {
  echo "$VERIFY_HOME/runs/$1"
}

listener() {
  lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1 || true
}

started_at() {
  ps -o lstart= -p "$1" 2>/dev/null | tr -s ' ' || true
}

same_process() {
  [[ -n "$(started_at "$1")" && "$(started_at "$1")" == "$2" ]]
}

cwd_of() {
  lsof -nP -a -p "$1" -d cwd 2>/dev/null | awk 'NR > 1 {print $NF}'
}

source_id() {
  local repo="$1" index
  index="$(mktemp)" || return 1
  cp "$(git -C "$repo" rev-parse --absolute-git-dir)/index" "$index" || { rm -f "$index"; return 1; }
  GIT_INDEX_FILE="$index" git -C "$repo" add -A >/dev/null 2>&1 || { rm -f "$index"; return 1; }
  GIT_INDEX_FILE="$index" git -C "$repo" write-tree || { rm -f "$index"; return 1; }
  rm -f "$index"
}

settings_hash() {
  shasum "$1/UKSF.Api/appsettings.Development.json" | cut -c1-16
}

wait_for() {
  local seconds="$1" description="$2"
  shift 2
  local deadline=$((SECONDS + seconds))
  while ((SECONDS < deadline)); do
    if "$@" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "timed out after ${seconds}s waiting for $description" >&2
  return 1
}

api_started() {
  grep -q "Application started" "$1/api.log"
}

http_status() {
  curl -s -m 5 -o /dev/null -w "%{http_code}" "$1" || true
}

web_ready() {
  [[ "$(http_status "http://localhost:$WEB_PORT/")" == "200" ]]
}

data() {
  local dir="$1"
  shift
  dotnet run "$SCRIPTS/verify-data.cs" -- "$dir/settings.json" "$@" 2>/dev/null
}

up() {
  local api_dir
  api_dir="$(cd "${UKSF_API_DIR:-$HOME/Workspace/uksf/api}" && pwd -P)"
  mkdir "$LOCK" 2>/dev/null || { echo "refusing: another verify run holds $LOCK ($(cat "$LOCK/run" 2>/dev/null)); run '$0 down' with its UKSF_VERIFY_HOME ($(cat "$LOCK/home" 2>/dev/null))" >&2; exit 1; }
  local run dir
  run="v$(date -u +%Y%m%d%H%M%S)-$(openssl rand -hex 2)"
  dir="$(run_dir "$run")"
  echo "$run" > "$LOCK/run"
  echo "$VERIFY_HOME" > "$LOCK/home"
  mkdir -p "$dir/email" "$dir/evidence" "$dir/drivers"
  touch "$dir/owned"
  echo "$api_dir" > "$dir/api-dir"
  echo "$run" > "$VERIFY_HOME/current"
  trap 'echo "up failed; cleaning up run '"$run"'" >&2; down' ERR
  for port in $API_PORT $WEB_PORT; do
    [[ -z "$(listener "$port")" ]] || { echo "refusing: port $port is in use by pid $(listener "$port"); this skill drives only instances it starts" >&2; false; }
  done
  if env | grep -qiE '^(appSettings|connectionStrings|Kestrel|ASPNETCORE_URLS)'; then
    echo "refusing: an environment variable overrides API configuration; unset it" >&2
    false
  fi
  node "$SCRIPTS/check-web-deps.mjs" "$WEB_DIR"
  cp "$api_dir/UKSF.Api/appsettings.Development.json" "$dir/settings.json"
  chmod 600 "$dir/settings.json"
  settings_hash "$api_dir" > "$dir/api-settings"
  source_id "$api_dir" > "$dir/api-source"
  source_id "$WEB_DIR" > "$dir/web-source"

  echo "building the API at $(git -C "$api_dir" rev-parse --short HEAD) (source tree $(cut -c1-12 "$dir/api-source"))"
  dotnet build "$api_dir/UKSF.Api/UKSF.Api.csproj" -c Debug -o "$dir/api-bin" -v quiet -nologo > "$dir/api-build.log" 2>&1

  ASPNETCORE_ENVIRONMENT=Development UKSF_VERIFY_MODE=1 UKSF_VERIFY_EMAIL_DIR="$dir/email" \
    nohup "$dir/api-bin/UKSF.Api" --contentRoot "$api_dir/UKSF.Api" > "$dir/api.log" 2>&1 &
  echo $! > "$dir/api.pid"
  started_at "$(cat "$dir/api.pid")" > "$dir/api.started"

  cd "$WEB_DIR"
  nohup python3 -c 'import os, sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' \
    node node_modules/@angular/cli/bin/ng.js serve --port "$WEB_PORT" > "$dir/web.log" 2>&1 &
  echo $! > "$dir/web.pgid"
  started_at "$(cat "$dir/web.pgid")" > "$dir/web.started"
  cd - >/dev/null

  wait_for 120 "the API to start" api_started "$dir"
  wait_for 240 "the web dev server" web_ready
  trap - ERR
  echo "run $run is up: api pid $(cat "$dir/api.pid"), web process group $(cat "$dir/web.pgid"), evidence in $dir/evidence"
}

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then echo "PASS $label"; else echo "FAIL $label"; failures=$((failures + 1)); fi
}

no_discord() {
  ! grep -qiE 'Discord connecting|Discord logged in' "$1/api.log"
}

connections_ok() {
  local remotes="$1" mongo_ips="$2" mongo_port="$3" remote host port
  while read -r remote; do
    [[ -z "$remote" ]] && continue
    host="${remote%:*}"
    port="${remote##*:}"
    host="${host#[}"
    host="${host%]}"
    if [[ "$host" == "127.0.0.1" || "$host" == "::1" ]]; then
      [[ "$port" == "$API_PORT" || "$port" == "$WEB_PORT" ]] || return 1
    else
      grep -qx "$host" <<< "$mongo_ips" && [[ "$port" == "$mongo_port" ]] || return 1
    fi
  done <<< "$remotes"
}

owned() {
  local run dir
  run="$(current_run)"
  dir="$(run_dir "$run")"
  [[ -z "${1:-}" || "$1" == "$run" ]] || { echo "run $1 is not the active run $run" >&2; return 1; }
  [[ "$(cat "$LOCK/run" 2>/dev/null)" == "$run" && "$(cat "$LOCK/home" 2>/dev/null)" == "$VERIFY_HOME" ]] || { echo "the lock does not belong to run $run in $VERIFY_HOME" >&2; return 1; }
  [[ ! -e "$dir/teardown" ]] || { echo "run $run is being torn down" >&2; return 1; }
  [[ "$(settings_hash "$(cat "$dir/api-dir")")" == "$(cat "$dir/api-settings")" ]] || { echo "the API settings file changed since up" >&2; return 1; }
  [[ "$(listener $API_PORT)" == "$(cat "$dir/api.pid")" ]] && same_process "$(cat "$dir/api.pid")" "$(cat "$dir/api.started")" || { echo "port $API_PORT is not held by run $run's API" >&2; return 1; }
  same_process "$(cat "$dir/web.pgid")" "$(cat "$dir/web.started")" || { echo "run $run's web server is gone" >&2; return 1; }
  [[ "$(ps -o pgid= -p "$(listener $WEB_PORT)" 2>/dev/null | tr -d ' ')" == "$(cat "$dir/web.pgid")" ]] || { echo "port $WEB_PORT is not held by run $run's web server" >&2; return 1; }
}

doctor() {
  local run dir api_pid
  run="$(current_run)"
  dir="$(run_dir "$run")"
  api_pid="$(cat "$dir/api.pid")"
  failures=0
  echo "run $run"
  check "this run owns the lock, both ports, its recorded processes, and unchanged API settings" owned "$run"
  check "the web process group serves $WEB_DIR" test "$(cwd_of "$(listener $WEB_PORT)")" = "$WEB_DIR"
  local api_now web_now
  api_now="$(source_id "$(cat "$dir/api-dir")")" || api_now="hashing failed"
  web_now="$(source_id "$WEB_DIR")" || web_now="hashing failed"
  check "API source is unchanged since up" test "$api_now" = "$(cat "$dir/api-source")"
  check "web source is unchanged since up" test "$web_now" = "$(cat "$dir/web-source")"
  check "verify mode skipped migrations" grep -q "verify mode: database migrations are not run" "$dir/api.log"
  check "verify mode skipped integrations" grep -q "verify mode: Teamspeak, Discord, the scheduler and queued builds are not started" "$dir/api.log"
  check "discord never connected" no_discord "$dir"
  check "unauthenticated GET /accounts is rejected with 401" test "$(http_status "http://localhost:$API_PORT/accounts")" = "401"
  local described reported expected mongo_ips mongo_port remotes
  described="$(data "$dir" doctor || true)"
  reported="$(sed -n 's/^verify mode: database \(.*\)$/\1/p' "$dir/api.log" | head -1)"
  expected="$(sed -n 's/^database=\([^ ]*\) server=\([^ ]*\) .*/\1 at \2/p' <<< "$described")"
  echo "API reports database: ${reported:-nothing}; expected: ${expected:-unknown}"
  check "the API's own database is devLocal on the expected server" test -n "$reported" -a "$reported" = "$expected"
  check "web dev server answers 200" web_ready
  mongo_ips="$(sed -n 's/.* ips=\([^ ]*\).*/\1/p' <<< "$described" | tr ',' '\n')"
  mongo_port="${expected##*:}"
  remotes="$(lsof -nP -a -p "$api_pid" -iTCP -sTCP:ESTABLISHED 2>/dev/null | awk 'NR > 1 {split($9, ends, "->"); print ends[2]}' | sort -u || true)"
  echo "API connections now: ${remotes:-none}"
  check "every API connection in this snapshot is the Mongo server and port, or this run's ports" connections_ok "$remotes" "$mongo_ips" "$mongo_port"
  [[ $failures -eq 0 ]] && echo "doctor: healthy" || { echo "doctor: $failures check(s) failed"; return 1; }
}

live_drivers() {
  local lease
  for lease in "$1"/drivers/*; do
    [[ -f "$lease" ]] || continue
    same_process "$(basename "$lease")" "$(cat "$lease")" && echo "$(basename "$lease")"
  done
}

no_live_drivers() {
  [[ -z "$(live_drivers "$1")" ]]
}

api_stopped() {
  ! same_process "$1" "$2"
}

stop_api() {
  local dir="$1" pid started
  [[ -f "$dir/api.pid" ]] || return 0
  pid="$(cat "$dir/api.pid")"
  started="$(cat "$dir/api.started")"
  same_process "$pid" "$started" || return 0
  kill -TERM "$pid"
  wait_for 30 "the API to stop" api_stopped "$pid" "$started" && return 0
  same_process "$pid" "$started" && kill -KILL "$pid"
  wait_for 10 "the API to die" api_stopped "$pid" "$started"
}

group_gone() {
  [[ -z "$(ps -axo pgid= | awk -v g="$1" '$1 == g')" ]]
}

stop_web() {
  local dir="$1" group started
  [[ -f "$dir/web.pgid" ]] || return 0
  group="$(cat "$dir/web.pgid")"
  started="$(cat "$dir/web.started")"
  if same_process "$group" "$started"; then
    kill -TERM -- "-$group"
    wait_for 30 "the web server to stop" group_gone "$group" && return 0
    same_process "$group" "$started" && kill -KILL -- "-$group"
    wait_for 10 "the web server to die" group_gone "$group" && return 0
  fi
  group_gone "$group" && return 0
  echo "process group $group still has members ($(ps -axo pid=,pgid= | awk -v g="$group" '$2 == g {print $1}' | tr '\n' ' ')) whose leader is gone, so they cannot be proven ours; stop them, then run down again" >&2
  return 1
}

down() {
  trap - ERR
  local run dir
  run="$(cat "$VERIFY_HOME/current" 2>/dev/null || true)"
  [[ -n "$run" ]] || { echo "no verify run is active in $VERIFY_HOME" >&2; return 1; }
  dir="$(run_dir "$run")"
  if [[ "$(cat "$LOCK/run" 2>/dev/null)" != "$run" || "$(cat "$LOCK/home" 2>/dev/null)" != "$VERIFY_HOME" ]]; then
    echo "refusing: the lock belongs to run $(cat "$LOCK/run" 2>/dev/null) in $(cat "$LOCK/home" 2>/dev/null), not $run in $VERIFY_HOME" >&2
    return 1
  fi
  mkdir "$dir/teardown" 2>/dev/null || { echo "refusing: another down is tearing run $run down" >&2; return 1; }
  trap "rmdir '$dir/teardown' 2>/dev/null || true" EXIT
  if ! wait_for 300 "running drivers to finish" no_live_drivers "$dir"; then
    echo "refusing: drivers $(live_drivers "$dir" | tr '\n' ' ')are still running; stop them, then run down again" >&2
    return 1
  fi
  stop_api "$dir" || return 1
  stop_web "$dir" || return 1
  local kinds
  kinds="$(sort -u "$dir/owned" | tr '\n' ' ')" || { echo "the run's ownership manifest is unreadable" >&2; return 1; }
  if [[ -n "$kinds" ]] && ! { data "$dir" cleanup "$run" --dry-run $kinds > "$dir/evidence/cleanup-dry-run.json" && cat "$dir/evidence/cleanup-dry-run.json" && data "$dir" cleanup "$run" $kinds > "$dir/evidence/cleanup.json"; }; then
    echo "processes stopped, but cleanup of $kinds failed; run down again to retry" >&2
    return 1
  fi
  [[ -n "$kinds" ]] || echo '{"cleanup":"no records were created"}' > "$dir/evidence/cleanup.json"
  cat "$dir/evidence/cleanup.json"
  echo
  rm -rf "$dir/api-bin" "$dir/teardown" "$dir/settings.json"
  rm -f "$dir/api.pid" "$dir/api.started" "$dir/web.pgid" "$dir/web.started" "$VERIFY_HOME/current"
  [[ "$(cat "$LOCK/run" 2>/dev/null)" == "$run" ]] && rm -rf "$LOCK"
  echo "run $run is down; evidence kept in $dir/evidence"
}

case "${1:-}" in
  up) up ;;
  doctor) doctor ;;
  down) down ;;
  owned) owned "${2:-}" ;;
  run-id) current_run ;;
  dir) run_dir "$(current_run)" ;;
  *) echo "usage: $0 up|doctor|down|owned [run-id]|run-id|dir" >&2; exit 2 ;;
esac
