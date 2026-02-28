#!/usr/bin/env bash
set -euo pipefail

# Runs Claude per component to verify and fix standards, ARIA, and theming.
# Requires: claude CLI.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECKER="claude"
MODEL="${MODEL:-sonnet}"

# Allow claude CLI to run inside Claude Code session
unset CLAUDECODE

if ! command -v "$CHECKER" >/dev/null 2>&1; then
  echo "claude CLI not found on PATH"
  exit 1
fi

STANDARDS=""
for f in "$ROOT"/.ai/*.md; do
  [ -f "$f" ] && STANDARDS="$STANDARDS
--- $(basename "$f") ---
$(cat "$f")
"
done
[ -f "$ROOT/DEVELOPMENT.md" ] && STANDARDS="$STANDARDS
--- DEVELOPMENT.md ---
$(cat "$ROOT/DEVELOPMENT.md")
"

AI_DOCS=""
for f in "$ROOT"/.ai/*.md; do
  [ -f "$f" ] && AI_DOCS="$AI_DOCS
--- .ai/$(basename "$f") ---
$(cat "$f")
"
done

COMPONENTS=()
while IFS= read -r -d '' f; do
  comp_dir="$(basename "$(dirname "$f")")"
  COMPONENTS+=("$comp_dir")
done < <(find "$ROOT/components" -maxdepth 2 -name "snice-*.ts" -print0)

IFS=$'\n' COMPONENTS=($(printf '%s\n' "${COMPONENTS[@]}" | sort -u))
unset IFS

for comp in "${COMPONENTS[@]}"; do
  SRC="$ROOT/components/$comp/snice-${comp}.ts"
  TYPES="$ROOT/components/$comp/snice-${comp}.types.ts"
  CSS="$ROOT/components/$comp/snice-${comp}.css"
  AI_DOC="$ROOT/docs/ai/components/${comp}.md"
  HUMAN_DOC="$ROOT/docs/components/${comp}.md"

  [ -f "$SRC" ] || continue

  CONTEXT="
--- SOURCE: snice-${comp}.ts ---
$(cat "$SRC")
"
  [ -f "$TYPES" ] && CONTEXT="$CONTEXT
--- TYPES: snice-${comp}.types.ts ---
$(cat "$TYPES")
"
  [ -f "$CSS" ] && CONTEXT="$CONTEXT
--- CSS: snice-${comp}.css ---
$(cat "$CSS")
"
  [ -f "$AI_DOC" ] && CONTEXT="$CONTEXT
--- AI DOC: ${comp}.md ---
$(cat "$AI_DOC")
"
  [ -f "$HUMAN_DOC" ] && CONTEXT="$CONTEXT
--- HUMAN DOC: ${comp}.md ---
$(cat "$HUMAN_DOC")
"

  PROMPT="You are Claude working inside the Snice repository.

Read and follow all standards and instructions below. Apply fixes directly in the repo.

STANDARDS:
$STANDARDS

AI DOCS:
$AI_DOCS

COMPONENT CONTEXT:
$CONTEXT

Task for component: $comp
1) Ensure it follows DEVELOPMENT.md and .ai/*.md standards.
2) Fix ARIA issues and accessibility violations in template, DOM, and CSS.
3) Ensure light and dark mode are handled correctly.
   - Use theme variables and fallbacks.
   - No hard-coded colors unless they are tokens or derived from tokens.
   - If data-theme or prefers-color-scheme is used, ensure both modes are correct.
4) If changes affect public API, update docs/ai and docs accordingly.

Operate only on this component and its docs. Make the fixes, do not just report."

  printf '%s' "$PROMPT" | claude -p --model "$MODEL" --dangerously-skip-permissions --chrome
done
