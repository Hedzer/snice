# snice-menu

Dropdown menu with items, dividers, and configurable trigger behavior.

## Components

- `<snice-menu>` - Container with trigger and panel
- `<snice-menu-item>` - Selectable item with icon/shortcut slots
- `<snice-menu-divider>` - Visual separator

## Properties

```ts
// snice-menu
open: boolean = false;
placement: 'bottom-start'|'bottom-end'|'top-start'|'top-end'|'right-start'|'right-end'|'left-start'|'left-end' = 'bottom-start';
trigger: 'click'|'hover'|'manual' = 'click';
closeOnSelect: boolean = true;       // attr: close-on-select
distance: number = 4;

// snice-menu-item
value: string = '';
disabled: boolean = false;
selected: boolean = false;
```

## Methods

- `openMenu()` → Open the menu
- `closeMenu()` → Close the menu
- `toggleMenu()` → Toggle open/closed

## Events

- `menu-open` → `{ menu }`
- `menu-close` → `{ menu }`
- `menu-item-select` → `{ item, value }` (bubbles from menu-item)

## Slots (snice-menu)

- `trigger` - Trigger element (required)
- `image-left` - Image before trigger
- `image-right` - Image after trigger
- `(default)` - Menu items and dividers

## Slots (snice-menu-item)

- `icon` - Icon before label
- `(default)` - Label content
- `shortcut` - Keyboard shortcut hint

## CSS Parts (snice-menu)

- `trigger` - Trigger wrapper
- `image-left` - Left image container
- `image-right` - Right image container
- `panel` - Dropdown panel
- `content` - Panel content wrapper

## CSS Parts (snice-menu-item)

- `item` - Item container
- `icon` - Icon wrapper
- `label` - Label wrapper
- `shortcut` - Shortcut wrapper

## CSS Parts (snice-menu-divider)

- `divider` - Separator line

## CSS Custom Properties

```css
--menu-bg: var(--snice-color-background, white);
--menu-border: var(--snice-color-border, #e5e7eb);
--menu-shadow: var(--snice-shadow-lg);
--menu-z-index: var(--snice-z-index-dropdown, 1000);
--menu-border-radius: var(--snice-radius-md, 0.375rem);
--menu-min-width: 10rem;
```

## Basic Usage

```typescript
import 'snice/components/menu/snice-menu';
```

```html
<snice-menu>
  <button slot="trigger">File</button>
  <snice-menu-item value="new">New</snice-menu-item>
  <snice-menu-item value="save">
    <span slot="icon">💾</span>
    Save
    <span slot="shortcut">⌘S</span>
  </snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="exit">Exit</snice-menu-item>
</snice-menu>
```
