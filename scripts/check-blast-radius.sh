#!/usr/bin/env bash
set -euo pipefail

body="${BLAST_RADIUS_PR_BODY:-${PR_BODY:-}}"
if [[ -n "${BLAST_RADIUS_PR_BODY_FILE:-}" ]]; then
  body="$(<"$BLAST_RADIUS_PR_BODY_FILE")"
fi

mapfile -t declarations < <(printf '%s\n' "$body" | grep -Ei '^[[:space:]>#*_-]*Blast-radius[[:space:]]*:' || true)
if [[ "${#declarations[@]}" -ne 1 ]]; then
  echo "Blast Radius check failed: expected exactly one Blast-radius declaration; found ${#declarations[@]}." >&2
  echo "Required PR field:" >&2
  echo "  Blast-radius: <local|cross-component|broad> - <reason and affected scope>" >&2
  exit 1
fi

value="${declarations[0]#*:}"
value="${value#"${value%%[![:space:]]*}"}"
value="${value%"${value##*[![:space:]]}"}"
lower="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
if [[ ! "$lower" =~ ^(local|cross-component|broad)[[:space:]]*[-:][[:space:]]*(.+)$ ]]; then
  echo "Blast Radius check failed: choose local, cross-component, or broad and provide a reason." >&2
  echo "Received: $value" >&2
  exit 1
fi

reason="${BASH_REMATCH[2]}"
reason_lower="$(printf '%s' "$reason" | tr '[:upper:]' '[:lower:]')"
if [[ "$reason_lower" =~ ^(todo|tbd|n/?a|none)([[:space:]:-]|$) ]]; then
  echo "Blast Radius check failed: the reason must explain affected components or potential consequences." >&2
  exit 1
fi

echo "Blast Radius declaration passed: ${BASH_REMATCH[1]} - $reason"
