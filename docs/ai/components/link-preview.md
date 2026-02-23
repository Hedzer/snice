# snice-link-preview

Rich URL preview card with image, title, description, and site info.

## Properties

```typescript
url: string = '';
title: string = '';
description: string = '';
image: string = '';
siteName: string = '';  // attr: site-name
favicon: string = '';
variant: 'vertical'|'horizontal' = 'vertical';
size: 'small'|'medium'|'large' = 'medium';
```

## Events

- `@snice/link-click` → `{ url: string }`

## Usage

```html
<!-- Vertical (default) -->
<snice-link-preview
  url="https://example.com"
  title="Article Title"
  description="Brief summary."
  image="/images/og.jpg"
  site-name="example.com"
  favicon="/icons/favicon.ico">
</snice-link-preview>

<!-- Horizontal, small -->
<snice-link-preview variant="horizontal" size="small"
  url="https://example.com" title="Quick Link" description="Short.">
</snice-link-preview>
```

## Features

- Vertical (image top) and horizontal (image left) layouts
- 3 sizes: small, medium, large
- Placeholder icon when no image
- Title clamped to 2 lines, description to 3
- Domain extracted from URL
- Click opens URL in new tab (noopener, noreferrer)
- Keyboard accessible (Enter/Space)
