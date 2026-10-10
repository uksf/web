#!/usr/bin/env bash
set -uo pipefail

usage() {
  cat <<'EOF'
usage:
  api-worktree.sh add <sha> <path> [--api-repo DIR]
  api-worktree.sh remove <path> [--dry-run]
  api-worktree.sh --help

add      refuses a <sha> that contains neither a61e4070 nor its squash on main, ed06088b (verify-mode
         logs stay out of Mongo only from there), then creates a detached API worktree of <sha> at <path> and copies the gitignored
         UKSF.Api/appsettings.Development.json into it with mode 600 (created owner-only, never readable first) and an ownership marker. <path> must not exist, must be
         absolute, and below $HOME it must be lower case: mixed casing across API checkouts breaks the
         .NET build cache. The source repo is --api-repo, UKSF_API_REPO, or ~/Workspace/uksf/api.
remove   deletes the copied settings file (it holds secrets), then removes the worktree. <path> must be the root
         of a linked worktree that add created: it checks the ownership marker add wrote in the worktree's git dir
         (the path and the SHA-256 of the settings copy) and refuses the main checkout, nested directories,
         unmarked worktrees and an altered settings file, before deleting anything. --dry-run runs the same
         checks, prints what would happen and changes nothing.

Each command prints one JSON line on success. Exit 0 on success, 1 on any refusal or failure.
EOF
}

die() {
  echo "api-worktree.sh: $1" >&2
  exit 1
}

settings="UKSF.Api/appsettings.Development.json"
marker="uksf-verify-owner"

sha256() {
  shasum -a 256 "$1" | cut -d' ' -f1
}

abort_add() {
  rm -f "$3"
  git -C "$1" worktree remove --force "$2" >/dev/null 2>&1
  die "$4; the new worktree was removed"
}

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
  git -C "$repo" merge-base --is-ancestor a61e4070 "$commit" 2>/dev/null || git -C "$repo" merge-base --is-ancestor ed06088b "$commit" 2>/dev/null || die "$commit contains neither a61e4070 nor its squash ed06088b: before them, verify-mode logs reach shared Mongo"
  git -C "$repo" worktree add --detach "$path" "$commit" >&2 || die "git worktree add failed"
  local dest="$path/$settings" canonical gitdir hash
  if [[ -e "$dest" || -L "$dest" ]]; then abort_add "$repo" "$path" "$dest" "$dest already exists"; fi
  (umask 077 && set -o noclobber && cat "$repo/$settings" > "$dest") || abort_add "$repo" "$path" "$dest" "could not copy the settings file"
  canonical="$(cd "$path" && pwd -P)" && gitdir="$(git -C "$path" rev-parse --absolute-git-dir)" && hash="$(sha256 "$dest")" || abort_add "$repo" "$path" "$dest" "could not read the new worktree"
  printf 'path=%s\nsettings_sha256=%s\n' "$canonical" "$hash" > "$gitdir/$marker" || abort_add "$repo" "$path" "$dest" "could not write the ownership marker"
  jq -cn --arg path "$canonical" --arg sha "$commit" '{added: $path, sha: $sha, settingsMode: "600", marker: true}'
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
  path="$(cd "$path" && pwd -P)" || die "cannot resolve $path"
  local top gitdir common listed=0 key value recorded actual="" has_settings=false
  top="$(git -C "$path" rev-parse --show-toplevel)" && top="$(cd "$top" && pwd -P)" || die "$path is not a git worktree"
  [[ "$top" == "$path" ]] || die "$path is not the root of a worktree"
  gitdir="$(git -C "$path" rev-parse --absolute-git-dir)" || die "cannot read the git dir of $path"
  common="$(git -C "$path" rev-parse --path-format=absolute --git-common-dir)" || die "cannot read the common git dir of $path"
  [[ "$gitdir" != "$common" ]] || die "$path is the main checkout, not a linked worktree"
  while read -r key value; do
    [[ "$key" == worktree && "$(cd "$value" 2>/dev/null && pwd -P)" == "$path" ]] && listed=1
  done < <(git -C "$path" worktree list --porcelain)
  ((listed)) || die "$path is not a registered linked worktree"
  [[ -f "$gitdir/$marker" && ! -L "$gitdir/$marker" ]] || die "$path has no ownership marker: api-worktree.sh add did not create it"
  recorded="$(sed -n 's/^path=//p' "$gitdir/$marker")"
  [[ "$recorded" == "$path" ]] || die "the ownership marker names $recorded, not $path"
  if [[ -e "$path/$settings" || -L "$path/$settings" ]]; then
    [[ -f "$path/$settings" && ! -L "$path/$settings" ]] || die "$path/$settings is not a regular file"
    actual="$(sha256 "$path/$settings")"
    [[ "$actual" == "$(sed -n 's/^settings_sha256=//p' "$gitdir/$marker")" ]] || die "the settings copy is not the file add created"
    has_settings=true
  fi
  if ((dry)); then
    jq -cn --arg path "$path" --argjson settings "$has_settings" '{dryRun: true, owned: true, wouldDeleteSettings: $settings, wouldRemoveWorktree: $path}'
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
