<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/accordion.md -->

# Accordion Components

The accordion components provide collapsible sections of content. An `<snice-accordion>` container manages multiple `<snice-accordion-item>` elements, supporting single or multiple open items with keyboard navigation.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Components

### `<snice-accordion>`
Container element that manages accordion items.

### `<snice-accordion-item>`
Individual collapsible section within an accordion.

## Properties

### Accordion Container

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `multiple` | `boolean` | `false` | Allow multiple items open simultaneously |
| `variant` | `'bordered' \| 'elevated'` | `'bordered'` | Visual style variant |

### Accordion Item

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `itemId` (attr: `item-id`) | `string` | auto-generated | Unique identifier for the item |
| `open` | `boolean` | `false` | Whether the item is expanded |
| `disabled` | `boolean` | `false` | Disable interaction with the item |

## Methods

### Accordion Container Methods

#### `openItem(id: string): void`
Open a specific item by ID.

```typescript
accordion.openItem('item-1');
```

#### `closeItem(id: string): void`
Close a specific item by ID.

```typescript
accordion.closeItem('item-1');
```

#### `toggleItem(id: string): void`
Toggle a specific item by ID.

```typescript
accordion.toggleItem('item-1');
```

#### `openAll(): void`
Open all items (only works in `multiple` mode).

```typescript
accordion.openAll();
```

#### `closeAll(): void`
Close all items.

```typescript
accordion.closeAll();
```

### Accordion Item Methods

#### `toggle(): void`
Toggle the item's open/closed state.

```typescript
item.toggle();
```

#### `expand(animate = true): void`
Open the item with optional animation.

```typescript
item.expand();
item.expand(false); // Without animation
```

#### `collapse(animate = true): void`
Close the item with optional animation.

```typescript
item.collapse();
item.collapse(false); // Without animation
```

## Events

### Container Events

#### `accordion-open`
Fired when an item is opened.

**Event Detail:**
```typescript
{
  itemId: string;
  item: SniceAccordionItemElement;
}
```

**Usage:**
```typescript
accordion.addEventListener('accordion-open', (e) => {
  console.log('Item opened:', e.detail.itemId);
});
```

#### `accordion-close`
Fired when an item is closed.

**Event Detail:**
```typescript
{
  itemId: string;
  item: SniceAccordionItemElement;
}
```

### Item Events

#### `accordion-item-toggle`
Fired when an item is toggled.

**Event Detail:**
```typescript
{
  itemId: string;
  open: boolean;
}
```

## Slots

### Accordion Container

| Name | Description |
|------|-------------|
| (default) | `<snice-accordion-item>` elements |

### Accordion Item

| Name | Description |
|------|-------------|
| `header` | Content for the clickable header/trigger |
| (default) | Content that appears when the item is expanded |

```html
<snice-accordion-item>
  <span slot="header">Click to expand</span>
  <div>Panel content</div>
</snice-accordion-item>
```

## CSS Parts

### Accordion Item Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `header` | `<button>` | The clickable header/trigger button |
| `title` | `<span>` | Wrapper around the header slot content |
| `icon` | `<svg>` | The chevron expand/collapse icon |
| `content` | `<div>` | The collapsible content region |
| `content-inner` | `<div>` | Inner wrapper containing the default slot |

```css
snice-accordion-item::part(header) {
  font-weight: 600;
  padding: 1rem;
}

snice-accordion-item::part(content) {
  padding: 1rem;
  background: #f9fafb;
}

snice-accordion-item::part(icon) {
  color: #6b7280;
  transition: transform 0.2s;
}
```

## Basic Usage

```typescript
import 'snice/components/accordion/snice-accordion';
import 'snice/components/accordion/snice-accordion-item';
```

```html
<snice-accordion>
  <snice-accordion-item item-id="item-1">
    <span slot="header">Section 1</span>
    <div>Content for section 1</div>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-2">
    <span slot="header">Section 2</span>
    <div>Content for section 2</div>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-3">
    <span slot="header">Section 3</span>
    <div>Content for section 3</div>
  </snice-accordion-item>
</snice-accordion>
```

## Examples

### Basic Accordion

```html
<snice-accordion>
  <snice-accordion-item item-id="general">
    <span slot="header">General Information</span>
    <p>This section contains general information about the product.</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="specs">
    <span slot="header">Technical Specifications</span>
    <ul>
      <li>Weight: 2.5 kg</li>
      <li>Dimensions: 30x20x10 cm</li>
      <li>Material: Aluminum</li>
    </ul>
  </snice-accordion-item>

  <snice-accordion-item item-id="warranty">
    <span slot="header">Warranty Information</span>
    <p>This product comes with a 2-year manufacturer warranty.</p>
  </snice-accordion-item>
</snice-accordion>
```

### Multiple Open Items

```html
<snice-accordion multiple>
  <snice-accordion-item item-id="item-1">
    <span slot="header">Section 1</span>
    <p>Content 1</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-2" open>
    <span slot="header">Section 2</span>
    <p>Content 2 (initially open)</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-3" open>
    <span slot="header">Section 3</span>
    <p>Content 3 (initially open)</p>
  </snice-accordion-item>
</snice-accordion>
```

### Elevated Variant

Use the `variant` attribute to change the visual style.

```html
<snice-accordion variant="elevated">
  <snice-accordion-item item-id="item-1">
    <span slot="header">Elevated Section 1</span>
    <p>Content with card-like appearance and shadow.</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-2">
    <span slot="header">Elevated Section 2</span>
    <p>Each item appears as a separate card.</p>
  </snice-accordion-item>
</snice-accordion>
```

### With Disabled Items

```html
<snice-accordion>
  <snice-accordion-item item-id="active">
    <span slot="header">Active Item</span>
    <p>This item can be clicked.</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="disabled" disabled>
    <span slot="header">Disabled Item</span>
    <p>This item cannot be opened.</p>
  </snice-accordion-item>
</snice-accordion>
```

### Programmatic Control

```html
<snice-accordion id="controlled" multiple>
  <snice-accordion-item item-id="item-1">
    <span slot="header">Item 1</span>
    <p>Content 1</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-2">
    <span slot="header">Item 2</span>
    <p>Content 2</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="item-3">
    <span slot="header">Item 3</span>
    <p>Content 3</p>
  </snice-accordion-item>
</snice-accordion>

<div style="display: flex; gap: 8px; margin-top: 1rem;">
  <button onclick="controlled.openAll()">
    Open All
  </button>
  <button onclick="controlled.closeAll()">
    Close All
  </button>
  <button onclick="controlled.toggleItem('item-2')">
    Toggle Item 2
  </button>
</div>
```

### With Event Handling

```typescript
accordion.addEventListener('accordion-open', (e) => {
  console.log('Opened item:', e.detail.itemId);
  // Track analytics, load content, etc.
});

accordion.addEventListener('accordion-close', (e) => {
  console.log('Closed item:', e.detail.itemId);
});

// Programmatic control
accordion.openItem('item-1');
accordion.closeItem('item-2');
accordion.toggleItem('item-3');
```

### FAQ Accordion

```html
<style>
  snice-accordion-item::part(header) {
    font-weight: 600;
    padding: 1rem;
  }

  snice-accordion-item::part(content) {
    padding: 1rem;
    background: #f9fafb;
  }
</style>

<snice-accordion id="faq">
  <snice-accordion-item item-id="shipping">
    <span slot="header">What are the shipping options?</span>
    <p>We offer standard (5-7 days) and express (2-3 days) shipping options.</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="returns">
    <span slot="header">What is your return policy?</span>
    <p>Items can be returned within 30 days of purchase for a full refund.</p>
  </snice-accordion-item>

  <snice-accordion-item item-id="warranty">
    <span slot="header">Do products come with a warranty?</span>
    <p>All products include a 1-year manufacturer warranty.</p>
  </snice-accordion-item>
</snice-accordion>
```

### Dynamic Content Loading

```html
<snice-accordion id="lazyAccordion">
  <snice-accordion-item item-id="section-1">
    <span slot="header">Section 1</span>
    <div id="content-1">Loading...</div>
  </snice-accordion-item>

  <snice-accordion-item item-id="section-2">
    <span slot="header">Section 2</span>
    <div id="content-2">Loading...</div>
  </snice-accordion-item>
</snice-accordion>
```

```typescript
import 'snice/components/accordion/snice-accordion';
import 'snice/components/accordion/snice-accordion-item';

accordion.addEventListener('accordion-open', async (e) => {
  const contentId = `content-${e.detail.itemId.split('-')[1]}`;
  const contentEl = document.querySelector(`#${contentId}`);

  if (contentEl.textContent === 'Loading...') {
    const response = await fetch(`/api/content/${e.detail.itemId}`);
    const data = await response.json();
    contentEl.innerHTML = data.html;
  }
});
```

### Settings Accordion

```html
<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>

<snice-accordion>
  <snice-accordion-item item-id="general-settings">
    <span slot="header">General Settings</span>
    <div class="setting-group">
      <div class="setting-item">
        <label>Language</label>
        <select>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Timezone</label>
        <select>
          <option>UTC</option>
          <option>EST</option>
          <option>PST</option>
        </select>
      </div>
    </div>
  </snice-accordion-item>

  <snice-accordion-item item-id="notification-settings">
    <span slot="header">Notifications</span>
    <div class="setting-group">
      <div class="setting-item">
        <label>Email notifications</label>
        <input type="checkbox" checked>
      </div>
      <div class="setting-item">
        <label>Push notifications</label>
        <input type="checkbox">
      </div>
    </div>
  </snice-accordion-item>
</snice-accordion>
```

## Keyboard Navigation

The accordion supports comprehensive keyboard navigation:

- **Arrow Down**: Move focus to the next item
- **Arrow Up**: Move focus to the previous item
- **Home**: Move focus to the first item
- **End**: Move focus to the last item
- **Enter** or **Space**: Toggle the focused item

## Accessibility

- **ARIA roles**: `button` role on headers, proper aria-expanded states
- **Keyboard support**: Full keyboard navigation
- **Screen reader friendly**: Announces state changes
- **Focus management**: Visible focus indicators
- **Semantic HTML**: Uses button elements for interactivity
