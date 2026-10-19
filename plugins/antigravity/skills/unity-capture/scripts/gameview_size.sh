#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
run_eval "$(sed -e "s/__W__/$1/" -e "s/__H__/$2/" "$(dirname "$0")/gameview_size.cs")"
