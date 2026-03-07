<!-- AI: For a low-token version of this doc, use docs/ai/components/treemap.md instead -->

# Treemap
`<snice-treemap>`

Renders hierarchical data as nested rectangles using a squarified treemap layout. Each rectangle's area is proportional to its value.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/treemap/snice-treemap';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-treemap.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `TreemapNode` | `{ label: '', value: 0 }` | Hierarchical data |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show text labels |
| `showValues` (attr: `show-values`) | `boolean` | `false` | Show numeric values |
| `colorScheme` (attr: `color-scheme`) | `'default' \| 'blue' \| 'green' \| 'purple' \| 'orange' \| 'warm' \| 'cool' \| 'rainbow'` | `'default'` | Color scheme |
| `padding` | `number` | `2` | Padding between rectangles (px) |
| `animation` | `boolean` | `true` | Enable transitions |

### TreemapNode Interface

```typescript
interface TreemapNode {
  label: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `drillDown()` | `node: TreemapNode` | Drill into a node's children |
| `drillUp()` | -- | Go back one level |
| `drillToRoot()` | -- | Reset to root level |

The `drillPath` getter returns the current drill-down path as `TreemapNode[]`.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `treemap-click` | `{ node: TreemapNode, depth: number }` | Rectangle clicked |
| `treemap-hover` | `{ node: TreemapNode, depth: number } \| null` | Hover enter (null on leave) |
| `treemap-drill` | `{ node: TreemapNode, path: TreemapNode[] }` | Drill level changed |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `breadcrumbs` | `<div>` | Breadcrumb navigation for drill-down |
| `base` | `<div>` | The main treemap container |
| `chart` | `<div>` | The chart rendering area |
| `tooltip` | `<div>` | The hover tooltip element |

```css
snice-treemap::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-treemap::part(breadcrumbs) {
  padding: 0.5rem;
  font-size: 0.875rem;
}
```

## Basic Usage

```typescript
import 'snice/components/treemap/snice-treemap';
```

```html
<snice-treemap id="usage" show-labels show-values style="height: 400px;"></snice-treemap>

<script>
  document.getElementById('usage').data = {
    label: 'Disk Usage',
    value: 0,
    children: [
      { label: 'Documents', value: 45 },
      { label: 'Photos', value: 30 },
      { label: 'Videos', value: 80 },
      { label: 'Music', value: 25 }
    ]
  };
</script>
```

## Examples

### Color Schemes

Use the `color-scheme` attribute to change the palette.

```html
<snice-treemap color-scheme="blue" show-labels></snice-treemap>
<snice-treemap color-scheme="warm" show-labels></snice-treemap>
<snice-treemap color-scheme="rainbow" show-labels></snice-treemap>
```

### Custom Node Colors

Set the `color` property on individual nodes to override the scheme.

```javascript
treemap.data = {
  label: 'Budget',
  value: 0,
  children: [
    { label: 'Rent', value: 1500, color: '#e74c3c' },
    { label: 'Food', value: 600, color: '#2ecc71' },
    { label: 'Transport', value: 300, color: '#3498db' }
  ]
};
```

### Drillable Hierarchy

Click a rectangle with children to drill into it. A breadcrumb trail appears for navigation.

```html
<snice-treemap id="org" show-labels style="height: 400px;"></snice-treemap>

<script>
  document.getElementById('org').data = {
    label: 'Company',
    value: 0,
    children: [
      {
        label: 'Engineering',
        value: 0,
        children: [
          { label: 'Frontend', value: 20 },
          { label: 'Backend', value: 25 },
          { label: 'DevOps', value: 10 }
        ]
      },
      {
        label: 'Sales',
        value: 0,
        children: [
          { label: 'Enterprise', value: 30 },
          { label: 'SMB', value: 15 }
        ]
      },
      { label: 'HR', value: 10 }
    ]
  };
</script>
```

### Programmatic Navigation

```javascript
const treemap = document.querySelector('snice-treemap');
treemap.drillDown(node);   // Drill into a node
treemap.drillUp();          // Go back one level
treemap.drillToRoot();      // Reset to root
console.log(treemap.drillPath); // Current path
```
