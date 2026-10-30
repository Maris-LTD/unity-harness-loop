#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
out=$(win_path "$2")
run_eval "$(sed -e "s#__PREFAB__#\"$1\"#" -e "s#__OUT__#@\"$out\"#" -e "s#__CW__#${3:-1080}#" -e "s#__CH__#${4:-1920}#" -e "s#__SETUP__#${5:-}#" "$(dirname "$0")/render_prefab.cs")"
echo "$out"
