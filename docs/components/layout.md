<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/layout.md -->

# Layout
`<snice-layout>`

Application layout with header navigation, main content area, and footer.

## Table of Contents
- [Methods](#methods)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Shell variants](#shell-variants)

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `update()` | `appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams` | Updates navigation from router state |

## Slots

| Name | Description |
|------|-------------|
| `brand` | Logo or brand content in the header |
| `page` | Main page content area |
| `footer` | Footer content |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer layout container |
| `header` | `<header>` | Header element with navigation |
| `header-content` | `<div>` | Slotted header content column |
| `brand` | `<div>` | Brand/logo area within header |
| `nav` | `<snice-nav>` | The internal navigation element |
| `body` | `<div>` | Row holding sidebar, main and rails |
| `main` | `<main>` | Main content area |
| `content` | `<div>` | Content column inside the body |
| `footer` | `<footer>` | Footer element |

Shell variants add parts for their own regions:

| Part | Shells | Description |
|------|--------|-------------|
| `sidebar` | sidebar, dashboard, docs, blog | Navigation column |
| `sidebar-toggle` | sidebar, dashboard, docs | Header button that opens or collapses the sidebar |
| `sidebar-toggle-icon` | sidebar, dashboard, docs | Glyph inside the sidebar toggle |
| `scrim` | sidebar, dashboard, docs | Overlay backdrop shown while the sidebar is open on narrow screens |
| `toolbar` | dashboard | Strip below the header holding breadcrumbs or filters |
| `breadcrumbs` | dashboard | The internal breadcrumbs element inside the toolbar |
| `right-sidebar` | dashboard | Secondary rail beside main |
| `prose` | docs | Measured article column |
| `toc` | docs | On-this-page rail |
| `skip-link` | docs | Skip-to-content link |
| `brand-fallback` | stacked, sidebar, dashboard, docs, blog, landing | Default brand text when nothing is slotted |
| `container` | blog, landing | Centered width-limited band |
| `header-container` | blog, landing | The header's centered band |
| `main-container` | blog | The main region's centered band |
| `footer-container` | blog, landing | The footer's centered band |
| `nav-area` | blog, landing | Header navigation region |
| `article` | blog | Article column |
| `hero` | landing | Hero band |
| `cta` | landing | Header call-to-action slot |
| `stack` | centered | Vertical stack inside the layout |
| `grid` | card | Card grid inside main |
| `background` | fullscreen | Background layer |
| `overlay` | fullscreen | Overlay layer |
| `controls` | fullscreen | Controls layer |
| `pane` | master-detail | Either pane |
| `list` | master-detail | List pane |
| `detail` | master-detail | Detail pane |
| `empty` | master-detail | Empty-state shown until a detail is slotted |
| `back-button` | master-detail | Narrow-viewport back button |
| `back-icon` | master-detail | Glyph inside the back button |
| `panel` | split, auth-split | Split panel / decorative brand panel |
| `panel-left` | split | Added beside `panel` on the left panel |
| `panel-right` | split | Added beside `panel` on the right panel |
| `divider` | split | Divider between the two panels |
| `form` | auth-split | Column holding the sign-in form |
| `form-inner` | auth-split | Inner column inside the form column |
| `page` | auth-split | Form content wrapper |

State tokens are added alongside the base token on the same element, so they can
be targeted with `::part(sidebar sidebar-collapsed)`.

| Part | Added to | Description |
|------|----------|-------------|
| `base-mobile` | `base` | Present at mobile widths (sidebar, dashboard) |
| `base-railed-stacked` | `base` | Present when the dashboard rail stacks |
| `header-empty` | `header` | Present while nothing is slotted into the header (card) |
| `footer-empty` | `footer` | Present while nothing is slotted into the footer |
| `brand-empty` | `brand` | Present while nothing is slotted into the brand (centered) |
| `sidebar-empty` | `sidebar` | Present while nothing is slotted into the sidebar (blog) |
| `sidebar-open` | `sidebar` | Present while the docs sidebar is open |
| `sidebar-rail` | `sidebar` | Present in rail collapse mode |
| `sidebar-collapsed` | `sidebar` | Present while the sidebar is collapsed |
| `sidebar-mobile-open` | `sidebar` | Present while the sidebar is open on mobile |
| `scrim-visible` | `scrim` | Present while the mobile sidebar is open |
| `toolbar-hidden` | `toolbar` | Present while the toolbar has nothing to show |
| `right-sidebar-empty` | `right-sidebar` | Present while no rail content is slotted |
| `content-railed` | `content` | Present while a right rail is shown |
| `content-with-sidebar` | `content` | Present while a blog sidebar is slotted |
| `toc-empty` | `toc` | Present while nothing is slotted into the table of contents |
| `list-hidden` | `list` | Present while the narrow shell shows the detail pane |
| `detail-hidden` | `detail` | Present while the narrow shell shows the list pane |

The internal `<snice-nav>` and the dashboard's `<snice-breadcrumbs>` forward
every one of their own parts with `nav-` and `breadcrumbs-` prefixes.

### Forwarded from the internal nav

| Part | Description |
|------|-------------|
| `nav-base` | The nav's outer content wrapper |
| `nav-nav` | The nav's `<nav>` element |
| `nav-group` | A nav group wrapper |
| `nav-group-label` | A nav group heading |
| `nav-submenu` | A nested list of child links |
| `nav-item` | A nav item wrapper |
| `nav-link` | An individual nav link |
| `nav-icon` | A nav item icon |
| `nav-label` | A nav link label |
| `nav-item-active` | Added to `nav-item` while its route is active |
| `nav-group-active` | Added to `nav-group` while it holds the active route |
| `nav-link-active` | Added to `nav-link` while its route is active |

### Forwarded from the dashboard breadcrumbs

| Part | Description |
|------|-------------|
| `breadcrumbs-base` | The breadcrumbs' `<nav>` container |
| `breadcrumbs-list` | The breadcrumbs' `<ol>` list |
| `breadcrumbs-item` | An individual breadcrumb `<li>` |
| `breadcrumbs-link` | An individual breadcrumb link |
| `breadcrumbs-text` | Non-link breadcrumb text |
| `breadcrumbs-separator` | A breadcrumb separator |
| `breadcrumbs-ellipsis` | The breadcrumbs' collapse ellipsis button |
| `breadcrumbs-ellipsis-icon` | The icon inside the ellipsis button |
| `breadcrumbs-list-collapsed` | Added to `breadcrumbs-list` while items are collapsed |
| `breadcrumbs-item-active` | Added to `breadcrumbs-item` for the active crumb |
| `breadcrumbs-item-hidden` | Added to `breadcrumbs-item` while the crumb is collapsed out of view |
| `breadcrumbs-item-overflow` | Added to `breadcrumbs-item` for the ellipsis list item |
| `breadcrumbs-text-current` | Added to `breadcrumbs-text` on the current-page crumb |

```css
snice-layout::part(header) {
  background: #1a1a2e;
  color: white;
}

snice-layout::part(footer) {
  border-top: 1px solid #e2e2e2;
  padding: 1rem;
}
```

## CSS Custom Properties

| Property | Default | Applies to |
|----------|---------|------------|
| `--snice-layout-sidebar-width` | `16rem` | Expanded sidebar |
| `--snice-layout-rail-collapsed-width` | `3rem` | Collapsed rail |
| `--snice-layout-rail-width` | `18rem` | Dashboard right rail |
| `--snice-layout-measure` | `65ch` | Blog reading measure |
| `--snice-layout-container` | `80rem` | Landing band inner width |
| `--snice-layout-list-width` | `20rem` | Master-detail list pane |
| `--snice-layout-docs-nav-width` | `18.75rem` | Documentation navigation tree |
| `--snice-layout-docs-toc-width` | `18.75rem` | Documentation on-this-page rail |
| `--snice-layout-docs-header-height` | `4rem` | Documentation sticky header |
| `--snice-layout-docs-header-height-compact` | `3.5rem` | Documentation header below 768px |
| `--snice-layout-auth-width` | `24rem` | Auth split form column |
| `--snice-layout-auth-panel-bg` | `var(--snice-color-surface-container)` | Auth split decorative panel |
| `--snice-layout-control-size` | `2rem` | Sidebar and drawer toggle buttons |

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

### Basic Layout

Use slots to fill the brand, page, and footer areas.

```html
<snice-layout>
  <div slot="brand">
    <h1>Dashboard</h1>
  </div>
  <div slot="page">
    <h2>Welcome</h2>
    <p>Main content goes here.</p>
  </div>
  <div slot="footer">
    <p>&copy; 2025 Acme Corp</p>
  </div>
</snice-layout>
```

### With Router Integration

Use the `update()` method to sync navigation with the router.

```html
<snice-layout id="app-layout">
  <img slot="brand" src="/logo.svg" alt="Logo" />
  <div slot="page" id="page-content"></div>
</snice-layout>
```

```typescript
layout.update(appContext, placards, currentRoute, routeParams);
```

## Shell variants

`<snice-layout>` is the stacked shell (header / main / footer). These siblings cover the
other standard page shapes. Every region is a slot, and each shell still receives router
navigation through `update()`.

| Element | Shape | Key slots |
|---------|-------|-----------|
| `<snice-layout>` | Stacked: header, main, footer | `brand`, `page`, `footer` |
| `<snice-layout-sidebar>` | App shell with a persistent left sidebar | `brand`, `header`, `sidebar`, `page`, `footer` |
| `<snice-layout-dashboard>` | App shell plus a toolbar strip and right rail | `brand`, `header`, `toolbar`, `sidebar`, `page`, `right-sidebar` |
| `<snice-layout-blog>` | Article with a centred reading measure | `brand`, `nav`, `page`, `sidebar`, `footer` |
| `<snice-layout-centered>` | Auth card, brand above and links below | `brand`, `page`, `footer` |
| `<snice-layout-split>` | Two panes at a fixed ratio | `left`, `right` |
| `<snice-layout-landing>` | Marketing bands with contained inner content | `brand`, `nav`, `cta`, `hero`, `page`, `footer` |
| `<snice-layout-card>` | Responsive card grid | `header`, `page`, `footer` |
| `<snice-layout-minimal>` | Bare main region | `page` |
| `<snice-layout-master-detail>` | List beside the selected item's detail | `brand`, `header`, `list`, `detail`, `empty` |
| `<snice-layout-docs>` | Navigation tree, prose, on-this-page rail | `brand`, `header`, `sidebar`, `page`, `toc`, `footer` |
| `<snice-layout-auth-split>` | Sign-in form beside a brand panel | `brand`, `page`, `footer`, `panel` |
| `<snice-layout-fullscreen>` | Layered canvas with overlay and controls | `background`, `overlay`, `page`, `controls` |

### Sidebar shells

`<snice-layout-sidebar>` and `<snice-layout-dashboard>` share one sidebar contract.
The sidebar sits in the flow on desktop and main reflows when it collapses. Below
768px it slides over the content behind a scrim, which closes on click or Escape —
content is never hidden outright.

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `collapsed` | boolean | `false` | Collapsed state; reflected, so `[collapsed]` is styleable |
| `collapse-mode` | `rail`, `offcanvas`, `none` | `rail` | `rail` shrinks to an icon column, `offcanvas` hides the sidebar, `none` pins it open and removes the toggle |

`Ctrl`/`Cmd` + `B` toggles the sidebar.

```html
<snice-layout-sidebar collapse-mode="rail">
  <div slot="brand">Acme</div>
  <a slot="sidebar" href="/dashboard"><span class="icon">▦</span><span class="label">Dashboard</span></a>
  <a slot="sidebar" href="/orders"><span class="icon">▤</span><span class="label">Orders</span></a>
  <div slot="page">Page content</div>
</snice-layout-sidebar>
```

```css
/* Hide labels while the rail is collapsed */
snice-layout-sidebar[collapsed] .label { display: none; }
```

Links slotted directly into `sidebar` get hover, focus, and current-page styling.
Wrap them in your own element and that styling becomes yours to write, because a
component cannot reach inside markup it does not own. Slot nothing and the shell
renders its own navigation from placards.

### The layout is the frame

A layout owns the whole screen. App shells (`sidebar`, `dashboard`, `fullscreen`) pin
themselves to the viewport, so body margins or ancestor padding cannot inset them:
their chrome stays put and only the content region scrolls. Content shells fill the
screen with `100dvh` and let the page scroll normally.

Add `contained` when a shell is *not* the page — inside a documentation demo, a
showcase card, or a preview pane. It then sizes to its parent instead.

```html
<!-- The page: owns the screen -->
<snice-layout-sidebar>…</snice-layout-sidebar>

<!-- A demo inside a page: sized by its container -->
<div style="height: 340px">
  <snice-layout-sidebar contained>…</snice-layout-sidebar>
</div>
```

| Attribute | Applies to | Description |
|-----------|------------|-------------|
| `contained` | every shell | Size to the parent element instead of owning the screen |

### Master detail

Both panes show side by side on wide screens. Below 641px only one is on screen:
the list, until `selected` is set, then the detail with a back control that emits
`detail-closed`.

```html
<snice-layout-master-detail selected>
  <div slot="brand">Inbox</div>
  <ul slot="list">…</ul>
  <article slot="detail">…</article>
  <p slot="empty">Pick a message</p>
</snice-layout-master-detail>
```

### Documentation

Three panes, collapsing in the order documentation sites use: the on-this-page
rail leaves at 1152px, then the navigation tree becomes a drawer at 996px. Ships a
skip link, labelled landmarks, and heading `scroll-margin-top` so anchors clear the
sticky header.

```html
<snice-layout-docs>
  <div slot="brand">Docs</div>
  <a slot="sidebar" href="/start" aria-current="page">Getting started</a>
  <div slot="page"><h1>Getting started</h1>…</div>
  <nav slot="toc">…</nav>
</snice-layout-docs>
```

### Auth split

The brand panel is decorative: it is hidden from assistive technology and steps
aside below 768px so the form takes the full width. `panel-position="start"` moves
it to the leading side.

```html
<snice-layout-auth-split>
  <div slot="brand">Acme</div>
  <form slot="page">…</form>
  <div slot="footer"><a href="/privacy">Privacy</a></div>
  <img slot="panel" src="/hero.jpg" alt="">
</snice-layout-auth-split>
```

### Shell attributes

| Element | Attribute | Values | Default | Description |
|---------|-----------|--------|---------|-------------|
| `snice-layout-split` | `direction` | `horizontal`, `vertical` | `horizontal` | Axis the two panes divide along |
| `snice-layout-split` | `ratio` | `50-50`, `60-40`, `70-30`, `33-67`, `67-33` | `50-50` | Size split between the panes |
| `snice-layout-card` | `columns` | `1`, `2`, `3`, `4`, `6` | `3` | Grid columns before responsive step-down |
| `snice-layout-card` | `gap` | `sm`, `md`, `lg`, `xl` | `md` | Space between cards |
| `snice-layout-centered` | `width` | `sm`, `md`, `lg`, `xl` | `md` | Card width |
| `snice-layout-landing` | `use-nav` | boolean | `false` | Render the placard-driven nav instead of the `nav` slot |
| `snice-layout-fullscreen` | `overlay` | boolean | `false` | Dim the canvas behind the content layer |
| `snice-layout-master-detail` | `selected` | boolean | `false` | A detail is open; drives the single-pane view below 641px |
| `snice-layout-auth-split` | `panel-position` | `start`, `end` | `end` | Side the brand panel sits on |

Shell sizing hooks are listed under [CSS Custom Properties](#css-custom-properties).
