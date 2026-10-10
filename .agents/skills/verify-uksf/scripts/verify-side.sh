#!/usr/bin/env bash

usage() {
  cat <<'EOF'
usage: verify-side.sh --web-dir DIR --scripts-dir DIR --home DIR [--api-dir DIR] [--side NAME] --drive NAME [--drive NAME ...]

Runs one full verification side in sequence: up, doctor, the named drives, down, then the
lock check and the port checks on 5500, 4200 and 47999. Run one side at a time: the verify lock
allows one run, and a second side must not start before this one has torn down.

Options (each may instead be given as an environment variable):
  --web-dir DIR      web checkout to serve and drive; needs package.json and node_modules   (UKSF_WEB_DIR)
  --api-dir DIR      API checkout to build; needs UKSF.Api/appsettings.Development.json
                     (UKSF_API_DIR, default ~/Workspace/uksf/api). Use one consistent path casing.
  --scripts-dir DIR  harness to use: the directory holding uksf-verify.sh and the drivers  (UKSF_VERIFY_SCRIPTS)
  --home DIR         the side's own UKSF_VERIFY_HOME, so its evidence stays separate         (UKSF_VERIFY_HOME)
  --side NAME        label echoed in the final JSON (default: base name of --home)
  --drive NAME       signup, details or mission; repeat for several, run in the order given
  --help             this text

When both signup and details are named, only details runs: it includes sign-up and sign-in, and
a second drive cannot share the run (its evidence folder and account already exist). The output says so.

Every prerequisite is chained with &&, so no drive runs after a failed up or doctor. Output:
progress on stdout, then one final JSON line with the side, run id, evidence path, doctor result,
each drive's result, the cleanup remaining counts, the lock and port results, and the exit code.

Exit codes:
  0  every drive passed, down was clean, no lock and no listeners remain
  1  up, doctor or a drive failed after a clean down, or a lock or listener remains, or bad input
  2  down failed: the run and its lock are kept; the retry command is printed
EOF
}

fail_usage() {
  echo "verify-side.sh: $1 (see --help)" >&2
  exit 1
}

web_dir="${UKSF_WEB_DIR:-}"
api_dir="${UKSF_API_DIR:-$HOME/Workspace/uksf/api}"
scripts_dir="${UKSF_VERIFY_SCRIPTS:-}"
home_dir="${UKSF_VERIFY_HOME:-}"
side=""
requested=()

while (($# > 0)); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --web-dir|--api-dir|--scripts-dir|--home|--side|--drive)
      (($# >= 2)) && [[ -n "$2" ]] || fail_usage "$1 needs a value"
      case "$1" in
        --web-dir) web_dir="$2" ;;
        --api-dir) api_dir="$2" ;;
        --scripts-dir) scripts_dir="$2" ;;
        --home) home_dir="$2" ;;
        --side) side="$2" ;;
        --drive) requested+=("$2") ;;
      esac
      shift 2 ;;
    *) fail_usage "unknown argument: $1" ;;
  esac
done

command -v jq >/dev/null || fail_usage "jq is required"
[[ -n "$web_dir" ]] || fail_usage "--web-dir is required"
[[ -n "$scripts_dir" ]] || fail_usage "--scripts-dir is required"
[[ -n "$home_dir" ]] || fail_usage "--home is required"
((${#requested[@]} > 0)) || fail_usage "at least one --drive is required"

[[ -f "$web_dir/package.json" && -d "$web_dir/node_modules" ]] || fail_usage "--web-dir $web_dir needs package.json and node_modules (run bun install --frozen-lockfile)"
[[ -f "$api_dir/UKSF.Api/appsettings.Development.json" ]] || fail_usage "--api-dir $api_dir has no UKSF.Api/appsettings.Development.json"
[[ -f "$scripts_dir/uksf-verify.sh" ]] || fail_usage "--scripts-dir $scripts_dir has no uksf-verify.sh"
[[ "$home_dir" == /* ]] || fail_usage "--home must be an absolute path"
[[ ! -e "$home_dir" || -d "$home_dir" ]] || fail_usage "--home $home_dir exists and is not a directory"
[[ -d "$(dirname "$home_dir")" ]] || fail_usage "the parent of --home $home_dir does not exist"

drives=()
for name in "${requested[@]}"; do
  case "$name" in
    signup|details|mission) ;;
    *) fail_usage "unknown drive '$name'; use signup, details or mission" ;;
  esac
  [[ " ${drives[*]-} " == *" $name "* ]] || drives+=("$name")
done
if [[ " ${drives[*]} " == *" signup "* && " ${drives[*]} " == *" details "* ]]; then
  echo "both signup and details were named: running details only, because it includes sign-up and sign-in"
  kept=()
  for name in "${drives[@]}"; do [[ "$name" == signup ]] || kept+=("$name"); done
  drives=("${kept[@]}")
fi

web_dir="$(cd "$web_dir" && pwd -P)"
api_dir="$(cd "$api_dir" && pwd -P)"
scripts_dir="$(cd "$scripts_dir" && pwd -P)"
mkdir -p "$home_dir"
home_dir="$(cd "$home_dir" && pwd -P)"
[[ -n "$side" ]] || side="$(basename "$home_dir")"
export UKSF_WEB_DIR="$web_dir" UKSF_API_DIR="$api_dir" UKSF_VERIFY_HOME="$home_dir"
export PATH="$HOME/.dotnet:$HOME/.bun/bin:$PATH" DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
verify="$scripts_dir/uksf-verify.sh"
lock="${TMPDIR:-/tmp}/uksf-verify.lock"
ports=(5500 4200 47999)

run_id=""
evidence=""
doctor="skipped"
up_result="fail"
drive_results='{}'
drives_ok=0
retry="UKSF_WEB_DIR=$web_dir UKSF_API_DIR=$api_dir UKSF_VERIFY_HOME=$home_dir $verify down"

record_drive() {
  drive_results="$(jq -c --arg n "$1" --arg r "$2" '.[$n] = $r' <<<"$drive_results")"
}

drive_command() {
  local script="drive-signup.mjs" extra=""
  case "$1" in
    details) extra="--details" ;;
    mission) script="drive-mission.mjs" ;;
  esac
  (cd "$web_dir" && node "$scripts_dir/$script" "$run_dir" "$run_id" "$scripts_dir" $extra)
}

run_drives() {
  local name stopped=0
  drives_ok=1
  for name in "${drives[@]}"; do
    if ((stopped)); then record_drive "$name" skipped; continue; fi
    echo "drive $name"
    if drive_command "$name"; then record_drive "$name" pass; else record_drive "$name" fail; drives_ok=0; stopped=1; fi
  done
}

if "$verify" up; then
  up_result="pass"
  if run_dir="$("$verify" dir)" && run_id="$("$verify" run-id)"; then
    evidence="$run_dir/evidence"
    if "$verify" doctor; then
      doctor="pass"
      run_drives
    else
      doctor="fail"
      echo "doctor failed: no drive ran"
      for name in "${drives[@]}"; do record_drive "$name" skipped; done
    fi
  else
    doctor="error"
    echo "could not read the run directory or id: no drive ran"
    for name in "${drives[@]}"; do record_drive "$name" skipped; done
  fi
  "$verify" down
  down_status=$?
else
  down_status=0
  echo "up failed; up tore itself down"
  for name in "${drives[@]}"; do record_drive "$name" skipped; done
fi

remaining="null"
[[ -n "$evidence" && -f "$evidence/cleanup.json" ]] && remaining="$(jq -c '.remaining // null' "$evidence/cleanup.json" 2>/dev/null || echo null)"

lock_result="absent"
[[ -e "$lock" ]] && lock_result="present"
listeners="{}"
for port in "${ports[@]}"; do
  state="free"
  [[ -n "$(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -1)" ]] && state="listening"
  listeners="$(jq -c --arg p "$port" --arg s "$state" '.[$p] = $s' <<<"$listeners")"
done

exit_code=0
if ((down_status != 0)); then
  exit_code=2
  echo "down failed for side $side; the run and its lock are kept. Fix the cause, then retry:" >&2
  echo "  $retry" >&2
elif [[ "$up_result" != pass || "$doctor" != pass || "$drives_ok" != 1 || "$lock_result" != absent || "$listeners" == *listening* ]]; then
  exit_code=1
fi

jq -cn \
  --arg side "$side" --arg run "$run_id" --arg evidence "$evidence" --arg up "$up_result" --arg doctor "$doctor" \
  --argjson drives "$drive_results" --argjson remaining "$remaining" --arg lock "$lock_result" \
  --argjson ports "$listeners" --argjson down "$down_status" --argjson code "$exit_code" \
  '{side: $side, runId: $run, evidence: $evidence, up: $up, doctor: $doctor, drives: $drives, downExit: $down, cleanupRemaining: $remaining, lock: $lock, ports: $ports, exitCode: $code}'
exit "$exit_code"
