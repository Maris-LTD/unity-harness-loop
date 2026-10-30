#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
run_eval "$(sed -e "s#__MODE__#\"crop\"#" -e "s#__OUT__#@\"$(win_path "$2")\"#" -e "s#__ARGS__#new[]{$3,$4,$5,$6,${7:-0}}#" -e "s#__FILES__#new[]{@\"$(win_path "$1")\"}#" "$(dirname "$0")/image_tool.cs")"
