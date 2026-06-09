# snice-chat — Remaining Work / Handoff

Branch: `feat/chat-theming` (uncommitted). Status as of this handoff.

## DONE (working, tested before the popover rework)
- `<snice-chat-message>` config-carrier sub-element + dual-API ingestion (array OR slotted children; slot wins).
- Per-user name colors: `color-authors` (auto hash→accent), `authorColors` map, per-message `authorColor`. Injected via inline `--snice-chat-author-color`.
- Markdown: `markdown` attr + per-message `format`; fixed the `white-space: pre-wrap` gap (`snice-markdown.message-text { white-space: normal }`).
- `layout="bubbles"`.
- Full `::part` surface (avatar, author, timestamp, edited, message-text, message/-own/-other, system-message, reactions, reaction, reaction-active, actions, typing-indicator, …).
- Exported enums `MessageFormat` / `ChatLayout`.
- Docs (human + AI), React adapter regen, public showcase (5 demos + avatars), full-showcase.html, Storybook stories.
- Full `npm test` was green per-stage BEFORE the popover rework below.

## DONE in this session (items 1–6 below)
- **1.** Delete confirm finished — `renderDeleteConfirm(message)` added, branched in `renderMessage`, actions hidden while confirming.
- **2.** Icons swapped — `PENCIL`/`TRASH` from `components/icons` via `unsafeHTML`; react button is a 🙂 emoji glyph (per request: a face, not `+`).
- **3.** CSS added — `.message-edit`, `.edit-field`, `.edit-actions`, `.edit-button`, `.edit-save`, `.message-confirm`, `.confirm-*`, `.action-emoji`; danger token `--snice-color-danger, rgb(220 38 38)`.
- **4.** Dropped the unused `isCurrentUser` param from `renderReactions`.
- **5.** Showcase double-apply fixed — `wire()` keeps only `message-send`.
- **6.** `message-thread` KEPT (decision reversed): threads are now a planned feature — see "Threads" below.
- Tests: 11 new cases (react-on-others, react toggle-off, edit show/Save/Enter/Escape, delete confirm/confirm-yes/cancel). Full `npm test` green (all 5 stages, 152 files / 1219 tests). Component rebuilt (`rebuild-single-component.mjs chat`, exit 0). Showcases rebuilt. Docs (human + AI) updated: action behavior + new parts.

### STILL TODO this session
- Visual check dark+light — BLOCKED: a 14h-old `vite --port 52891` (the user's, pid was 2119182) is hung and holding the port; needs the user to kill it or free the port.
- Cleanup: `.superpowers/brainstorm/**`, `.playwright-mcp/**` (not yet removed — awaiting commit-scope decision).
- Commit (not done — never commit without asking).

### Threads (Slack-style) — QUEUED
- Keep `message-thread` event + `ChatMessage.thread?: ChatMessage[]`.
- Brainstorm needed: reply affordance on a message → opens a thread panel/drawer; thread reply composer; unread/typing within a thread; how thread renders (side panel vs inline expand). Design-first before code.

## (HISTORICAL) IN PROGRESS / BROKEN — must finish before this compiles & works

### 1. Message-action rework is half-applied (`components/chat/snice-chat.ts`)
- ✅ `handleReaction` now toggles + emits (react works on ANY message).
- ✅ Inline edit added: `startEdit`/`commitEdit`/`cancelEdit`/`handleEditKeydown`, `editingId` state, `renderEditor`, `@query('.edit-field')`, focus on edit.
- ✅ `renderActions(messageId, isCurrentUser)`: react on all, edit/delete owner-only.
- ❌ **Delete confirm is incomplete.** `handleDelete` sets `confirmingDeleteId`, and `confirmDelete`/`cancelDelete` exist, BUT:
  - there is **no `renderDeleteConfirm` method**, and
  - `renderMessage` does NOT render anything when `confirmingDeleteId === message.id`.
  - → clicking Delete currently does nothing visible. Add a `renderDeleteConfirm(message)` (inline "Delete this message? [Delete][Cancel]"), and branch to it in `renderMessage` (and hide the actions popover while confirming, like edit).

### 2. Icons — STILL raw inline SVG (the repeated ask)
- `renderActions` and `renderEditor` use hand-rolled `<svg><path>`.
- Use the shared icon constants in **`components/icons/index.ts`** (e.g. `PENCIL` for edit, `TRASH` for delete). There is also `renderIcon()` in `components/utils.ts` for ligatures/urls.
- No react/emoji constant exists in `components/icons/index.ts` — pick/add an appropriate one for the react button (e.g. a face/`+` reaction icon) rather than the inline circle SVG.

### 3. CSS missing for the new inline UI (`components/chat/snice-chat.css`)
- No styles exist yet for: `.message-edit`, `.edit-field`, `.edit-actions`, `.edit-button`, `.edit-save`, and the delete-confirm classes (`.message-confirm` / `.confirm-*` — naming TBD with #1).
- Use theme tokens with exact `theme.css` fallbacks (delete = `--snice-color-danger, rgb(220 38 38)`).
- Add parts already referenced: `edit-input`, `edit-save`, `edit-cancel` (+ delete-confirm parts).

### 4. `renderReactions` signature
- Call site is now `renderReactions(message.id, message.reactions)` but the method still declares a 3rd `isCurrentUser` param (now unused). Drop the unused param.

### 5. Showcase double-apply (`public/showcases/chat.html`)
- `wire()` adds `message-react` / `message-edit` / `message-delete` listeners that ALSO mutate. The component now self-applies these → **double application** (react toggles twice = no-op; edit/delete double-fire).
- Remove the react/edit/delete listeners from `wire()`. Keep only `message-send` (component does not self-add sent messages).

### 6. Dead code
- `handleThread` was removed; `emitMessageThread` + the `message-thread` `@dispatch` + its event-map entry are now unused. Either remove them (and from docs/types/adapter) or leave as declared public event. Decide.

## AFTER finishing the above
- Rebuild: `node scripts/rebuild-single-component.mjs chat` (must exit 0).
- Tests: add coverage for react-on-others, inline edit (commit on Enter, cancel on Esc), inline delete confirm/cancel; then run full `npm test` (all 5 stages) — green, no excuses.
- Docs (human + AI): update the action behavior (react on any message; inline edit; inline delete confirm) and the new parts (`edit-input`, `edit-save`, `edit-cancel`, delete-confirm parts).
- Visual check in dark AND light via `npm run website:dev` (:52891) — screenshots to /tmp only, never in the repo.

## Cleanup (not feature)
- Untracked session cruft to remove: `.superpowers/brainstorm/**`, `.playwright-mcp/**` session files.
- Decide whether the rebuilt artifacts (`dist/`, `public/components/snice-chat.min.js`, `adapters/react/*.js`) get committed or left to the deploy pipeline.

## Not started (queued, design-first)
- **#10** Bubble side-placement config (`bubble-align` own-left/own-right) layered on `layout="bubbles"`.
- **#11** Custom message content — pluggable element interface so a custom element (poll, choice, gif viewer) renders as a pseudo-message. NEEDS A BRAINSTORM before any code.
