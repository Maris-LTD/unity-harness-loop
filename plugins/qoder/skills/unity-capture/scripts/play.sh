#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
type="$1"; timeout="${2:-60}"
if [ -z "$type" ]; then echo "usage: play.sh <Full.Component.Type> [timeoutSec]"; exit 64; fi
force_on="var was = UnityEditor.PlayerSettings.runInBackground; UnityEditor.PlayerSettings.runInBackground = true; return was;"
was=$(run_eval "$force_on" 2>/dev/null)
case "$was" in False|false) [ -f "$RIB_STATE" ] || echo false > "$RIB_STATE" ;; esac
unity command editor_play --json --no-banner --result-only >/dev/null 2>&1
end=$((SECONDS+timeout)); r=""
while [ $SECONDS -lt $end ]; do
  r=$(run_eval "UnityEditor.PlayerSettings.runInBackground = true; return UnityEngine.Application.isPlaying && UnityEngine.Object.FindAnyObjectByType<$type>() != null;" 2>/dev/null)
  case "$r" in True|true) sleep "${SETTLE:-1.5}"; echo "playing, $type found"; exit 0 ;; esac
  sleep 2
done
echo "timeout after ${timeout}s: $type not found (last eval: ${r:0:300})"
exit 1
