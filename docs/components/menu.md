# Menu Components

The menu components provide dropdown menus with customizable triggers, placement options, and support for icons and keyboard shortcuts. A `<snice-menu>` container manages `<snice-menu-item>` elements and `<snice-menu-divider>` separators.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [Examples](#examples)

## Basic Usage

```html
<snice-menu>
  <button slot="trigger">Open Menu</button>
  <snice-menu-item value="new">New File</snice-menu-item>
  <snice-menu-item value="open">Open...</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="save">Save</snice-menu-item>
</snice-menu>
```

```typescript
import 'snice/components/menu/snice-menu';
import 'snice/components/menu/snice-menu-item';
import 'snice/components/menu/snice-menu-divider';
```

## Components

### `<snice-menu>`
Container element that manages the menu panel and trigger behavior.

### `<snice-menu-item>`
Individual menu item that can be selected.

### `<snice-menu-divider>`
Visual separator between menu items.

## Properties

### Menu Container

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the menu is open |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end' \| 'right-start' \| 'right-end' \| 'left-start' \| 'left-end'` | `'bottom-start'` | Menu panel placement relative to trigger |
| `trigger` | `'click' \| 'hover' \| 'manual'` | `'click'` | How the menu is triggered |
| `closeOnSelect` | `boolean` | `true` | Whether to close menu when item is selected |
| `distance` | `number` | `4` | Distance (in pixels) from trigger to panel |

### Menu Item

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Value associated with the menu item |
| `disabled` | `boolean` | `false` | Disable interaction with the item |
| `selected` | `boolean` | `false` | Whether the item is selected |

## Methods

### Menu Container Methods

#### `openMenu(): void`
Open the menu panel.

```typescript
menu.openMenu();
```

#### `closeMenu(): void`
Close the menu panel.

```typescript
menu.closeMenu();
```

#### `toggleMenu(): void`
Toggle the menu open/closed state.

```typescript
menu.toggleMenu();
```

## Events

### Container Events

#### `menu-open`
Fired when the menu is opened.

**Event Detail:**
```typescript
{
  menu: SniceMenuElement;
}
```

**Usage:**
```typescript
menu.addEventListener('menu-open', (e) => {
  console.log('Menu opened');
});
```

#### `menu-close`
Fired when the menu is closed.

**Event Detail:**
```typescript
{
  menu: SniceMenuElement;
}
```

### Item Events

#### `menu-item-select`
Fired when a menu item is selected.

**Event Detail:**
```typescript
{
  item: SniceMenuItemElement;
  value: string;
}
```

**Usage:**
```typescript
menu.addEventListener('menu-item-select', (e) => {
  console.log('Selected item:', e.detail.value);
});
```

## Slots

### Menu Slots

#### `trigger` (named slot)
Element that triggers the menu (required).

```html
<snice-menu>
  <button slot="trigger">Click me</button>
  <!-- menu items -->
</snice-menu>
```

#### `image-left` (named slot)
Image or icon to display before the trigger content.

```html
<snice-menu>
  <img slot="image-left" src="avatar.jpg" alt="User">
  <span slot="trigger">User Menu</span>
  <!-- menu items -->
</snice-menu>
```

#### `image-right` (named slot)
Image or icon to display after the trigger content.

```html
<snice-menu>
  <span slot="trigger">Settings</span>
  <img slot="image-right" src="icon.svg" alt="">
  <!-- menu items -->
</snice-menu>
```

#### Default slot
Menu items and dividers.

### Menu Item Slots

#### `icon` (named slot)
Icon displayed before the item label.

```html
<snice-menu-item value="save">
  <span slot="icon">💾</span>
  Save
</snice-menu-item>
```

#### Default slot
The item label/content.

#### `shortcut` (named slot)
Keyboard shortcut hint displayed after the label.

```html
<snice-menu-item value="save">
  Save
  <span slot="shortcut">⌘S</span>
</snice-menu-item>
```

## Examples

### Basic Menu

```html
<snice-menu>
  <button slot="trigger">File</button>
  <snice-menu-item value="new">New</snice-menu-item>
  <snice-menu-item value="open">Open</snice-menu-item>
  <snice-menu-item value="save">Save</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="exit">Exit</snice-menu-item>
</snice-menu>
```

### Menu with Icons and Shortcuts

```html
<snice-menu>
  <button slot="trigger">Edit</button>

  <snice-menu-item value="undo">
    <span slot="icon">↩️</span>
    Undo
    <span slot="shortcut">⌘Z</span>
  </snice-menu-item>

  <snice-menu-item value="redo">
    <span slot="icon">↪️</span>
    Redo
    <span slot="shortcut">⌘⇧Z</span>
  </snice-menu-item>

  <snice-menu-divider></snice-menu-divider>

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
```

### Different Placements

```html
<!-- Bottom start (default) -->
<snice-menu placement="bottom-start">
  <button slot="trigger">Bottom Start</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
</snice-menu>

<!-- Bottom end -->
<snice-menu placement="bottom-end">
  <button slot="trigger">Bottom End</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
</snice-menu>

<!-- Top start -->
<snice-menu placement="top-start">
  <button slot="trigger">Top Start</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
</snice-menu>

<!-- Right side -->
<snice-menu placement="right-start">
  <button slot="trigger">Right</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
</snice-menu>
```

### Hover Trigger

```html
<snice-menu trigger="hover">
  <button slot="trigger">Hover Me</button>
  <snice-menu-item value="quick1">Quick Action 1</snice-menu-item>
  <snice-menu-item value="quick2">Quick Action 2</snice-menu-item>
  <snice-menu-item value="quick3">Quick Action 3</snice-menu-item>
</snice-menu>
```

### Manual Control

```html
<snice-menu id="manual-menu" trigger="manual">
  <button slot="trigger">Manual Menu</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
</snice-menu>

<button onclick="document.getElementById('manual-menu').openMenu()">
  Open Menu
</button>
```

### Disabled Items

```html
<snice-menu>
  <button slot="trigger">Actions</button>
  <snice-menu-item value="edit">Edit</snice-menu-item>
  <snice-menu-item value="delete" disabled>Delete (disabled)</snice-menu-item>
  <snice-menu-item value="share">Share</snice-menu-item>
</snice-menu>
```

### Keep Open on Select

```html
<snice-menu id="multi-menu" close-on-select="false">
  <button slot="trigger">Multi-Select</button>
  <snice-menu-item value="option1">Option 1</snice-menu-item>
  <snice-menu-item value="option2">Option 2</snice-menu-item>
  <snice-menu-item value="option3">Option 3</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="done">Done</snice-menu-item>
</snice-menu>

<script type="module">
  const menu = document.getElementById('multi-menu');
  menu.addEventListener('menu-item-select', (e) => {
    if (e.detail.value === 'done') {
      menu.closeMenu();
    }
  });
</script>
```

### User Profile Menu

```html
<snice-menu placement="bottom-end">
  <img slot="image-left"
       src="https://via.placeholder.com/32"
       alt="User avatar"
       style="width: 32px; height: 32px; border-radius: 50%;">
  <span slot="trigger">John Doe</span>

  <snice-menu-item value="profile">
    <span slot="icon">👤</span>
    View Profile
  </snice-menu-item>

  <snice-menu-item value="settings">
    <span slot="icon">⚙️</span>
    Settings
  </snice-menu-item>

  <snice-menu-item value="billing">
    <span slot="icon">💳</span>
    Billing
  </snice-menu-item>

  <snice-menu-divider></snice-menu-divider>

  <snice-menu-item value="help">
    <span slot="icon">❓</span>
    Help & Support
  </snice-menu-item>

  <snice-menu-divider></snice-menu-divider>

  <snice-menu-item value="logout">
    <span slot="icon">🚪</span>
    Log Out
  </snice-menu-item>
</snice-menu>
```

### Context Menu

```html
<div id="content" style="padding: 2rem; border: 1px solid #ccc;">
  Right-click me for context menu
</div>

<snice-menu id="context-menu" trigger="manual">
  <div slot="trigger" style="display: none;"></div>

  <snice-menu-item value="copy">Copy</snice-menu-item>
  <snice-menu-item value="paste">Paste</snice-menu-item>
  <snice-menu-divider></snice-menu-divider>
  <snice-menu-item value="delete">Delete</snice-menu-item>
</snice-menu>

<script type="module">
  const content = document.getElementById('content');
  const menu = document.getElementById('context-menu');

  content.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    // Position menu at cursor
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    menu.openMenu();
  });

  menu.addEventListener('menu-item-select', (e) => {
    console.log('Context action:', e.detail.value);
  });
</script>
```

### With Event Handling

```typescript
import type { SniceMenuElement } from 'snice/components/menu/snice-menu.types';

const menu = document.querySelector<SniceMenuElement>('snice-menu');

menu.addEventListener('menu-open', () => {
  console.log('Menu opened');
  // Load dynamic content, track analytics, etc.
});

menu.addEventListener('menu-close', () => {
  console.log('Menu closed');
});

menu.addEventListener('menu-item-select', (e) => {
  console.log('Selected:', e.detail.value);

  switch (e.detail.value) {
    case 'save':
      saveDocument();
      break;
    case 'export':
      exportData();
      break;
    case 'delete':
      confirmDelete();
      break;
  }
});
```

### Dynamic Menu Items

```html
<snice-menu id="dynamic-menu">
  <button slot="trigger">Recent Files</button>
  <!-- Items populated dynamically -->
</snice-menu>

<script type="module">
  import 'snice/components/menu/snice-menu';
  import 'snice/components/menu/snice-menu-item';

  const menu = document.getElementById('dynamic-menu');

  // Load recent files
  const recentFiles = await fetch('/api/recent-files').then(r => r.json());

  recentFiles.forEach((file, index) => {
    const item = document.createElement('snice-menu-item');
    item.value = file.id;
    item.textContent = file.name;

    const shortcut = document.createElement('span');
    shortcut.slot = 'shortcut';
    shortcut.textContent = `⌘${index + 1}`;
    item.appendChild(shortcut);

    menu.appendChild(item);
  });

  menu.addEventListener('menu-item-select', (e) => {
    openFile(e.detail.value);
  });
</script>
```

### Nested Menu Actions

```html
<snice-menu>
  <button slot="trigger">Actions</button>

  <snice-menu-item value="new">
    <span slot="icon">📄</span>
    New Document
  </snice-menu-item>

  <snice-menu-item value="import">
    <span slot="icon">📥</span>
    Import
  </snice-menu-item>

  <snice-menu-item value="export">
    <span slot="icon">📤</span>
    Export
  </snice-menu-item>

  <snice-menu-divider></snice-menu-divider>

  <snice-menu-item value="share">
    <span slot="icon">🔗</span>
    Share
  </snice-menu-item>

  <snice-menu-item value="permissions">
    <span slot="icon">🔒</span>
    Permissions
  </snice-menu-item>

  <snice-menu-divider></snice-menu-divider>

  <snice-menu-item value="archive">
    <span slot="icon">📦</span>
    Archive
  </snice-menu-item>

  <snice-menu-item value="delete">
    <span slot="icon">🗑️</span>
    Delete
  </snice-menu-item>
</snice-menu>
```

### Styled Menu

```html
<style>
  #styled-menu::part(panel) {
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    min-width: 200px;
  }

  #styled-menu::part(trigger) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
  }
</style>

<snice-menu id="styled-menu">
  <button slot="trigger">Styled Menu</button>
  <snice-menu-item value="1">Option 1</snice-menu-item>
  <snice-menu-item value="2">Option 2</snice-menu-item>
  <snice-menu-item value="3">Option 3</snice-menu-item>
</snice-menu>
```

## Accessibility

- **ARIA roles**: `menu` role on panel, `menuitem` role on items
- **Keyboard support**: Click and keyboard activation of trigger
- **Screen reader friendly**: Proper aria attributes
- **Focus management**: Focus returns to trigger when closed
- **Disabled state**: Items can be disabled with proper aria-disabled

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Use meaningful values**: Set descriptive `value` attributes on menu items
2. **Group related items**: Use dividers to separate logical groups
3. **Keep menus concise**: Limit to 7-10 items per menu for usability
4. **Use icons sparingly**: Icons should enhance, not clutter
5. **Position appropriately**: Choose placement based on trigger location
6. **Handle outside clicks**: Menu automatically closes on outside click
7. **Provide keyboard shortcuts**: Show shortcuts in the menu when available
8. **Test on mobile**: Ensure touch interactions work well
9. **Consider hover carefully**: Hover trigger may not work well on touch devices
10. **Close after action**: Use `closeOnSelect` for single-action menus

## Common Patterns

### File Menu Pattern
```html
<snice-menu>
  <button slot="trigger">File</button>
  <snice-menu-item value="new">New</snice-menu-item>
  <snice-menu-item value="open">Open</snice-menu-item>
  <snice-menu-item value="save">Save</snice-menu-item>
</snice-menu>
```

### User Menu Pattern
```html
<snice-menu placement="bottom-end">
  <img slot="image-left" src="avatar.jpg">
  <span slot="trigger">Username</span>
  <snice-menu-item value="profile">Profile</snice-menu-item>
  <snice-menu-item value="logout">Logout</snice-menu-item>
</snice-menu>
```

### Action Menu Pattern
```html
<snice-menu>
  <button slot="trigger">⋮</button>
  <snice-menu-item value="edit">Edit</snice-menu-item>
  <snice-menu-item value="delete">Delete</snice-menu-item>
</snice-menu>
```

### Multi-Select Pattern
```html
<snice-menu close-on-select="false">
  <button slot="trigger">Filters</button>
  <!-- Multiple selections allowed -->
</snice-menu>
```
