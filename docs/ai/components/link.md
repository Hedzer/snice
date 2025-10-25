# snice-link

Link component with variants and external link handling.

## Properties

```typescript
href: string = ''                      // Link URL
target: LinkTarget = '_self'           // '_self' | '_blank' | '_parent' | '_top'
variant: LinkVariant = 'default'       // 'default' | 'primary' | 'secondary' | 'muted'
disabled: boolean = false              // Disable link
external: boolean = false              // Auto _blank + noopener
underline: boolean = false             // Show underline
hash: boolean = false                  // Auto prepend # to href (for hash routing)
```

## Events

```typescript
@dispatch('click')     // Emitted on click (prevented if disabled)
@dispatch('navigate')  // Emitted on hash link click (for router integration)
                       // detail: { href: string }
                       // cancelable: true
```

## Usage

```html
<!-- Basic -->
<snice-link href="/page">Link text</snice-link>

<!-- External -->
<snice-link href="https://example.com" external>External</snice-link>

<!-- Variants -->
<snice-link href="/page" variant="primary">Primary</snice-link>
<snice-link href="/page" variant="secondary">Secondary</snice-link>
<snice-link href="/page" variant="muted">Muted</snice-link>

<!-- Underlined -->
<snice-link href="/page" underline>Underlined link</snice-link>

<!-- Disabled -->
<snice-link href="/page" disabled>Disabled</snice-link>

<!-- Hash links (for routing) -->
<snice-link href="home" hash>Home</snice-link>
<snice-link href="about" hash>About</snice-link>
<!-- Renders as: <a href="#home">Home</a> -->

<!-- Router integration -->
<snice-link href="profile" hash @navigate="${handleNavigate}">Profile</snice-link>
<script>
  function handleNavigate(e) {
    console.log('Navigate to:', e.detail.href);
    // e.preventDefault() in the handler will cancel navigation
  }
</script>
```

## CSS Parts

```css
::part(link)          /* Anchor element */
::part(external-icon) /* External icon */
```

## Styling

```css
--snice-color-primary
--snice-color-primary-dark
--snice-color-text-secondary
--snice-color-text
--snice-color-text-muted
--snice-color-text-disabled
```
