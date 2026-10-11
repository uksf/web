#!/usr/bin/env bash

fixed_failure() {
  printf '{"side":"unknown","up":"skipped","doctor":"skipped","drives":{},"exitCode":%d,"reason":"%s"}\n' "$1" "$2"
}

if ! command -v jq >/dev/null 2>&1; then
  fixed_failure 1 "jq is required"
  exit 1
fi

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)" && [[ -f "$here/verify-side-lib.sh" ]] || {
  fixed_failure 1 "verify-side-lib.sh is missing next to verify-side.sh"
  exit 1
}
. "$here/verify-side-lib.sh"

web_dir="${UKSF_WEB_DIR:-}"
api_dir="${UKSF_API_DIR:-$HOME/Workspace/uksf/api}"
scripts_dir="${UKSF_VERIFY_SCRIPTS:-}"
home_dir="${UKSF_VERIFY_HOME:-}"
side=""
requested=()
run_id=""
run_dir=""
evidence=""
up_result="skipped"
doctor="skipped"
drive_lines=""
port_lines=""
remaining="null"
lock_result="untouched"
down_status=0
drives_ok=0
reason=""
retry=""

while (($# > 0)); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --web-dir|--api-dir|--scripts-dir|--home|--side|--drive)
      (($# >= 2)) && [[ -n "$2" ]] || bail "$1 needs a value"
      case "$1" in
        --web-dir) web_dir="$2" ;;
        --api-dir) api_dir="$2" ;;
        --scripts-dir) scripts_dir="$2" ;;
        --home) home_dir="$2" ;;
        --side) side="$2" ;;
        --drive) requested+=("$2") ;;
      esac
      shift 2 ;;
    *) bail "unknown argument: $1" ;;
  esac
done

command -v lsof >/dev/null 2>&1 || bail "lsof is required to check the ports"
[[ -n "$web_dir" ]] || bail "--web-dir is required"
[[ -n "$scripts_dir" ]] || bail "--scripts-dir is required"
[[ -n "$home_dir" ]] || bail "--home is required"
((${#requested[@]} > 0)) || bail "at least one --drive is required"

[[ "$home_dir" == /* ]] || bail "--home must be an absolute path"
[[ ! -e "$home_dir" || -d "$home_dir" ]] || bail "--home $home_dir exists and is not a directory"
[[ -d "$(dirname "$home_dir")" ]] || bail "the parent of --home $home_dir does not exist"

web_dir="$(canon "$web_dir")" || bail "--web-dir cannot be resolved"
api_dir="$(canon "$api_dir")" || bail "--api-dir cannot be resolved"
scripts_dir="$(canon "$scripts_dir")" || bail "--scripts-dir cannot be resolved"

[[ -f "$web_dir/package.json" && -d "$web_dir/node_modules" ]] || bail "--web-dir $web_dir needs package.json and node_modules (run bun install --frozen-lockfile)"
[[ -f "$api_dir/UKSF.Api/appsettings.Development.json" ]] || bail "--api-dir $api_dir has no UKSF.Api/appsettings.Development.json"
[[ -x "$scripts_dir/uksf-verify.sh" ]] || bail "--scripts-dir $scripts_dir has no executable uksf-verify.sh"

drives=()
for name in "${requested[@]}"; do
  case "$name" in
    signup|details|mission) ;;
    *) bail "unknown drive '$name'; use signup, details or mission" ;;
  esac
  [[ " ${drives[*]-} " == *" $name "* ]] || drives+=("$name")
done
if [[ " ${drives[*]} " == *" signup "* && " ${drives[*]} " == *" details "* ]]; then
  echo "both signup and details were named: running details only, because it includes sign-up and sign-in"
  kept=()
  for name in "${drives[@]}"; do [[ "$name" == signup ]] || kept+=("$name"); done
  drives=("${kept[@]}")
fi

unsupported=0
for name in "${drives[@]}"; do
  if probe_drive "$name"; then record_drive "$name" skipped; else record_drive "$name" unsupported; unsupported=1; fi
done
if ((unsupported)); then
  echo "the harness in $scripts_dir does not support every requested drive: no run started" >&2
  reason="the harness does not support every requested drive"
  finish 1
fi
drive_lines=""

mkdir -p "$home_dir" || bail "--home $home_dir cannot be created"
home_dir="$(canon "$home_dir")" || bail "--home cannot be resolved"
[[ -n "$side" ]] || side="${home_dir##*/}"
export UKSF_WEB_DIR="$web_dir" UKSF_API_DIR="$api_dir" UKSF_VERIFY_HOME="$home_dir"
export PATH="$HOME/.dotnet:$HOME/.bun/bin:$PATH" DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
verify="$scripts_dir/uksf-verify.sh"
lock="${TMPDIR:-/tmp}/uksf-verify.lock"
ports=(5500 4200 47999)
retry="$(retry_command)"

up_ok=0
if "$verify" up; then
  up_ok=1
  up_result="pass"
  if run_dir="$("$verify" dir)" && run_id="$("$verify" run-id)"; then
    evidence="$run_dir/evidence"
    if "$verify" doctor; then
      doctor="pass"
      run_drives
    else
      doctor="fail"
      echo "doctor failed: no drive ran"
      skip_drives
    fi
  else
    doctor="error"
    echo "could not read the run directory or id: no drive ran"
    skip_drives
  fi
else
  up_result="fail"
  echo "up failed: no drive ran"
  skip_drives
fi

if ((up_ok)) || owns_lock; then
  ((up_ok)) || echo "up failed and left this home's run and lock behind: running down"
  "$verify" down
  down_status=$?
fi

[[ -n "$evidence" && -f "$evidence/cleanup.json" ]] && remaining="$(jq -c '.remaining // null' "$evidence/cleanup.json" 2>/dev/null || echo null)"
[[ -n "$remaining" ]] || remaining="null"

lock_result="absent"
[[ -e "$lock" ]] && lock_result="present"
for port in "${ports[@]}"; do
  port_lines+="$port"$'\t'"$(port_state "$port")"$'\n'
done

exit_code=0
if ((down_status != 0)); then
  exit_code=2
  reason="down failed; the run and its lock are kept"
  echo "down failed for side $side; the run and its lock are kept. Fix the cause, then retry:" >&2
  echo "  $retry" >&2
elif [[ "$up_result" != pass ]]; then exit_code=1; reason="up failed"
elif [[ "$doctor" != pass ]]; then exit_code=1; reason="doctor did not pass"
elif ((drives_ok != 1)); then exit_code=1; reason="a drive failed"
elif [[ "$lock_result" != absent ]]; then exit_code=1; reason="the verify lock remains"
elif [[ "$port_lines" == *listening* ]]; then exit_code=1; reason="a port still has a listener"
elif [[ "$port_lines" == *error* ]]; then exit_code=1; reason="a port could not be inspected"
fi
((exit_code == 2)) || retry=""

finish "$exit_code"
