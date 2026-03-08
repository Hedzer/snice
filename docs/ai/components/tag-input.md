# snice-tag-input

Tag/chip input with autocomplete suggestions, keyboard navigation, and comma-separated entry.

## Properties

```ts
value: string[] = []
suggestions: string[] = []
maxTags: number = 0              // 0 = unlimited (attribute: max-tags)
allowDuplicates: boolean = false // attribute: allow-duplicates
placeholder: string = 'Add a tag...'
disabled: boolean = false
readonly: boolean = false
label: string = ''
name: string = ''
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

## Input Behavior

- Enter: Add current input as tag (or select highlighted suggestion)
- Comma: Split input and add each part as a tag
- Backspace on empty input: Remove last tag
- ArrowUp/ArrowDown: Navigate suggestions
- Escape: Close suggestions dropdown

**CSS Parts:**
- `base` - Outer wrapper div
- `label` - Label element
- `container` - Tags + input container
- `tag` - Individual tag span
- `tag-text` - Tag text content
- `input` - Text input field
- `suggestions` - Suggestions dropdown

## CSS Custom Properties

- `--snice-color-border` - Container border (default: `rgb(226 226 226)`)
- `--snice-color-primary` - Focus ring, tag color (default: `rgb(37 99 235)`)
- `--snice-color-primary-subtle` - Tag background (default: `rgb(239 246 255)`)
- `--snice-color-background` - Input background (default: `rgb(255 255 255)`)
- `--snice-color-text` - Text color (default: `rgb(23 23 23)`)
- `--snice-color-text-tertiary` - Placeholder color
- `--snice-focus-ring-width` - Focus ring width (default: `2px`)
- `--snice-focus-ring-color` - Focus ring color
- `--snice-shadow-lg` - Suggestions dropdown shadow

## Usage

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
