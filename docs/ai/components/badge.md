# snice-badge

Notification indicators and status markers.

## Properties

```typescript
content: string = '';
count: number = 0;
max: number = 99;
dot: boolean = false;
variant: 'default'|'primary'|'success'|'warning'|'error'|'info' = 'default';
position: 'top-right'|'top-left'|'bottom-right'|'bottom-left' = 'top-right';
inline: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
pulse: boolean = false;
offset: number = 0;
```

## Methods

- `setBadgeContent(content)` - Set text content
- `setBadgeCount(count)` - Set numeric count
- `showDot()` - Switch to dot mode
- `hide()` - Clear all content

## Slots

- `(default)` - Content the badge overlays

## CSS Parts

- `base` - Outer wrapper element
- `badge` - The badge indicator element

## Basic Usage

```html
<snice-badge content="New"></snice-badge>
<snice-badge count="5"></snice-badge>
<snice-badge count="150" max="99"></snice-badge>
<snice-badge dot></snice-badge>

<!-- On element -->
<snice-badge count="3" variant="error">
  <button>Messages</button>
</snice-badge>

<!-- Variants -->
<snice-badge content="New" variant="primary"></snice-badge>
<snice-badge content="OK" variant="success"></snice-badge>
<snice-badge content="!" variant="warning"></snice-badge>
<snice-badge content="x" variant="error"></snice-badge>
<snice-badge content="i" variant="info"></snice-badge>

<!-- Positions -->
<snice-badge count="5" position="top-left"></snice-badge>
<snice-badge count="5" position="bottom-right"></snice-badge>

<!-- Inline -->
<p>Status <snice-badge inline content="Active" variant="success"></snice-badge></p>

<!-- Pulse animation -->
<snice-badge dot pulse variant="error"></snice-badge>

<!-- Custom offset -->
<snice-badge count="5" offset="5">...</snice-badge>
```

## Accessibility

- `role="status"` for screen reader announcements
- Descriptive `aria-label` on badge element
