# Treemap Component

The treemap component renders hierarchical data as nested rectangles using an SVG-based squarified treemap layout algorithm. Each rectangle's area is proportional to its value, making it ideal for visualizing the relative sizes of categories within a hierarchy.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Basic Usage

```html
<snice-treemap id="my-treemap" show-labels show-values></snice-treemap>

<script type="module">
  import 'snice/components/treemap/snice-treemap';

  const treemap = document.getElementById('my-treemap');
  treemap.data = {
    label: 'Disk Usage',
    value: 0,
    children: [
      { label: 'Documents', value: 45 },
      { label: 'Photos', value: 30 },
      { label: 'Videos', value: 80 },
      { label: 'Music', value: 25 },
    ]
  };
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `TreemapNode` | `{ label: '', value: 0 }` | Hierarchical data to display |
| `show-labels` | `boolean` | `true` | Show text labels on rectangles |
| `show-values` | `boolean` | `false` | Show numeric values on rectangles |
| `color-scheme` | `TreemapColorScheme` | `'default'` | Color scheme for rectangles |
| `padding` | `number` | `2` | Padding between rectangles in pixels |
| `animation` | `boolean` | `true` | Enable animated transitions |

### TreemapNode Interface

```typescript
interface TreemapNode {
  label: string;        // Display name
  value: number;        // Numeric value (leaf nodes)
  children?: TreemapNode[];  // Child nodes (parent value computed from children)
  color?: string;       // Optional custom color (overrides color scheme)
}
```

### Color Schemes

| Scheme | Description |
|--------|-------------|
| `default` | Tableau 10 categorical palette |
| `blue` | Sequential blues |
| `green` | Sequential greens |
| `purple` | Sequential purples |
| `orange` | Sequential oranges |
| `warm` | Warm reds/oranges |
| `cool` | Cool teals/blues |
| `rainbow` | Multi-hue categorical |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `drillDown` | `(node: TreemapNode) => void` | Drill into a node's children |
| `drillUp` | `() => void` | Go back one level |
| `drillToRoot` | `() => void` | Reset to root level |

The `drillPath` getter returns the current drill-down path as a `TreemapNode[]`.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/treemap-click` | `{ node: TreemapNode, depth: number }` | Fired when a rectangle is clicked |
| `@snice/treemap-hover` | `{ node: TreemapNode, depth: number } \| null` | Fired on hover (null on leave) |
| `@snice/treemap-drill` | `{ node: TreemapNode, path: TreemapNode[] }` | Fired when drill level changes |

## Examples

### Drillable Hierarchy

```html
<snice-treemap id="org" show-labels></snice-treemap>

<script type="module">
  const treemap = document.getElementById('org');
  treemap.data = {
    label: 'Company',
    value: 0,
    children: [
      {
        label: 'Engineering',
        value: 0,
        children: [
          { label: 'Frontend', value: 20 },
          { label: 'Backend', value: 25 },
          { label: 'DevOps', value: 10 },
        ]
      },
      {
        label: 'Sales',
        value: 0,
        children: [
          { label: 'Enterprise', value: 30 },
          { label: 'SMB', value: 15 },
        ]
      },
      { label: 'HR', value: 10 },
    ]
  };

  treemap.addEventListener('@snice/treemap-drill', (e) => {
    console.log('Drilled to:', e.detail.path.map(n => n.label).join(' > '));
  });
</script>
```

Click a rectangle with children to drill in. A breadcrumb trail appears for navigation.

### Custom Colors

```html
<snice-treemap id="budget" show-labels show-values></snice-treemap>

<script type="module">
  document.getElementById('budget').data = {
    label: 'Budget',
    value: 0,
    children: [
      { label: 'Rent', value: 1500, color: '#e74c3c' },
      { label: 'Food', value: 600, color: '#2ecc71' },
      { label: 'Transport', value: 300, color: '#3498db' },
      { label: 'Savings', value: 500, color: '#1abc9c' },
    ]
  };
</script>
```

### Color Schemes

```html
<snice-treemap color-scheme="blue" show-labels></snice-treemap>
<snice-treemap color-scheme="warm" show-labels></snice-treemap>
<snice-treemap color-scheme="rainbow" show-labels></snice-treemap>
```

### Listening to Events

```html
<snice-treemap id="events" show-labels></snice-treemap>

<script type="module">
  const map = document.getElementById('events');

  map.addEventListener('@snice/treemap-click', (e) => {
    console.log('Clicked:', e.detail.node.label);
  });

  map.addEventListener('@snice/treemap-hover', (e) => {
    if (e.detail) {
      console.log('Hovering:', e.detail.node.label);
    }
  });
</script>
```

## Accessibility

- **ARIA role**: The treemap container has `role="img"` with `aria-label` from the root data label
- **Keyboard**: Breadcrumb buttons are focusable and keyboard-accessible
- **Tooltips**: Hover tooltips show node label and value

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1, Shadow DOM, and ResizeObserver support

## Best Practices

1. **Provide meaningful labels**: Each node should have a descriptive label
2. **Use appropriate color schemes**: Categorical data works well with `default` or `rainbow`; sequential data with `blue`, `green`, etc.
3. **Set a fixed height**: The treemap needs a defined height on the host element (e.g., `snice-treemap { height: 400px; }`)
4. **Limit depth**: More than 2-3 levels of hierarchy can be hard to navigate; use drill-down for deep trees
5. **Balance node counts**: Very many small nodes become unreadable; consider grouping small values
6. **Custom colors**: Use the `color` property on nodes for domain-specific coloring (e.g., red for expenses, green for income)
7. **Responsive**: The treemap auto-resizes via ResizeObserver; place it in a flexible container
8. **Show values selectively**: Enable `show-values` when exact numbers matter; labels alone are often sufficient
