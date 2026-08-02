# snice-link-preview

Rich URL preview card with image, title, description, and site info.

## Properties

```ts
url: string = '';
title: string = '';    // JS-only; a title attribute is the native tooltip, not this
description: string = '';
image: string = '';
siteName: string = '';  // attr: site-name
favicon: string = '';
variant: 'vertical'|'horizontal' = 'vertical';
size: 'small'|'medium'|'large' = 'medium';
```

## Events

- `link-click` → `{ url: string }`

## CSS Parts

- `base` - Outer preview card container
- `content` - Text content area (title, description, footer)
- `title` - Title text element

## Basic Usage

```typescript
import 'snice/components/link-preview/snice-link-preview';
```

```html
<!-- Vertical (default) -->
<snice-link-preview
  id="preview"
  url="https://example.com"
  description="Brief summary."
  image="/images/og.jpg"
  site-name="example.com"
  favicon="/icons/favicon.ico">
</snice-link-preview>
<script>document.getElementById('preview').title = 'Article Title';</script>

<!-- Horizontal, small -->
<snice-link-preview variant="horizontal" size="small"
  url="https://example.com" description="Short.">
</snice-link-preview>
```
