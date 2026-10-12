#!/usr/bin/env bash
set -e
root=$(cd "${1:?usage: link_memory.sh <project root> [--dry-run]}" && pwd)
slug=$(printf '%s' "$root" | sed 's/[^A-Za-z0-9]/-/g')
config="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
repo_mem="$root/.claude/memory"
link="$config/projects/$slug/memory"
echo "project: $root"
echo "repo memory: $repo_mem"
echo "agent memory: $link"
[ "$2" = "--dry-run" ] && exit 0
mkdir -p "$repo_mem" "$(dirname "$link")"
if [ -L "$link" ]; then
  [ "$(cd "$link" && pwd -P)" = "$(cd "$repo_mem" && pwd -P)" ] && { echo "already linked"; exit 0; }
  echo "agent memory links elsewhere: $(readlink "$link")"; exit 1
fi
if [ -d "$link" ]; then
  for f in "$link"/*; do
    [ -f "$f" ] || continue
    d="$repo_mem/$(basename "$f")"
    if [ -f "$d" ] && ! cmp -s "$f" "$d"; then echo "both places have different $(basename "$f"); merge into $repo_mem first"; exit 1; fi
  done
  for f in "$link"/*; do
    [ -f "$f" ] || continue
    d="$repo_mem/$(basename "$f")"
    [ -f "$d" ] || { cp "$f" "$d"; echo "moved $(basename "$f")"; }
  done
  rm -rf "$link"
fi
ln -s "$repo_mem" "$link"
echo "linked $link -> $repo_mem"
