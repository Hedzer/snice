<!-- AI: For a low-token version of this doc, use docs/ai/components/tag.md instead -->

# Tag Component
`<snice-tag>`

A display-only tag/token for labeling and categorization. Unlike the chip component, tags are simpler with no selection state and are primarily used for status labels, categories, and metadata.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/tag/snice-tag';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-tag.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Tag size |
| `removable` | `boolean` | `false` | Show remove button |
| `outline` | `boolean` | `false` | Use outlined style |
| `pill` | `boolean` | `false` | Fully rounded corners |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tag-remove` | `{ tag: SniceTagElement }` | Fired when remove button is clicked |

## Slots

| Name | Description |
|------|-------------|
| (default) | Tag label content |
| `icon` | Leading icon content |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The tag container span |
| `icon` | The icon slot wrapper |
| `label` | The label slot wrapper |

```css
snice-tag::part(base) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Basic Usage

```typescript
import 'snice/components/tag/snice-tag';
```

```html
<snice-tag>Label</snice-tag>
```

## Examples

### Variants

Use the `variant` attribute to set the tag's color scheme.

```html
<snice-tag>Default</snice-tag>
<snice-tag variant="primary">Primary</snice-tag>
<snice-tag variant="success">Success</snice-tag>
<snice-tag variant="warning">Warning</snice-tag>
<snice-tag variant="danger">Danger</snice-tag>
<snice-tag variant="info">Info</snice-tag>
```

### Outline

Set the `outline` attribute for a bordered style without fill.

```html
<snice-tag outline>Default</snice-tag>
<snice-tag variant="primary" outline>Primary</snice-tag>
<snice-tag variant="danger" outline>Danger</snice-tag>
```

### Pill Shape

Set the `pill` attribute for fully rounded corners.

```html
<snice-tag pill>Default</snice-tag>
<snice-tag pill variant="primary">Primary</snice-tag>
<snice-tag pill variant="success">Success</snice-tag>
```

### Sizes

Use the `size` attribute to change the tag size.

```html
<snice-tag size="small">Small</snice-tag>
<snice-tag size="medium">Medium</snice-tag>
<snice-tag size="large">Large</snice-tag>
```

### Removable

Set the `removable` attribute to show a remove button.

```html
<snice-tag removable>Removable</snice-tag>
<snice-tag removable variant="primary">JavaScript</snice-tag>
```

```typescript
document.querySelector('snice-tag').addEventListener('tag-remove', (e) => {
  e.target.remove();
});
```

### With Icons

Use the `icon` slot to add a leading icon.

```html
<snice-tag variant="success"><span slot="icon">✓</span>Approved</snice-tag>
<snice-tag variant="danger"><span slot="icon">✕</span>Rejected</snice-tag>
<snice-tag variant="warning"><span slot="icon">⚠</span>Pending</snice-tag>
```

### Status Labels

```html
<snice-tag variant="success">Active</snice-tag>
<snice-tag variant="warning">Draft</snice-tag>
<snice-tag variant="danger">Archived</snice-tag>
<snice-tag outline>Inactive</snice-tag>
```

### Priority Levels

```html
<snice-tag variant="danger" size="small">Critical</snice-tag>
<snice-tag variant="warning" size="small">High</snice-tag>
<snice-tag variant="primary" size="small">Medium</snice-tag>
<snice-tag size="small">Low</snice-tag>
```

### Article Categories

```html
<snice-tag pill variant="primary" size="small">Technology</snice-tag>
<snice-tag pill variant="success" size="small">Science</snice-tag>
<snice-tag pill variant="info" size="small">Design</snice-tag>
```

## Accessibility

- Tags use semantic inline elements
- Remove button has `aria-label="Remove"` for screen readers
- Focus styles are applied on the remove button for keyboard users
