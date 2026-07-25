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

### Sizing hooks

| Custom property | Default | Applies to |
|-----------------|---------|------------|
| `--snice-layout-sidebar-width` | `16rem` | Expanded sidebar |
| `--snice-layout-rail-collapsed-width` | `3rem` | Collapsed rail |
| `--snice-layout-rail-width` | `18rem` | Dashboard right rail |
| `--snice-layout-measure` | `65ch` | Blog reading measure |
| `--snice-layout-container` | `80rem` | Landing band inner width |
