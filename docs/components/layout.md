<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/layout.md -->

# Layout
`<snice-layout>`

Application layout with header navigation, main content area, and footer.

## Table of Contents
- [Methods](#methods)
- [Slots](#slots)
- [CSS Parts](#css-parts)
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
| `brand` | `<div>` | Brand/logo area within header |
| `main` | `<main>` | Main content area |
| `footer` | `<footer>` | Footer element |

Shell variants add parts for their own regions:

| Part | Shells | Description |
|------|--------|-------------|
| `sidebar` | sidebar, dashboard, docs | Navigation column |
| `scrim` | sidebar, dashboard, docs | Overlay backdrop shown while the sidebar is open on narrow screens |
| `toolbar` | dashboard | Strip below the header holding breadcrumbs or filters |
| `right-sidebar` | dashboard | Secondary rail beside main |
| `prose` | docs | Measured article column |
| `toc` | docs | On-this-page rail |
| `list` | master-detail | List pane |
| `detail` | master-detail | Detail pane |
| `empty` | master-detail | Empty-state shown until a detail is slotted |
| `form` | auth-split | Column holding the sign-in form |
| `panel` | auth-split | Decorative brand panel |
| `page` | auth-split | Form content wrapper |

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

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-layout-auth-panel-bg` | Layout auth panel background |
| `--snice-layout-control-size` | Layout control size |
| `--snice-layout-docs-header-height` | Layout docs header height |
| `--snice-layout-docs-header-height-compact` | Layout docs header height compact |

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

### Sizing hooks

| Custom property | Default | Applies to |
|-----------------|---------|------------|
| `--snice-layout-sidebar-width` | `16rem` | Expanded sidebar |
| `--snice-layout-rail-collapsed-width` | `3rem` | Collapsed rail |
| `--snice-layout-rail-width` | `18rem` | Dashboard right rail |
| `--snice-layout-measure` | `65ch` | Blog reading measure |
| `--snice-layout-container` | `80rem` | Landing band inner width |
| `--snice-layout-list-width` | `20rem` | Master-detail list pane |
| `--snice-layout-docs-nav-width` | `18.75rem` | Documentation navigation tree |
| `--snice-layout-docs-toc-width` | `18.75rem` | Documentation on-this-page rail |
| `--snice-layout-auth-width` | `24rem` | Auth split form column |
