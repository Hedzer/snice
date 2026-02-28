[//]: # (AI: For a low-token version of this doc, use docs/ai/components/mentions.md instead)

# Mentions
`<snice-mentions>`

A text input with inline @mention autocomplete. Typing the trigger character shows a filtered user list dropdown, and selected mentions are stored as structured markers in the value.

## Basic Usage

```typescript
import 'snice/components/mentions/snice-mentions';
```

```html
<snice-mentions id="editor"></snice-mentions>

<script>
  const editor = document.getElementById('editor');
  editor.users = [
    { id: 'u1', name: 'Alice Johnson' },
    { id: 'u2', name: 'Bob Smith' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/mentions/snice-mentions';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-mentions.min.js"></script>
```

## Examples

### With Users and Avatars

Provide a `users` array with optional avatar URLs for the autocomplete dropdown.

```html
<snice-mentions id="mention-demo"></snice-mentions>

<script>
  document.getElementById('mention-demo').users = [
    { id: 'u1', name: 'Alice Johnson', avatar: 'alice.jpg' },
    { id: 'u2', name: 'Bob Smith', avatar: 'bob.jpg' },
    { id: 'u3', name: 'Charlie Davis' }
  ];
</script>
```

### Pre-populated Value

Set the `value` property with mention markers in `@[Name](id)` format.

```javascript
const editor = document.getElementById('editor');
editor.value = 'Hey @[Alice Johnson](u1), please review this.';
```

### Readonly

Set the `readonly` attribute to prevent editing.

```html
<snice-mentions readonly value="Thanks @[Bob Smith](u2)!"></snice-mentions>
```

### Custom Trigger Character

Use the `trigger` attribute to change the trigger from `@` to another character.

```html
<snice-mentions trigger="#"></snice-mentions>
```

### Reading Structured Data

Use the public methods to extract mention data.

```javascript
const editor = document.getElementById('editor');

// Raw value with markers: "Hey @[Alice](u1)!"
console.log(editor.getValue());

// Plain text: "Hey Alice!"
console.log(editor.getPlainText());

// Structured mentions: [{ id: 'u1', name: 'Alice', startIndex: 4, endIndex: 20 }]
console.log(editor.getMentions());
```

### Listening to Events

```javascript
const editor = document.getElementById('editor');

editor.addEventListener('mention-add', e => {
  console.log('Mentioned:', e.detail.user.name);
});

editor.addEventListener('mention-remove', e => {
  console.log('Removed mention:', e.detail.user.name);
});

editor.addEventListener('value-change', e => {
  console.log('Value:', e.detail.value);
  console.log('Plain:', e.detail.plainText);
  console.log('Mentions:', e.detail.mentions);
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Raw text with `@[Name](id)` mention markers |
| `users` | `MentionUser[]` | `[]` | Users available for autocomplete |
| `placeholder` | `string` | `'Type @ to mention someone...'` | Input placeholder text |
| `readonly` | `boolean` | `false` | Prevents editing |
| `trigger` | `string` | `'@'` | Character that triggers the autocomplete dropdown |

### MentionUser Interface

```typescript
interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}
```

### Mention Interface

```typescript
interface Mention {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `mention-add` | `{ user: MentionUser, value: string }` | Fired when a mention is added |
| `mention-remove` | `{ user: MentionUser, value: string }` | Fired when a mention is removed from the text |
| `value-change` | `{ value: string, plainText: string, mentions: Mention[] }` | Fired on any value change |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getValue()` | --- | `string` | Raw value with mention markers |
| `getPlainText()` | --- | `string` | Text with mentions replaced by names |
| `getMentions()` | --- | `Mention[]` | Array of structured mention data |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Wrapper container |
| `editor` | Editor container with border |
| `textarea` | The textarea element |
| `dropdown` | Autocomplete dropdown |
