#!/usr/bin/env bash
# Classify the PR diff, never the synthetic pull/NUMBER/merge commit.
# NUL-delimited Git paths avoid quoted octal UTF-8 and newline ambiguities.
set -euo pipefail

code=false
desktop=false
desktop_direct=false
sdk=false
workflow=false
full=false

is_source() {
  case "$1" in
    *.go|*.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|*.py|*.sh|*.bash|*.ps1|*.rs|*.c|*.h|*.cpp|*.hpp|*.cs|*.java|*.kt|*.kts|*.swift|*.m|*.mm|*.dart|*.vue|*.svelte) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ "${CI_EVENT_NAME:-}" != pull_request || "${CI_HEAD_REF:-}" == release/* ]]; then
  # Push, manual, scheduled and release runs remain deliberately exhaustive.
  code=true; desktop=true; desktop_direct=true; sdk=true; workflow=true; full=true
else
  : "${CI_BASE_SHA:?missing pull request base SHA}"
  : "${CI_HEAD_SHA:?missing pull request head SHA}"
  git cat-file -e "${CI_BASE_SHA}^{commit}"
  git cat-file -e "${CI_HEAD_SHA}^{commit}"
  merge_base=$(git merge-base "$CI_BASE_SHA" "$CI_HEAD_SHA")
  changed=$(mktemp)
  trap 'rm -f "$changed"' EXIT
  # --no-renames tracks both sides of moves, including source -> docs/.
  # -z preserves Chinese, whitespace, quotes and newlines verbatim.
  git diff --no-renames --name-only -z "$merge_base" "$CI_HEAD_SHA" > "$changed"

  count=0
  while IFS= read -r -d '' path; do
    count=$((count + 1))
    case "$path" in
      .github/workflows/*|.github/actions/*|scripts/ci-classify-changes.sh|scripts/ci-classify.test.mjs|scripts/ci-workflow.test.mjs)
        workflow=true ;;
      desktop/*)
        desktop=true; desktop_direct=true ;;
      sdk/*)
        sdk=true ;;
      internal/extension/*)
        code=true; desktop=true; sdk=true ;;
      docs/*|benchmarks/*|plan/*|tmp/*|.agents/*|release-notes/*)
        # Directory names alone do not imply documentation-only changes.
        if is_source "$path"; then
          code=true
          if [[ "$path" != benchmarks/* ]]; then desktop=true; fi
        fi ;;
      *.md|*.mdx|LICENSE|.gitignore|.gitattributes|.editorconfig|.coderabbit.yaml|.github/ISSUE_TEMPLATE/*|.github/pull_request_template.md|.github/labeler.yml|.github/dependabot.yml)
        : ;;
      .github/*)
        # Other GitHub automation definitions require workflow validation.
        workflow=true ;;
      *)
        # Unknown paths fail closed. Root-module changes can affect desktop.
        code=true; desktop=true ;;
    esac
  done < "$changed"
  printf 'CI classifier: %d changed paths\n' "$count" >&2
fi

result=$(printf 'code=%s\ndesktop=%s\ndesktop_direct=%s\nsdk=%s\nworkflow=%s\nfull=%s\n' \
  "$code" "$desktop" "$desktop_direct" "$sdk" "$workflow" "$full")
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf '%s\n' "$result" >> "$GITHUB_OUTPUT"
fi
printf '%s\n' "$result"
