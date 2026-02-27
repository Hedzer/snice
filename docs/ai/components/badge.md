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

## Usage

```html
<!-- Basic -->
<snice-badge content="New"></snice-badge>

<!-- Count badge -->
<snice-badge count="5"></snice-badge>

<!-- Max count (99+) -->
<snice-badge count="150" max="99"></snice-badge>

<!-- Dot indicator -->
<snice-badge dot></snice-badge>

<!-- On element -->
<div style="position: relative; display: inline-block;">
  <button>Messages</button>
  <snice-badge count="3" variant="error"></snice-badge>
</div>

<!-- Variants -->
<snice-badge content="New" variant="primary"></snice-badge>
<snice-badge content="✓" variant="success"></snice-badge>
<snice-badge content="!" variant="warning"></snice-badge>
<snice-badge content="×" variant="error"></snice-badge>
<snice-badge content="i" variant="info"></snice-badge>

<!-- Positions -->
<snice-badge count="5" position="top-right"></snice-badge>
<snice-badge count="5" position="top-left"></snice-badge>
<snice-badge count="5" position="bottom-right"></snice-badge>
<snice-badge count="5" position="bottom-left"></snice-badge>

<!-- Inline -->
<p>Status <snice-badge inline content="Active"></snice-badge></p>

<!-- Pulse animation -->
<snice-badge dot pulse variant="error"></snice-badge>
```

**CSS Parts:**
- `base` - Outer wrapper element
- `badge` - The badge indicator element

## Features

- 6 color variants
- Count with max limit (shows 99+ style)
- Dot mode for indicators
- 4 positioning options
- Inline or positioned
- Pulse animation
- Custom offset
