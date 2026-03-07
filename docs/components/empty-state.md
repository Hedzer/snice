<!-- AI: For a low-token version of this doc, use docs/ai/components/empty-state.md instead -->

# Empty State Component

The `<snice-empty-state>` component provides a consistent way to display empty or no-data states.

## Basic Usage

```html
<snice-empty-state
  icon="📭"
  title="No data"
  description="There's nothing here yet"
></snice-empty-state>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `icon` | `string` | `'📭'` | Icon (URL, image file, emoji). Use slot for icon fonts. |
| `title` | `string` | `'No data'` | Title text |
| `description` | `string` | `''` | Description text |
| `actionText` | `string` | `''` | Action button text |
| `actionHref` | `string` | `''` | Action link URL |

## Slots

| Slot Name | Description |
|-----------|-------------|
| `icon` | Custom icon content. Overrides the `icon` property. |
| (default) | Custom content below the action button |

### Icon Slot Usage

Use the `icon` slot for external CSS-based icon fonts:

```html
<snice-empty-state title="No results">
  <span slot="icon" class="material-symbols-outlined" style="font-size: 4rem;">search_off</span>
  <p>Try adjusting your search criteria</p>
</snice-empty-state>

<snice-empty-state title="No items">
  <i slot="icon" class="fa-solid fa-box-open fa-4x"></i>
</snice-empty-state>
```

## Events

### `empty-state-action`
Fired when action button/link is clicked.

## Examples

### No Search Results

```html
<snice-empty-state
  icon="🔍"
  title="No results found"
  description="Try adjusting your search criteria"
  action-text="Clear Search"
></snice-empty-state>
```

### Empty List

```html
<snice-empty-state
  icon="📦"
  title="No items yet"
  description="Get started by creating your first item"
  action-text="Create Item"
></snice-empty-state>
```

### 404 Page

```html
<snice-empty-state
  icon="🤷"
  title="Page not found"
  description="The page you're looking for doesn't exist"
  action-text="Go Home"
  action-href="/"
></snice-empty-state>
```

### With Custom Content

```html
<snice-empty-state
  icon="🎨"
  title="No projects"
>
  <div slot="">
    <button>Create Project</button>
    <button>Import Project</button>
  </div>
</snice-empty-state>
```
