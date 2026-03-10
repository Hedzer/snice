# snice-alert

Notification messages for user feedback.

## Properties

```typescript
variant: 'info'|'success'|'warning'|'error' = 'info';
size: 'small'|'medium'|'large' = 'medium';
title: string = '';
dismissible: boolean = false;
icon: string = '';   // URL, emoji, or 'none'. Use icon slot for icon fonts.
```

## Methods

- `show()` - Show alert
- `hide()` - Hide alert with animation

## Events

- `alert-dismiss` → `{ variant, title }` - Dismiss button clicked
- `alert-shown` → `{ variant, title }` - Alert shown
- `alert-hidden` → `{ variant, title }` - Alert hidden after animation

## Slots

- `(default)` - Alert message content
- `icon` - Custom icon content (overrides `icon` property and default icons)

## CSS Parts

- `icon` - The icon container

## Basic Usage

```html
<!-- Basic -->
<snice-alert>Alert message</snice-alert>

<!-- Variants -->
<snice-alert variant="success">Operation completed!</snice-alert>
<snice-alert variant="error">An error occurred</snice-alert>
<snice-alert variant="warning">Please review your input</snice-alert>

<!-- With title -->
<snice-alert variant="info" title="Information">
  Additional details.
</snice-alert>

<!-- Dismissible -->
<snice-alert variant="success" dismissible>
  Can be closed by user
</snice-alert>

<!-- Icon SLOT for Material Symbols, Font Awesome, SVGs -->
<snice-alert variant="info">
  <span slot="icon" class="material-symbols-outlined">info</span>
  Information message
</snice-alert>

<!-- Icon PROPERTY for emoji, URLs, image files only -->
<snice-alert icon="/icons/info.svg">With image icon</snice-alert>

<!-- No icon -->
<snice-alert icon="none">No icon alert</snice-alert>

<!-- Sizes -->
<snice-alert size="small">Small</snice-alert>
<snice-alert size="large">Large</snice-alert>
```

## Accessibility

- `role="alert"` with `aria-live="polite"`
- Dismiss button is keyboard accessible
- WCAG AA color contrast
