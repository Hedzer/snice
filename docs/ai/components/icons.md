# Icons

Snice embeds a small set of Heroicons (MIT © Tailwind Labs) as defaults. Consumers override any default by slotting their own icon (Font Awesome, Material Symbols, Lucide, custom SVG, etc.).

## Override precedence (lowest → highest)

1. Built-in snice default (Heroicon glyph matching the component's semantic context)
2. `icon` property: string via `renderIcon()`, resolved in order:
   `img://` / `text://` override → URL or path (`https://`, `/`, `./`, `../`, `data:`) →
   image filename with optional query (`logo.svg?v=2`) → built-in catalogue name (inline SVG) → text (emoji, ligature)
3. `<slot name="icon">` override: wins over both

## Override examples

```html
<!-- default -->
<snice-alert variant="info">Hello</snice-alert>

<!-- emoji via prop -->
<snice-alert variant="info" icon="🎉">Launch</snice-alert>

<!-- Font Awesome -->
<snice-alert variant="info">
  <i slot="icon" class="fa-solid fa-circle-info"></i>Hello
</snice-alert>

<!-- Material Symbols -->
<snice-alert variant="info">
  <span slot="icon" class="material-symbols-outlined">info</span>Hello
</snice-alert>

<!-- suppress entirely -->
<snice-alert variant="info" icon="none">Hello</snice-alert>
```

## Components with built-in defaults

- Variant status icon: `<snice-alert>`, `<snice-banner>`; `<snice-timeline>` marker (per item variant)
- Placeholder: `<snice-image>` (no `src`), `<snice-cell-image>` (table)
- `<snice-approval-flow>` step status (pending/approved/rejected/skipped)
- Trend indicator: `<snice-kpi>`, `<snice-cell-percentage>` (table)
- `<snice-cell-json>` expand/collapse chevron; `<snice-header>` sort direction (both table)
- Close button: `<snice-modal>`, `<snice-drawer>`, `<snice-toast>`
- `<snice-data-card>` Edit/Done button

## Importing built-in glyphs directly

```ts
import { CHECK_CIRCLE_SOLID, X_MARK, CHEVRON_RIGHT } from 'snice/components/icons';
```

Full catalogue: see `components/icons/index.ts`. ~20 Heroicons, solid + outline styles.

## License

Heroicons MIT © Tailwind Labs. Attribution in snice's license page.
