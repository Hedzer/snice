# Tabs Components

The tabs components provide a flexible tabbed interface for organizing content into separate panels. The system consists of three components working together: `<snice-tabs>` (container), `<snice-tab>` (tab buttons), and `<snice-tab-panel>` (content panels).

## Table of Contents
- [Basic Usage](#basic-usage)
- [Components](#components)
  - [snice-tabs](#snice-tabs)
  - [snice-tab](#snice-tab)
  - [snice-tab-panel](#snice-tab-panel)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Variants](#variants)
- [Examples](#examples)

## Basic Usage

```html
<snice-tabs>
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>
  <snice-tab slot="nav">Tab 3</snice-tab>

  <snice-tab-panel>Content for tab 1</snice-tab-panel>
  <snice-tab-panel>Content for tab 2</snice-tab-panel>
  <snice-tab-panel>Content for tab 3</snice-tab-panel>
</snice-tabs>
```

```typescript
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/tabs/snice-tab-panel';

const tabs = document.querySelector('snice-tabs');
tabs.addEventListener('tab-change', (e) => {
  console.log('Tab changed to:', e.detail.index);
});
```

## Components

### snice-tabs

The main container component that manages tab navigation and panel visibility.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selected` | `number` | `0` | Index of the currently selected tab |
| `placement` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Position of the tab navigation |
| `noScrollControls` | `boolean` | `false` | Hide the scroll buttons for overflowing tabs |
| `transition` | `string` | `'none'` | Transition effect when switching panels |

#### Methods

##### `selectTab(index: number): void`
Select a tab by its index.

```typescript
tabs.selectTab(2);
```

##### `show(index: number): void`
Alias for `selectTab()`. Shows the tab at the specified index.

```typescript
tabs.show(1);
```

##### `getTab(index: number): SniceTabElement | undefined`
Get a tab element by its index.

```typescript
const tab = tabs.getTab(0);
```

##### `getPanel(index: number): SniceTabPanelElement | undefined`
Get a panel element by its index.

```typescript
const panel = tabs.getPanel(0);
```

#### Events

##### `tab-change`
Fired when the active tab changes.

**Event Detail:**
```typescript
{
  index: number;           // New tab index
  oldIndex: number;        // Previous tab index
  tab: SniceTabElement;    // Reference to the selected tab element
  panel: SniceTabPanelElement; // Reference to the selected panel element
}
```

**Usage:**
```typescript
tabs.addEventListener('tab-change', (e) => {
  const { index, oldIndex, tab, panel } = e.detail;
  console.log(`Changed from tab ${oldIndex} to ${index}`);
});
```

### snice-tab

Individual tab button component. Must be placed inside `<snice-tabs>` with `slot="nav"`.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Whether the tab is disabled |
| `closable` | `boolean` | `false` | Whether to show a close button |

#### Methods

##### `focus(): void`
Give focus to the tab.

```typescript
tab.focus();
```

##### `blur(): void`
Remove focus from the tab.

```typescript
tab.blur();
```

#### Events

##### `tab-select`
Fired when the tab is clicked (bubbles to parent tabs container).

**Event Detail:**
```typescript
{
  tab: SniceTabElement; // Reference to the clicked tab
}
```

##### `tab-close`
Fired when the close button is clicked (only if `closable` is true).

**Event Detail:**
```typescript
{
  tab: SniceTabElement; // Reference to the tab being closed
}
```

### snice-tab-panel

Content panel component. Must be placed inside `<snice-tabs>` in the default slot.

#### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | Optional identifier for the panel |
| `transitionIn` | `string` | `''` | Transition effect when showing |
| `transitionOut` | `string` | `''` | Transition effect when hiding |
| `transitioning` | `'in' \| 'out' \| ''` | `''` | Current transition state |
| `transitionDuration` | `number` | `300` | Duration of transition in milliseconds |

## Variants

### Tab Placement

Control where the tab navigation appears relative to the content.

```html
<!-- Top (default) -->
<snice-tabs placement="top">
  <!-- ... -->
</snice-tabs>

<!-- Bottom -->
<snice-tabs placement="bottom">
  <!-- ... -->
</snice-tabs>

<!-- Start (left in LTR) -->
<snice-tabs placement="start">
  <!-- ... -->
</snice-tabs>

<!-- End (right in LTR) -->
<snice-tabs placement="end">
  <!-- ... -->
</snice-tabs>
```

### Closable Tabs

```html
<snice-tabs>
  <snice-tab slot="nav" closable>Closable Tab</snice-tab>
  <snice-tab slot="nav">Regular Tab</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
</snice-tabs>

<script type="module">
  import 'snice/components/tabs/snice-tabs';
  import 'snice/components/tabs/snice-tab';
  import 'snice/components/tabs/snice-tab-panel';

  const tabs = document.querySelectorAll('snice-tab');
  tabs.forEach(tab => {
    tab.addEventListener('tab-close', (e) => {
      console.log('Tab closed:', e.detail.tab);
      // Handle tab removal
    });
  });
</script>
```

### Disabled Tabs

```html
<snice-tabs>
  <snice-tab slot="nav">Active Tab</snice-tab>
  <snice-tab slot="nav" disabled>Disabled Tab</snice-tab>
  <snice-tab slot="nav">Active Tab</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
  <snice-tab-panel>Content 3</snice-tab-panel>
</snice-tabs>
```

### Without Scroll Controls

```html
<snice-tabs no-scroll-controls>
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>
  <snice-tab slot="nav">Tab 3</snice-tab>

  <snice-tab-panel>Content 1</snice-tab-panel>
  <snice-tab-panel>Content 2</snice-tab-panel>
  <snice-tab-panel>Content 3</snice-tab-panel>
</snice-tabs>
```

## Examples

### Basic Tabs

```html
<snice-tabs>
  <snice-tab slot="nav">Home</snice-tab>
  <snice-tab slot="nav">Profile</snice-tab>
  <snice-tab slot="nav">Settings</snice-tab>

  <snice-tab-panel>
    <h2>Home</h2>
    <p>Welcome to the home page!</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Profile</h2>
    <p>Your profile information...</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Settings</h2>
    <p>Application settings...</p>
  </snice-tab-panel>
</snice-tabs>
```

### Programmatic Tab Control

```typescript
import type { SniceTabsElement } from 'snice/components/tabs/snice-tabs.types';

const tabs = document.querySelector<SniceTabsElement>('snice-tabs');

// Navigate to specific tab
tabs.selectTab(2);

// Or use show()
tabs.show(1);

// Get references
const tab = tabs.getTab(0);
const panel = tabs.getPanel(0);
```

### With Event Handling

```typescript
const tabs = document.querySelector('snice-tabs');

tabs.addEventListener('tab-change', (e) => {
  const { index, oldIndex, tab, panel } = e.detail;

  // Load content dynamically
  if (!panel.hasAttribute('data-loaded')) {
    loadPanelContent(index, panel);
    panel.setAttribute('data-loaded', 'true');
  }
});

async function loadPanelContent(index: number, panel: HTMLElement) {
  const response = await fetch(`/api/tab-content/${index}`);
  const content = await response.text();
  panel.innerHTML = content;
}
```

### Dynamic Tabs

```html
<snice-tabs id="dynamicTabs"></snice-tabs>

<button id="addTab">Add Tab</button>

<script type="module">
  import 'snice/components/tabs/snice-tabs';
  import 'snice/components/tabs/snice-tab';
  import 'snice/components/tabs/snice-tab-panel';

  const tabs = document.querySelector('#dynamicTabs');
  let tabCount = 0;

  function addTab() {
    tabCount++;

    const tab = document.createElement('snice-tab');
    tab.setAttribute('slot', 'nav');
    tab.setAttribute('closable', 'true');
    tab.textContent = `Tab ${tabCount}`;

    const panel = document.createElement('snice-tab-panel');
    panel.textContent = `Content for tab ${tabCount}`;

    tabs.appendChild(tab);
    tabs.appendChild(panel);

    // Handle close
    tab.addEventListener('tab-close', () => {
      const index = Array.from(tabs.querySelectorAll('snice-tab')).indexOf(tab);
      const panelToRemove = tabs.querySelectorAll('snice-tab-panel')[index];

      tab.remove();
      panelToRemove.remove();
    });

    // Select the new tab
    const newIndex = tabs.querySelectorAll('snice-tab').length - 1;
    tabs.selectTab(newIndex);
  }

  document.querySelector('#addTab').addEventListener('click', addTab);

  // Add initial tab
  addTab();
</script>
```

### With Transitions

```html
<snice-tabs transition="fade">
  <snice-tab slot="nav">Tab 1</snice-tab>
  <snice-tab slot="nav">Tab 2</snice-tab>
  <snice-tab slot="nav">Tab 3</snice-tab>

  <snice-tab-panel>
    <h2>Panel 1</h2>
    <p>Content with fade transition</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Panel 2</h2>
    <p>Content with fade transition</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Panel 3</h2>
    <p>Content with fade transition</p>
  </snice-tab-panel>
</snice-tabs>
```

### Vertical Tabs

```html
<snice-tabs placement="start">
  <snice-tab slot="nav">Dashboard</snice-tab>
  <snice-tab slot="nav">Analytics</snice-tab>
  <snice-tab slot="nav">Reports</snice-tab>
  <snice-tab slot="nav">Settings</snice-tab>

  <snice-tab-panel>
    <h2>Dashboard</h2>
    <p>Dashboard content...</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Analytics</h2>
    <p>Analytics content...</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Reports</h2>
    <p>Reports content...</p>
  </snice-tab-panel>

  <snice-tab-panel>
    <h2>Settings</h2>
    <p>Settings content...</p>
  </snice-tab-panel>
</snice-tabs>

<style>
  snice-tabs[placement="start"],
  snice-tabs[placement="end"] {
    height: 400px;
  }
</style>
```

### Complete Example with All Features

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .tab-demo {
      max-width: 800px;
      margin: 2rem auto;
    }

    .panel-content {
      padding: 1rem;
    }

    .panel-content h2 {
      margin-top: 0;
    }
  </style>

  <script type="module">
    import 'snice/components/tabs/snice-tabs';
    import 'snice/components/tabs/snice-tab';
    import 'snice/components/tabs/snice-tab-panel';

    const tabs = document.querySelector('snice-tabs');

    // Handle tab changes
    tabs.addEventListener('tab-change', (e) => {
      console.log('Active tab:', e.detail.index);
    });

    // Handle tab close
    document.querySelectorAll('snice-tab[closable]').forEach(tab => {
      tab.addEventListener('tab-close', (e) => {
        if (confirm('Close this tab?')) {
          const index = Array.from(tabs.querySelectorAll('snice-tab')).indexOf(e.detail.tab);
          const panel = tabs.querySelectorAll('snice-tab-panel')[index];

          e.detail.tab.remove();
          panel.remove();
        }
      });
    });
  </script>
</head>
<body>
  <div class="tab-demo">
    <snice-tabs selected="0" transition="fade">
      <snice-tab slot="nav">Overview</snice-tab>
      <snice-tab slot="nav">Details</snice-tab>
      <snice-tab slot="nav" closable>Extra</snice-tab>
      <snice-tab slot="nav" disabled>Disabled</snice-tab>

      <snice-tab-panel>
        <div class="panel-content">
          <h2>Overview</h2>
          <p>This is the overview tab with general information.</p>
        </div>
      </snice-tab-panel>

      <snice-tab-panel>
        <div class="panel-content">
          <h2>Details</h2>
          <p>Detailed information goes here.</p>
        </div>
      </snice-tab-panel>

      <snice-tab-panel>
        <div class="panel-content">
          <h2>Extra Content</h2>
          <p>This tab can be closed.</p>
        </div>
      </snice-tab-panel>

      <snice-tab-panel>
        <div class="panel-content">
          <h2>Disabled</h2>
          <p>This content is not accessible.</p>
        </div>
      </snice-tab-panel>
    </snice-tabs>
  </div>
</body>
</html>
```

## Accessibility

The tabs components include proper ARIA attributes and keyboard support:

- `role="tablist"` on the navigation container
- `role="tab"` on each tab element
- `aria-selected` reflects the current tab state
- `aria-hidden` on panels to hide inactive content from screen readers
- `tabindex` management for keyboard navigation
- Focus management for keyboard users
- `aria-label` on scroll buttons

### Keyboard Support

- **Tab**: Move focus into/out of the tab list
- **Arrow Keys**: Navigate between tabs
- **Home**: Focus first tab
- **End**: Focus last tab
- **Space/Enter**: Activate focused tab

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
