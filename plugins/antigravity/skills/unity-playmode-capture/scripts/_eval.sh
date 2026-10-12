win_path() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }
run_eval() {
  unity command editor_focus --json --no-banner --result-only >/dev/null 2>&1
  unity command eval "$(printf '%s' "$1" | tr '\n' ' ')" --json --no-banner | python -c "import json,sys;d=json.load(sys.stdin);r=d['data']['result'] if d.get('success') else None;print(r['result'] if r and r.get('success') else json.dumps(d)[:3000])"
}
