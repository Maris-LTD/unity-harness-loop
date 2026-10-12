#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
out=$(win_path "$2")
run_eval "$(sed -e "s#__FOLDER__#\"$1\"#" -e "s#__OUT__#@\"$out\"#" -e "s#__CW__#${3:-1080}#" -e "s#__CH__#${4:-1920}#" "$(dirname "$0")/ui_audit.cs")"
if [ -n "$5" ] && [ -f "$5" ]; then
  new=$(comm -13 <(sort "$5") <(sort "$2")); fixed=$(comm -23 <(sort "$5") <(sort "$2"))
  echo "new: $(printf '%s' "$new" | grep -c .)  fixed: $(printf '%s' "$fixed" | grep -c .)"
  printf '%s\n' "$new" | grep . | head -40
else
  cut -d' ' -f1 "$2" | sort | uniq -c
  head -40 "$2"
fi
