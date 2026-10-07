#!/usr/bin/env bash
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="${UKSF_WEB_DIR:-$(git -C "$SCRIPTS" rev-parse --show-toplevel)}"
API_DIR="${UKSF_API_DIR:-$HOME/Workspace/uksf/api}"
VERIFY_HOME="${UKSF_VERIFY_HOME:-$HOME/.uksf-verify}"
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

cwd_of() {
  lsof -nP -a -p "$1" -d cwd 2>/dev/null | awk 'NR > 1 {print $NF}'
}

web_ready() {
  [[ "$(http_status "http://localhost:$WEB_PORT/")" == "200" ]]
}

data() {
  dotnet run "$SCRIPTS/verify-data.cs" -- "$API_DIR" "$@" 2>/dev/null
}

up() {
  if [[ -f "$VERIFY_HOME/current" ]]; then
    echo "refusing: run $(cat "$VERIFY_HOME/current") is still active; run '$0 down' first" >&2
    exit 1
  fi
  for port in $API_PORT $WEB_PORT; do
    if [[ -n "$(listener "$port")" ]]; then
      echo "refusing: port $port is already in use by pid $(listener "$port"); this skill drives only instances it starts" >&2
      exit 1
    fi
  done
  [[ -f "$API_DIR/UKSF.Api/appsettings.Development.json" ]] || { echo "missing $API_DIR/UKSF.Api/appsettings.Development.json" >&2; exit 1; }

  local run="v$(date -u +%Y%m%d%H%M%S)"
  local dir="$VERIFY_HOME/runs/$run"
  mkdir -p "$dir/email" "$dir/evidence"
  git -C "$API_DIR" rev-parse HEAD > "$dir/api-commit"
  git -C "$WEB_DIR" rev-parse HEAD > "$dir/web-commit"

  echo "building the API at $(cut -c1-8 "$dir/api-commit")"
  dotnet build "$API_DIR/UKSF.Api/UKSF.Api.csproj" -c Debug -o "$VERIFY_HOME/api-bin" -v quiet -nologo > "$dir/api-build.log" 2>&1 || { echo "API build failed; see $dir/api-build.log" >&2; exit 1; }

  ASPNETCORE_ENVIRONMENT=Development UKSF_VERIFY_MODE=1 UKSF_VERIFY_EMAIL_DIR="$dir/email" \
    nohup "$VERIFY_HOME/api-bin/UKSF.Api" --contentRoot "$API_DIR/UKSF.Api" > "$dir/api.log" 2>&1 &
  echo $! > "$dir/api.pid"
  echo "$run" > "$VERIFY_HOME/current"

  (cd "$WEB_DIR" && nohup python3 -c 'import os, sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' \
    node node_modules/@angular/cli/bin/ng.js serve --port "$WEB_PORT" > "$dir/web.log" 2>&1 &
    echo $! > "$dir/web.pgid")

  wait_for 120 "the API to start" api_started "$dir"
  wait_for 240 "the web dev server" web_ready
  local web_pid
  web_pid="$(listener $WEB_PORT)"
  [[ "$(cwd_of "$web_pid")" == "$WEB_DIR" ]] || { echo "port $WEB_PORT is held by pid $web_pid outside $WEB_DIR" >&2; exit 1; }
  echo "$web_pid" > "$dir/web.pid"
  echo "run $run is up: api pid $(cat "$dir/api.pid"), web pid $web_pid, evidence in $dir/evidence"
}

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then echo "PASS $label"; else echo "FAIL $label"; failures=$((failures + 1)); fi
}

doctor() {
  local run dir api_pid web_pid
  run="$(current_run)"
  dir="$VERIFY_HOME/runs/$run"
  api_pid="$(cat "$dir/api.pid")"
  web_pid="$(cat "$dir/web.pid")"
  failures=0
  echo "run $run"
  check "api process $api_pid is alive" kill -0 "$api_pid"
  check "port $API_PORT belongs to our api process" test "$(listener $API_PORT)" = "$api_pid"
  check "port $WEB_PORT belongs to our web process $web_pid" test "$(listener $WEB_PORT)" = "$web_pid"
  check "the web process serves $WEB_DIR" test "$(cwd_of "$web_pid")" = "$WEB_DIR"
  check "api runs the checked-out commit" test "$(git -C "$API_DIR" rev-parse HEAD)" = "$(cat "$dir/api-commit")"
  check "verify mode skipped migrations" grep -q "verify mode: database migrations are not run" "$dir/api.log"
  check "verify mode skipped integrations" grep -q "verify mode: Teamspeak, Discord, the scheduler and queued builds are not started" "$dir/api.log"
  check "discord never connected" bash -c "! grep -qi 'Discord connecting\|Discord logged in' '$dir/api.log'"
  check "unauthenticated GET /accounts answers 401" test "$(http_status "http://localhost:$API_PORT/accounts")" = "401"
  check "database is devLocal and reachable" data doctor
  check "web dev server answers 200" web_ready
  local remotes
  remotes="$(lsof -nP -a -p "$api_pid" -iTCP -sTCP:ESTABLISHED 2>/dev/null | awk 'NR>1 {split($9, ends, "->"); print ends[2]}' | grep -v '^127\.0\.0\.1:\|^\[::1\]:' | sort -u || true)"
  echo "api outbound connections: ${remotes:-none}"
  local mongo_port
  mongo_port="$(data doctor | sed -n 's/.*port=\([0-9]*\).*/\1/p')"
  check "every outbound connection goes to the Mongo port ($mongo_port)" bash -c "[[ -z \"$remotes\" ]] || ! grep -qv ':$mongo_port\$' <<< \"$remotes\""
  [[ $failures -eq 0 ]] && echo "doctor: healthy" || { echo "doctor: $failures check(s) failed"; return 1; }
}

down() {
  local run dir
  run="$(current_run)"
  dir="$VERIFY_HOME/runs/$run"
  if [[ -f "$dir/api.pid" ]] && kill -0 "$(cat "$dir/api.pid")" 2>/dev/null; then
    kill -TERM "$(cat "$dir/api.pid")"
    wait_for 30 "the API to stop" bash -c "! kill -0 $(cat "$dir/api.pid")" || kill -KILL "$(cat "$dir/api.pid")"
  fi
  for file in web.pid web.pgid; do
    [[ -f "$dir/$file" ]] || continue
    local group
    group="$(ps -o pgid= -p "$(cat "$dir/$file")" 2>/dev/null | tr -d ' ' || true)"
    [[ -n "$group" ]] || continue
    kill -TERM -- "-$group" 2>/dev/null || true
    wait_for 30 "the web server to stop" bash -c "! kill -0 -- -$group" || kill -KILL -- "-$group" 2>/dev/null || true
  done
  data cleanup "$run" | tee "$dir/evidence/cleanup.json"
  rm -f "$dir/api.pid" "$dir/web.pid" "$dir/web.pgid" "$VERIFY_HOME/current"
  echo "run $run is down; evidence kept in $dir/evidence"
}

case "${1:-}" in
  up) up ;;
  doctor) doctor ;;
  down) down ;;
  run-id) current_run ;;
  dir) echo "$VERIFY_HOME/runs/$(current_run)" ;;
  *) echo "usage: $0 up|doctor|down|run-id|dir" >&2; exit 2 ;;
esac
