#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
if [ -z "$1" ]; then echo "usage: capture.sh <out.png> [width height]  (default 1080 1920)"; exit 64; fi
tmp=$(mktemp)
unity command capture_game_view --width "${2:-1080}" --height "${3:-1920}" --json --no-banner --result-only > "$tmp"
python -c "
import json,sys,base64
try: d=json.load(open(sys.argv[1],encoding='utf-8'))
except Exception: print(open(sys.argv[1],encoding='utf-8',errors='replace').read()[:2000]); sys.exit(1)
b=d.get('base64') if isinstance(d,dict) else None
if not b: print(json.dumps(d)[:2000]); sys.exit(1)
open(sys.argv[2],'wb').write(base64.b64decode(b.split(',')[-1])); print(sys.argv[2], d.get('width'), d.get('height'))
" "$(win_path "$tmp")" "$(win_path "$1")"
rc=$?; rm -f "$tmp"; exit $rc
