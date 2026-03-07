<!-- AI: For a low-token version of this doc, use docs/ai/components/split-button.md instead -->

# Split Button
`<snice-split-button>`

A primary action button with a dropdown menu of alternative actions. Click the main button for the primary action, or click the chevron dropdown for alternatives.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/split-button/snice-split-button';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-split-button.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Primary button text |
| `actions` | `SplitButtonAction[]` | `[]` | Array of `{ label, value, icon?, disabled? }` for dropdown |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disables the entire button |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `outline` | `boolean` | `false` | Use outline style (transparent background) |
| `pill` | `boolean` | `false` | Use pill (fully rounded) shape |
| `icon` | `string` | `''` | Icon (URL, image file, emoji) |
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position relative to label |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `primary-click` | `{ button }` | Primary button clicked |
| `action-click` | `{ value, action, button }` | A dropdown action was selected |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The button container |
| `primary` | The primary button |
| `divider` | The divider between buttons |
| `toggle` | The dropdown toggle button |
| `menu` | The dropdown menu container |
| `menu-items` | The menu items wrapper |
| `action` | Each menu action button |

## Basic Usage

```typescript
import 'snice/components/split-button/snice-split-button';
```

```html
<snice-split-button label="Save" variant="primary"></snice-split-button>
```

```typescript
const btn = document.querySelector('snice-split-button');
btn.actions = [
  { value: 'save-draft', label: 'Save as Draft' },
  { value: 'save-template', label: 'Save as Template' },
];
```

## Examples

### Variants

Use the `variant` attribute to set the button's visual style.

```html
<snice-split-button label="Default" variant="default"></snice-split-button>
<snice-split-button label="Primary" variant="primary"></snice-split-button>
<snice-split-button label="Success" variant="success"></snice-split-button>
<snice-split-button label="Danger" variant="danger"></snice-split-button>
```

### Sizes

Use the `size` attribute to change the button size.

```html
<snice-split-button label="Small" size="small"></snice-split-button>
<snice-split-button label="Medium" size="medium"></snice-split-button>
<snice-split-button label="Large" size="large"></snice-split-button>
```

### Disabled

Disable both the primary button and dropdown with the `disabled` attribute.

```html
<snice-split-button label="Disabled" disabled></snice-split-button>
```

### Disabled Actions

Individual actions can be disabled.

```typescript
btn.actions = [
  { value: 'save', label: 'Save' },
  { value: 'locked', label: 'Locked Action', disabled: true },
];
```

### With Icons

Pass an `icon` URL in action objects to display icons alongside labels.

```typescript
btn.actions = [
  { value: 'copy', label: 'Duplicate', icon: '/icons/copy.svg' },
  { value: 'share', label: 'Share', icon: '/icons/share.svg' },
];
```

### Event Handling

```typescript
const btn = document.querySelector('snice-split-button');

btn.addEventListener('primary-click', () => {
  console.log('Primary action triggered');
});

btn.addEventListener('action-click', (e) => {
  console.log('Action:', e.detail.value);
  console.log('Action object:', e.detail.action);
});
```
