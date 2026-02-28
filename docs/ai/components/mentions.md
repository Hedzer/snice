# snice-mentions

Text input with inline @mention autocomplete. Mentions stored as `@[Name](id)` markers.

## Properties

```typescript
value: string = '';              // Raw text with @[Name](id) markers
users: MentionUser[] = [];       // Autocomplete candidates
placeholder: string = 'Type @ to mention someone...';
readonly: boolean = false;
trigger: string = '@';           // Trigger character

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

## Events

- `mention-add` -> `{ user: MentionUser, value: string }`
- `mention-remove` -> `{ user: MentionUser, value: string }`
- `value-change` -> `{ value: string, plainText: string, mentions: Mention[] }`

## Methods

- `getValue()` - Raw value with mention markers
- `getPlainText()` - Text with mentions replaced by names only
- `getMentions()` - Array of Mention objects with id, name, indices

## CSS Parts

- `base` - Wrapper
- `editor` - Editor container
- `textarea` - Text input
- `dropdown` - Autocomplete dropdown

## Usage

```html
<snice-mentions id="editor" placeholder="Write something..."></snice-mentions>
<script>
  const editor = document.getElementById('editor');
  editor.users = [
    { id: 'u1', name: 'Alice Johnson', avatar: 'alice.jpg' },
    { id: 'u2', name: 'Bob Smith' }
  ];
  editor.value = 'Hey @[Alice Johnson](u1), check this out!';
  editor.addEventListener('mention-add', e => console.log('Mentioned:', e.detail.user));
  editor.addEventListener('value-change', e => console.log('Mentions:', e.detail.mentions));
</script>
```
