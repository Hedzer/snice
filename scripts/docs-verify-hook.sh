#!/usr/bin/env bash

# PostToolUse hook for Edit/Write — async doc verification
# Launches a background agent to verify docs match source for edited components.
# Non-blocking: fires and forgets so it doesn't slow down the main session.

CHECKER="${SNICE_CHECKER:-codex}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

unset CLAUDECODE

# Read hook input from stdin (JSON)
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# Only trigger for component source files
case "$FILE_PATH" in
  */components/*/snice-*.ts) ;;
  *) exit 0 ;;
esac

# Extract component name from path: components/<name>/snice-<name>.ts
COMP_DIR=$(echo "$FILE_PATH" | sed -n 's|.*/components/\([^/]*\)/.*|\1|p')
[ -z "$COMP_DIR" ] && exit 0

# Derive file paths
SRC="$ROOT/components/$COMP_DIR/snice-${COMP_DIR}.ts"
TYPES="$ROOT/components/$COMP_DIR/snice-${COMP_DIR}.types.ts"
CSS="$ROOT/components/$COMP_DIR/snice-${COMP_DIR}.css"
AI_DOC="$ROOT/docs/ai/components/${COMP_DIR}.md"
HUMAN_DOC="$ROOT/docs/components/${COMP_DIR}.md"
GUIDE="$ROOT/.ai/component-docs-guide.md"

# Need at least source + one doc
[ -f "$SRC" ] || exit 0
{ [ -f "$AI_DOC" ] || [ -f "$HUMAN_DOC" ]; } || exit 0

# Check CLI availability
command -v "$CHECKER" >/dev/null 2>&1 || exit 0

# Build context: source + types + css + both docs + guide
CONTEXT=""
[ -f "$SRC" ] && CONTEXT="$CONTEXT
--- SOURCE: snice-${COMP_DIR}.ts ---
$(cat "$SRC")
"
[ -f "$TYPES" ] && CONTEXT="$CONTEXT
--- TYPES: snice-${COMP_DIR}.types.ts ---
$(cat "$TYPES")
"
[ -f "$CSS" ] && CONTEXT="$CONTEXT
--- CSS: snice-${COMP_DIR}.css ---
$(cat "$CSS")
"

# Gather all standards files (same as standards hook)
STANDARDS=""
for f in "$ROOT"/.ai/*.md; do
  [ -f "$f" ] && STANDARDS="$STANDARDS
--- $(basename "$f") ---
$(cat "$f")
"
done
[ -f "$ROOT/docs/ai/DEVELOPMENT.md" ] && STANDARDS="$STANDARDS
--- DEVELOPMENT.md ---
$(cat "$ROOT/docs/ai/DEVELOPMENT.md")
"

DOCS=""
[ -f "$AI_DOC" ] && DOCS="$DOCS
--- AI DOC: ${COMP_DIR}.md ---
$(cat "$AI_DOC")
"
[ -f "$HUMAN_DOC" ] && DOCS="$DOCS
--- HUMAN DOC: ${COMP_DIR}.md ---
$(cat "$HUMAN_DOC")
"

GUIDE_CONTENT=""
[ -f "$GUIDE" ] && GUIDE_CONTENT="$(cat "$GUIDE")"

PROMPT="You are a documentation verifier for the Snice web component framework.

STANDARDS:
$STANDARDS

DOCUMENTATION GUIDE:
$GUIDE_CONTENT

COMPONENT SOURCE:
$CONTEXT

CURRENT DOCS:
$DOCS

Verify both doc files match the source. Check:
1. Every @property() in source → listed in docs Properties section (correct type, default, attribute name)
2. Every @dispatch() in source → listed in docs Events section
3. Every public method in source → listed in docs Methods section
4. Every part=\"...\" in source/template → listed in CSS Parts section
5. Every <slot> in template → listed in Slots section
6. Every --snice-* CSS custom property → listed in CSS Custom Properties section
7. AI doc is low-token (no tables, uses typescript code block for props, bullets for slots/events/methods, 50-150 lines max)
8. Human doc follows section order from the guide
9. Both docs are in sync — no info in one but missing from the other

If everything is correct, respond with just \"ok\".
If there are issues, list ONLY the specific discrepancies in this format:
[docs:$COMP_DIR] <issue description>

Be terse. Only flag real mismatches between source and docs."

# Fire and forget — run checker in background, print results when done
(
  case "$CHECKER" in
    claude)
      RESPONSE=$(printf '%s' "$PROMPT" | claude -p --model haiku --dangerously-skip-permissions 2>/dev/null)
      ;;
    codex)
      RESPONSE=$(printf '%s' "$PROMPT" | codex exec --dangerously-bypass-approvals-and-sandbox --ephemeral - 2>/dev/null)
      ;;
    *)
      exit 0
      ;;
  esac

  if [ -n "$RESPONSE" ] && [ "$RESPONSE" != "ok" ]; then
    echo "[docs-verify:$COMP_DIR] $RESPONSE"
  fi
) &

# Don't wait — exit immediately so hook doesn't block
exit 0
