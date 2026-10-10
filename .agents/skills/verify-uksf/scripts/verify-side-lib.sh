usage() {
  cat <<'EOF'
usage: verify-side.sh --web-dir DIR --scripts-dir DIR --home DIR [--api-dir DIR] [--side NAME] --drive NAME [--drive NAME ...]

Runs one full verification side in sequence: up, doctor, the named drives, down, then the
lock check and the port checks on 5500, 4200 and 47999. Run one side at a time: the verify lock
allows one run, and a second side must not start before this one has torn down.
Needs jq and lsof on PATH.

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

Every prerequisite is chained with &&, so no drive runs after a failed up or doctor. A drive
counts as a pass only when its own result says so: details also needs a result file whose
Details checks all passed, otherwise it is recorded as a fail ("harness ran no Details checks").

Output: progress on stdout, then one final JSON line on every exit path after the arguments are
read: side, run id, evidence path, doctor result, each drive's result, notes per drive, the cleanup
remaining counts, the lock and port results, the exit code, a reason and the retry command.
If jq is missing, or the JSON cannot be built, a fixed JSON line with a reason is printed instead.

Exit codes:
  0  every drive passed, down was clean, no lock remains, every port is free
  1  up, doctor or a drive failed after a clean down, or a lock or listener remains, or a port
     could not be inspected, or bad input, or the harness lacks a requested drive (reported as
     "unsupported"; no run starts)
  2  down failed (also when the cleanup inside a failed up failed): the run and its lock are kept;
     the retry command is printed
EOF
}

fixed_failure() {
  printf '{"side":"unknown","up":"skipped","doctor":"skipped","drives":{},"exitCode":%d,"reason":"%s"}\n' "$1" "$2"
}

record_drive() {
  drive_lines+="$1"$'\t'"$2"$'\t'"${3:-}"$'\n'
}

finish() {
  local code="$1" line failed
  if [[ -z "$side" ]]; then side="${home_dir%/}"; side="${side##*/}"; fi
  [[ -n "$side" ]] || side="unknown"
  line="$(jq -cn \
    --arg side "$side" --arg run "$run_id" --arg evidence "$evidence" --arg up "$up_result" --arg doctor "$doctor" \
    --arg drives "$drive_lines" --arg ports "$port_lines" --argjson remaining "$remaining" --arg lock "$lock_result" \
    --argjson down "$down_status" --argjson code "$code" --arg reason "$reason" --arg retry "$retry" '
    def table($text): [$text | split("\n")[] | select(length > 0) | split("\t")];
    def object($rows; $value): $rows | map({key: .[0], value: .[$value]}) | from_entries;
    {side: $side, runId: $run, evidence: $evidence, up: $up, doctor: $doctor,
     drives: object(table($drives); 1), notes: object(table($drives) | map(select(.[2] != "")); 2),
     cleanupRemaining: $remaining, lock: $lock, ports: object(table($ports); 1), downExit: $down,
     exitCode: $code, reason: $reason, retry: $retry}')" && [[ -n "$line" ]] || {
    failed=$((code == 0 ? 1 : code))
    fixed_failure "$failed" "could not build the result JSON"
    exit "$failed"
  }
  printf '%s\n' "$line"
  exit "$code"
}

bail() {
  echo "verify-side.sh: $1 (see --help)" >&2
  reason="$1"
  finish 1
}

canon() {
  local resolved
  resolved="$(cd "$1" 2>/dev/null && pwd -P)" && [[ -n "$resolved" ]] && printf '%s' "$resolved"
}

probe_drive() {
  case "$1" in
    signup) [[ -f "$scripts_dir/drive-signup.mjs" ]] ;;
    details) [[ -f "$scripts_dir/drive-signup.mjs" ]] && grep -qF -- '"--details"' "$scripts_dir/drive-signup.mjs" ;;
    mission) [[ -f "$scripts_dir/drive-mission.mjs" ]] ;;
  esac
}

port_state() {
  local out status errors
  errors="$(mktemp)" || { echo error; return; }
  out="$(lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>"$errors")"
  status=$?
  if [[ -n "$out" ]]; then echo listening
  elif ((status == 0)) || { ((status == 1)) && [[ ! -s "$errors" ]]; }; then echo free
  else echo error
  fi
  rm -f "$errors"
}

retry_command() {
  local parts=(env "UKSF_WEB_DIR=$web_dir" "UKSF_API_DIR=$api_dir" "UKSF_VERIFY_HOME=$home_dir")
  [[ -z "${TMPDIR:-}" ]] || parts+=("TMPDIR=$TMPDIR")
  parts+=("$verify" down)
  local line
  line="$(printf '%q ' "${parts[@]}")"
  printf '%s' "${line% }"
}

owns_lock() {
  local current
  current="$("$verify" run-id 2>/dev/null)" || return 1
  [[ -n "$current" && "$(cat "$lock/run" 2>/dev/null)" == "$current" && "$(cat "$lock/home" 2>/dev/null)" == "$home_dir" ]]
}

drive_command() {
  local script="drive-signup.mjs" extra=""
  case "$1" in
    details) extra="--details" ;;
    mission) script="drive-mission.mjs" ;;
  esac
  (cd "$web_dir" && node "$scripts_dir/$script" "$run_dir" "$run_id" "$scripts_dir" $extra)
}

details_checked() {
  jq -e '.pass == true and ((.checks // {}) | length > 0 and all(.[]; . == true))' \
    "$run_dir/evidence/application-details/result.json" >/dev/null 2>&1
}

run_drives() {
  local name stopped=0
  drives_ok=1
  for name in "${drives[@]}"; do
    if ((stopped)); then record_drive "$name" skipped; continue; fi
    echo "drive $name"
    if ! drive_command "$name"; then
      record_drive "$name" fail
    elif [[ "$name" == details ]] && ! details_checked; then
      record_drive "$name" fail "harness ran no Details checks"
    else
      record_drive "$name" pass
      continue
    fi
    drives_ok=0
    stopped=1
  done
}

skip_drives() {
  local name
  for name in "${drives[@]}"; do record_drive "$name" skipped; done
}
