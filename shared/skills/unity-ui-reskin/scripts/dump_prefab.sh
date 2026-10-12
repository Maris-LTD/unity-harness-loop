#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
paths=$(printf '"%s",' "$@"); paths="new[]{${paths%,}}"
deep=false; [ "${DEEP:-0}" = 1 ] && deep=true
run_eval "$(sed -e "s#__PATHS__#$paths#" -e "s#__DEEP__#$deep#" -e "s#__SUB__#\"${SUB:-}\"#g" "$(dirname "$0")/dump.cs")"
