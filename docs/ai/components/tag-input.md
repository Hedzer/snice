# snice-tag-input

Tag/chip input with autocomplete suggestions, keyboard navigation, and comma-separated entry.

## Properties

```typescript
value: string[] = [];
suggestions: string[] = [];
maxTags: number = 0;              // 0 = unlimited (attr: max-tags)
allowDuplicates: boolean = false; // attr: allow-duplicates
placeholder: string = 'Add a tag...';
disabled: boolean = false;
readonly: boolean = false;
label: string = '';
name: string = '';
```

## Methods

- `addTag(tag: string)` - Add a tag programmatically
- `removeTag(index: number)` - Remove tag at index
- `clear()` - Remove all tags
- `focus()` - Focus the input field

## Events

- `tag-add` -> `{ tag: string; value: string[] }`
- `tag-remove` -> `{ tag: string; index: number; value: string[] }`
- `tag-change` -> `{ value: string[] }`

## CSS Parts

- `base` - Outer wrapper div
- `label` - Label element
- `container` - Tags + input container
- `tag` - Individual tag span
- `tag-text` - Tag text content
- `input` - Text input field
- `suggestions` - Suggestions dropdown

## Keyboard Navigation

- Enter: Add current input as tag (or select highlighted suggestion)
- Comma: Split input and add each part as a tag
- Backspace on empty input: Remove last tag
- ArrowUp/ArrowDown: Navigate suggestions
- Escape: Close suggestions dropdown

## Basic Usage

```html
<snice-tag-input
  label="Skills"
  placeholder="Add a skill..."
  max-tags="5"
></snice-tag-input>
```

```typescript
tagInput.suggestions = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'];
tagInput.value = ['JavaScript'];

tagInput.addEventListener('tag-change', (e) => {
  console.log('Tags:', e.detail.value);
});
```
