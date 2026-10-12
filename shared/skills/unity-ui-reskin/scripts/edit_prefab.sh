#!/usr/bin/env bash
. "$(dirname "$0")/_eval.sh"
prelude=$(sed "s#__SPRITE_DIR__#\"${3:-Assets}\"#" "$(dirname "$0")/prelude.cs")
body="$prelude
$(cat "$2")"
run_eval "var root=UnityEditor.PrefabUtility.LoadPrefabContents(\"$1\"); try { $body
UnityEditor.PrefabUtility.SaveAsPrefabAsset(root, \"$1\"); } finally { UnityEditor.PrefabUtility.UnloadPrefabContents(root); } return \"saved $1\";"
