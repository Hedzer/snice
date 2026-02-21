# snice-link-preview

Social media-style link preview card. Purely visual -- all data passed via properties.

## Properties

```typescript
url: string = '';
title: string = '';
description: string = '';
image: string = '';                              // image URL
siteName: string = '';                           // attribute: site-name
favicon: string = '';                            // small icon URL
variant: 'horizontal' | 'vertical' = 'vertical';
size: 'small' | 'medium' | 'large' = 'medium';
```

## Events

```typescript
'@snice/link-click': CustomEvent<{ url: string }>  // emitted on click
```

## Usage

```html
<!-- Vertical (default) -->
<snice-link-preview
  title="Article Title"
  description="A brief summary of the article content."
  image="https://example.com/og-image.jpg"
  site-name="example.com"
  favicon="https://example.com/favicon.ico"
  url="https://example.com/article"
></snice-link-preview>

<!-- Horizontal, small -->
<snice-link-preview
  variant="horizontal"
  size="small"
  title="Quick Link"
  description="Short description"
  site-name="example.com"
  url="https://example.com"
></snice-link-preview>
```

## Features

- Vertical (image top) and horizontal (image left) layouts
- 3 sizes: small, medium, large
- Image with fallback placeholder
- Title truncation (2 lines), description truncation (3 lines)
- Domain extraction from URL
- Favicon + site name footer
- Hover shadow effect
- Click opens URL in new tab
- Accessible: role="article", keyboard navigable
