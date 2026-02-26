#!/usr/bin/env bash

# PostToolUse hook for Edit/Write — fresh coding standards check each time
# Set SNICE_CHECKER=codex to use OpenAI Codex instead of Claude (default: claude)

CHECKER="${SNICE_CHECKER:-codex}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

# Allow claude CLI to run inside Claude Code session
unset CLAUDECODE

# Read hook input from stdin (JSON)
INPUT=$(cat)

# Extract tool input fields
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# Skip non-source files
case "$FILE_PATH" in
  */tests/*|*/.debug/*|*/docs/*|*/public/*) exit 0 ;;
  *.md|*.json|*.html|*.sh) exit 0 ;;
esac

# Check CLI availability
command -v "$CHECKER" >/dev/null 2>&1 || exit 0

# Extract diff from tool input
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
if [ "$TOOL_NAME" = "Edit" ]; then
  OLD=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
  NEW=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
  DIFF=$(printf -- '--- old\n+++ new\n-%s\n+%s' "$OLD" "$NEW")
else
  # Write tool — full content
  DIFF=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
fi

[ -z "$DIFF" ] && exit 0

# Gather all standards files
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

[ -z "$STANDARDS" ] && exit 0

PROMPT="You are a coding standards reviewer for the Snice web component framework.

Standards:
$STANDARDS

Review for:
1. Coding standards violations
2. If the diff changes a component's public API surface, remind: \"API changed — update docs (docs/ + docs/ai/), react adapter metadata, and run component checklist (.ai/component-checklist.md)\"
   API surface includes: @property, @dispatch, part=\"...\", slot, public methods, CSS custom properties (--snice-*), and any attribute a consumer would use.

Be terse. If code follows standards and no API surface changed, respond with just \"ok\". Only flag real issues.

File: $FILE_PATH

Diff:
$DIFF"

case "$CHECKER" in
  claude)
    RESPONSE=$(printf '%s' "$PROMPT" | claude -p --model sonnet --dangerously-skip-permissions 2>/dev/null)
    ;;
  codex)
    RESPONSE=$(printf '%s' "$PROMPT" | codex exec --dangerously-bypass-approvals-and-sandbox --ephemeral - 2>/dev/null)
    ;;
  *)
    exit 0
    ;;
esac

if [ -n "$RESPONSE" ] && [ "$RESPONSE" != "ok" ]; then
  echo "[standards] $RESPONSE"
fi
