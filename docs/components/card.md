<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/card.md -->

# Card Component

Container for grouped content with support for headers, footers, images, visual variants, interactive states, and responsive sizing.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'elevated' \| 'bordered' \| 'flat'` | `'elevated'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Padding size |
| `clickable` | `boolean` | `false` | Enable hover and click states |
| `selected` | `boolean` | `false` | Show selected state |
| `disabled` | `boolean` | `false` | Disable interactions |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `card-click` | `{ selected: boolean }` | Fired when a clickable card is clicked |

## Slots

| Name | Description |
|------|-------------|
| (default) | Main body content of the card |
| `image` | Image displayed at the top of the card |
| `header` | Content for the card header section |
| `footer` | Content for the card footer section |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer card container |
| `header` | Card header section |
| `body` | Card body section |
| `footer` | Card footer section |

```css
snice-card::part(header) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

snice-card::part(base) {
  border-radius: 1rem;
}
```

## Basic Usage

```html
<snice-card>
  <p>Card content goes here</p>
</snice-card>
```

```typescript
import 'snice/components/card/snice-card';
```

## Examples

### Card with Header and Footer

Use the `header` and `footer` slots to add structured content.

```html
<snice-card>
  <div slot="header">
    <h3 style="margin: 0;">User Profile</h3>
  </div>
  <p><strong>Name:</strong> John Doe</p>
  <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
    <button>Edit</button>
    <button>Delete</button>
  </div>
</snice-card>
```

### Variants

Use the `variant` attribute to change the visual style.

```html
<snice-card variant="elevated">Elevated card with shadow</snice-card>
<snice-card variant="bordered">Bordered card with no shadow</snice-card>
<snice-card variant="flat">Flat card with minimal styling</snice-card>
```

### Sizes

Use the `size` attribute to change the padding.

```html
<snice-card size="small">Small padding</snice-card>
<snice-card size="medium">Medium padding</snice-card>
<snice-card size="large">Large padding</snice-card>
```

### Clickable Cards

Set `clickable` to enable hover and click states.

```html
<snice-card clickable>
  <h3>Interactive Card</h3>
  <p>Click me to see the hover effect</p>
</snice-card>

<snice-card clickable selected>
  <h3>Selected Card</h3>
</snice-card>

<snice-card clickable disabled>
  <h3>Disabled Card</h3>
</snice-card>
```

### Interactive Selection

Use the `card-click` event to implement single-selection behavior.

```html
<snice-card id="card-1" clickable>Option A</snice-card>
<snice-card id="card-2" clickable>Option B</snice-card>
<snice-card id="card-3" clickable>Option C</snice-card>

<script type="module">
  const cards = ['card-1', 'card-2', 'card-3'].map(id => document.getElementById(id));

  cards.forEach(card => {
    card.addEventListener('card-click', () => {
      cards.forEach(c => c.selected = false);
      card.selected = true;
    });
  });
</script>
```

### Product Cards

Combine the image slot, body content, and footer for product displays.

```html
<snice-card clickable>
  <img slot="image" src="/products/laptop.jpg" alt="Laptop">
  <h3>Professional Laptop</h3>
  <p>High-performance laptop for work and play</p>
  <div slot="footer">$999</div>
</snice-card>
```

## Accessibility

- Clickable cards are fully keyboard accessible
- Proper ARIA roles and states for interactive cards
- Clear focus indicators for keyboard navigation
- Semantic content structure
