# Layout Components

A collection of layout components for structuring web applications.

## Components

### snice-layout
Basic layout with header, main content, and footer areas.

```html
<snice-layout>
  <div slot="brand"><h1>My App</h1></div>
  <nav slot="nav">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  
  <!-- Main content -->
  <div>
    <h1>Welcome</h1>
    <p>This is the main content area.</p>
  </div>
  
  <div slot="footer">
    <p>&copy; 2024 My Company</p>
  </div>
</snice-layout>
```

### snice-layout-sidebar
App shell with a persistent sidebar: in flow on desktop (main reflows when it
collapses), overlay with scrim below 768px. `collapsed` controls the desktop
state; the header toggle flips it (or opens the overlay on mobile). Slot
`sidebar` for your own navigation; without it a placard-driven `snice-nav`
renders when a router is present.

```html
<snice-layout-sidebar>
  <div slot="brand"><h2>Dashboard</h2></div>
  <nav slot="sidebar">
    <a href="/dashboard">Overview</a>
    <a href="/users">Users</a>
    <a href="/settings">Settings</a>
  </nav>
  <div slot="header">
    <h1>Page Title</h1>
  </div>
  <div slot="page">
    <p>Dashboard content goes here</p>
  </div>
</snice-layout-sidebar>
```

### snice-layout-minimal
Clean layout with just content area.

```html
<snice-layout-minimal>
  <div>
    <h1>Simple Page</h1>
    <p>Minimal layout for focused content.</p>
  </div>
</snice-layout-minimal>
```

### snice-layout-centered
Centered card for forms and authentication pages. Optional `brand` renders
above the card and `footer` (privacy/terms links) below; both hide when not
slotted.

```html
<snice-layout-centered width="md">
  <div slot="brand">Acme</div>
  <form slot="page">
    <h2>Sign In</h2>
    <input type="email" placeholder="Email">
    <input type="password" placeholder="Password">
    <button type="submit">Sign In</button>
  </form>
  <div slot="footer"><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div>
</snice-layout-centered>
```

#### Properties
- `width`: Container width - `"sm"` | `"md"` | `"lg"` | `"xl"` (default: `"md"`)

### snice-layout-landing
Marketing/landing page layout with hero section.

```html
<snice-layout-landing>
  <div slot="brand"><h1>Company</h1></div>
  <nav slot="nav">
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
  </nav>
  <button slot="cta">Get Started</button>
  
  <div slot="hero">
    <h1>Amazing Product</h1>
    <p>Transform your business today</p>
  </div>
  
  <!-- Main content sections -->
  <section>
    <h2>Features</h2>
    <p>Feature content...</p>
  </section>
</snice-layout-landing>
```

### snice-layout-split
Two-panel layout with configurable split ratios.

```html
<snice-layout-split direction="horizontal" ratio="60-40">
  <div slot="left">
    <h2>Left Panel</h2>
    <p>Content for left side</p>
  </div>
  <div slot="right">
    <h2>Right Panel</h2>
    <p>Content for right side</p>
  </div>
</snice-layout-split>
```

#### Properties
- `direction`: Split direction - `"horizontal"` | `"vertical"` (default: `"horizontal"`)
- `ratio`: Panel size ratio - `"50-50"` | `"60-40"` | `"70-30"` | `"33-67"` | `"67-33"` (default: `"50-50"`)

### snice-layout-card
Grid layout optimized for card-based content. Header and footer bars render
only when slotted; the grid steps down to 2 columns under 768px and 1 under
480px.

```html
<snice-layout-card columns="3" gap="lg">
  <div slot="header">
    <h1>Product Gallery</h1>
  </div>

  <div slot="page" class="card">Product 1</div>
  <div slot="page" class="card">Product 2</div>
  <div slot="page" class="card">Product 3</div>
</snice-layout-card>
```

#### Properties
- `columns`: Number of columns - `"1"` | `"2"` | `"3"` | `"4"` | `"6"` (default: `"3"`)
- `gap`: Grid gap size - `"sm"` | `"md"` | `"lg"` | `"xl"` (default: `"md"`)

### snice-layout-blog
Article layout with a centered reading measure. The sidebar column exists
only when `slot="sidebar"` content is provided; otherwise the article
centers. The sidebar stacks below the article under 968px.

```html
<snice-layout-blog>
  <div slot="brand"><h1>My Blog</h1></div>
  <nav slot="nav">
    <a href="/">Home</a>
    <a href="/archive">Archive</a>
  </nav>

  <article slot="page">
    <h1>Blog Post Title</h1>
    <p>Article content goes here...</p>
  </article>

  <div slot="sidebar">
    <h3>Recent Posts</h3>
    <ul>
      <li><a href="/post1">Post 1</a></li>
      <li><a href="/post2">Post 2</a></li>
    </ul>
  </div>
</snice-layout-blog>
```

### snice-layout-dashboard
App shell with left nav sidebar, toolbar strip (placard breadcrumbs by
default, slottable), main area, and an optional right rail. The rail renders
only when `slot="right-sidebar"` content exists, stacks below main under
1024px, and the left sidebar overlays with a scrim under 768px. App chrome
like search or a user menu belongs in the generic `header` slot.

```html
<snice-layout-dashboard>
  <div slot="brand"><h1>Analytics</h1></div>
  <div slot="header">
    <input type="search" placeholder="Search...">
    <span>Welcome, John!</span>
  </div>

  <nav slot="sidebar">
    <a href="/dashboard">Overview</a>
    <a href="/analytics">Analytics</a>
  </nav>

  <div slot="page">
    <h2>Dashboard Overview</h2>
    <div class="metrics">...</div>
  </div>

  <div slot="right-sidebar">
    <h3>Recent Activity</h3>
    <ul>...</ul>
  </div>
</snice-layout-dashboard>
```

### snice-layout-fullscreen
Immersive fullscreen layout for presentations, media viewers.

```html
<snice-layout-fullscreen overlay>
  <img slot="background" src="background.jpg" alt="Background">
  
  <div slot="overlay">
    <h1>Overlay Content</h1>
  </div>
  
  <!-- Main fullscreen content -->
  <div>
    <h2>Centered Content</h2>
  </div>
  
  <div slot="controls">
    <button>Play</button>
    <button>Pause</button>
    <button>Fullscreen</button>
  </div>
</snice-layout-fullscreen>
```

#### Properties
- `overlay`: Show overlay background - `boolean` (default: `false`)

## Styling

All layout components use the Snice design system CSS custom properties for consistent theming. You can override these variables to customize the appearance:

```css
:root {
  --snice-color-primary: #your-primary-color;
  --snice-color-surface: #your-background-color;
  --snice-spacing-md: your-spacing-value;
  /* ... other theme variables */
}
```

## Responsive Design

All layouts include responsive breakpoints and will adapt to mobile devices automatically. Most layouts stack vertically on small screens for optimal mobile experience.

## Events

Layout components are structural and don't emit custom events. However, you can listen for standard DOM events on slotted content:

```javascript
document.querySelector('snice-layout-sidebar')
  .addEventListener('click', (e) => {
    if (e.target.matches('.sidebar-toggle')) {
      // Handle sidebar toggle
    }
  });
```