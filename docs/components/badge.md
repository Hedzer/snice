[//]: # (AI: For a low-token version of this doc, use docs/ai/components/badge.md instead)

# Badge Component

The badge component displays notification indicators, status markers, and counts. It can be positioned on other elements or used inline, with support for custom colors, sizes, and animations.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Examples](#examples)

## Basic Usage

```html
<!-- Simple text badge -->
<snice-badge content="New"></snice-badge>

<!-- Count badge -->
<snice-badge count="5"></snice-badge>

<!-- Dot indicator -->
<snice-badge dot></snice-badge>
```

```typescript
import 'snice/components/badge/snice-badge';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Text content to display |
| `count` | `number` | `0` | Numeric count to display |
| `max` | `number` | `99` | Maximum count before showing "99+" |
| `dot` | `boolean` | `false` | Show as a dot indicator |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Color variant |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Position when overlaying an element |
| `inline` | `boolean` | `false` | Display inline with text |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |
| `pulse` | `boolean` | `false` | Enable pulse animation |
| `offset` | `number` | `0` | Offset in pixels from default position |

## Methods

#### `setBadgeContent(content: string): void`
Set the badge to display text content.

```typescript
badge.setBadgeContent('New');
```

#### `setBadgeCount(count: number): void`
Set the badge to display a numeric count.

```typescript
badge.setBadgeCount(5);
```

#### `showDot(): void`
Change the badge to dot mode.

```typescript
badge.showDot();
```

#### `hide(): void`
Hide the badge by clearing all content.

```typescript
badge.hide();
```

## Examples

### Basic Badges

```html
<!-- Text content -->
<snice-badge content="New"></snice-badge>
<snice-badge content="Pro"></snice-badge>
<snice-badge content="Beta"></snice-badge>

<!-- Numeric count -->
<snice-badge count="5"></snice-badge>
<snice-badge count="23"></snice-badge>
<snice-badge count="150" max="99"></snice-badge>

<!-- Dot indicator -->
<snice-badge dot></snice-badge>
```

### Color Variants

```html
<snice-badge content="Default" variant="default"></snice-badge>
<snice-badge content="Primary" variant="primary"></snice-badge>
<snice-badge content="Success" variant="success"></snice-badge>
<snice-badge content="Warning" variant="warning"></snice-badge>
<snice-badge content="Error" variant="error"></snice-badge>
<snice-badge content="Info" variant="info"></snice-badge>
```

### Badge on Elements

```html
<style>
  .badge-container {
    position: relative;
    display: inline-block;
  }
</style>

<!-- On button -->
<div class="badge-container">
  <button>Messages</button>
  <snice-badge count="3" variant="error"></snice-badge>
</div>

<!-- On icon -->
<div class="badge-container">
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
  </svg>
  <snice-badge count="12" variant="primary"></snice-badge>
</div>

<!-- On avatar -->
<div class="badge-container">
  <img src="avatar.jpg" alt="User" style="width: 48px; height: 48px; border-radius: 50%;">
  <snice-badge dot pulse variant="success"></snice-badge>
</div>
```

### Different Positions

```html
<style>
  .position-demo {
    position: relative;
    display: inline-block;
    margin: 2rem;
  }

  .demo-box {
    width: 60px;
    height: 60px;
    background: #e5e7eb;
    border-radius: 8px;
  }
</style>

<!-- Top right (default) -->
<div class="position-demo">
  <div class="demo-box"></div>
  <snice-badge count="5" position="top-right"></snice-badge>
</div>

<!-- Top left -->
<div class="position-demo">
  <div class="demo-box"></div>
  <snice-badge count="5" position="top-left"></snice-badge>
</div>

<!-- Bottom right -->
<div class="position-demo">
  <div class="demo-box"></div>
  <snice-badge count="5" position="bottom-right"></snice-badge>
</div>

<!-- Bottom left -->
<div class="position-demo">
  <div class="demo-box"></div>
  <snice-badge count="5" position="bottom-left"></snice-badge>
</div>
```

### Inline Badges

```html
<p>
  Status: <snice-badge inline content="Active" variant="success"></snice-badge>
</p>

<p>
  Plan: <snice-badge inline content="Pro" variant="primary"></snice-badge>
</p>

<h3>
  Documentation
  <snice-badge inline content="Beta" variant="warning" size="small"></snice-badge>
</h3>
```

### Different Sizes

```html
<!-- Small -->
<snice-badge content="Small" size="small"></snice-badge>
<snice-badge count="5" size="small" variant="error"></snice-badge>
<snice-badge dot size="small" variant="primary"></snice-badge>

<!-- Medium (default) -->
<snice-badge content="Medium" size="medium"></snice-badge>
<snice-badge count="15" size="medium" variant="warning"></snice-badge>
<snice-badge dot size="medium" variant="success"></snice-badge>

<!-- Large -->
<snice-badge content="Large" size="large"></snice-badge>
<snice-badge count="99+" size="large" variant="info"></snice-badge>
<snice-badge dot size="large" variant="error" pulse></snice-badge>
```

### Pulse Animation

```html
<!-- Pulse with dot -->
<snice-badge dot pulse variant="success"></snice-badge>
<snice-badge dot pulse variant="error"></snice-badge>
<snice-badge dot pulse variant="warning"></snice-badge>

<!-- Pulse with count -->
<snice-badge count="3" pulse variant="primary"></snice-badge>

<!-- Pulse with content -->
<snice-badge content="Live" pulse variant="error"></snice-badge>
```

### Notification Counter

```html
<style>
  .nav-item {
    position: relative;
    display: inline-block;
    margin: 0 1rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    cursor: pointer;
  }
</style>

<nav>
  <div class="nav-item">
    Home
  </div>

  <div class="nav-item">
    Messages
    <snice-badge count="5" variant="primary"></snice-badge>
  </div>

  <div class="nav-item">
    Notifications
    <snice-badge count="12" variant="error"></snice-badge>
  </div>

  <div class="nav-item">
    Updates
    <snice-badge dot pulse variant="info"></snice-badge>
  </div>
</nav>
```

### Dynamic Badge Updates

```html
<div class="badge-container">
  <button id="cart-button">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
    Cart
  </button>
  <snice-badge id="cart-badge" count="0"></snice-badge>
</div>

<button onclick="addToCart()">Add Item</button>
<button onclick="clearCart()">Clear Cart</button>

<script type="module">
  import type { SniceBadgeElement } from 'snice/components/badge/snice-badge.types';

  let cartCount = 0;
  const badge = document.getElementById('cart-badge') as SniceBadgeElement;

  window.addToCart = () => {
    cartCount++;
    badge.setBadgeCount(cartCount);
  };

  window.clearCart = () => {
    cartCount = 0;
    badge.hide();
  };
</script>
```

### Status Indicators

```html
<style>
  .user-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .user-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }

  .user-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
</style>

<div class="user-list">
  <div class="user-item">
    <div class="user-avatar">
      JD
      <snice-badge dot variant="success" position="bottom-right"></snice-badge>
    </div>
    <span>John Doe (Online)</span>
  </div>

  <div class="user-item">
    <div class="user-avatar">
      JS
      <snice-badge dot variant="warning" position="bottom-right"></snice-badge>
    </div>
    <span>Jane Smith (Away)</span>
  </div>

  <div class="user-item">
    <div class="user-avatar">
      AB
      <snice-badge dot variant="error" position="bottom-right"></snice-badge>
    </div>
    <span>Alice Brown (Busy)</span>
  </div>

  <div class="user-item">
    <div class="user-avatar">
      CD
    </div>
    <span>Charlie Davis (Offline)</span>
  </div>
</div>
```

### Max Count Handling

```html
<div class="badge-container">
  <button>Messages</button>
  <snice-badge id="msg-badge" count="0" max="99" variant="error"></snice-badge>
</div>

<div style="margin-top: 1rem;">
  <button onclick="setCount(5)">5 messages</button>
  <button onclick="setCount(50)">50 messages</button>
  <button onclick="setCount(100)">100 messages</button>
  <button onclick="setCount(500)">500 messages</button>
</div>

<script type="module">
  import type { SniceBadgeElement } from 'snice/components/badge/snice-badge.types';

  const badge = document.getElementById('msg-badge') as SniceBadgeElement;

  window.setCount = (count) => {
    badge.setBadgeCount(count);
  };
</script>
```

### Badge with Custom Offset

```html
<style>
  .icon-container {
    position: relative;
    display: inline-block;
    margin: 2rem;
  }
</style>

<!-- Default offset -->
<div class="icon-container">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
  <snice-badge count="5" variant="error"></snice-badge>
</div>

<!-- With offset -->
<div class="icon-container">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
  <snice-badge count="5" variant="error" offset="5"></snice-badge>
</div>
```

### Feature Badges

```html
<style>
  .feature-card {
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    max-width: 20rem;
  }

  .feature-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>

<div class="feature-card">
  <h3 class="feature-title">
    Advanced Analytics
    <snice-badge inline content="New" variant="primary" size="small"></snice-badge>
  </h3>
  <p>Get detailed insights into your data with our new analytics dashboard.</p>
</div>

<div class="feature-card">
  <h3 class="feature-title">
    API Access
    <snice-badge inline content="Pro" variant="warning" size="small"></snice-badge>
  </h3>
  <p>Integrate with your applications using our REST API.</p>
</div>

<div class="feature-card">
  <h3 class="feature-title">
    Custom Domains
    <snice-badge inline content="Beta" variant="info" size="small"></snice-badge>
  </h3>
  <p>Use your own domain name for your hosted content.</p>
</div>
```

### Unread Messages Indicator

```html
<style>
  .message-thread {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
  }

  .message-thread:hover {
    background: #f9fafb;
  }

  .thread-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .thread-content {
    flex: 1;
  }
</style>

<div class="message-thread">
  <div class="thread-avatar">
    A
    <snice-badge count="3" variant="error" size="small"></snice-badge>
  </div>
  <div class="thread-content">
    <strong>Alice</strong>
    <p style="margin: 0; color: #6b7280;">Hey, are you available for a call?</p>
  </div>
</div>

<div class="message-thread">
  <div class="thread-avatar">
    B
    <snice-badge count="1" variant="error" size="small"></snice-badge>
  </div>
  <div class="thread-content">
    <strong>Bob</strong>
    <p style="margin: 0; color: #6b7280;">I've sent you the files.</p>
  </div>
</div>

<div class="message-thread">
  <div class="thread-avatar">C</div>
  <div class="thread-content">
    <strong>Charlie</strong>
    <p style="margin: 0; color: #9ca3af;">Thanks for your help!</p>
  </div>
</div>
```

## Accessibility

- **ARIA role**: Badge has `role="status"` for screen reader announcements
- **ARIA label**: Descriptive labels for badge content
- **Color contrast**: All variants meet WCAG AA standards
- **Screen reader friendly**: Content is properly announced

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Use appropriate variants**: Choose colors that match the badge meaning
2. **Keep content short**: 1-3 characters work best for badges
3. **Set reasonable max values**: Default max of 99 works well for most cases
4. **Use dot for simple indicators**: When exact count isn't needed
5. **Position appropriately**: Ensure badges don't obscure important content
6. **Avoid overuse**: Too many badges can reduce their effectiveness
7. **Make badges clickable if needed**: Wrap in button or link when actionable
8. **Test with long counts**: Ensure layout handles 99+ properly
9. **Use pulse sparingly**: Reserve for important notifications
10. **Consider accessibility**: Ensure badge content is announced to screen readers

## Common Patterns

### Notification Badge
```html
<div class="badge-container">
  <button>Notifications</button>
  <snice-badge count="5" variant="error"></snice-badge>
</div>
```

### Status Indicator
```html
<div class="badge-container">
  <img src="avatar.jpg" alt="User">
  <snice-badge dot variant="success"></snice-badge>
</div>
```

### Feature Label
```html
<h3>
  Premium Feature
  <snice-badge inline content="Pro" variant="warning" size="small"></snice-badge>
</h3>
```

### Count with Max
```html
<snice-badge count="150" max="99"></snice-badge>
<!-- Displays as "99+" -->
```

## Variant Colors

| Variant | Color Scheme | Use Case |
|---------|-------------|----------|
| `default` | Gray | Neutral information |
| `primary` | Blue | Primary actions, branding |
| `success` | Green | Positive status, confirmations |
| `warning` | Orange | Warnings, important notices |
| `error` | Red | Errors, urgent notifications |
| `info` | Light blue | Informational content |
