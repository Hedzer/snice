# snice-layout

Application layout with header navigation, main content area, and footer.

## Methods

- `update(appContext, placards, currentRoute, routeParams)` - Update layout navigation from router state

## Slots

- `brand` - Logo/brand in header
- `page` - Main page content
- `footer` - Footer content

## CSS Parts

- `scrim` - Overlay backdrop for the mobile sidebar
- `prose` - Measured article column (docs shell)
- `form` - Form column (auth-split shell)
- `base` - Outer layout container div
- `header` - Header element with navigation
- `brand` - Brand/logo area within header
- `main` - Main content area
- `footer` - Footer element

## Basic Usage

```typescript
import 'snice/components/layout/snice-layout';
```

```html
<snice-layout>
  <div slot="brand"><h1>My App</h1></div>
  <div slot="page">Page content</div>
  <div slot="footer"><p>&copy; 2025 My Company</p></div>
</snice-layout>
```

## Examples

```html
<!-- Router integration -->
<snice-layout id="app-layout">
  <img slot="brand" src="/logo.svg" alt="Logo" />
  <div slot="page"></div>
</snice-layout>
```

```typescript
layout.update(appContext, placards, currentRoute, routeParams);
```

## Shell variants

Siblings of `snice-layout` for the other standard page shapes. All regions are slots; all still take router `update()`.

- `snice-layout` — stacked: `brand`, `page`, `footer`
- `snice-layout-sidebar` — app shell: `brand`, `header`, `sidebar`, `page`, `footer`
- `snice-layout-dashboard` — app shell + toolbar + right rail: `brand`, `header`, `toolbar`, `sidebar`, `page`, `right-sidebar`
- `snice-layout-blog` — article measure: `brand`, `nav`, `page`, `sidebar`, `footer`
- `snice-layout-centered` — auth card: `brand`, `page`, `footer`
- `snice-layout-split` — two panes: `left`, `right` (`direction`, `ratio`)
- `snice-layout-landing` — marketing bands: `brand`, `nav`, `cta`, `hero`, `page`, `footer` (`use-nav`)
- `snice-layout-card` — card grid: `header`, `page`, `footer` (`columns`, `gap`)
- `snice-layout-minimal` — `page` only
- `snice-layout-fullscreen` — layers: `background`, `overlay`, `page`, `controls` (`overlay`)
- `snice-layout-master-detail` — list + detail: `brand`, `header`, `list`, `detail`, `empty` (`selected`); <641px single pane, back emits `detail-closed`
- `snice-layout-docs` — three panes: `brand`, `header`, `sidebar`, `page`, `toc`, `footer`; rail drops at 1152px, tree → drawer at 996px; skip link + heading scroll-margin
- `snice-layout-auth-split` — form + decorative panel: `brand`, `page`, `footer`, `panel` (`panel-position`: `end` default | `start`); panel hidden <768px

## Sidebar shells

Sidebar is in-flow on desktop (main reflows on collapse); below 768px it overlays behind a scrim that closes on click/Escape. Content is never hidden.

- `collapsed` — boolean, reflected → `[collapsed]` is styleable
- `collapse-mode` — `rail` (default, icon column) | `offcanvas` (hidden) | `none` (pinned, no toggle)
- `Ctrl`/`Cmd`+`B` toggles

```html
<snice-layout-sidebar collapse-mode="rail">
  <div slot="brand">Acme</div>
  <a slot="sidebar" href="/dashboard"><span class="icon">▦</span><span class="label">Dashboard</span></a>
  <div slot="page">Page content</div>
</snice-layout-sidebar>
```

```css
snice-layout-sidebar[collapsed] .label { display: none; }
```

Directly slotted links get hover/focus/current styling; nested markup is styled by its owner. No slotted content → placard-driven nav.

## The layout is the frame

Layouts own the screen. App shells (`sidebar`, `dashboard`, `fullscreen`) are `position: fixed; inset: 0` — body margin/ancestor padding cannot inset them; chrome is pinned, content region scrolls. Content shells use `100dvh` (with `100vh` fallback) and let the page scroll.

`contained` on any shell → sizes to parent instead (docs demos, showcase cards, preview panes).

```html
<snice-layout-sidebar>…</snice-layout-sidebar>                  <!-- is the page -->
<div style="height:340px"><snice-layout-sidebar contained>…</snice-layout-sidebar></div>  <!-- embedded -->
```

## Sizing hooks

- `--snice-layout-sidebar-width` (`16rem`), `--snice-layout-rail-collapsed-width` (`3rem`)
- `--snice-layout-rail-width` (`18rem`), `--snice-layout-measure` (`65ch`), `--snice-layout-container` (`80rem`)
- `--snice-layout-list-width` (`20rem`), `--snice-layout-docs-nav-width` / `--snice-layout-docs-toc-width` (`18.75rem`), `--snice-layout-auth-width` (`24rem`)
