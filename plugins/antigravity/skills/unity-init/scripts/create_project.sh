#!/usr/bin/env bash
target="${1%/}"; editor="$2"; template="${3:-com.unity.template.urp-blank}"
if [ -z "$target" ] || [ -z "$editor" ]; then echo "usage: create_project.sh <target dir> <editor version> [template id]"; exit 64; fi
win() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }
if [ -f "$target/ProjectSettings/ProjectVersion.txt" ]; then echo "already a Unity project: $target"; exit 1; fi
name=$(basename "$target"); parent=$(cd "$(dirname "$target")" && pwd); stage="$parent/_create_$name"
if [ -e "$stage" ]; then echo "staging folder exists, remove it first: $stage"; exit 1; fi
mkdir -p "$target" "$stage"
out=$(unity projects new "$name" --path "$(win "$stage")" --editor-version "$editor" --template "$template" --json --no-banner 2>&1)
ok=$(printf '%s' "$out" | python -c "import json,sys
try: print('yes' if json.load(sys.stdin).get('success') else 'no')
except Exception: print('no')")
if [ "$ok" != yes ]; then printf '%s\n' "$out" | tail -20; rm -rf "$stage"; echo "list templates: unity templates list --editor $editor --json --no-banner"; exit 1; fi
for f in "$stage/$name"/* "$stage/$name"/.[!.]*; do
  [ -e "$f" ] || continue
  if [ -e "$target/$(basename "$f")" ]; then echo "conflict: $target/$(basename "$f") exists; project left in $stage/$name"; exit 1; fi
done
for f in "$stage/$name"/* "$stage/$name"/.[!.]*; do [ -e "$f" ] && mv "$f" "$target/"; done
rmdir "$stage/$name" "$stage"
echo "created $(win "$target") editor=$editor template=$template"
ls -a "$target"
