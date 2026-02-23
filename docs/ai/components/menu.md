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
<snice-menu trigger="manual" id="m">...</snice-menu>
<script>document.getElementById('m').openMenu();</script>

<!-- Keep open -->
<snice-menu close-on-select="false">...</snice-menu>
```

## Features

- 8 placement options
- Click, hover, or manual trigger
- Auto-close on select (configurable)
- Auto-close on outside click
- Icon and shortcut slots
- Disabled/selected item states
- ARIA roles (menu, menuitem)
