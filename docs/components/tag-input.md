<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/tag-input.md -->

# Tag Input
`<snice-tag-input>`

A chip/tag-style input field where users can add tags by typing and pressing Enter or comma, remove them with Backspace or the X button, and select from autocomplete suggestions with keyboard navigation.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string[]` | `[]` | Array of current tag values |
| `suggestions` | `string[]` | `[]` | Autocomplete suggestion list |
| `maxTags` (attr: `max-tags`) | `number` | `0` | Maximum number of tags (0 = unlimited) |
| `allowDuplicates` (attr: `allow-duplicates`) | `boolean` | `false` | Whether to allow duplicate tags |
| `placeholder` | `string` | `'Add a tag...'` | Input placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |
| `readonly` | `boolean` | `false` | Make the input readonly |
| `label` | `string` | `''` | Label text displayed above the input |
| `name` | `string` | `''` | Form field name |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addTag()` | `tag: string` | Add a tag programmatically |
| `removeTag()` | `index: number` | Remove the tag at the specified index |
| `clear()` | -- | Remove all tags |
| `focus()` | -- | Focus the input field |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tag-add` | `{ tag: string, value: string[] }` | A new tag was added |
| `tag-remove` | `{ tag: string, index: number, value: string[] }` | A tag was removed |
| `tag-change` | `{ value: string[] }` | The tag list changed (add or remove) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer wrapper div |
| `label` | The label element above the input |
| `container` | Container holding tags and the input field |
| `tag` | An individual tag chip |
| `tag-text` | The text content inside a tag |
| `input` | The text input field |
| `suggestions` | The autocomplete suggestions dropdown |

## Basic Usage

```typescript
import 'snice/components/tag-input/snice-tag-input';
```

```html
<snice-tag-input placeholder="Add a tag..."></snice-tag-input>
```

## Examples

### With Label and Initial Tags

Use the `label` attribute for a label and set initial tags via JavaScript.

```html
<snice-tag-input id="skills" label="Skills" placeholder="Add a skill..."></snice-tag-input>

<script type="module">
  const tagInput = document.getElementById('skills');
  tagInput.value = ['JavaScript', 'TypeScript', 'CSS'];
</script>
```

### With Autocomplete Suggestions

Set the `suggestions` property to enable autocomplete.

```html
<snice-tag-input id="languages" label="Languages" placeholder="Type to search..."></snice-tag-input>

<script type="module">
  const tagInput = document.getElementById('languages');
  tagInput.suggestions = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'];
</script>
```

### Max Tags Limit

Use `max-tags` to restrict the number of tags.

```html
<snice-tag-input label="Top 3 Interests" placeholder="Add up to 3..." max-tags="3"></snice-tag-input>
```

### Handling Tag Changes

```javascript
tagInput.addEventListener('tag-add', (e) => {
  console.log(`Added: ${e.detail.tag}`);
});

tagInput.addEventListener('tag-remove', (e) => {
  console.log(`Removed: ${e.detail.tag}`);
});

tagInput.addEventListener('tag-change', (e) => {
  console.log('Tags:', e.detail.value);
});
```

### Programmatic Tag Management

```javascript
tagInput.addTag('New');
tagInput.removeTag(0);
tagInput.clear();
```

### Disabled and Readonly States

```html
<snice-tag-input label="Disabled" disabled></snice-tag-input>
<snice-tag-input label="Readonly" readonly></snice-tag-input>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Enter | Add the current input text as a tag, or select the highlighted suggestion |
| Comma | Split the input on commas and add each part as a tag |
| Backspace | On empty input, remove the last tag |
| ArrowUp / ArrowDown | Navigate through the suggestions dropdown |
| Escape | Close the suggestions dropdown |

## Accessibility

- Full keyboard navigation for adding, removing, and selecting tags
- ArrowUp/ArrowDown navigate through the suggestions dropdown; Enter selects
- Pressing Backspace on an empty input removes the last tag
- The `label` property provides an accessible label for the input
- Focus returns to the input after adding or removing a tag
