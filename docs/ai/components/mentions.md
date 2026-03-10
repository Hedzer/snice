# snice-mentions

Text input with inline @mention autocomplete. Mentions stored as `@[Name](id)` markers.

## Properties

```ts
value: string = '';              // Raw text with @[Name](id) markers
users: MentionUser[] = [];       // JS only — autocomplete candidates
placeholder: string = 'Type @ to mention someone...';
readonly: boolean = false;
trigger: string = '@';           // Trigger character
```

## Types

```ts
interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

interface Mention {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
}
```

## Methods

- `getValue()` → `string` (raw value with markers)
- `getPlainText()` → `string` (mentions replaced by names)
- `getMentions()` → `Mention[]` (structured mention data)

## Events

- `mention-add` → `{ user: MentionUser, value: string }`
- `mention-remove` → `{ user: MentionUser, value: string }`
- `value-change` → `{ value: string, plainText: string, mentions: Mention[] }`

## CSS Parts

- `base` - Wrapper container
- `editor` - Editor container
- `textarea` - Text input
- `dropdown` - Autocomplete dropdown

## Keyboard

Arrow Down/Up navigate dropdown, Enter/Tab select, Escape closes.

## Basic Usage

```typescript
import 'snice/components/mentions/snice-mentions';
```

```html
<snice-mentions placeholder="Write something..."></snice-mentions>
```

```typescript
editor.users = [
  { id: 'u1', name: 'Alice Johnson', avatar: 'alice.jpg' },
  { id: 'u2', name: 'Bob Smith' }
];
editor.value = 'Hey @[Alice Johnson](u1), check this out!';
editor.addEventListener('mention-add', e => console.log('Mentioned:', e.detail.user));
editor.addEventListener('value-change', e => console.log('Mentions:', e.detail.mentions));
```
