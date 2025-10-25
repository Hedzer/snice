# snice-layout

Collection of pre-built page layouts for common application patterns.

## snice-layout

Base layout with header navigation, main content area, and footer.

### Slots

- `brand` - Logo/brand in header
- `page` - Main page content
- `footer` - Footer content

### Methods

- `update(appContext, placards, currentRoute, routeParams)` - Update layout navigation

### Usage

```html
<snice-layout>
  <div slot="brand">
    <h1>My App</h1>
  </div>
  <div slot="page">
    <!-- Page content -->
  </div>
  <div slot="footer">
    <p>© 2025 My Company</p>
  </div>
</snice-layout>
```

## snice-layout-centered

Centered single-column layout with configurable width.

### Properties

```typescript
width: 'sm'|'md'|'lg'|'xl' = 'md';
```

### Slots

- `page` - Main content (centered)

### Usage

```html
<snice-layout-centered width="lg">
  <div slot="page">
    <!-- Centered content -->
  </div>
</snice-layout-centered>
```

## snice-layout-split

Two-column split layout.

### Slots

- `left` - Left column content
- `right` - Right column content

### Usage

```html
<snice-layout-split>
  <div slot="left">
    <!-- Left sidebar -->
  </div>
  <div slot="right">
    <!-- Main content -->
  </div>
</snice-layout-split>
```

## snice-layout-sidebar

Layout with collapsible sidebar and main content area.

### Slots

- `brand` - Logo/brand in sidebar header
- `sidebar` - Sidebar navigation content
- `page` - Main page content
- `footer` - Footer content

### Usage

```html
<snice-layout-sidebar>
  <div slot="brand">
    <h1>My App</h1>
  </div>
  <nav slot="sidebar">
    <!-- Sidebar navigation -->
  </nav>
  <div slot="page">
    <!-- Main content -->
  </div>
</snice-layout-sidebar>
```

## snice-layout-dashboard

Dashboard layout with header, sidebar, and content grid.

### Slots

- `brand` - Logo/brand
- `header` - Top header content
- `sidebar` - Left sidebar navigation
- `page` - Main dashboard content

### Usage

```html
<snice-layout-dashboard>
  <div slot="brand">
    <h1>Dashboard</h1>
  </div>
  <div slot="header">
    <!-- User menu, notifications -->
  </div>
  <nav slot="sidebar">
    <!-- Nav items -->
  </nav>
  <div slot="page">
    <!-- Dashboard widgets -->
  </div>
</snice-layout-dashboard>
```

## snice-layout-landing

Landing page layout with hero section.

### Slots

- `header` - Top navigation
- `hero` - Hero section
- `page` - Main content
- `footer` - Footer

### Usage

```html
<snice-layout-landing>
  <nav slot="header">
    <!-- Top nav -->
  </nav>
  <div slot="hero">
    <h1>Welcome</h1>
  </div>
  <div slot="page">
    <!-- Features, content -->
  </div>
  <footer slot="footer">
    <!-- Links, copyright -->
  </footer>
</snice-layout-landing>
```

## snice-layout-blog

Blog-style layout with header, content, and sidebar.

### Slots

- `header` - Header navigation
- `page` - Main blog content
- `sidebar` - Blog sidebar (recent posts, categories)
- `footer` - Footer

### Usage

```html
<snice-layout-blog>
  <nav slot="header">
    <!-- Blog nav -->
  </nav>
  <article slot="page">
    <!-- Blog post -->
  </article>
  <aside slot="sidebar">
    <!-- Recent posts, categories -->
  </aside>
</snice-layout-blog>
```

## snice-layout-fullscreen

Full viewport layout with no margins.

### Slots

- `page` - Fullscreen content

### Usage

```html
<snice-layout-fullscreen>
  <div slot="page">
    <!-- Fullscreen app -->
  </div>
</snice-layout-fullscreen>
```

## snice-layout-minimal

Minimal layout with just header and content.

### Slots

- `header` - Minimal header
- `page` - Main content

### Usage

```html
<snice-layout-minimal>
  <div slot="header">
    <h1>Simple App</h1>
  </div>
  <div slot="page">
    <!-- Content -->
  </div>
</snice-layout-minimal>
```

## snice-layout-card

Card-based centered layout for login/signup pages.

### Slots

- `page` - Card content

### Usage

```html
<snice-layout-card>
  <div slot="page">
    <h2>Sign In</h2>
    <!-- Login form -->
  </div>
</snice-layout-card>
```

## Features

- 10 pre-built layout patterns
- Responsive design
- Slotted content areas
- Navigation integration (where applicable)
- Router integration support
- Common UI patterns (dashboard, blog, landing, etc.)
