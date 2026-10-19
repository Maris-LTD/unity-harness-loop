#!/usr/bin/env bash
project="${1:-.}"; timeout="${2:-900}"
win() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }
path=$(win "$(cd "$project" && pwd)")
end=$((SECONDS+timeout)); last=""
while [ $SECONDS -lt $end ]; do
  state=$(unity status --json --no-banner 2>/dev/null | python -c "import json,os,sys
want=os.path.normcase(os.path.normpath(sys.argv[1]))
try: d=json.load(sys.stdin)
except Exception: print('none'); sys.exit()
for i in (d.get('data') or {}).get('instances') or []:
    if os.path.normcase(os.path.normpath(i.get('project') or ''))==want: print(i.get('state') or 'unknown'); break
else: print('none')" "$path")
  [ "$state" != "$last" ] && echo "$(date +%H:%M:%S) state: $state" && last="$state"
  [ "$state" = ready ] && exit 0
  sleep 6
done
echo "timeout after ${timeout}s, last state: $last"
unity pipeline list --json --no-banner 2>&1 | tail -30
exit 1
