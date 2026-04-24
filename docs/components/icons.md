<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/icons.md -->

# Icons

Snice ships a small set of **default SVG icons** used by components as fallbacks — status glyphs in `<snice-alert>` / `<snice-banner>` / `<snice-timeline>`, chevrons in tables and menus, the `×` in modal / drawer / toast close buttons, and so on.

These defaults are sourced from **[Heroicons](https://heroicons.com)** (MIT © Tailwind Labs) and embedded into snice source so there's no runtime dependency. Consumers can override with any icon library they prefer — Font Awesome, Material Symbols, Lucide, Phosphor, custom SVG — without touching the default set.

## The three override points (precedence low → high)

Every component that shows an icon looks for the icon in this order:

1. **Snice default** — a Heroicons glyph chosen to match the component's semantic context (info-circle for `variant="info"`, check-circle for success, etc.). Rendered only when neither of the overrides below is present.
2. **`icon` property** — a string. Components pipe it through `renderIcon()` which detects whether it's a URL, data-URL, emoji, or plain text and renders accordingly.
3. **`<slot name="icon">`** — consumer-provided element. Wins over both the prop and the default.

## Examples

Same component, four icon sources:

```html
<!-- Snice default (built-in Heroicons) -->
<snice-alert variant="info">Hello</snice-alert>

<!-- icon prop: emoji -->
<snice-alert variant="info" icon="🎉">Launch</snice-alert>

<!-- icon prop: URL / data-URL -->
<snice-alert variant="info" icon="/icons/rocket.svg">Deploy</snice-alert>

<!-- Slot: Font Awesome -->
<snice-alert variant="info">
  <i slot="icon" class="fa-solid fa-circle-info"></i>
  Heads up
</snice-alert>

<!-- Slot: Material Symbols -->
<snice-alert variant="info">
  <span slot="icon" class="material-symbols-outlined">info</span>
  Heads up
</snice-alert>

<!-- Slot: Inline SVG -->
<snice-alert variant="info">
  <svg slot="icon" viewBox="0 0 24 24">
    <path d="..."/>
  </svg>
  Heads up
</snice-alert>

<!-- Suppress entirely -->
<snice-alert variant="info" icon="none">Hello</snice-alert>
```

## Built-in icon catalogue

These are the Heroicon glyphs currently embedded in `components/icons/index.ts`. They're internal (not a public export of the library API), but consumers who want to reuse one for visual consistency can import it directly:

```ts
import { CHECK_CIRCLE_SOLID } from 'snice/components/icons';

someEl.innerHTML = CHECK_CIRCLE_SOLID;
```

| Name | Style | Used by |
|------|-------|---------|
| `INFO_CIRCLE_SOLID` | filled | alert/banner/timeline `info` variant |
| `CHECK_CIRCLE_SOLID` | filled | alert/banner/timeline `success` variant |
| `EXCLAMATION_TRIANGLE_SOLID` | filled | alert/banner/timeline `warning` variant |
| `X_CIRCLE_SOLID` | filled | alert/banner/timeline `error` variant |
| `CIRCLE_SOLID` | filled | timeline `default` marker |
| `CHECK` | stroke | approval-flow approved, data-card "Done" state |
| `X_MARK` | stroke | approval-flow rejected, modal/drawer/toast close button |
| `CHEVRON_UP` | stroke | table sort (ascending) |
| `CHEVRON_DOWN` | stroke | table sort (descending), json-cell collapse |
| `CHEVRON_LEFT` | stroke | navigational |
| `CHEVRON_RIGHT` | stroke | approval-flow skipped, json-cell expand |
| `MAGNIFYING_GLASS` | stroke | search inputs |
| `BARS_3` | stroke | menu triggers |
| `PHOTO` | stroke | image / table-image placeholder |
| `ELLIPSIS_HORIZONTAL` | stroke | approval-flow pending, overflow menus |
| `TRASH` | stroke | delete actions |
| `PLUS` | stroke | add actions |
| `PENCIL` | stroke | data-card "Edit" state, inline edit triggers |
| `CAMERA` | stroke | camera-capture components |
| `ARROW_UP` / `ARROW_DOWN` / `ARROW_RIGHT` | stroke | directional indicators |
| `ARROW_TRENDING_UP` / `ARROW_TRENDING_DOWN` | stroke | kpi, cell-percentage trends |
| `STAR_SOLID` / `STAR_OUTLINE` | filled / stroke | rating scales (available for consumers) |

## Why Heroicons

- **License**: MIT — safe to embed directly in snice source with attribution.
- **Visual consistency**: one family across chrome (outline / stroke) and status (solid / filled) — no mix-and-match between vendors.
- **Small surface**: snice only needs ~20 glyphs; copying them avoids shipping 600+ as a package dep.
- **Recognizable**: Heroicons is the canonical Tailwind icon set; consumers already expect its aesthetic.

## License

Heroicons is © Tailwind Labs and released under the [MIT License](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE). Credit is acknowledged on the [snice license page](/license.html).

## If you need an icon snice doesn't ship

Snice components that render a built-in default always expose a `<slot name="icon">` (and often an `icon` property) so you can override without forking the library. Use whatever icon set you already have — snice stays out of your way.
