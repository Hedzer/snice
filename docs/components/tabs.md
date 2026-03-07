<!-- AI: For a low-token version of this doc, use docs/ai/components/tabs.md instead -->

# Tabs
`<snice-tabs>`

A tabbed interface for organizing content into separate panels, using `<snice-tab>` for navigation and `<snice-tab-panel>` for content.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/tabs/snice-tab-panel';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-tabs.min.js"></script>
```

## Properties

### snice-tabs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selected` | `number` | `0` | Index of the selected tab |
| `placement` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Tab navigation position |
| `noScrollControls` (attr: `no-scroll-controls`) | `boolean` | `false` | Hide scroll buttons for overflowing tabs |
| `transition` | `string` | `'none'` | Panel transition effect |

### snice-tab

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Prevents tab selection |
| `closable` | `boolean` | `false` | Shows close button |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `selectTab()` | `index: number` | Select tab by index |
| `show()` | `index: number` | Alias for selectTab |
| `getTab()` | `index: number` | Get tab element at index |
| `getPanel()` | `index: number` | Get panel element at index |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `tab-change` | `{ index: number, oldIndex: number, tab: SniceTabElement, panel: SniceTabPanelElement }` | Active tab changed |
| `tab-close` | `{ tab: SniceTabElement }` | Close button clicked on a closable tab |

## Slots

| Name | Description |
|------|-------------|
| `nav` | `<snice-tab>` elements for tab navigation |
| (default) | `<snice-tab-panel>` elements for tab content |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outermost tabs container |
| `nav-container` | `<div>` | Nav bar wrapper (includes scroll buttons) |
| `nav` | `<div>` | Tab navigation scroll area |
| `indicator` | `<div>` | Active tab indicator bar |
| `scroll-button` | `<button>` | Scroll arrow button (both) |
| `scroll-button-start` | `<button>` | Start scroll button |
| `scroll-button-end` | `<button>` | End scroll button |
| `panels` | `<div>` | Panel content wrapper |

## Basic Usage

```typescript
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/tabs/snice-tab-panel';
```

```html
<snice-tabs>
  <snice-tab slot="nav">Home</snice-tab>
  <snice-tab slot="nav">Profile</snice-tab>
  <snice-tab slot="nav">Settings</snice-tab>

  <snice-tab-panel>Home content</snice-tab-panel>
  <snice-tab-panel>Profile content</snice-tab-panel>
  <snice-tab-panel>Settings content</snice-tab-panel>
</snice-tabs>
```

## Examples

### Placement

Use the `placement` attribute to position the tab navigation.

```html
<snice-tabs placement="top"><!-- default --></snice-tabs>
<snice-tabs placement="bottom"><!-- tabs below content --></snice-tabs>
<snice-tabs placement="start"><!-- tabs on left --></snice-tabs>
<snice-tabs placement="end"><!-- tabs on right --></snice-tabs>
```

### Closable Tabs

Set the `closable` attribute on individual tabs to show a close button.

```html
<snice-tabs>
  <snice-tab slot="nav" closable>Document 1</snice-tab>
  <snice-tab slot="nav" closable>Document 2</snice-tab>
  <snice-tab slot="nav">Permanent Tab</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
  <snice-tab-panel>Permanent content</snice-tab-panel>
</snice-tabs>
```

### Disabled Tabs

Set the `disabled` attribute on individual tabs to prevent selection.

```html
<snice-tabs>
  <snice-tab slot="nav">Active</snice-tab>
  <snice-tab slot="nav" disabled>Disabled</snice-tab>
  <snice-tab slot="nav">Active</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
  <snice-tab-panel>Content 3</snice-tab-panel>
</snice-tabs>
```

### With Transitions

Use the `transition` attribute for panel switch animations.

```html
<snice-tabs transition="fade">
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>

  <snice-tab-panel>Fading content 1</snice-tab-panel>
  <snice-tab-panel>Fading content 2</snice-tab-panel>
</snice-tabs>
```

### Initial Selection

Use the `selected` attribute to set the initially active tab index.

```html
<snice-tabs selected="2">
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>
  <snice-tab slot="nav">Tab 3 (selected)</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
  <snice-tab-panel>Content 3</snice-tab-panel>
</snice-tabs>
```

### Programmatic Control

```javascript
const tabs = document.querySelector('snice-tabs');
tabs.selectTab(2);           // Select by index
tabs.show(1);                // Alias for selectTab
const tab = tabs.getTab(0);  // Get tab element
const panel = tabs.getPanel(0); // Get panel element
```
