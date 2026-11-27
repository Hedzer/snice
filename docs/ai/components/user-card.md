# snice-user-card

Profile card with avatar, contact info, social links, and status indicator.

## Properties

```typescript
name: string = '';
avatar: string = '';
role: string = '';
company: string = '';
email: string = '';
phone: string = '';
location: string = '';
social: SocialLink[] = [];  // { platform: string, url: string }
status: 'online'|'away'|'offline'|'busy' = 'offline';
variant: 'card'|'horizontal'|'compact' = 'card';
```

## Methods

- `emitActionClick(action: string)` - Dispatch action-click event programmatically

## Events

- `social-click` -> `{ platform: string, url: string }`
- `action-click` -> `{ action: string }`

## Slots

- `(default)` - Action buttons (e.g. Follow, Message)

## CSS Parts

- `base` - Outer container
- `avatar` - Avatar wrapper
- `status` - Status indicator dot
- `name` - Name heading
- `role` - Role/company text
- `contact` - Contact info section
- `social` - Social links row
- `actions` - Actions slot wrapper
- `avatar-image` - Avatar `<img>` when `avatar` is set
- `avatar-fallback` - Initials shown when there is no avatar image
- `content` - Info column beside the avatar
- `contact-item` - A single contact row
- `contact-item-email` - Added to `contact-item` on the email row
- `contact-item-phone` - Added to `contact-item` on the phone row
- `contact-item-location` - Added to `contact-item` on the location row
- `contact-icon` - Icon inside a contact row
- `contact-icon-email` - Added to `contact-icon` on the email row
- `contact-icon-phone` - Added to `contact-icon` on the phone row
- `contact-icon-location` - Added to `contact-icon` on the location row
- `contact-link` - Anchor inside a contact row
- `contact-link-email` - Added to `contact-link` on the email row
- `contact-link-phone` - Added to `contact-link` on the phone row
- `contact-text` - Non-link contact text (location)
- `social-link` - A social platform button
- `social-icon` - SVG glyph inside a social button

## Basic Usage

```html
<snice-user-card
  name="Sarah Johnson"
  role="Engineer"
  company="Acme Corp"
  email="sarah@acme.com"
  phone="+1 555-0123"
  location="San Francisco, CA"
  status="online"
></snice-user-card>

<snice-user-card variant="horizontal" name="Alex" role="CTO" status="online">
  <button>Message</button>
</snice-user-card>

<snice-user-card variant="compact" name="Lisa" role="Dev" status="away"></snice-user-card>
```

```javascript
card.social = [
  { platform: 'github', url: 'https://github.com/user' },
  { platform: 'twitter', url: 'https://twitter.com/user' },
  { platform: 'linkedin', url: 'https://linkedin.com/in/user' }
];
```

## Accessibility

- Avatar fallback uses initials from name
- Status indicator has `role="img"` and `aria-label`
- Social links have `aria-label` and `title`
- Email/phone rendered as accessible links
