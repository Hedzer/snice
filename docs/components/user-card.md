[//]: # (AI: For a low-token version of this doc, use docs/ai/components/user-card.md instead)

# User Card Component

`<snice-user-card>`

A profile card that displays a user's avatar, name, role, contact information, social links, and online status. Supports three layout variants for different use cases.

## Basic Usage

```typescript
import 'snice/components/user-card/snice-user-card';
```

```html
<snice-user-card
  name="Sarah Johnson"
  role="Software Engineer"
  company="Acme Corp"
  email="sarah@acme.com"
  status="online"
></snice-user-card>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/user-card/snice-user-card';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-user-card.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the layout style.

```html
<!-- Default card (centered) -->
<snice-user-card variant="card" name="Sarah Johnson" role="Engineer"></snice-user-card>

<!-- Horizontal layout -->
<snice-user-card variant="horizontal" name="Sarah Johnson" role="Engineer"></snice-user-card>

<!-- Compact (for lists) -->
<snice-user-card variant="compact" name="Sarah Johnson" role="Engineer"></snice-user-card>
```

### Status Indicators

Use the `status` attribute to show the user's availability.

```html
<snice-user-card name="Online User" status="online"></snice-user-card>
<snice-user-card name="Away User" status="away"></snice-user-card>
<snice-user-card name="Busy User" status="busy"></snice-user-card>
<snice-user-card name="Offline User" status="offline"></snice-user-card>
```

### With Avatar

Use the `avatar` attribute to display a profile image. Falls back to initials when no image is provided or the image fails to load.

```html
<snice-user-card
  name="Sarah Johnson"
  avatar="https://example.com/avatar.jpg"
  role="Engineer"
></snice-user-card>
```

### Contact Information

Use the `email`, `phone`, and `location` attributes to display contact details.

```html
<snice-user-card
  name="Sarah Johnson"
  email="sarah@example.com"
  phone="+1 555-0123"
  location="San Francisco, CA"
></snice-user-card>
```

### Social Links

Set the `social` property (array) to display social media icons.

```html
<snice-user-card name="Sarah Johnson" id="my-card"></snice-user-card>

<script>
  document.getElementById('my-card').social = [
    { platform: 'github', url: 'https://github.com/sarah' },
    { platform: 'twitter', url: 'https://twitter.com/sarah' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/sarah' },
    { platform: 'website', url: 'https://sarah.dev' }
  ];
</script>
```

Supported platform icons: `github`, `twitter`/`x`, `linkedin`, `facebook`, `instagram`, `youtube`, `website`/`web`. Unknown platforms show a generic link icon.

### With Action Buttons

Use the default slot to add action buttons.

```html
<snice-user-card name="Sarah Johnson" role="Engineer" variant="horizontal">
  <button>Message</button>
  <button>Follow</button>
</snice-user-card>
```

### Team List (Compact)

```html
<div style="display: flex; flex-direction: column; gap: 0.5rem;">
  <snice-user-card variant="compact" name="Alice" role="Frontend" status="online"></snice-user-card>
  <snice-user-card variant="compact" name="Bob" role="Backend" status="away"></snice-user-card>
  <snice-user-card variant="compact" name="Charlie" role="DevOps" status="offline"></snice-user-card>
</div>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Action buttons or additional content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | User's display name |
| `avatar` | `string` | `''` | URL for avatar image |
| `role` | `string` | `''` | User's role or job title |
| `company` | `string` | `''` | User's company name |
| `email` | `string` | `''` | Email address (displayed as mailto link) |
| `phone` | `string` | `''` | Phone number (displayed as tel link) |
| `location` | `string` | `''` | Location text |
| `social` | `SocialLink[]` | `[]` | Array of `{ platform, url }` objects. Set via JS property. |
| `status` | `'online' \| 'away' \| 'offline' \| 'busy'` | `'offline'` | Online status indicator |
| `variant` | `'card' \| 'horizontal' \| 'compact'` | `'card'` | Layout variant |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `social-click` | `{ platform: string, url: string }` | Fired when a social link icon is clicked |
| `action-click` | `{ action: string }` | Fired programmatically via `emitActionClick()` |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `emitActionClick()` | `action: string` | Dispatches an `action-click` event |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer card container |
| `avatar` | Avatar wrapper element |
| `status` | Status indicator dot |
| `name` | Name heading |
| `role` | Role/company paragraph |
| `contact` | Contact info container |
| `social` | Social links row |
| `actions` | Action buttons wrapper |

## Accessibility

- Avatar fallback uses initials derived from the name
- Status indicator has `role="img"` and `aria-label` with the status value
- Social link buttons have `aria-label` and `title` with the platform name
- Contact email and phone are rendered as accessible links

## Best Practices

1. Always provide a `name` - it drives the initials fallback and accessibility
2. Use `compact` variant in lists or sidebars
3. Use `horizontal` variant for detail views or wider layouts
4. Set `social` via JavaScript property (it is an array, not an HTML attribute)
5. Prefer using `<snice-button>` elements in the action slot for consistency
