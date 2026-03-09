# Design: snice-action-bar

## Summary

A positioned, animated container for contextual actions. Wraps slotted content (buttons, icons, anything), handles layout, show/hide animation, and keyboard navigation. Consumer controls shape, content, and trigger.

## Properties

```typescript
open: boolean = false;                          // attr: open
position: 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right'
  | 'bottom-left' | 'bottom-right' = 'bottom'; // attr: position
size: 'small' | 'medium' = 'medium';           // attr: size
variant: 'default' | 'pill' = 'default';        // attr: variant
noAnimation: boolean = false;                   // attr: no-animation
noEscapeDismiss: boolean = false;               // attr: no-escape-dismiss
```

## Methods

- `show()` — sets open = true
- `hide()` — sets open = false
- `toggle()` — toggles open state

## Events

- `action-bar-open` → `{ actionBar: this }`
- `action-bar-close` → `{ actionBar: this }`

## Slots

- `(default)` — action content

## Keyboard

- Arrow keys navigate focusable slotted children (roving tabindex)
- `Escape` calls hide() unless `no-escape-dismiss`
- `role="toolbar"` with `aria-label` support

## Positioning

- `position: absolute` within a `position: relative` parent
- `position` property maps to CSS inset values:
  - `bottom` → bottom center
  - `top-right` → top right corner
  - etc.

## Animation

- Show: fade in + slide from anchored edge (e.g., bottom → slides up)
- Hide: reverse (fade out + slide back)
- `no-animation`: always visible, `open` ignored, no transitions
- Uses CSS transitions (not keyframes) for simplicity

## CSS Custom Properties

```css
--action-bar-background: var(--snice-color-background-element, rgb(252 251 249))
--action-bar-border: 1px solid var(--snice-color-border, rgb(226 226 226))
--action-bar-border-radius: var(--snice-border-radius-lg, 0.5rem)
--action-bar-padding: var(--snice-spacing-xs, 0.5rem)
--action-bar-gap: var(--snice-spacing-2xs, 0.25rem)
--action-bar-shadow: var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))
--action-bar-z-index: 10
```

## Variant: pill

Overrides border-radius to full rounding (`9999px`).

## Size

- `small`: reduced padding and gap
- `medium`: default

## Non-goals (v1)

- No `for="selector"` auto-trigger (future)
- No viewport collision detection
- No imperative items API
- No built-in trigger modes

## Usage

```html
<!-- Animated on parent hover -->
<div class="card"
     @mouseenter=${() => bar.show()}
     @mouseleave=${() => bar.hide()}>
  <p>Post content</p>
  <snice-action-bar id="bar" position="bottom" variant="pill">
    <button>♡</button>
    <button>💬</button>
    <button>🗑</button>
  </snice-action-bar>
</div>

<!-- Always visible -->
<snice-action-bar no-animation position="top-right" size="small">
  <button>✏️</button>
  <button>🗑</button>
</snice-action-bar>
```
