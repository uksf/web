#!/usr/bin/env bash

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

cleanup_records() {
  dotnet run "$SCRIPTS/verify-cleanup.cs" -- "$1/settings.json" "${@:2}"
}

abandon_up() {
  [[ "$BASH_SUBSHELL" == 0 && "$(cat "$LOCK/run" 2>/dev/null)" == "$1" ]] || return 0
  [[ "$(cat "$VERIFY_HOME/current" 2>/dev/null)" != "$1" ]] || rm -f "$VERIFY_HOME/current"
  rm -rf "$2" "$LOCK"
}

fail_up() {
  [[ "$BASH_SUBSHELL" == 0 && "$(cat "$VERIFY_HOME/current" 2>/dev/null)" == "$1" ]] || return 0
  echo "up failed; cleaning up run $1" >&2
  down
}
