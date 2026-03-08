# snice-menu

Dropdown menu with items, dividers, and configurable trigger behavior.

## Properties

```typescript
open: boolean = false;
placement: 'bottom-start'|'bottom-end'|'top-start'|'top-end'|'right-start'|'right-end'|'left-start'|'left-end' = 'bottom-start';
trigger: 'click'|'hover'|'manual' = 'click';
closeOnSelect: boolean = true;       // attr: close-on-select
distance: number = 4;
```

## Methods

- `openMenu()` - Open the menu
- `closeMenu()` - Close the menu
- `toggleMenu()` - Toggle open/closed

## Slots (menu)

- `trigger` - Trigger element (required)
- `image-left` - Image before trigger
- `image-right` - Image after trigger
- `(default)` - Menu items and dividers

## Events

- `menu-open` → `{ menu }`
- `menu-close` → `{ menu }`
- `menu-item-select` → `{ item, value }`

## snice-menu-item

```typescript
value: string = '';
disabled: boolean = false;
selected: boolean = false;
```

Slots: `icon`, `(default)`, `shortcut`

## snice-menu-divider

Visual separator between items.

## Usage

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

<!-- Hover trigger -->
<snice-menu trigger="hover">...</snice-menu>

<!-- Manual control -->
<snice-menu trigger="manual">...</snice-menu>

<!-- Keep open -->
<snice-menu close-on-select="false">...</snice-menu>
```

## CSS Parts

### snice-menu
- `trigger` - Trigger wrapper
- `image-left` - Left image container
- `image-right` - Right image container
- `panel` - Dropdown panel
- `content` - Panel content wrapper

### snice-menu-item
- `item` - Item container
- `icon` - Icon wrapper
- `label` - Label wrapper
- `shortcut` - Shortcut wrapper

## CSS Custom Properties

```css
--menu-bg: var(--snice-color-background, white);
--menu-border: var(--snice-color-border, #e5e7eb);
--menu-shadow: var(--snice-shadow-lg, ...);
--menu-z-index: var(--snice-z-index-dropdown, 1000);
--menu-border-radius: var(--snice-radius-md, 0.375rem);
--menu-min-width: 10rem;
--menu-distance: 4px;  /* set via distance property */
```
