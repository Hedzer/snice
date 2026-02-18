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
| `icon` | `string` | `'📭'` | Icon (URL, image file, emoji, or font ligature) |
| `title` | `string` | `'No data'` | Title text |
| `description` | `string` | `''` | Description text |
| `actionText` | `string` | `''` | Action button text |
| `actionHref` | `string` | `''` | Action link URL |

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
