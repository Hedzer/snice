[//]: # (AI: For a low-token version of this doc, use docs/ai/components/tag-input.md instead)

# Tag Input Component

The tag input component provides a chip/tag-style input field where users can add tags by typing and pressing Enter or comma, remove them with Backspace or the X button, and select from autocomplete suggestions with keyboard navigation.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Input Behavior](#input-behavior)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-tag-input placeholder="Add a tag..."></snice-tag-input>
```

```typescript
import 'snice/components/tag-input/snice-tag-input';
```

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

#### `addTag(tag: string): void`
Add a tag programmatically.

```typescript
tagInput.addTag('JavaScript');
```

#### `removeTag(index: number): void`
Remove the tag at the specified index.

```typescript
tagInput.removeTag(0); // Remove the first tag
```

#### `clear(): void`
Remove all tags.

```typescript
tagInput.clear();
```

#### `focus(): void`
Focus the input field.

```typescript
tagInput.focus();
```

## Events

#### `tag-add`
Fired when a new tag is added.

**Event Detail:**
```typescript
{
  tag: string;       // The added tag
  value: string[];   // Updated array of all tags
}
```

#### `tag-remove`
Fired when a tag is removed.

**Event Detail:**
```typescript
{
  tag: string;       // The removed tag
  index: number;     // Index of the removed tag
  value: string[];   // Updated array of all tags
}
```

#### `tag-change`
Fired whenever the tag list changes (add or remove).

**Event Detail:**
```typescript
{
  value: string[];   // Current array of all tags
}
```

## Input Behavior

| Key | Action |
|-----|--------|
| Enter | Add the current input text as a tag, or select the highlighted suggestion |
| Comma | Split the input on commas and add each part as a tag |
| Backspace | On empty input, remove the last tag |
| ArrowUp / ArrowDown | Navigate through the suggestions dropdown |
| Escape | Close the suggestions dropdown |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-border` | Container border color | `rgb(226 226 226)` |
| `--snice-color-primary` | Focus ring color and tag accent | `rgb(37 99 235)` |
| `--snice-color-primary-subtle` | Tag background color | `rgb(239 246 255)` |
| `--snice-color-background` | Input background color | `rgb(255 255 255)` |
| `--snice-color-text` | Text color | `rgb(23 23 23)` |
| `--snice-color-text-tertiary` | Placeholder text color | -- |
| `--snice-focus-ring-width` | Focus ring width | `2px` |
| `--snice-focus-ring-color` | Focus ring color | -- |
| `--snice-shadow-lg` | Suggestions dropdown shadow | -- |

## Examples

### Basic Tag Input

```html
<snice-tag-input placeholder="Add a tag..."></snice-tag-input>
```

### With Label and Initial Tags

Use the `label` attribute for a label and set initial tags via JavaScript.

```html
<snice-tag-input id="skills" label="Skills" placeholder="Add a skill..."></snice-tag-input>

<script type="module">
  import 'snice/components/tag-input/snice-tag-input';

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
  tagInput.suggestions = [
    'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go',
    'Java', 'C++', 'Ruby', 'Swift', 'Kotlin'
  ];
</script>
```

### Max Tags Limit

Use `max-tags` to restrict the number of tags.

```html
<snice-tag-input
  label="Top 3 Interests"
  placeholder="Add up to 3..."
  max-tags="3"
></snice-tag-input>
```

### Handling Tag Changes

```html
<snice-tag-input id="tags-tracked" label="Tags" placeholder="Add a tag..."></snice-tag-input>
<p id="tag-count">0 tags</p>

<script type="module">
  const tagInput = document.getElementById('tags-tracked');
  const counter = document.getElementById('tag-count');

  tagInput.addEventListener('tag-add', (e) => {
    console.log(`Added: ${e.detail.tag}`);
  });

  tagInput.addEventListener('tag-remove', (e) => {
    console.log(`Removed: ${e.detail.tag}`);
  });

  tagInput.addEventListener('tag-change', (e) => {
    counter.textContent = `${e.detail.value.length} tags`;
  });
</script>
```

### Programmatic Tag Management

```html
<snice-tag-input id="managed-tags" label="Categories"></snice-tag-input>
<div style="margin-top: 0.5rem;">
  <button id="add-btn">Add "New"</button>
  <button id="clear-btn">Clear All</button>
</div>

<script type="module">
  const tagInput = document.getElementById('managed-tags');
  tagInput.value = ['Design', 'Development'];

  document.getElementById('add-btn').addEventListener('click', () => {
    tagInput.addTag('New');
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    tagInput.clear();
  });
</script>
```

### Disabled and Readonly States

```html
<!-- Disabled: no interaction -->
<snice-tag-input label="Disabled" disabled></snice-tag-input>

<!-- Readonly: shows tags but cannot add or remove -->
<snice-tag-input id="readonly-tags" label="Readonly" readonly></snice-tag-input>

<script type="module">
  document.getElementById('readonly-tags').value = ['Fixed', 'Tags'];
</script>
```

## Accessibility

- **Keyboard support**: Full keyboard navigation for adding, removing, and selecting tags
- **Suggestions navigation**: ArrowUp/ArrowDown navigate through the suggestions dropdown; Enter selects
- **Backspace removal**: Pressing Backspace on an empty input removes the last tag
- **Label**: The `label` property provides an accessible label for the input
- **Focus management**: Focus returns to the input after adding or removing a tag

## Best Practices

1. **Provide suggestions when possible**: Autocomplete reduces typos and improves consistency
2. **Set a max when appropriate**: Use `max-tags` to prevent unbounded tag lists
3. **Prevent duplicates**: Keep `allowDuplicates` as `false` (default) unless duplicates are meaningful
4. **Use descriptive placeholders**: Tell users what kind of tags to add (e.g. "Add a skill...", "Type a topic...")
5. **Listen to `tag-change` for syncing**: Use the `tag-change` event to persist tag changes, as it covers both additions and removals
6. **Use `label` for forms**: Always provide a label for form contexts to maintain accessibility
