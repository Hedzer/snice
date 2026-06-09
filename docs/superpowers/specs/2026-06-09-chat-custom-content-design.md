# snice-chat — Custom Content & Author Identity (Design Spec)

Status: approved design, ready for an implementation plan.
Date: 2026-06-09.
Owner: snice-chat.

## 1. Purpose

Today `snice-chat` renders four message types (`text`, `file`, `image`, `system`) and the body of every message is static rendered content. We want consumers to put **interactive, stateful custom elements** in the message stream — polls, prompts, choices, gif viewers, anything they build as a snice component — and have them behave as first-class messages: they round-trip through reload/replay, their live state persists, and they freeze when their lifecycle ends.

The same design pass also pins how author identity is modeled, because the data model is being revised and the existing `author: string` collapses identity and display name in a way that breaks once `author` is a database ID.

## 2. Scope

In scope:

- A new message kind `type: 'custom'` carrying a tag + attributes + opaque state blob.
- A small public interface, `SniceChatContent`, that custom elements implement so the chat can hydrate them, persist their changes, and reconstruct them on replay.
- Both authoring paths (imperative descriptor in the `messages` array, and declarative slotting of the real element inside `<snice-chat-message>`), mirroring the existing dual API.
- Element-driven freeze: the element decides interactive vs frozen via a `locked` flag inside its own state.
- A fallback render when a custom message references a tag that is not a registered custom element.
- Author identity: an additive, backwards-compatible `authorId` on the message and `currentUserId` on the chat.

Out of scope (queued separately):

- Pluggable content authored as a *different* element name nested inside a `<snice-chat-message>` more than one level (only the direct custom-element child is recognised).
- A library of built-in custom contents (poll, choice, gif). Those land as separate components later and just implement the contract spec'd here.
- Threading/replies (see the threads task in `2026-05-27-chat-theming-REMAINING.md`).

## 3. Data Model

### 3.1 `ChatMessage` additions

```typescript
type MessageType = 'text' | 'file' | 'image' | 'system' | 'custom';

interface ChatMessage {
  // ...existing fields unchanged...
  type: MessageType;

  // present iff type === 'custom':
  tag?: string;                          // e.g. 'snice-poll'
  attributes?: Record<string, string>;   // serialized to HTML attributes verbatim
  state?: unknown;                       // opaque JSON blob; chat never inspects

  // identity (additive, backwards compatible):
  authorId?: string;                     // stable id; falls back to `author` when absent
}
```

`content` is unused when `type === 'custom'` (the body comes from the rendered element). The field is relaxed from `string` to `string | undefined` in `ChatMessage` — a backwards-compatible widening for callers that previously always set it.

### 3.2 `SniceChat` additions

```typescript
currentUserId?: string;   // stable id of the local user
```

When `currentUserId` is set, own/other detection compares it to `message.authorId`. Otherwise it falls back to the existing `currentUser === message.author` comparison. Color-hashing uses the same precedence: hash on `authorId` when present, else `author`. No existing call site changes behavior unless the consumer opts in by setting IDs.

## 4. The Contract — `SniceChatContent`

```typescript
export interface SniceChatContent extends HTMLElement {
  /** Saved state blob the chat hydrates on render. Element renders from it. */
  value: unknown;
}

export interface SniceChatContentEventMap {
  /** Emitted whenever the element's state changes, including becoming locked.
   *  Detail is the FULL serializable state, not a delta. */
  'content-change': CustomEvent<{ state: unknown }>;
}
```

Conventions custom elements follow but the chat does not enforce in code:

- The element renders interactive vs frozen based on a `locked` field it owns inside its own `state`. The chat never looks at `locked`; it just stores whatever state comes back.
- `content-change` carries the complete new state, so the chat can persist by replacing.
- The element may also accept a chat-level `readonly` attribute as an override (e.g. for a globally disabled chat); it's optional and not required by the contract.
- No `getState()` method. The `content-change` event is the only state channel out.

## 5. Round-Trip & Freeze

```
[author] <snice-poll question="Lunch?"> in light DOM
   │
   ▼ ingest (declarative path) OR addMessage (imperative path)
ChatMessage { type:'custom', tag, attributes, state, ... }
   │
   ▼ stored in messages[] / persisted by consumer to backend
   │
   ▼ render: chat reconstructs <snice-poll> in shadow DOM,
            sets attributes, sets .value = state
   │
   ▼ element renders from state — interactive iff state.locked === false
   │
   ▼ user interacts → element emits content-change { state: {...new} }
   │
   ▼ chat updates messages[i].state AND re-emits message-content-change
   │
   ▼ next render replays the new state (no special path)
```

Reload from history is just "render with the stored state." There is no `historical` vs `live` mode in the chat. A still-open poll loaded from history stays interactive because its stored `state.locked === false`. A closed one stays frozen because `state.locked === true`. The chat's behavior is identical in both cases.

## 6. Authoring API

Both paths mirror the existing dual API.

### 6.1 Imperative

```typescript
chat.addMessage({
  type: 'custom',
  tag: 'snice-poll',
  attributes: { question: 'Lunch?' },
  state: { options: ['🍕', '🌮'], votes: {}, locked: false },
  author: 'Alice',
  authorId: 'u_1',
  timestamp: new Date(),
});
```

`messages` array entries with `type:'custom'` follow the same shape.

### 6.2 Declarative

```html
<snice-chat current-user="Me" current-user-id="u_42">
  <snice-chat-message author="Alice" author-id="u_1" timestamp="...">
    <snice-poll question="Lunch?"></snice-poll>
  </snice-chat-message>
</snice-chat>
```

`<snice-chat-message>`'s existing `getMessageDefinition()` is extended to detect a custom-element child — the **first** light-DOM child whose tag name contains a hyphen and isn't `snice-chat-message`. Subsequent custom-element siblings are ignored (a message has one body). When present:

- `type` becomes `'custom'`.
- `tag` = the child's tag name.
- `attributes` = the child's HTML attributes serialized into a `Record<string,string>` (excluding internal snice/render attributes).
- `state` = the child's current `.value` if defined, else `undefined`.

Slot ingestion (existing `onSlottedMessagesChanged` observer) covers added/removed messages. The custom child itself is then re-rendered by the chat into shadow DOM; the original light-DOM element is not displayed (the chat has no projecting slot).

## 7. Rendering & Reconstruction

A custom message uses the same message frame as any other message: avatar, author, timestamp, edited marker, reactions, and the hover-actions menu are unchanged. The custom element replaces the **body** only.

Reconstruction cannot go through the snice `html` template because the tag name is dynamic. The render pass instead writes a placeholder:

```html
<div part="custom-host" class="custom-host" data-message-id="${m.id}"></div>
```

After render, a post-render pass walks each `[data-message-id]` whose message is `type:'custom'` and:

1. Looks up the current child in the host. If it's already the correct tag, leaves it.
2. Otherwise clears the host and `document.createElement(tag)`, applies attributes, sets `value = state`, appends.
3. Subscribes once to `content-change` on the host element (delegated, so re-mounted children don't need to re-bind).

The post-render pass keys on `tag` + message id so reuse is stable across re-renders. Diffing is intentionally trivial: same tag → reuse and re-`value`; different tag → rebuild.

### 7.1 Hover actions on custom messages

Reactions and delete behave as for any message. Inline text-edit (the textarea editor) is suppressed for `type:'custom'` because there is no prose to edit; "editing" a poll means interacting with it.

### 7.2 Unknown tag fallback

If `customElements.get(tag)` is undefined at render time, the host renders a small placeholder:

```
<div part="custom-fallback" class="custom-fallback">
  Unsupported content (<code>${tag}</code>)
</div>
```

The message's `state` is left intact in the model so nothing is lost if the consumer later registers the element and re-renders.

## 8. Chat-Level Events

A new event mirrors the self-apply-then-emit pattern already used for react / edit / delete:

```typescript
'message-content-change': CustomEvent<{ messageId: string; state: unknown }>
```

When the chat receives `content-change` from a custom child, it updates `messages[i].state` in place AND re-emits `message-content-change` with the messageId so the consumer can persist to a backend. Consumers must not also call `updateMessage` in their handler — the chat already applied it (the same double-apply trap as the other actions).

## 9. Author Identity (Folded Section)

This is a small additive change folded into the same spec because it touches the same `ChatMessage` type and the same color/own-detection paths.

- Add `authorId?: string` to `ChatMessage`.
- Add `currentUserId?: string` to `SniceChat` (attribute `current-user-id`).
- `<snice-chat-message>` gains an `author-id` attribute that flows into `getMessageDefinition()`.
- `isCurrentUser` becomes:
  ```typescript
  const isCurrentUser = this.currentUserId
    ? message.authorId === this.currentUserId
    : message.author === this.currentUser;
  ```
- Color hashing in `autoAuthorColor` and `resolveAuthorColor` keys off `authorId` when present, else `author`. The display in the message header is always `author` (the name), unchanged.

Backwards compatibility: consumers who never set IDs see no behavior change. Consumers who set IDs get stable color and ownership even when display names change or collide.

## 10. Testing

- `type:'custom'` ingest from a slotted `<snice-chat-message>` carrying a child custom element: produces a `ChatMessage` with `tag`, `attributes`, `state` derived from the child's `.value`.
- `addMessage({type:'custom', ...})` renders a host containing the correct tag with attributes applied and `.value` set to the stored state.
- A `content-change` from the custom child updates the message's `state` in the array AND fires `message-content-change` with that state.
- Re-render after a `state` change reuses the existing child element (no flicker / no re-create) when `tag` is unchanged.
- Changing the `tag` rebuilds the child.
- Unknown tag renders the fallback placeholder and preserves `state`.
- Inline text-edit is suppressed on a `type:'custom'` message; reactions and delete still work.
- Author identity: `authorId === currentUserId` gives the `message-own` part regardless of display name; color hash is stable across display-name changes when `authorId` is set; without IDs, behavior is identical to today.

All tests live alongside existing chat tests (`tests/components/chat.test.ts`, `tests/components/chat-message.test.ts`).

## 11. Implementation Notes

- Dynamic tag names cannot appear in the snice `html` template. The chat renders a host placeholder per custom message and mounts/updates the child imperatively in a post-render pass (the table's programmatic mount pattern is the prior art).
- `attributes` is `Record<string,string>` because HTML attributes are strings; complex values must live in `state`, not `attributes`. The contract is clear about this.
- `state` is treated as opaque JSON — the chat does not clone or freeze it. Consumers persisting to a backend should treat it the same.
- Delegated `content-change` listener on the messages area, so re-mounts don't leak handlers.

## 12. Migration

- No required migration: every existing call site keeps working. `type:'custom'`, `tag`, `attributes`, `state`, `authorId`, `currentUserId`, and `message-content-change` are all additive.

---

Ready for `writing-plans`.
