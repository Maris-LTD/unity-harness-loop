#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
out=$(win_path "$1"); shift
files=""; for f in "$@"; do files="$files@\"$(win_path "$f")\","; done
run_eval "$(sed -e "s#__MODE__#\"stack\"#" -e "s#__OUT__#@\"$out\"#" -e "s#__ARGS__#new[]{${H:-1000}}#" -e "s#__FILES__#new[]{${files%,}}#" "$(dirname "$0")/image_tool.cs")"
