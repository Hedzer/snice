# snice-link

Hyperlink component with variants, external link handling, and hash routing.

## Properties

```ts
href: string = '';
target: '_self'|'_blank'|'_parent'|'_top' = '_self';
variant: 'default'|'primary'|'secondary'|'muted' = 'default';
disabled: boolean = false;
external: boolean = false;   // auto _blank + noopener noreferrer + arrow icon
underline: boolean = false;
hash: boolean = false;        // auto-prepend # to href
```

## Events

- `click` → `MouseEvent` (prevented when disabled)
- `navigate` → `{ href: string }` (hash links only, cancelable)

## Slots

- `(default)` - Link text content

## CSS Parts

- `link` - Anchor element
- `external-icon` - External arrow icon

## Basic Usage

```typescript
import 'snice/components/link/snice-link';
```

```html
<snice-link href="/about">About</snice-link>

<!-- Variants -->
<snice-link href="/page" variant="primary">Primary</snice-link>
<snice-link href="/page" variant="secondary">Secondary</snice-link>
<snice-link href="/page" variant="muted">Muted</snice-link>

<!-- External (auto _blank + noopener + arrow icon) -->
<snice-link href="https://example.com" external>External</snice-link>

<!-- Underlined -->
<snice-link href="/docs" underline>Docs</snice-link>

<!-- Disabled -->
<snice-link href="/page" disabled>Disabled</snice-link>

<!-- Hash routing -->
<snice-link href="home" hash>Home</snice-link>
<!-- Renders: <a href="#home">Home</a> -->

<!-- Router integration -->
<snice-link href="profile" hash @navigate="${e => router.go(e.detail.href)}">Profile</snice-link>
```
