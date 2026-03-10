# snice-action-bar

Positioned, animated container for contextual actions within a relative parent.

## Properties

```typescript
open: boolean = false;                          // attr: open
position: 'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right' = 'bottom';
size: 'small'|'medium' = 'medium';
variant: 'default'|'pill' = 'default';
noAnimation: boolean = false;                   // attr: no-animation — always visible, no transitions
noEscapeDismiss: boolean = false;               // attr: no-escape-dismiss
```

## Methods

- `show()` - Open
- `hide()` - Close
- `toggle()` - Toggle open state

## Events

- `action-bar-open` → `{ actionBar: SniceActionBarElement }`
- `action-bar-close` → `{ actionBar: SniceActionBarElement }`

## Slots

- `(default)` - Action content (buttons, icons, etc.)

## CSS Parts

- `base` - The inner toolbar container

## CSS Custom Properties

- `--action-bar-background` - Background color
- `--action-bar-border` - Border style
- `--action-bar-border-radius` - Border radius
- `--action-bar-padding` - Inner padding
- `--action-bar-gap` - Gap between items
- `--action-bar-shadow` - Box shadow
- `--action-bar-z-index` - Z-index

## Basic Usage

```html
<div style="position:relative"
     onmouseenter="this.querySelector('snice-action-bar').show()"
     onmouseleave="this.querySelector('snice-action-bar').hide()">
  <p>Content</p>
  <snice-action-bar position="bottom" variant="pill">
    <button>Edit</button>
    <button>Delete</button>
  </snice-action-bar>
</div>

<!-- Always visible -->
<snice-action-bar no-animation position="top-right" size="small">
  <button>Edit</button>
</snice-action-bar>
```

## Keyboard Navigation

- Arrow keys navigate focusable children (roving tabindex)
- `Escape` closes unless `no-escape-dismiss`
- `Home`/`End` jump to first/last
- `role="toolbar"`

## Accessibility

- `role="toolbar"` with `aria-label="Actions"`
- Roving keyboard navigation
- Escape dismiss (configurable)
