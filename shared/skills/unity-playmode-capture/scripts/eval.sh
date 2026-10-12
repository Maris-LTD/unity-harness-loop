#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
if [ "$1" = "-e" ] && [ -n "$2" ]; then run_eval "$2"
elif [ -f "$1" ]; then run_eval "$(cat "$1")"
else echo "usage: eval.sh <file.cs> | eval.sh -e '<statements; return x;>'"; exit 64
fi
