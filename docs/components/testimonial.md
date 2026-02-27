[//]: # (AI: For a low-token version of this doc, use docs/ai/components/testimonial.md instead)

# Testimonial Component

The testimonial component displays a quote or review card with author information, avatar, role/company attribution, optional star rating, and multiple visual variants. It is ideal for customer testimonials, reviews, and social proof sections.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-testimonial
  quote="This product changed my workflow completely."
  author="Jane Doe"
></snice-testimonial>
```

```typescript
import 'snice/components/testimonial/snice-testimonial';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quote` | `string` | `''` | The testimonial quote text |
| `author` | `string` | `''` | Author name |
| `avatar` | `string` | `''` | URL for the author's avatar image |
| `role` | `string` | `''` | Author's role or job title (e.g., "CEO") |
| `company` | `string` | `''` | Author's company name (renders as "role at company") |
| `rating` | `number` | `0` | Star rating from 0-5 (0 hides the rating display) |
| `variant` | `'card' \| 'minimal' \| 'featured'` | `'card'` | Visual style variant |

### Variants

| Variant | Description |
|---------|-------------|
| `card` | Default style with background, border, and shadow |
| `minimal` | Left border accent, no background fill |
| `featured` | Primary-colored background with inverse (light) text |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-background-element` | Card background color | `rgb(252 251 249)` |
| `--snice-color-border` | Card border color | `rgb(226 226 226)` |
| `--snice-color-primary` | Quote icon color, minimal border accent, featured background | `rgb(37 99 235)` |
| `--snice-color-text` | Primary text color | `rgb(23 23 23)` |
| `--snice-color-text-secondary` | Author role/company text color | _(theme default)_ |
| `--snice-color-text-inverse` | Text color for the featured variant | `rgb(250 250 250)` |
| `--snice-color-warning` | Star rating color | `rgb(234 179 8)` |
| `--snice-shadow-sm` | Card shadow | _(theme default)_ |
| `--snice-spacing-lg` | Card padding | `1.5rem` |
| `--snice-border-radius-lg` | Card border radius | `0.5rem` |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer testimonial container |
| `quote` | `<div>` | The quote text element |
| `author` | `<div>` | The author info container (avatar, name, role) |
| `stars` | `<div>` | The star rating element |

```css
snice-testimonial::part(base) {
  border: 2px solid #e2e8f0;
}

snice-testimonial::part(quote) {
  font-style: italic;
  font-size: 1.125rem;
}

snice-testimonial::part(stars) {
  color: #f59e0b;
}
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

Use the `featured` variant for a bold, primary-colored background with inverse text, suitable for hero sections.

```html
<snice-testimonial
  variant="featured"
  quote="Outstanding experience from start to finish. The team was incredibly responsive."
  author="John Smith"
  role="VP of Engineering"
  company="TechCorp"
  avatar="https://example.com/avatars/john.jpg"
  rating="5"
></snice-testimonial>
```

### Without Rating

Set `rating` to `0` (or omit it) to hide the star rating display entirely.

```html
<snice-testimonial
  quote="A game-changer for our team's productivity."
  author="Sarah Kim"
  role="Product Manager"
  company="StartupXYZ"
></snice-testimonial>
```

### Testimonial Grid

Arrange multiple testimonials in a responsive grid layout.

```html
<style>
  .testimonial-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
</style>

<div class="testimonial-grid">
  <snice-testimonial
    quote="Incredible tool. Saved us hours every week."
    author="Maria Lopez"
    role="Engineering Manager"
    company="DataFlow"
    rating="5"
  ></snice-testimonial>

  <snice-testimonial
    quote="The best UI components library I've used."
    author="Chris Park"
    role="Frontend Developer"
    company="WebScale"
    avatar="https://example.com/avatars/chris.jpg"
    rating="4"
  ></snice-testimonial>

  <snice-testimonial
    quote="Clean design, great documentation, easy integration."
    author="Emma Wilson"
    role="Tech Lead"
    company="BuildRight"
    rating="5"
  ></snice-testimonial>
</div>
```

## Accessibility

- **Semantic markup**: The quote is rendered with appropriate quotation semantics
- **Image alt text**: Avatar images use the author name as alt text for screen readers
- **Star rating**: The star rating is conveyed with an ARIA label (e.g., "4 out of 5 stars")
- **Color contrast**: All text meets WCAG AA contrast requirements across all variants, including the featured variant with inverse text
- **No interactive elements**: Testimonials are display-only, so no keyboard interaction is needed

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Use real quotes**: Authentic testimonials build trust; avoid generic placeholder text
2. **Include author details**: Name and role/company add credibility
3. **Add avatars when available**: Photos make testimonials more personal and trustworthy
4. **Use the featured variant sparingly**: Reserve it for one or two standout quotes
5. **Keep quotes concise**: Shorter quotes are more impactful and easier to scan
6. **Use the rating when relevant**: Star ratings work well for product reviews but may not suit all testimonial contexts
7. **Group testimonials together**: Display 3 or more testimonials in a grid for social proof
