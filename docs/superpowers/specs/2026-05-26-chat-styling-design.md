# snice-chat: full theming surface + declarative messages + markdown

**Date:** 2026-05-26
**Status:** Approved design, pre-implementation

## Problem

`snice-chat` is barely styleable. It exposes only 5 CSS parts (`base`, `messages`,
`input-area`, `input-container`, `input`) and theme tokens. None of the per-message
pieces — author name, avatar, timestamp, bubble, reactions — are reachable from
outside the shadow DOM. There is no per-user color, no own-vs-other distinction
(the component computes `isCurrentUser` but never writes it to the DOM), no
markdown, and no declarative authoring API (it is imperative-only via `messages[]`).

## Goals

Deliver five capabilities, all **opt-in** and **purely additive** — the default
render must be byte-for-byte identical to today:

- **A · Per-user name colors** — each author's name colored, Slack/Discord style.
- **B · Own vs other** — style "my" messages differently; ship an opt-in bubble layout.
- **C · Bubble / message-type theming** — restyle bubble, system message, reactions, timestamps.
- **D · Full part surface** — every internal element exposed as a CSS `::part`.
- **E · Markdown** — render message content as markdown, opt-in.

Plus the architectural change the user approved:

- **Declarative `<snice-chat-message>` sub-element** giving `snice-chat` the dual API
  (imperative array **or** slotted children) required of collection components.

## Non-Goals (explicitly out of scope)

- **CDN bundling of the new sub-element.** The known table/`snice-column` CDN
  gotcha is not solved here. Do not touch the CDN build for this work.
- Inline message editing UX (stays the existing `prompt()` behavior).
- Threads / reaction pickers / any new interaction.

## Architecture

Follows the existing **table / `snice-column` pattern**: the sub-element is a
declarative *config carrier*, not a self-rendering element. The parent keeps
ownership of all rendering, so the styling part surface stays flat — no nested
shadow DOM, no `exportparts` chaining.

```
<snice-chat>                         parent — owns rendering, owns the part surface
  ├─ messages[] (imperative API)  ┐
  │                               ├─ merged → renders message rows in its shadow DOM
  └─ <snice-chat-message slot>  ──┘   (slot wins when present)
        (declarative config carrier, render() = <slot></slot>, renders nothing)
```

Ingestion mirrors the table:

```
await customElements.whenDefined('snice-chat-message');
const els = Array.from(this.querySelectorAll('snice-chat-message[slot="messages"]'));
this.messages = els.map(el => el.getMessageDefinition());
// re-read on bubbling 'message-changed'
```

## New element: `<snice-chat-message>`

Files: `components/chat/snice-chat-message.ts`, `snice-chat-message.types.ts`, `snice-chat-message.css` (minimal).

- `@element('snice-chat-message')`, `@render()` → `html\`<slot></slot>\``.
- Attributes: `author`, `avatar`, `timestamp`, `type`, `format` (`text` | `markdown`),
  `edited` (boolean), `author-color`.
- Message body = default slot text content.
- `getMessageDefinition(): ChatMessage` — serializes props to a `ChatMessage`.
- Bubbles `message-changed` (`{ message: ChatMessage }`) on any prop change, so the
  parent re-reads (same as `snice-column`'s `column-changed`).

## `<snice-chat>` additions — all additive

### 1. Dual API
Keep `messages[]`, `addMessage`, `updateMessage`, `deleteMessage`, `clear`. Also
ingest slotted `<snice-chat-message slot="messages">` via the table pattern above.
Slot children win when present.

### 2. Per-user name colors (A)
- New property `authorColors: Record<string, string>` (override map).
- New boolean attribute `color-authors` — opt-in to automatic coloring.
- Resolution per message, computed inside the component instance (no global
  registry, no singleton):
  1. `authorColors[author]` if set, else
  2. auto: stable hash of author name → fixed accent palette **only when `color-authors` is present**, else
  3. unset → falls through to the current default color.
- Implementation: author element gets `style="--snice-chat-author-color:${resolved}"`
  when a color resolves; CSS reads `color: var(--snice-chat-author-color, <current default token>)`.
  Inline-CSS-var injection is the established snice idiom (`--c`, `--bar-delay`,
  `--volume-percent`, `--form-columns`). **No `data-*` styling hooks.**

### 3. Own vs other (B)
- Each message row gets space-separated part names: `part="message message-own"`
  or `part="message message-other"` (the established stateful-variant idiom —
  cf. `part="button first-button"`). Default CSS for these adds nothing visual.
- Opt-in `layout="bubbles"` attribute ships the aligned colored-bubble look via
  `:host([layout="bubbles"])` rules. Absent attribute = today's look.

### 4. Bubble / type theming (C) + full part surface (D)
Add `part=` to: `avatar`, `author`, `timestamp`, `edited`, `message-text`,
`attachment`, `reactions`, `reaction`, `message-actions`, `system-message`,
`typing-indicator`. (Generic role names; stateful variants via space-separated
second names where applicable.)

### 5. Markdown (E)
- Add `format?: 'text' | 'markdown'` to `ChatMessage`.
- New boolean attribute `markdown` — component-wide default.
- A message renders as markdown when `message.format === 'markdown'`, or when the
  `markdown` attribute is set and `message.format !== 'text'` (per-message `'text'`
  overrides the component default).
- Markdown rendered through the existing `<snice-markdown>` component; import follows
  the existing `import '../empty-state/snice-empty-state'` precedent. Off by default.

### Types
- `ChatMessage` gains `format?: 'text' | 'markdown'`.
- New `SniceChatMessageElement` interface + `SniceChatMessageEventMap`.
- `snice-chat` gains `authorColors`, `markdown`, `colorAuthors`, `layout` on its element interface.

## Deliverables

- Source: the new element (3 files) + additive edits to `snice-chat.ts`, `.types.ts`, `.css`.
- React adapter: metadata for `snice-chat` (new props) and new `snice-chat-message` in
  `scripts/generate-react-adapters.js`; regenerate adapters + tests.
- Tests: unit tests for both elements (see Verification).
- Docs: `docs/components/chat.md` and `docs/ai/components/chat.md` updated to mirror —
  new properties, attributes, parts, the sub-element, markdown, layout. Behavior + API
  only; no internal symbol names or framework plumbing in the prose.
- Showcase: update `public/showcases/chat.html` to demo the new capabilities.

## Verification (required before calling done)

- **Tests for everything authored.** Cover: dual-API ingestion (array, slot, both →
  slot wins), boundary cases (no messages, one, many), author-color resolution
  (map / auto / default / `color-authors` off), own/other part names, markdown
  on/off and per-message override, all new parts present, default render unchanged.
- **Full suite:** `npm test` — the whole vitest suite, not a filtered path. Every
  failure is in scope to fix; no "pre-existing" excuses.
- **Visual confirmation of all authored code** — exercise the live component in the
  browser (showcase/demo), in **both dark and light** (Snice defaults to dark). Confirm:
  default render unchanged, per-user colors, bubble layout, markdown, system messages,
  reactions. Visual defects are bugs, not "polish later".

## Key design decisions

1. **Sub-element is a config carrier, not self-rendering** — mirrors `snice-column`.
   Keeps the part surface on the parent's shadow DOM (flat `::part`, no `exportparts`).
2. **Auto-coloring is opt-in (`color-authors`), not on by default** — preserves the
   byte-for-byte-unchanged default render. `authorColors` map always wins over auto.
3. **Per-author color via inline `--snice-chat-author-color`, not `data-*`** — matches
   the snice dynamic-per-item idiom; `data-*` in snice are behavioral/JS hooks only.
4. **Own/other via space-separated part names**, matching `part="button first-button"`.
5. **Markdown reuses `<snice-markdown>`**, imported like the existing empty-state import.
6. **CDN bundling of the sub-element is out of scope** by explicit instruction.
