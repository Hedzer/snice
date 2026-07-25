# Styling

Human reference: `docs/styling.md`

Scoped CSS, host styling, dynamic styles, and icons. Theme tokens: [theme.md](theme.md).

## @styles()

Returns CSS via `css` tagged template, scoped to the element's shadow DOM.

```typescript
@element('styled-card')
class StyledCard extends HTMLElement {
  @render()
  renderContent() {
    return html`<div class="card">Content</div>`;
  }

  @styles()
  cardStyles() {
    return css`
      .card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    `;
  }
}
```

**Note:** Only one `@styles()` method is supported per element. If multiple are declared, only the last one is used. Combine all styles in a single method.

## Scoped styles

Styles are automatically scoped to the component's shadow DOM — e.g. a rule like `h1 { color: blue; }` only affects `<h1>` inside this component, not the rest of the page.

## Dynamic styles

`@styles()` is called **once** during initialization and does not update on property changes. For dynamic styling, use CSS custom properties set in the template:

```typescript
@element('theme-component')
class ThemeComponent extends HTMLElement {
  @property() accentColor = '#007bff';

  @render()
  renderContent() {
    return html`<div class="themed" style="--accent: ${this.accentColor}">Themed content</div>`;
  }

  @styles()
  themeStyles() {
    return css`.themed { color: var(--accent); }`;
  }
}
```

## Host styling

```typescript
@styles()
hostStyles() {
  return css`
    :host { display: block; width: 100%; max-width: 600px; margin: 0 auto; }
    :host([disabled]) { opacity: 0.5; pointer-events: none; }
    :host(:hover) { background: #f0f0f0; }
  `;
}
```

## Icons

Many Snice components accept an `icon` property (or `prefix-icon` / `suffix-icon` for inputs). The icon value is auto-detected:

| Value | Rendered As |
|-------|-------------|
| `"search"`, `"check_circle"` | Ligature icon with icon font |
| `"🔍"`, `"$"` | Text/emoji as-is |
| `"https://example.com/icon.svg"` | `<img>` element |
| `"logo.png"`, `"icon.svg"` | `<img>` element |
| `"img://url"` | Explicit `<img>` |
| `"text://content"` | Explicit `<span>` |

### Changing the icon font

By default, ligature icons (lowercase words like `search`, `home`, `check_circle`) use **Material Symbols Outlined**. To use a different icon font like Font Awesome, set the `--snice-icon-font` CSS custom property:

```css
:root {
  --snice-icon-font: 'Font Awesome 6 Free';
}
```

Load the corresponding font in your HTML:

```html
<!-- Material Symbols (default) -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap">

<!-- Or Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
```

### Icon slots

For full control over icon rendering (e.g., using a specific icon library class), use named slots instead of the `icon` attribute:

```html
<snice-input label="Search">
  <span slot="prefix-icon" class="fa-solid fa-magnifying-glass"></span>
</snice-input>

<snice-button>
  <svg slot="icon" viewBox="0 0 24 24">...</svg>
  Submit
</snice-button>
```
