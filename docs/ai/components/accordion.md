# snice-accordion & snice-accordion-item

Collapsible sections with single or multiple open mode and keyboard navigation.

## Components

### snice-accordion

Container managing accordion items.

### snice-accordion-item

Individual collapsible section.

## Properties

### snice-accordion

```typescript
multiple: boolean = false;                         // Allow multiple items open
variant: 'bordered' | 'elevated' = 'bordered';    // Visual style variant
```

### snice-accordion-item

```typescript
itemId: string = '';             // attr: item-id, auto-generated if not provided
open: boolean = false;
disabled: boolean = false;
```

## Methods

### snice-accordion

- `openItem(id)` - Open specific item
- `closeItem(id)` - Close specific item
- `toggleItem(id)` - Toggle specific item
- `openAll()` - Open all (multiple mode only)
- `closeAll()` - Close all

### snice-accordion-item

- `toggle()` - Toggle open/closed
- `expand(animate = true)` - Open
- `collapse(animate = true)` - Close

## Events

- `accordion-open` → `{ itemId, item }` - Item opened (on container)
- `accordion-close` → `{ itemId, item }` - Item closed (on container)
- `accordion-item-toggle` → `{ itemId, open }` - Item toggled (on item)

## Slots

### snice-accordion
- `(default)` - `<snice-accordion-item>` elements

### snice-accordion-item
- `header` - Clickable trigger content
- `(default)` - Collapsible content

## CSS Parts

(on snice-accordion-item)
- `header` - The clickable button trigger
- `title` - Span wrapping the header slot
- `icon` - The chevron SVG icon
- `content` - The collapsible content wrapper
- `content-inner` - Inner div containing the default slot

## Basic Usage

```html
<snice-accordion>
  <snice-accordion-item item-id="item-1">
    <span slot="header">Section 1</span>
    <div>Content 1</div>
  </snice-accordion-item>
  <snice-accordion-item item-id="item-2">
    <span slot="header">Section 2</span>
    <div>Content 2</div>
  </snice-accordion-item>
</snice-accordion>

<!-- Multiple open -->
<snice-accordion multiple>
  <snice-accordion-item item-id="a" open>
    <span slot="header">A</span>
    <p>Content A</p>
  </snice-accordion-item>
</snice-accordion>

<!-- Elevated variant -->
<snice-accordion variant="elevated">...</snice-accordion>

<!-- Disabled item -->
<snice-accordion-item item-id="disabled" disabled>...</snice-accordion-item>
```

## Keyboard Navigation

- **Arrow Down/Up** - Next/previous item
- **Home/End** - First/last item
- **Enter/Space** - Toggle focused item

## Accessibility

- `aria-expanded` on headers, `button` role
- Full keyboard navigation
- Visible focus indicators
