#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
restore_run_in_background() {
  [ -f "$RIB_STATE" ] || return 0
  run_eval "UnityEditor.PlayerSettings.runInBackground = false; return 0;" >/dev/null && rm -f "$RIB_STATE"
}
unity command editor_stop --json --no-banner --result-only >/dev/null 2>&1
for i in 1 2 3 4 5 6 7 8 9 10; do
  r=$(run_eval "return UnityEngine.Application.isPlaying;" 2>/dev/null)
  case "$r" in False|false) restore_run_in_background; echo "stopped"; exit 0 ;; esac
  sleep 1
done
run_eval "UnityEditor.EditorApplication.isPlaying = false; return 0;" >/dev/null
restore_run_in_background
echo "stop requested (last isPlaying: ${r:0:200})"
