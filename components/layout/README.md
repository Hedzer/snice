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
Layout with collapsible sidebar navigation.

```html
<snice-layout-sidebar>
  <div slot="brand"><h2>Dashboard</h2></div>
  <nav slot="nav">
    <a href="/dashboard">Overview</a>
    <a href="/users">Users</a>
    <a href="/settings">Settings</a>
  </nav>
  <div slot="header">
    <h1>Page Title</h1>
  </div>
  
  <!-- Main content -->
  <div>
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
Centered container perfect for forms, authentication pages.

```html
<snice-layout-centered width="md">
  <form>
    <h2>Sign In</h2>
    <input type="email" placeholder="Email">
    <input type="password" placeholder="Password">
    <button type="submit">Sign In</button>
  </form>
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
Grid layout optimized for card-based content.

```html
<snice-layout-card columns="3" gap="lg">
  <div slot="header">
    <h1>Product Gallery</h1>
  </div>
  
  <!-- Cards go in main slot -->
  <div class="card">Product 1</div>
  <div class="card">Product 2</div>
  <div class="card">Product 3</div>
</snice-layout-card>
```

#### Properties
- `columns`: Number of columns - `"1"` | `"2"` | `"3"` | `"4"` | `"6"` (default: `"3"`)
- `gap`: Grid gap size - `"sm"` | `"md"` | `"lg"` | `"xl"` (default: `"md"`)

### snice-layout-blog
Article layout with sidebar for additional content.

```html
<snice-layout-blog>
  <div slot="brand"><h1>My Blog</h1></div>
  <nav slot="nav">
    <a href="/">Home</a>
    <a href="/archive">Archive</a>
  </nav>
  
  <!-- Article content -->
  <article>
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
Complex dashboard layout with multiple content areas.

```html
<snice-layout-dashboard>
  <div slot="brand"><h1>Analytics</h1></div>
  <input slot="search" type="search" placeholder="Search...">
  <div slot="user">Welcome, John!</div>
  
  <nav slot="nav">
    <a href="/dashboard">Overview</a>
    <a href="/analytics">Analytics</a>
  </nav>
  
  <div slot="sidebar">
    <h3>Quick Actions</h3>
    <button>New Report</button>
  </div>
  
  <!-- Main dashboard content -->
  <div>
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
  --snice-color-background: #your-background-color;
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