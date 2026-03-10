<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/chip.md -->

# Chip Component

Compact elements for tags, filters, selections, or categorizations. Supports icons, avatars, removable states, and multiple visual variants.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Text label for the chip |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Chip size |
| `removable` | `boolean` | `false` | Show remove button |
| `selected` | `boolean` | `false` | Show selected state |
| `disabled` | `boolean` | `false` | Disable the chip |
| `icon` | `string` | `''` | Icon (URL, image file, emoji). Use slot for icon fonts. |
| `avatar` | `string` | `''` | Avatar image URL |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `chip-click` | `{ label: string, selected: boolean }` | Fired when the chip is clicked (not the remove button) |
| `chip-remove` | `{ label: string }` | Fired when the remove button is clicked |

## Slots

| Name | Description |
|------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property. Note: `avatar` property takes precedence over icon slot. |

## CSS Parts

| Part | Description |
|------|-------------|
| `icon` | The icon wrapper element |

## Basic Usage

```html
<snice-chip label="Tag"></snice-chip>
```

```typescript
import 'snice/components/chip/snice-chip';
```

## Examples

### Color Variants

Use the `variant` attribute to set the chip color.

```html
<snice-chip label="Default" variant="default"></snice-chip>
<snice-chip label="Primary" variant="primary"></snice-chip>
<snice-chip label="Success" variant="success"></snice-chip>
<snice-chip label="Warning" variant="warning"></snice-chip>
<snice-chip label="Error" variant="error"></snice-chip>
<snice-chip label="Info" variant="info"></snice-chip>
```

### Sizes

Use the `size` attribute to change the chip size.

```html
<snice-chip label="Small" size="small"></snice-chip>
<snice-chip label="Medium" size="medium"></snice-chip>
<snice-chip label="Large" size="large"></snice-chip>
```

### Removable Chips

Set `removable` to show a remove button. Listen for `chip-remove` to handle removal.

```html
<snice-chip label="Remove me" removable></snice-chip>
```

```typescript
chip.addEventListener('chip-remove', () => {
  chip.remove();
});
```

### Icons

Use the `icon` property for emoji or URLs. Use the `icon` slot for CSS-based icon fonts.

```html
<!-- Emoji icons -->
<snice-chip label="Favorite" icon="★" variant="warning"></snice-chip>
<snice-chip label="Home" icon="🏠" variant="primary"></snice-chip>

<!-- Image URL -->
<snice-chip label="Star" icon="/icons/star.svg" variant="warning"></snice-chip>

<!-- Icon slot for Material Symbols -->
<snice-chip label="Home" variant="primary">
  <span slot="icon" class="material-symbols-outlined">home</span>
</snice-chip>
```

> **Note:** `icon="home"` or `icon="settings"` renders as **plain text**, not a Material icon. Snice does not bundle Material Symbols. Use the `icon` slot instead.

### Avatars

Use `avatar` for user chips. Avatar takes precedence over the icon slot.

```html
<snice-chip label="John Doe" avatar="https://via.placeholder.com/32" removable></snice-chip>
```

### Selected State

Set `selected` for toggleable chips.

```html
<snice-chip label="Option 1" selected></snice-chip>
<snice-chip label="Option 2"></snice-chip>
```

```typescript
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.selected = false);
    chip.selected = true;
  });
});
```

### Filter Chips

Use selected state for multi-select filter behavior.

```typescript
chip.addEventListener('click', () => {
  chip.selected = !chip.selected;
  console.log('Active filters:', Array.from(chips).filter(c => c.selected).map(c => c.label));
});
```

### Tag List

Combine `removable` and `chip-remove` events for dynamic tag management.

```html
<div class="tag-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
  <snice-chip label="JavaScript" variant="warning" removable></snice-chip>
  <snice-chip label="TypeScript" variant="primary" removable></snice-chip>
  <snice-chip label="React" variant="info" removable></snice-chip>
</div>
```

```typescript
chips.forEach(chip => {
  chip.addEventListener('chip-remove', () => chip.remove());
});
```

## Accessibility

- Focusable and activatable with Enter/Space
- ARIA attributes: `role`, `aria-selected`, `aria-disabled`
- Remove button has `aria-label` for screen readers
- Clear focus indicators for keyboard navigation
