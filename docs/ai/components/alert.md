# snice-alert

Notification messages for user feedback.

## Properties

```typescript
variant: 'info'|'success'|'warning'|'error' = 'info';
size: 'small'|'medium'|'large' = 'medium';
title: string = '';
dismissible: boolean = false;
icon: string = '';
```

## Slots

- `icon` - Custom icon content (overrides `icon` property and default icons)

## Methods

- `show()` - Show alert
- `hide()` - Hide alert

## Events

- `alert-dismiss` - Fired when dismiss button clicked. Detail: `{ variant, title }`
- `alert-shown` - Fired when show() is called. Detail: `{ variant, title }`
- `alert-hidden` - Fired after hide animation completes. Detail: `{ variant, title }`

## Usage

```html
<!-- Basic -->
<snice-alert>Alert message</snice-alert>

<!-- Success -->
<snice-alert variant="success">
  Operation completed successfully!
</snice-alert>

<!-- Error -->
<snice-alert variant="error">
  An error occurred
</snice-alert>

<!-- Warning -->
<snice-alert variant="warning">
  Please review your input
</snice-alert>

<!-- With title -->
<snice-alert variant="info" title="Information">
  Additional details about the information.
</snice-alert>

<!-- Dismissible -->
<snice-alert variant="success" dismissible>
  Can be closed by user
</snice-alert>

<!-- ⚠️ icon="info" renders as PLAIN TEXT. Use the icon slot for icon fonts. -->

<!-- Icon SLOT — for Material Symbols, Font Awesome, SVGs -->
<snice-alert variant="info">
  <span slot="icon" class="material-symbols-outlined">info</span>
  Information message
</snice-alert>

<!-- Icon PROPERTY — for emoji, URLs, image files only -->
<snice-alert icon="🎉">Custom icon alert</snice-alert>
<snice-alert icon="/icons/info.svg">With image icon</snice-alert>

<!-- Sizes -->
<snice-alert size="small">Small</snice-alert>
<snice-alert size="medium">Medium</snice-alert>
<snice-alert size="large">Large</snice-alert>
```

## Features

- 4 variants with semantic colors
- 3 size options
- Optional title
- Optional dismiss button
- Custom icon support (URL, image files, emoji). Use slot for icon fonts.
- Show/hide methods
- Accessibility: role="alert"

## Variants

- `info` - Blue, informational
- `success` - Green, positive feedback
- `warning` - Orange, caution
- `error` - Red, errors/problems
