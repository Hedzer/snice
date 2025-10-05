# Placard Integration Summary

The main demo app (`examples/app`) has been updated to use the placard system for data-driven navigation.

## What Changed

### 1. **App Layout** ([examples/app/layouts/app-layout.ts](examples/app/layouts/app-layout.ts))

**Before:**
- Hardcoded navigation links in HTML
- No dynamic routing awareness
- Manual active state management

**After:**
- Implements `Layout` interface with `update()` method
- Uses `@part('nav')` for selective navigation re-rendering
- Automatically builds navigation from placard metadata
- Dynamic active state based on current route
- Supports icons and tooltips from placards
- Falls back to hardcoded nav if no placards present

### 2. **Pages with Placards**

**Home Page** ([examples/app/pages/home-page.ts](examples/app/pages/home-page.ts))
```typescript
const homePlacard: Placard = {
  name: 'home',
  title: 'Home',
  description: 'Welcome to Snice - a simple, decorator-based framework',
  icon: '🏠',
  show: true,
  order: 1
};
```

**Todo Page** ([examples/app/pages/todo-page.ts](examples/app/pages/todo-page.ts))
```typescript
const todosPlacard: Placard = {
  name: 'todos',
  title: 'Todos',
  description: 'Stay organized and productive with your todo list',
  icon: '✨',
  show: true,
  order: 2
};
```

**About Page** ([examples/app/pages/about-page.ts](examples/app/pages/about-page.ts))
```typescript
const aboutPlacard: Placard = {
  name: 'about',
  title: 'About',
  description: 'Learn more about Snice framework',
  icon: 'ℹ️',
  show: true,
  order: 3
};
```

### 3. **Minimal Layout** ([examples/app/layouts/minimal-layout.ts](examples/app/layouts/minimal-layout.ts))
- Also implements `Layout` interface for consistency
- Empty `update()` method (no navigation needed for minimal layout)

## Benefits

1. **Data-Driven Navigation**: Navigation is automatically generated from page metadata
2. **Centralized Page Info**: Page titles, icons, and descriptions live with the page definition
3. **Automatic Active State**: Current route highlighting works out of the box
4. **Flexible Ordering**: Use `order` property to control navigation sequence
5. **Icon Support**: Icons display next to navigation items
6. **Tooltips**: Hover descriptions from placard metadata
7. **Future-Ready**: Easy to add more metadata (search terms, hotkeys, breadcrumbs, etc.)

## How It Works

1. **Page Registration**: Each page defines a placard with metadata
2. **Collection**: Router collects all placards during initialization
3. **Layout Update**: On navigation, router calls `layout.update(context, placards, route, params)`
4. **Rendering**: Layout uses `@part` to efficiently re-render navigation
5. **Active State**: Layout compares current route with placard names for highlighting

## Running the Demo

```bash
# From project root
npm run build

# Open examples/app/index.html in a browser
# Or use a dev server:
npx vite examples/app
```

The navigation will now be:
- 🏠 Home
- ✨ Todos
- ℹ️ About

All automatically generated from placards, with proper active state highlighting!

## Additional Examples

See [examples/placard-demo.html](examples/placard-demo.html) for a more advanced example with:
- Hierarchical navigation (parent/child relationships)
- Grouped navigation items
- Breadcrumb generation
- Sidebar layout with dynamic nav
