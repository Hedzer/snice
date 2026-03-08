# snice-accordion & snice-accordion-item

Collapsible sections with single or multiple open mode and keyboard navigation.

## Components

### snice-accordion

Container managing accordion items.

```typescript
multiple: boolean = false;                         // Allow multiple items open
variant: 'bordered' | 'elevated' = 'bordered';    // Visual style variant
```

**Methods:**
- `openItem(id)` - Open specific item
- `closeItem(id)` - Close specific item
- `toggleItem(id)` - Toggle specific item
- `openAll()` - Open all (multiple mode only)
- `closeAll()` - Close all

**Events:**
- `accordion-open` - {itemId, item}
- `accordion-close` - {itemId, item}

### snice-accordion-item

Individual collapsible section.

```typescript
itemId: string;              // Auto-generated if not provided
open: boolean = false;
disabled: boolean = false;
```

**Methods:**
- `toggle()` - Toggle open/closed
- `expand(animate = true)` - Open
- `collapse(animate = true)` - Close

**Events:**
- `accordion-item-toggle` - {itemId, open}

**Slots:**
- `header` - Clickable trigger content
- default - Collapsible content

**CSS Parts:**
- `header` - The clickable button trigger
- `title` - Span wrapping the header slot
- `icon` - The chevron SVG icon
- `content` - The collapsible content wrapper
- `content-inner` - Inner div containing the default slot

## Usage

```html
<!-- Basic -->
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

  <snice-accordion-item item-id="b" open>
    <span slot="header">B</span>
    <p>Content B</p>
  </snice-accordion-item>
</snice-accordion>

<!-- Disabled item -->
<snice-accordion>
  <snice-accordion-item item-id="active">
    <span slot="header">Active</span>
    <p>Can open</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="disabled" disabled>
    <span slot="header">Disabled</span>
    <p>Cannot open</p>
  </snice-accordion-item>
</snice-accordion>
```

## Programmatic Control

```typescript
// Control items
accordion.openItem('item-1');
accordion.closeItem('item-2');
accordion.toggleItem('item-3');
accordion.openAll();  // Multiple mode only
accordion.closeAll();

// Listen for events
accordion.addEventListener('accordion-open', (e) => {
  console.log('Opened:', e.detail.itemId);
});

// Control individual item
item.toggle();
item.expand();
item.collapse();
```

## Keyboard Navigation

- **↓** - Next item
- **↑** - Previous item
- **Home** - First item
- **End** - Last item
- **Enter/Space** - Toggle focused item

## Features

- Single or multiple open mode
- Keyboard navigation
- Click or keyboard to toggle
- Auto-generated item IDs
- Disabled state
- Open/close events
- Accessibility: aria-expanded, button roles
- Smooth animations

## Notes

- Items are light DOM children (not slotted)
- Without `multiple`, opening one closes others
- Item IDs auto-generated if not provided
- Disabled items cannot be toggled
- Header slot required for trigger content
