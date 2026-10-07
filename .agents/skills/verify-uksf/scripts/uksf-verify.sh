#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="${UKSF_WEB_DIR:-$(git -C "$SCRIPTS" rev-parse --show-toplevel)}"
API_DIR="${UKSF_API_DIR:-$HOME/Workspace/uksf/api}"
VERIFY_HOME="${UKSF_VERIFY_HOME:-$HOME/.uksf-verify}"
LOCK="${TMPDIR:-/tmp}/uksf-verify.lock"
API_PORT=5500
WEB_PORT=4200
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export PATH="$DOTNET_ROOT:$HOME/.bun/bin:$PATH"

current_run() {
  [[ -f "$VERIFY_HOME/current" ]] || { echo "no verify run is active" >&2; exit 1; }
  cat "$VERIFY_HOME/current"
}

listener() {
  lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1 || true
}

started_at() {
  ps -o lstart= -p "$1" 2>/dev/null | tr -s ' ' || true
}

cwd_of() {
  lsof -nP -a -p "$1" -d cwd 2>/dev/null | awk 'NR > 1 {print $NF}'
}

pid_gone() {
  ! kill -0 "$1" 2>/dev/null
}

group_gone() {
  [[ -z "$(group_members "$1")" ]]
}

group_members() {
  ps -axo pid=,pgid= | awk -v group="$1" '$2 == group {print $1}'
}

source_id() {
  local repo="$1"
  {
    git -C "$repo" rev-parse HEAD
    git -C "$repo" diff HEAD
    git -C "$repo" ls-files -o --exclude-standard -z | (cd "$repo" && xargs -0 shasum 2>/dev/null) || true
  } | shasum | cut -c1-16
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
  dotnet run "$SCRIPTS/verify-data.cs" -- "$API_DIR" "$@" 2>/dev/null
}

up() {
  mkdir "$LOCK" 2>/dev/null || { echo "refusing: another verify run holds $LOCK ($(cat "$LOCK/run" 2>/dev/null)); run '$0 down' first" >&2; exit 1; }
  local run dir
  run="v$(date -u +%Y%m%d%H%M%S)-$(openssl rand -hex 2)"
  dir="$VERIFY_HOME/runs/$run"
  echo "$run" > "$LOCK/run"
  trap 'echo "up failed; cleaning up run '"$run"'" >&2; down' ERR
  for port in $API_PORT $WEB_PORT; do
    [[ -z "$(listener "$port")" ]] || { echo "refusing: port $port is in use by pid $(listener "$port"); this skill drives only instances it starts" >&2; rmdir_lock; exit 1; }
  done
  if env | grep -qiE '^(appSettings|connectionStrings|Kestrel|ASPNETCORE_URLS)'; then
    echo "refusing: an environment variable overrides API configuration; unset it" >&2; rmdir_lock; exit 1
  fi
  [[ -f "$API_DIR/UKSF.Api/appsettings.Development.json" ]] || { echo "missing $API_DIR/UKSF.Api/appsettings.Development.json" >&2; rmdir_lock; exit 1; }

  mkdir -p "$dir/email" "$dir/evidence"
  mkdir -p "$VERIFY_HOME"
  echo "$run" > "$VERIFY_HOME/current"
  source_id "$API_DIR" > "$dir/api-source"
  source_id "$WEB_DIR" > "$dir/web-source"
  git -C "$API_DIR" rev-parse HEAD > "$dir/api-commit"
  git -C "$WEB_DIR" rev-parse HEAD > "$dir/web-commit"

  echo "building the API at $(cut -c1-8 "$dir/api-commit") (source $(cat "$dir/api-source"))"
  dotnet build "$API_DIR/UKSF.Api/UKSF.Api.csproj" -c Debug -o "$dir/api-bin" -v quiet -nologo > "$dir/api-build.log" 2>&1

  ASPNETCORE_ENVIRONMENT=Development UKSF_VERIFY_MODE=1 UKSF_VERIFY_EMAIL_DIR="$dir/email" \
    nohup "$dir/api-bin/UKSF.Api" --contentRoot "$API_DIR/UKSF.Api" > "$dir/api.log" 2>&1 &
  echo $! > "$dir/api.pid"
  started_at "$(cat "$dir/api.pid")" > "$dir/api.started"

  cd "$WEB_DIR"
  nohup python3 -c 'import os, sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' \
    node node_modules/@angular/cli/bin/ng.js serve --port "$WEB_PORT" > "$dir/web.log" 2>&1 &
  echo $! > "$dir/web.pgid"
  cd - >/dev/null

  wait_for 120 "the API to start" api_started "$dir"
  wait_for 240 "the web dev server" web_ready
  trap - ERR
  echo "run $run is up: api pid $(cat "$dir/api.pid"), web process group $(cat "$dir/web.pgid"), evidence in $dir/evidence"
}

rmdir_lock() {
  rm -rf "$LOCK"
  trap - ERR
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
  local remotes="$1" mongo_ips="$2" remote host port
  while read -r remote; do
    [[ -z "$remote" ]] && continue
    host="${remote%:*}"
    port="${remote##*:}"
    host="${host#[}"
    host="${host%]}"
    if [[ "$host" == "127.0.0.1" || "$host" == "::1" ]]; then
      [[ "$port" == "$API_PORT" || "$port" == "$WEB_PORT" ]] || return 1
    else
      grep -qx "$host" <<< "$mongo_ips" || return 1
    fi
  done <<< "$remotes"
}

api_database_line() {
  sed -n 's/^verify mode: database \(.*\)$/\1/p' "$1/api.log" | head -1
}

owned() {
  local run dir
  run="$(current_run)"
  dir="$VERIFY_HOME/runs/$run"
  [[ -z "${1:-}" || "$1" == "$run" ]] || { echo "run $1 is not the active run $run" >&2; return 1; }
  [[ "$(cat "$LOCK/run" 2>/dev/null)" == "$run" ]] || { echo "the lock does not belong to run $run" >&2; return 1; }
  [[ "$(listener $API_PORT)" == "$(cat "$dir/api.pid")" ]] || { echo "port $API_PORT is not held by run $run's API" >&2; return 1; }
  [[ "$(started_at "$(cat "$dir/api.pid")")" == "$(cat "$dir/api.started")" ]] || { echo "the API pid was reused" >&2; return 1; }
  [[ "$(ps -o pgid= -p "$(listener $WEB_PORT)" 2>/dev/null | tr -d ' ')" == "$(cat "$dir/web.pgid")" ]] || { echo "port $WEB_PORT is not held by run $run's web server" >&2; return 1; }
}

doctor() {
  local run dir api_pid
  run="$(current_run)"
  dir="$VERIFY_HOME/runs/$run"
  api_pid="$(cat "$dir/api.pid")"
  failures=0
  echo "run $run"
  check "this run owns the lock, both ports, and its recorded processes" owned "$run"
  check "the web process group serves $WEB_DIR" test "$(cwd_of "$(listener $WEB_PORT)")" = "$WEB_DIR"
  check "API source is unchanged since up ($(cat "$dir/api-source"))" test "$(source_id "$API_DIR")" = "$(cat "$dir/api-source")"
  check "web source is unchanged since up ($(cat "$dir/web-source"))" test "$(source_id "$WEB_DIR")" = "$(cat "$dir/web-source")"
  check "verify mode skipped migrations" grep -q "verify mode: database migrations are not run" "$dir/api.log"
  check "verify mode skipped integrations" grep -q "verify mode: Teamspeak, Discord, the scheduler and queued builds are not started" "$dir/api.log"
  check "discord never connected" no_discord "$dir"
  check "unauthenticated GET /accounts is rejected with 401" test "$(http_status "http://localhost:$API_PORT/accounts")" = "401"
  local reported expected
  reported="$(api_database_line "$dir")"
  expected="$(data doctor | sed -n 's/^database=\([^ ]*\) server=\([^ ]*\) .*/\1 at \2/p')"
  echo "API reports database: ${reported:-nothing}; expected: ${expected:-unknown}"
  check "the API's own database is devLocal on the expected server" test -n "$reported" -a "$reported" = "$expected"
  check "web dev server answers 200" web_ready
  local mongo_ips remotes
  mongo_ips="$(data doctor | sed -n 's/.* ips=\([^ ]*\).*/\1/p' | tr ',' '\n')"
  remotes="$(lsof -nP -a -p "$api_pid" -iTCP -sTCP:ESTABLISHED 2>/dev/null | awk 'NR > 1 {split($9, ends, "->"); print ends[2]}' | sort -u || true)"
  echo "API connections now: ${remotes:-none}"
  check "every API connection in this snapshot goes to the Mongo server or this run's ports" connections_ok "$remotes" "$mongo_ips"
  [[ $failures -eq 0 ]] && echo "doctor: healthy" || { echo "doctor: $failures check(s) failed"; return 1; }
}

stop_api() {
  local dir="$1" pid
  [[ -f "$dir/api.pid" ]] || return 0
  pid="$(cat "$dir/api.pid")"
  kill -0 "$pid" 2>/dev/null || return 0
  if [[ "$(started_at "$pid")" != "$(cat "$dir/api.started" 2>/dev/null)" ]]; then
    echo "not signalling pid $pid: it is not the API this run started" >&2
    return 0
  fi
  kill -TERM "$pid"
  wait_for 30 "the API to stop" pid_gone "$pid" || kill -KILL "$pid"
}

stop_web() {
  local dir="$1" group member ours=""
  [[ -f "$dir/web.pgid" ]] || return 0
  group="$(cat "$dir/web.pgid")"
  for member in $(group_members "$group"); do
    [[ "$(cwd_of "$member")" == "$WEB_DIR" ]] && ours=yes
  done
  [[ -n "$ours" ]] || return 0
  kill -TERM -- "-$group" 2>/dev/null || true
  wait_for 30 "the web server to stop" group_gone "$group" || kill -KILL -- "-$group" 2>/dev/null || true
}

down() {
  trap - ERR
  local run dir
  run="$(cat "$VERIFY_HOME/current" 2>/dev/null || cat "$LOCK/run" 2>/dev/null || true)"
  [[ -n "$run" ]] || { echo "no verify run is active" >&2; rm -rf "$LOCK"; return 0; }
  dir="$VERIFY_HOME/runs/$run"
  stop_api "$dir"
  stop_web "$dir"
  mkdir -p "$dir/evidence"
  data cleanup "$run" | tee "$dir/evidence/cleanup.json" || echo "cleanup failed; see the run's records in devLocal" >&2
  rm -rf "$dir/api-bin"
  rm -f "$dir/api.pid" "$dir/api.started" "$dir/web.pgid" "$VERIFY_HOME/current"
  rm -rf "$LOCK"
  echo "run $run is down; evidence kept in $dir/evidence"
}

case "${1:-}" in
  up) up ;;
  doctor) doctor ;;
  down) down ;;
  owned) owned "${2:-}" ;;
  run-id) current_run ;;
  dir) echo "$VERIFY_HOME/runs/$(current_run)" ;;
  *) echo "usage: $0 up|doctor|down|owned [run-id]|run-id|dir" >&2; exit 2 ;;
esac
