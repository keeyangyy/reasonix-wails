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

is_docs_only() {
  case "$1" in
    *.md|*.mdx|*.txt|*.rst|*.adoc|*.tex|*.svg|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.avif|*.ico|*.pdf|*.json|*.jsonl|*.yaml|*.yml|*.toml|*.csv|*.tsv|*.xml|*.html|*.css|*.scss|*.sass|*.less|*.woff|*.woff2|*.ttf|*.otf|*.eot|*.mp4|*.webm|*.lock|*.snap|docs/.nojekyll) return 0 ;;
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
      .github/workflows/*|.github/actions/*|scripts/ci-classify-changes.sh|scripts/ci-classify.test.mjs|scripts/ci-workflow.test.mjs|\
      scripts/check-docs-impact.sh|scripts/check-docs-impact.test.sh|\
      scripts/check-cache-impact.sh|scripts/check-cache-impact.test.sh|\
      scripts/check-blast-radius.sh)
        workflow=true ;;
      desktop/*)
        # Only prose in desktop/ can skip its expensive native matrix.
        case "$path" in *.md|*.mdx|*.txt) : ;; *) desktop=true; desktop_direct=true ;; esac ;;
      sdk/*)
        case "$path" in *.md|*.mdx|*.txt) : ;; *) sdk=true ;; esac ;;
      internal/extension/*)
        # Protocol and extension source changes affect all three modules.
        # Pure prose under this directory does not.
        case "$path" in *.md|*.mdx|*.txt) : ;; *) code=true; desktop=true; sdk=true ;; esac ;;
      docs/*|benchmarks/*|plan/*|tmp/*|.agents/*|release-notes/*)
        # Only known documentation/data formats can skip source checks.
        # Unknown extensions fail closed, even under docs/ or benchmarks/.
        if ! is_docs_only "$path"; then
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
