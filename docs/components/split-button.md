<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/split-button.md -->

# Split Button

A primary action button with a dropdown menu of alternative actions. Click the main button for the primary action, or click the chevron to reveal alternatives.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Primary button text |
| `actions` | `SplitButtonAction[]` | `[]` | Array of `{ label, value, icon?, disabled? }` for the dropdown menu |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disables the entire button |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `outline` | `boolean` | `false` | Use outline style (transparent background) |
| `pill` | `boolean` | `false` | Use pill (fully rounded) shape |
| `icon` | `string` | `''` | Icon (URL, image file, or emoji) |
| `iconPlacement` (attr: `icon-placement`) | `'start' \| 'end'` | `'start'` | Icon position relative to label |

The `actions` property is set via JavaScript (not HTML attributes):

```typescript
interface SplitButtonAction {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `primary-click` | `{ button: SniceSplitButtonElement }` | Primary button was clicked |
| `action-click` | `{ value: string, action: SplitButtonAction, button: SniceSplitButtonElement }` | A dropdown action was selected |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The button container |
| `primary` | The primary button |
| `divider` | The divider between primary and toggle buttons |
| `toggle` | The dropdown toggle button (chevron) |
| `menu` | The dropdown menu container |
| `menu-items` | The menu items wrapper |
| `action` | Each individual menu action button |

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

### Outline and Pill

```html
<snice-split-button label="Outline" variant="primary" outline></snice-split-button>
<snice-split-button label="Pill" variant="primary" pill></snice-split-button>
```

### Disabled

Disable both the primary button and dropdown.

```html
<snice-split-button label="Disabled" disabled></snice-split-button>
```

### Disabled Actions

Individual dropdown actions can be disabled.

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
btn.addEventListener('primary-click', () => {
  console.log('Primary action triggered');
});

btn.addEventListener('action-click', (e) => {
  console.log('Action:', e.detail.value);
  console.log('Action object:', e.detail.action);
});
```

## Accessibility

- Dropdown menu closes on action click, outside click, or Escape key
- Actions are set via the `actions` JavaScript property (not child elements)
- Loading state disables the button and shows a spinner
