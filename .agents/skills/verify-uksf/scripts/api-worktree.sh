#!/usr/bin/env bash
set -uo pipefail

usage() {
  cat <<'EOF'
usage:
  api-worktree.sh add <sha> <path> [--api-repo DIR]
  api-worktree.sh remove <path> [--dry-run]
  api-worktree.sh --help

add      creates a detached API worktree of <sha> at <path> and copies the gitignored
         UKSF.Api/appsettings.Development.json into it with mode 600. <path> must not exist, must be
         absolute, and below $HOME it must be lower case: mixed casing across API checkouts breaks the
         .NET build cache. The source repo is --api-repo, UKSF_API_REPO, or ~/Workspace/uksf/api.
remove   deletes the copied settings file (it holds secrets), then removes the worktree. <path> must be a
         linked worktree of an API repo. --dry-run prints what would happen and changes nothing.

Each command prints one JSON line on success. Exit 0 on success, 1 on any refusal or failure.
EOF
}

die() {
  echo "api-worktree.sh: $1" >&2
  exit 1
}

settings="UKSF.Api/appsettings.Development.json"

add() {
  local sha="" path="" repo="${UKSF_API_REPO:-$HOME/Workspace/uksf/api}"
  while (($# > 0)); do
    case "$1" in
      --api-repo) (($# >= 2)) || die "--api-repo needs a value"; repo="$2"; shift 2 ;;
      -*) die "unknown option $1" ;;
      *) if [[ -z "$sha" ]]; then sha="$1"; elif [[ -z "$path" ]]; then path="$1"; else die "too many arguments"; fi; shift ;;
    esac
  done
  [[ -n "$sha" && -n "$path" ]] || die "usage: add <sha> <path>"
  [[ "$path" == /* ]] || die "path must be absolute"
  [[ ! -e "$path" ]] || die "$path already exists"
  local below="${path#"$HOME"}"
  [[ "$below" != *[[:upper:]]* ]] || die "path below \$HOME must be lower case, got $below"
  [[ -d "$(dirname "$path")" ]] || die "the parent of $path does not exist"
  [[ -f "$repo/$settings" ]] || die "$repo has no $settings to copy"
  local commit
  commit="$(git -C "$repo" rev-parse --verify --quiet "$sha^{commit}")" || die "$sha is not a commit in $repo"
  git -C "$repo" worktree add --detach "$path" "$commit" >&2 || die "git worktree add failed"
  cp "$repo/$settings" "$path/$settings" && chmod 600 "$path/$settings" || die "could not copy the settings file"
  jq -cn --arg path "$path" --arg sha "$commit" '{added: $path, sha: $sha, settingsMode: "600"}'
}

remove() {
  local path="" dry=0
  while (($# > 0)); do
    case "$1" in
      --dry-run) dry=1; shift ;;
      -*) die "unknown option $1" ;;
      *) [[ -z "$path" ]] || die "too many arguments"; path="$1"; shift ;;
    esac
  done
  [[ -n "$path" ]] || die "usage: remove <path> [--dry-run]"
  [[ -d "$path" ]] || die "$path is not a directory"
  path="$(cd "$path" && pwd -P)"
  [[ -f "$path/UKSF.Api/UKSF.Api.csproj" ]] || die "$path is not an API checkout"
  local git_dir common
  git_dir="$(git -C "$path" rev-parse --absolute-git-dir)" || die "$path is not a git worktree"
  common="$(cd "$(git -C "$path" rev-parse --git-common-dir)" && pwd -P)"
  [[ "$git_dir" != "$common" ]] || die "$path is the main checkout, not a linked worktree"
  local has_settings=false
  [[ -f "$path/$settings" ]] && has_settings=true
  if ((dry)); then
    jq -cn --arg path "$path" --argjson settings "$has_settings" '{dryRun: true, wouldDeleteSettings: $settings, wouldRemoveWorktree: $path}'
    return 0
  fi
  rm -f "$path/$settings" || die "could not delete the settings copy"
  git --git-dir="$common" worktree remove "$path" || die "git worktree remove refused; the settings copy is already deleted"
  jq -cn --arg path "$path" --argjson settings "$has_settings" '{removed: $path, deletedSettings: $settings}'
}

case "${1:-}" in
  add) shift; add "$@" ;;
  remove) shift; remove "$@" ;;
  --help|-h) usage ;;
  *) usage >&2; exit 1 ;;
esac
