win_path() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }
eval_raw() { unity command eval "$1" --json --no-banner; }
run_eval() {
  local code out
  code="$(printf '%s' "$1" | tr '\n' ' ')"
  out=$(eval_raw "$code")
  case "$out" in *"timed out"*)
    unity command editor_focus --json --no-banner --result-only >/dev/null 2>&1
    out=$(eval_raw "$code") ;;
  esac
  printf '%s' "$out" | python -c "import json,sys;d=json.load(sys.stdin);r=d['data']['result'] if d.get('success') else None;print(r['result'] if r and r.get('success') else json.dumps(d)[:3000])"
}
