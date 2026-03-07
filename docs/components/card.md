<!-- AI: For a low-token version of this doc, use docs/ai/components/card.md instead -->

# Card Component

The card component provides a container for grouped content with support for headers, footers, different visual styles, interactive states, and responsive sizing.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Slots](#slots)
- [Events](#events)
- [Examples](#examples)

## Basic Usage

```html
<snice-card>
  <p>Card content goes here</p>
</snice-card>
```

```typescript
import 'snice/components/card/snice-card';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'elevated' \| 'bordered' \| 'flat'` | `'elevated'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Padding size |
| `clickable` | `boolean` | `false` | Enable hover and click states |
| `selected` | `boolean` | `false` | Show selected state |
| `disabled` | `boolean` | `false` | Disable interactions |

## Slots

### `header` (named slot)
Content for the card header section.

```html
<snice-card>
  <div slot="header">Card Title</div>
  <p>Body content</p>
</snice-card>
```

### Default slot
Main body content of the card.

```html
<snice-card>
  <p>This is the body content</p>
</snice-card>
```

### `footer` (named slot)
Content for the card footer section.

```html
<snice-card>
  <p>Body content</p>
  <div slot="footer">
    <button>Action</button>
  </div>
</snice-card>
```

## Events

#### `card-click`
Fired when a clickable card is clicked.

**Event Detail:**
```typescript
{
  selected: boolean;
  disabled: boolean;
}
```

**Usage:**
```typescript
card.addEventListener('card-click', (e) => {
  console.log('Card clicked, selected:', e.detail.selected);
});
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer card container |
| `header` | `<div>` | Card header section |
| `body` | `<div>` | Card body section |
| `footer` | `<div>` | Card footer section |

```css
snice-card::part(header) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

snice-card::part(footer) {
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

snice-card::part(base) {
  border-radius: 1rem;
}
```

## Examples

### Basic Cards

```html
<!-- Simple card -->
<snice-card>
  <p>This is a basic card with default settings.</p>
</snice-card>

<!-- Card with text content -->
<snice-card>
  <h3>Card Title</h3>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
</snice-card>
```

### Card with Header and Footer

```html
<snice-card>
  <div slot="header">
    <h3 style="margin: 0;">User Profile</h3>
  </div>

  <div>
    <p><strong>Name:</strong> John Doe</p>
    <p><strong>Email:</strong> john@example.com</p>
    <p><strong>Role:</strong> Administrator</p>
  </div>

  <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
    <button>Edit</button>
    <button>Delete</button>
  </div>
</snice-card>
```

### Card Variants

```html
<!-- Elevated card (default) -->
<snice-card variant="elevated">
  <p>Elevated card with shadow</p>
</snice-card>

<!-- Bordered card -->
<snice-card variant="bordered">
  <p>Bordered card with no shadow</p>
</snice-card>

<!-- Flat card -->
<snice-card variant="flat">
  <p>Flat card with minimal styling</p>
</snice-card>
```

### Card Sizes

```html
<!-- Small card -->
<snice-card size="small">
  <p>Small padding</p>
</snice-card>

<!-- Medium card (default) -->
<snice-card size="medium">
  <p>Medium padding</p>
</snice-card>

<!-- Large card -->
<snice-card size="large">
  <p>Large padding</p>
</snice-card>
```

### Clickable Cards

```html
<snice-card clickable>
  <h3>Interactive Card</h3>
  <p>Click me to see the hover effect</p>
</snice-card>

<snice-card clickable selected>
  <h3>Selected Card</h3>
  <p>This card is in the selected state</p>
</snice-card>

<snice-card clickable disabled>
  <h3>Disabled Card</h3>
  <p>This card cannot be clicked</p>
</snice-card>
```

### Product Cards

```html
<style>
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 0.375rem;
  }

  .product-title {
    margin: 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .product-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #3b82f6;
  }
</style>

<div class="product-grid">
  <snice-card clickable>
    <img class="product-image" src="/products/laptop.jpg" alt="Laptop">
    <h3 class="product-title">Professional Laptop</h3>
    <p>High-performance laptop for work and play</p>
    <div class="product-price">$999</div>
  </snice-card>

  <snice-card clickable>
    <img class="product-image" src="/products/phone.jpg" alt="Phone">
    <h3 class="product-title">Smartphone</h3>
    <p>Latest model with advanced features</p>
    <div class="product-price">$699</div>
  </snice-card>

  <snice-card clickable>
    <img class="product-image" src="/products/tablet.jpg" alt="Tablet">
    <h3 class="product-title">Tablet Pro</h3>
    <p>Perfect for creativity and productivity</p>
    <div class="product-price">$449</div>
  </snice-card>
</div>
```

### User Profile Cards

```html
<style>
  .profile-card {
    text-align: center;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto;
  }

  .profile-name {
    margin: 1rem 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .profile-role {
    color: #6b7280;
    margin: 0;
  }

  .profile-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }
</style>

<snice-card class="profile-card">
  <img class="profile-avatar" src="/avatars/user1.jpg" alt="User">
  <h3 class="profile-name">Sarah Johnson</h3>
  <p class="profile-role">Software Engineer</p>

  <div class="profile-stats">
    <div class="stat">
      <div class="stat-value">142</div>
      <div class="stat-label">Projects</div>
    </div>
    <div class="stat">
      <div class="stat-value">1.2K</div>
      <div class="stat-label">Followers</div>
    </div>
    <div class="stat">
      <div class="stat-value">89</div>
      <div class="stat-label">Following</div>
    </div>
  </div>

  <div slot="footer">
    <button style="width: 100%; padding: 0.5rem;">Follow</button>
  </div>
</snice-card>
```

### Pricing Cards

```html
<style>
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 900px;
  }

  .plan-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .plan-price {
    margin: 1rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    color: #3b82f6;
  }

  .plan-price span {
    font-size: 1rem;
    color: #6b7280;
  }

  .plan-features {
    list-style: none;
    padding: 0;
    margin: 1.5rem 0;
  }

  .plan-features li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .plan-features li:before {
    content: "✓ ";
    color: #10b981;
    font-weight: bold;
  }
</style>

<div class="pricing-grid">
  <snice-card variant="bordered">
    <div slot="header">
      <h3 class="plan-name">Basic</h3>
    </div>

    <div class="plan-price">
      $9
      <span>/month</span>
    </div>

    <ul class="plan-features">
      <li>Up to 5 projects</li>
      <li>1 GB storage</li>
      <li>Email support</li>
      <li>Basic analytics</li>
    </ul>

    <div slot="footer">
      <button style="width: 100%; padding: 0.75rem;">Choose Plan</button>
    </div>
  </snice-card>

  <snice-card variant="elevated" selected>
    <div slot="header">
      <h3 class="plan-name">Pro</h3>
      <span style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">POPULAR</span>
    </div>

    <div class="plan-price">
      $29
      <span>/month</span>
    </div>

    <ul class="plan-features">
      <li>Unlimited projects</li>
      <li>10 GB storage</li>
      <li>Priority support</li>
      <li>Advanced analytics</li>
      <li>API access</li>
    </ul>

    <div slot="footer">
      <button style="width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem;">Choose Plan</button>
    </div>
  </snice-card>

  <snice-card variant="bordered">
    <div slot="header">
      <h3 class="plan-name">Enterprise</h3>
    </div>

    <div class="plan-price">
      $99
      <span>/month</span>
    </div>

    <ul class="plan-features">
      <li>Unlimited everything</li>
      <li>100 GB storage</li>
      <li>24/7 phone support</li>
      <li>Custom analytics</li>
      <li>Dedicated account manager</li>
    </ul>

    <div slot="footer">
      <button style="width: 100%; padding: 0.75rem;">Contact Sales</button>
    </div>
  </snice-card>
</div>
```

### Dashboard Stat Cards

```html
<style>
  .stat-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-info h4 {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .stat-info .value {
    margin: 0.5rem 0 0;
    font-size: 2rem;
    font-weight: 700;
  }

  .stat-icon {
    font-size: 2.5rem;
  }

  .stat-change {
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .stat-change.positive {
    color: #10b981;
  }

  .stat-change.negative {
    color: #ef4444;
  }
</style>

<div class="stat-cards">
  <snice-card>
    <div class="stat-card-content">
      <div class="stat-info">
        <h4>Total Revenue</h4>
        <div class="value">$45,231</div>
        <div class="stat-change positive">↑ 12.5% from last month</div>
      </div>
      <div class="stat-icon">💰</div>
    </div>
  </snice-card>

  <snice-card>
    <div class="stat-card-content">
      <div class="stat-info">
        <h4>New Users</h4>
        <div class="value">1,234</div>
        <div class="stat-change positive">↑ 8.2% from last month</div>
      </div>
      <div class="stat-icon">👥</div>
    </div>
  </snice-card>

  <snice-card>
    <div class="stat-card-content">
      <div class="stat-info">
        <h4>Active Sessions</h4>
        <div class="value">852</div>
        <div class="stat-change negative">↓ 3.1% from last month</div>
      </div>
      <div class="stat-icon">📊</div>
    </div>
  </snice-card>

  <snice-card>
    <div class="stat-card-content">
      <div class="stat-info">
        <h4>Support Tickets</h4>
        <div class="value">23</div>
        <div class="stat-change positive">↓ 45.2% from last month</div>
      </div>
      <div class="stat-icon">🎫</div>
    </div>
  </snice-card>
</div>
```

### Interactive Selection Cards

```html
<style>
  .selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .option-card {
    text-align: center;
    padding: 1.5rem;
  }

  .option-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .option-title {
    font-weight: 600;
    margin: 0.5rem 0;
  }
</style>

<div class="selection-grid">
  <snice-card id="card-1" clickable class="option-card">
    <div class="option-icon">💳</div>
    <h4 class="option-title">Credit Card</h4>
    <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Pay with card</p>
  </snice-card>

  <snice-card id="card-2" clickable class="option-card">
    <div class="option-icon">🏦</div>
    <h4 class="option-title">Bank Transfer</h4>
    <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Direct transfer</p>
  </snice-card>

  <snice-card id="card-3" clickable class="option-card">
    <div class="option-icon">📱</div>
    <h4 class="option-title">Mobile Payment</h4>
    <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Apple/Google Pay</p>
  </snice-card>
</div>

<script type="module">
  import type { SniceCardElement } from 'snice/components/card/snice-card.types';

  const cards = ['card-1', 'card-2', 'card-3'].map(id =>
    document.getElementById(id) as SniceCardElement
  );

  cards.forEach(card => {
    card.addEventListener('card-click', () => {
      // Deselect all other cards
      cards.forEach(c => c.selected = false);
      // Select clicked card
      card.selected = true;
      console.log('Selected payment method:', card.querySelector('.option-title').textContent);
    });
  });
</script>
```

### Blog Post Cards

```html
<style>
  .blog-card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 0.375rem 0.375rem 0 0;
    margin: -1rem -1rem 1rem;
  }

  .blog-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .blog-title {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .blog-excerpt {
    color: #4b5563;
    line-height: 1.6;
  }
</style>

<snice-card clickable>
  <img class="blog-card-image" src="/blog/post1.jpg" alt="Blog post">

  <div class="blog-meta">
    <span>📅 March 15, 2025</span>
    <span>👤 John Doe</span>
  </div>

  <h3 class="blog-title">Getting Started with Web Components</h3>

  <p class="blog-excerpt">
    Learn how to build reusable, encapsulated components using modern web standards.
    This comprehensive guide covers everything from basics to advanced patterns.
  </p>

  <div slot="footer">
    <a href="/blog/post-1" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
      Read more →
    </a>
  </div>
</snice-card>
```

### Notification Cards

```html
<style>
  .notification-card {
    display: flex;
    gap: 1rem;
    align-items: start;
  }

  .notification-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .notification-content {
    flex: 1;
  }

  .notification-title {
    margin: 0 0 0.25rem;
    font-weight: 600;
  }

  .notification-time {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
</style>

<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
  <snice-card clickable size="small">
    <div class="notification-card">
      <div class="notification-icon">✉️</div>
      <div class="notification-content">
        <h4 class="notification-title">New message from Alice</h4>
        <p style="margin: 0;">Hey, are you available for a quick call?</p>
        <div class="notification-time">5 minutes ago</div>
      </div>
    </div>
  </snice-card>

  <snice-card clickable size="small">
    <div class="notification-card">
      <div class="notification-icon">🔔</div>
      <div class="notification-content">
        <h4 class="notification-title">System update available</h4>
        <p style="margin: 0;">Version 2.0 is ready to install</p>
        <div class="notification-time">1 hour ago</div>
      </div>
    </div>
  </snice-card>

  <snice-card clickable size="small">
    <div class="notification-card">
      <div class="notification-icon">✅</div>
      <div class="notification-content">
        <h4 class="notification-title">Task completed</h4>
        <p style="margin: 0;">Your export is ready to download</p>
        <div class="notification-time">2 hours ago</div>
      </div>
    </div>
  </snice-card>
</div>
```

## Accessibility

- **Keyboard support**: Clickable cards are fully keyboard accessible
- **ARIA attributes**: Proper roles and states for interactive cards
- **Focus indicators**: Clear focus states for keyboard navigation
- **Screen reader friendly**: Content structure is semantic and accessible

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Use appropriate variants**: Choose styles that match your design system
2. **Keep content focused**: Cards should contain related information
3. **Use headers wisely**: Headers help organize card content
4. **Make clickable cards obvious**: Use hover states to indicate interactivity
5. **Don't overload cards**: Keep content concise and scannable
6. **Group related cards**: Use grids or lists for multiple cards
7. **Use footers for actions**: Place buttons and links in the footer
8. **Consider mobile**: Ensure cards stack well on smaller screens
9. **Test keyboard navigation**: Ensure clickable cards work without a mouse
10. **Provide feedback**: Show selected or active states clearly

## Common Patterns

### Content Container
```html
<snice-card>
  <h3>Section Title</h3>
  <p>Content goes here</p>
</snice-card>
```

### Selectable Option
```html
<snice-card clickable selected>
  <h4>Selected Option</h4>
</snice-card>
```

### Information Display
```html
<snice-card>
  <div slot="header">Stats</div>
  <p>Metric: 123</p>
</snice-card>
```

### Action Card
```html
<snice-card>
  <p>Content</p>
  <div slot="footer">
    <button>Action</button>
  </div>
</snice-card>
```

## Variant Styles

| Variant | Appearance | Use Case |
|---------|------------|----------|
| `elevated` | Shadow | Cards that float above the page |
| `bordered` | Border, no shadow | Subtle separation within content |
| `flat` | Minimal styling | Lightweight content containers |
