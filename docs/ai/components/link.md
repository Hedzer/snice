# snice-link

Hyperlink component with variants, external link handling, and hash routing.

## Properties

```ts
href: string = '';              // accepted URL, or no internal href when rejected
target: '_self'|'_blank'|'_parent'|'_top' = '_self';
variant: 'default'|'primary'|'secondary'|'muted' = 'default';
disabled: boolean = false;
external: boolean = false;   // auto _blank + noopener noreferrer + arrow icon
underline: boolean = false;
hash: boolean = false;        // auto-prepend # to href
```

## Events

- `click` → native `MouseEvent` (default prevented when disabled or `href` is rejected)
- `navigate` → `{ href: string }` (accepted hash links only, cancelable)

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

## URL Safety

- Uses core `isSafeUrl()`; there is no component-local scheme list.
- Accepts relative/root/hash/query references, HTTP(S) network paths, `http:`,
  `https:`, `mailto:`, and `tel:`.
- Rejects script/data/file/FTP/custom schemes, malformed URLs, raw ASCII
  controls, whitespace-only values, and non-string runtime values.
- Trims accepted values. Exact `''` retains the legacy `#` fallback.
- `hash` validates first, then prefixes `#`.
- Rejected values remove the internal anchor's `href`, prevent click default,
  emit no `navigate` event, and render with muted non-link styling.

## Accessibility

- Accepted values remain a native `<a>` with normal focus, Enter activation,
  context-menu/copy behavior, target/rel behavior, and slotted accessible name.
- Rejected values have no link semantics or executable/copyable destination.
- `external` sets `target="_blank"` and `rel="noopener noreferrer"`.
- `disabled` prevents pointer activation and uses disabled styling.
