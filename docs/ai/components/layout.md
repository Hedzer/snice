# snice-layout

Application layout with header navigation, main content area, and footer.

## Methods

- `update(appContext, placards, currentRoute, routeParams)` - Update layout navigation from router state

## Slots

- `brand` - Logo/brand in header
- `page` - Main page content
- `footer` - Footer content

## CSS Parts

Shared across the shells that render the region:

- `base` - Outer layout container div
- `header` - Header element with navigation
- `header-content` - Slotted header content column
- `brand` - Brand/logo area within header
- `nav-area` - Header nav region (blog, landing)
- `nav` - The internal `<snice-nav>` element
- `body` - Row holding sidebar, main and rails
- `main` - Main content area
- `content` - Content column inside the body
- `container` - Centered width-limited band (blog, landing)
- `footer` - Footer element
- `sidebar` - Navigation column (sidebar, dashboard, docs, blog)
- `sidebar-toggle` - Header button that opens/collapses the sidebar
- `sidebar-toggle-icon` - Glyph inside `sidebar-toggle`
- `scrim` - Overlay backdrop for the mobile sidebar
- `toolbar` - Strip below the header (dashboard)
- `breadcrumbs` - The internal `<snice-breadcrumbs>` in the toolbar (dashboard)
- `right-sidebar` - Secondary rail beside main (dashboard)
- `prose` - Measured article column (docs shell)
- `toc` - On-this-page rail (docs shell)
- `skip-link` - Skip-to-content link (docs shell)
- `brand-fallback` - Default brand text inside `brand` (stacked, sidebar, dashboard, docs, blog, landing)
- `article` - Article column (blog shell)
- `hero` - Hero band (landing shell)
- `cta` - Header call-to-action slot (landing shell)
- `stack` - Vertical stack (centered shell)
- `grid` - Card grid (card shell)
- `background` - Background layer (fullscreen shell)
- `overlay` - Overlay layer (fullscreen shell)
- `controls` - Controls layer (fullscreen shell)
- `pane` - A master-detail pane
- `list` - List pane (master-detail shell)
- `detail` - Detail pane (master-detail shell)
- `empty` - Empty state until a detail is slotted (master-detail shell)
- `back-button` - Narrow-viewport back button (master-detail shell)
- `back-icon` - Glyph inside `back-button`
- `panel` - Split panel / decorative brand panel (split, auth-split shells)
- `panel-left` - Added to the left `panel` (split shell)
- `panel-right` - Added to the right `panel` (split shell)
- `divider` - Divider between split panels
- `form` - Form column (auth-split shell)
- `form-inner` - Inner column inside `form` (auth-split shell)
- `page` - Form content wrapper (auth-split shell)
- `header-container` - Added to the header `container` (blog, landing)
- `main-container` - Added to the main `container` (blog)
- `footer-container` - Added to the footer `container` (blog, landing)

State tokens:

- `base-mobile` - Added to `base` at mobile widths (sidebar, dashboard)
- `base-railed-stacked` - Added to `base` when the dashboard rail stacks
- `header-empty` - Added to `header` while nothing is slotted (card shell)
- `footer-empty` - Added to `footer` while nothing is slotted
- `brand-empty` - Added to `brand` while nothing is slotted (centered shell)
- `sidebar-empty` - Added to `sidebar` while nothing is slotted (blog shell)
- `sidebar-open` - Added to `sidebar` while open (docs shell)
- `sidebar-rail` - Added to `sidebar` in rail collapse mode
- `sidebar-collapsed` - Added to `sidebar` while collapsed
- `sidebar-mobile-open` - Added to `sidebar` while open on mobile
- `scrim-visible` - Added to `scrim` while the mobile sidebar is open
- `toolbar-hidden` - Added to `toolbar` while it has nothing to show
- `right-sidebar-empty` - Added to `right-sidebar` while no rail is slotted
- `content-railed` - Added to `content` while a right rail is present
- `content-with-sidebar` - Added to `content` while a blog sidebar is slotted
- `toc-empty` - Added to `toc` while nothing is slotted
- `list-hidden` - Added to `list` while the narrow shell shows the detail
- `detail-hidden` - Added to `detail` while the narrow shell shows the list

Forwarded from the internal `<snice-nav>` via `exportparts`:

- `nav-base` - Exported `base` of the nav
- `nav-nav` - Exported `nav` of the nav
- `nav-group` - Exported `group` of the nav
- `nav-group-label` - Exported `group-label` of the nav
- `nav-submenu` - Exported `submenu` of the nav
- `nav-item` - Exported `item` of the nav
- `nav-link` - Exported `link` of the nav
- `nav-icon` - Exported `icon` of the nav
- `nav-label` - Exported `label` of the nav
- `nav-item-active` - Exported `item-active` of the nav
- `nav-group-active` - Exported `group-active` of the nav
- `nav-link-active` - Exported `link-active` of the nav

Forwarded from the dashboard's `<snice-breadcrumbs>` via `exportparts`:

- `breadcrumbs-base` - Exported `base` of the breadcrumbs
- `breadcrumbs-list` - Exported `list` of the breadcrumbs
- `breadcrumbs-item` - Exported `item` of the breadcrumbs
- `breadcrumbs-link` - Exported `link` of the breadcrumbs
- `breadcrumbs-text` - Exported `text` of the breadcrumbs
- `breadcrumbs-separator` - Exported `separator` of the breadcrumbs
- `breadcrumbs-ellipsis` - Exported `ellipsis` of the breadcrumbs
- `breadcrumbs-ellipsis-icon` - Exported `ellipsis-icon` of the breadcrumbs
- `breadcrumbs-list-collapsed` - Exported `list-collapsed` of the breadcrumbs
- `breadcrumbs-item-active` - Exported `item-active` of the breadcrumbs
- `breadcrumbs-item-hidden` - Exported `item-hidden` of the breadcrumbs
- `breadcrumbs-item-overflow` - Exported `item-overflow` of the breadcrumbs
- `breadcrumbs-text-current` - Exported `text-current` of the breadcrumbs

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
- `snice-layout-centered` — auth card: `brand`, `page`, `footer` (`width`: `sm`|`md`|`lg`|`xl`, default `md`)
- `snice-layout-split` — two panes: `left`, `right` (`direction`: `horizontal` default|`vertical`; `ratio`: `50-50` default|`60-40`|`70-30`|`33-67`|`67-33`)
- `snice-layout-landing` — marketing bands: `brand`, `nav`, `cta`, `hero`, `page`, `footer` (`use-nav` boolean, default false)
- `snice-layout-card` — card grid: `header`, `page`, `footer` (`columns`: `1`|`2`|`3` default|`4`|`6`; `gap`: `sm`|`md` default|`lg`|`xl`)
- `snice-layout-minimal` — `page` only
- `snice-layout-fullscreen` — layers: `background`, `overlay`, `page`, `controls` (`overlay` boolean, default false)
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

## CSS Custom Properties

- `--snice-layout-sidebar-width` (`16rem`), `--snice-layout-rail-collapsed-width` (`3rem`)
- `--snice-layout-rail-width` (`18rem`), `--snice-layout-measure` (`65ch`), `--snice-layout-container` (`80rem`)
- `--snice-layout-list-width` (`20rem`), `--snice-layout-docs-nav-width` / `--snice-layout-docs-toc-width` (`18.75rem`), `--snice-layout-auth-width` (`24rem`)
- `--snice-layout-docs-header-height` (`4rem`), `--snice-layout-docs-header-height-compact` (`3.5rem`) — docs sticky header, compact below 768px
- `--snice-layout-auth-panel-bg` (`var(--snice-color-surface-container)`) — auth split panel
- `--snice-layout-control-size` (`2rem`) — sidebar / drawer toggle buttons
