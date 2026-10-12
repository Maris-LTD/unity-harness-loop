#!/usr/bin/env bash
unity command editor_focus --json --no-banner --result-only >/dev/null 2>&1
tmp=$(mktemp)
unity command capture_game_view --width "$2" --height "$3" --json --no-banner --result-only > "$tmp"
python -c "
import json,sys,base64
d=json.load(open(sys.argv[1],encoding='utf-8'))
b=d.get('base64') if isinstance(d,dict) else None
if not b: print(json.dumps(d)[:2000]); sys.exit(1)
open(sys.argv[2],'wb').write(base64.b64decode(b.split(',')[-1])); print(sys.argv[2], d.get('width'), d.get('height'))
" "$tmp" "$1"
rc=$?; rm -f "$tmp"; exit $rc
