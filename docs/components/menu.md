<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/menu.md -->

# Menu
`<snice-menu>`

A dropdown menu with composable items, dividers, icons, and keyboard shortcut hints.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Components

- `<snice-menu>` - The dropdown menu container with trigger and panel
- `<snice-menu-item>` - Individual selectable menu item with icon and shortcut slots
- `<snice-menu-divider>` - Visual separator between items

## Properties

### snice-menu

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the menu is open |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end' \| 'right-start' \| 'right-end' \| 'left-start' \| 'left-end'` | `'bottom-start'` | Panel placement |
| `trigger` | `'click' \| 'hover' \| 'manual'` | `'click'` | Trigger mode |
| `closeOnSelect` (attr: `close-on-select`) | `boolean` | `true` | Close on item selection |
| `distance` | `number` | `4` | Distance from trigger to panel (px) |

### snice-menu-item

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Item value |
| `disabled` | `boolean` | `false` | Disable interaction |
| `selected` | `boolean` | `false` | Selected state |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `openMenu()` | -- | Open the menu |
| `closeMenu()` | -- | Close the menu |
| `toggleMenu()` | -- | Toggle the menu |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `menu-open` | `{ menu: SniceMenuElement }` | Menu opened |
| `menu-close` | `{ menu: SniceMenuElement }` | Menu closed |
| `menu-item-select` | `{ item: SniceMenuItemElement, value: string }` | Item selected (bubbles from menu-item) |

## Slots

### snice-menu

| Name | Description |
|------|-------------|
| `trigger` | Element that triggers the menu (required) |
| `image-left` | Image/icon before the trigger |
| `image-right` | Image/icon after the trigger |
| (default) | Menu items and dividers |

### snice-menu-item

| Name | Description |
|------|-------------|
| `icon` | Icon before the item label |
| (default) | Item label content |
| `shortcut` | Keyboard shortcut hint |

## CSS Parts

### snice-menu

| Part | Element | Description |
|------|---------|-------------|
| `trigger` | `<div>` | The trigger wrapper element |
| `image-left` | `<span>` | Left image container |
| `image-right` | `<span>` | Right image container |
| `panel` | `<div>` | The dropdown panel |
| `content` | `<div>` | Panel content wrapper |

### snice-menu-item

| Part | Element | Description |
|------|---------|-------------|
| `item` | `<div>` | The menu item container |
| `icon` | `<span>` | Icon wrapper |
| `label` | `<span>` | Label wrapper |
| `shortcut` | `<span>` | Keyboard shortcut wrapper |

### snice-menu-divider

| Part | Element | Description |
|------|---------|-------------|
| `divider` | `<div>` | The separator line |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--menu-bg` | Panel background color | `var(--snice-color-background, white)` |
| `--menu-border` | Panel border color | `var(--snice-color-border, #e5e7eb)` |
| `--menu-shadow` | Panel box shadow | `var(--snice-shadow-lg)` |
| `--menu-z-index` | Panel z-index | `var(--snice-z-index-dropdown, 1000)` |
| `--menu-border-radius` | Panel border radius | `var(--snice-radius-md, 0.375rem)` |
| `--menu-min-width` | Minimum panel width | `10rem` |

## Basic Usage

```typescript
import 'snice/components/menu/snice-menu';
import 'snice/components/menu/snice-menu-item';
import 'snice/components/menu/snice-menu-divider';
```

```html
<snice-menu>
  <button slot="trigger">Open Menu</button>
  <snice-menu-item value="new">New File</snice-menu-item>
  <snice-menu-item value="open">Open...</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="save">Save</snice-menu-item>
</snice-menu>
```

## Examples

### Icons and Shortcuts

Use the `icon` and `shortcut` slots on menu items to add visual cues.

```html
<snice-menu>
  <button slot="trigger">Edit</button>
  <snice-menu-item value="undo">
    <span slot="icon">↩️</span>
    Undo
    <span slot="shortcut">⌘Z</span>
  </snice-menu-item>
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
</snice-menu>
```

### Placement

Use the `placement` attribute to position the menu relative to its trigger.

```html
<snice-menu placement="bottom-end">
  <button slot="trigger">Bottom End</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
</snice-menu>

<snice-menu placement="right-start">
  <button slot="trigger">Right</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
</snice-menu>
```

### Hover Trigger

Set `trigger="hover"` to open the menu on mouse hover.

```html
<snice-menu trigger="hover">
  <button slot="trigger">Hover Me</button>
  <snice-menu-item value="1">Quick Action 1</snice-menu-item>
  <snice-menu-item value="2">Quick Action 2</snice-menu-item>
</snice-menu>
```

### Manual Control

Set `trigger="manual"` and use methods to control the menu programmatically.

```html
<snice-menu trigger="manual" id="my-menu">
  <button slot="trigger">Manual</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
</snice-menu>
```

```typescript
document.getElementById('my-menu').openMenu();
```

### Disabled Items

```html
<snice-menu>
  <button slot="trigger">Actions</button>
  <snice-menu-item value="edit">Edit</snice-menu-item>
  <snice-menu-item value="delete" disabled>Delete</snice-menu-item>
  <snice-menu-item value="share">Share</snice-menu-item>
</snice-menu>
```

### Keep Open on Select

Set `close-on-select="false"` for multi-action menus.

```html
<snice-menu close-on-select="false">
  <button slot="trigger">Filters</button>
  <snice-menu-item value="active">Active</snice-menu-item>
  <snice-menu-item value="pending">Pending</snice-menu-item>
  <snice-menu-item value="archived">Archived</snice-menu-item>
</snice-menu>
```

### User Profile Menu

Use `image-left` and `image-right` slots for avatar menus.

```html
<snice-menu placement="bottom-end">
  <img slot="image-left" src="avatar.jpg" alt="User" style="width:32px;height:32px;border-radius:50%">
  <span slot="trigger">John Doe</span>
  <snice-menu-item value="profile">
    <span slot="icon">👤</span>
    Profile
  </snice-menu-item>
  <snice-menu-item value="settings">
    <span slot="icon">⚙️</span>
    Settings
  </snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="logout">
    <span slot="icon">🚪</span>
    Log Out
  </snice-menu-item>
</snice-menu>
```

### Event Handling

```typescript
menu.addEventListener('menu-item-select', (e) => {
  console.log('Selected:', e.detail.value);
});

menu.addEventListener('menu-open', () => console.log('Opened'));
menu.addEventListener('menu-close', () => console.log('Closed'));
```
