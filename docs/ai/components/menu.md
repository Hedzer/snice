# snice-menu

Dropdown menu with items, dividers, and configurable trigger behavior.

## Properties

```typescript
open: boolean = false;
placement: 'bottom-start'|'bottom-end'|'top-start'|'top-end'|'right-start'|'right-end'|'left-start'|'left-end' = 'bottom-start';
trigger: 'click'|'hover'|'manual' = 'click';
closeOnSelect: boolean = true;
distance: number = 4;
```

## Methods

- `openMenu()` - Open the menu
- `closeMenu()` - Close the menu
- `toggleMenu()` - Toggle menu open/closed state

## Slots

- `trigger` - Element that triggers the menu (required)
- Default slot - Menu items and dividers

## Events

- `@snice/menu-open` - Fired when menu opens (detail: { menu: SniceMenuElement })
- `@snice/menu-close` - Fired when menu closes (detail: { menu: SniceMenuElement })

## Usage

```html
<!-- Basic menu -->
<snice-menu>
  <button slot="trigger">Open Menu</button>
  <snice-menu-item value="new">New File</snice-menu-item>
  <snice-menu-item value="open">Open</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="save">Save</snice-menu-item>
</snice-menu>

<!-- With icons and shortcuts -->
<snice-menu>
  <button slot="trigger">Edit</button>
  <snice-menu-item value="cut">
    <span slot="icon">✂️</span>
    Cut
    <span slot="shortcut">⌘X</span>
  </snice-menu-item>
  <snice-menu-item value="copy">
    <span slot="icon">📋</span>
    Copy
    <span slot="shortcut">⌘C</span>
  </snice-menu-item>
  <snice-menu-item value="paste">
    <span slot="icon">📄</span>
    Paste
    <span slot="shortcut">⌘V</span>
  </snice-menu-item>
</snice-menu>

<!-- Different placements -->
<snice-menu placement="top-start">...</snice-menu>
<snice-menu placement="right-start">...</snice-menu>

<!-- Hover trigger -->
<snice-menu trigger="hover">...</snice-menu>

<!-- Manual control -->
<snice-menu trigger="manual" id="my-menu">...</snice-menu>
<script>
  document.getElementById('my-menu').openMenu();
</script>

<!-- Keep open on select -->
<snice-menu close-on-select="false">...</snice-menu>
```

## snice-menu-item

### Properties

```typescript
value: string = '';
disabled: boolean = false;
selected: boolean = false;
```

### Slots

- `icon` - Icon before label
- Default slot - Item label
- `shortcut` - Keyboard shortcut text

### Events

- `@snice/menu-item-select` - Fired when item is clicked (detail: { item: SniceMenuItemElement, value: string })

## snice-menu-divider

Visual separator between menu items.

## Features

- 8 placement options
- Click, hover, or manual trigger modes
- Auto-close on item selection (configurable)
- Auto-close on outside click
- Icon and shortcut support
- Disabled state for items
- Selected state for items
- Keyboard accessible (aria roles)
- Configurable distance from trigger
