<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/testimonial.md -->

# Testimonial
`<snice-testimonial>`

Displays a quote or review card with author information, avatar, role/company attribution, optional star rating, and multiple visual variants.

## Table of Contents
- [Properties](#properties)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quote` | `string` | `''` | The testimonial quote text |
| `author` | `string` | `''` | Author name |
| `avatar` | `string` | `''` | URL for the author's avatar image |
| `role` | `string` | `''` | Author's role or job title |
| `company` | `string` | `''` | Author's company name (renders as "role at company") |
| `rating` | `number` | `0` | Star rating from 0-5 (0 hides the rating display) |
| `variant` | `'card' \| 'minimal' \| 'featured'` | `'card'` | Visual style variant |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-background-element` | Card background color | `rgb(252 251 249)` |
| `--snice-color-border` | Card border color | `rgb(226 226 226)` |
| `--snice-color-primary` | Quote icon color, minimal border accent, featured background | `rgb(37 99 235)` |
| `--snice-color-text` | Primary text color | `rgb(23 23 23)` |
| `--snice-color-text-secondary` | Author role/company text color | -- |
| `--snice-color-text-inverse` | Text color for the featured variant | `rgb(250 250 250)` |
| `--snice-color-warning` | Star rating color | `rgb(234 179 8)` |
| `--snice-shadow-sm` | Card shadow | -- |
| `--snice-spacing-lg` | Card padding | `1.5rem` |
| `--snice-border-radius-lg` | Card border radius | `0.5rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer testimonial container |
| `quote` | The quote text element |
| `author` | The author info container (avatar, name, role) |
| `stars` | The star rating element |

## Basic Usage

```typescript
import 'snice/components/testimonial/snice-testimonial';
```

```html
<snice-testimonial
  quote="This product changed my workflow completely."
  author="Jane Doe"
></snice-testimonial>
```

## Examples

### Card Variant (Default)

Use the default `card` variant for a testimonial with background, border, and shadow.

```html
<snice-testimonial
  quote="This product changed my workflow completely. I can't imagine going back."
  author="Jane Doe"
  role="CTO"
  company="Acme Corp"
  avatar="https://example.com/avatars/jane.jpg"
  rating="5"
></snice-testimonial>
```

### Minimal Variant

Use the `minimal` variant for a subtle left-border accent style without a background fill.

```html
<snice-testimonial
  variant="minimal"
  quote="Simple, elegant, and powerful. Exactly what we needed."
  author="Alex Rivera"
  role="Lead Designer"
  company="DesignStudio"
  rating="4"
></snice-testimonial>
```

### Featured Variant

Use the `featured` variant for a bold, primary-colored background with inverse text.

```html
<snice-testimonial
  variant="featured"
  quote="Outstanding experience from start to finish."
  author="John Smith"
  role="VP of Engineering"
  company="TechCorp"
  rating="5"
></snice-testimonial>
```

### Without Rating

Set `rating` to `0` (or omit it) to hide the star rating display.

```html
<snice-testimonial
  quote="A game-changer for our team's productivity."
  author="Sarah Kim"
  role="Product Manager"
></snice-testimonial>
```

### Testimonial Grid

```html
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
  <snice-testimonial
    quote="Incredible tool. Saved us hours every week."
    author="Maria Lopez"
    rating="5"
  ></snice-testimonial>
  <snice-testimonial
    quote="The best UI components library I've used."
    author="Chris Park"
    rating="4"
  ></snice-testimonial>
</div>
```

## Accessibility

- Avatar images use the author name as alt text for screen readers
- Star rating is conveyed with visible star characters
- Color contrast meets WCAG AA across all variants
- No interactive elements; testimonials are display-only
