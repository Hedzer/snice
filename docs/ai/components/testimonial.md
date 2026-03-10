# snice-testimonial

Testimonial/quote card with author info, avatar, star rating, and variant styles.

## Properties

```typescript
quote: string = '';
author: string = '';
avatar: string = '';            // URL for author avatar image
role: string = '';              // e.g. "CEO"
company: string = '';           // e.g. "Acme Inc" (renders as "role at company")
rating: number = 0;             // 0-5 star rating (0 = hidden)
variant: 'card'|'minimal'|'featured' = 'card';
```

## CSS Custom Properties

- `--snice-color-background-element` - Card background (default: `rgb(252 251 249)`)
- `--snice-color-border` - Card border (default: `rgb(226 226 226)`)
- `--snice-color-primary` - Quote icon, minimal border, featured bg (default: `rgb(37 99 235)`)
- `--snice-color-text` - Text color (default: `rgb(23 23 23)`)
- `--snice-color-text-secondary` - Author role color
- `--snice-color-text-inverse` - Featured variant text (default: `rgb(250 250 250)`)
- `--snice-color-warning` - Star rating color (default: `rgb(234 179 8)`)

## CSS Parts

- `base` - The outer testimonial container
- `quote` - The quote text element
- `author` - The author info container (avatar, name, role)
- `stars` - The star rating element

## Basic Usage

```html
<snice-testimonial
  quote="This product changed my workflow completely."
  author="Jane Doe"
  role="CTO"
  company="Acme Corp"
  avatar="https://example.com/jane.jpg"
  rating="5"
  variant="card"
></snice-testimonial>

<snice-testimonial
  quote="Outstanding experience from start to finish."
  author="John Smith"
  rating="4"
  variant="featured"
></snice-testimonial>
```
