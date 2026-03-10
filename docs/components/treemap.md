<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/treemap.md -->

# Treemap
`<snice-treemap>`

Renders hierarchical data as nested rectangles using a squarified treemap layout. Each rectangle's area is proportional to its value. Supports drill-down navigation.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `TreemapNode` | `{ label: '', value: 0 }` | Hierarchical data |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show text labels |
| `showValues` (attr: `show-values`) | `boolean` | `false` | Show numeric values |
| `colorScheme` (attr: `color-scheme`) | `'default' \| 'blue' \| 'green' \| 'purple' \| 'orange' \| 'warm' \| 'cool' \| 'rainbow'` | `'default'` | Color scheme |
| `padding` | `number` | `2` | Padding between rectangles (px) |
| `animation` | `boolean` | `true` | Enable transitions |
| `drillPath` | `TreemapNode[]` | _(read-only)_ | Current drill-down path |

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

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `treemap-click` | `{ node: TreemapNode, depth: number }` | Rectangle clicked |
| `treemap-hover` | `{ node: TreemapNode, depth: number } \| null` | Hover enter (null on leave) |
| `treemap-drill` | `{ node: TreemapNode, path: TreemapNode[] }` | Drill level changed |

## CSS Parts

| Part | Description |
|------|-------------|
| `breadcrumbs` | Breadcrumb navigation for drill-down |
| `base` | The main treemap container |
| `chart` | The chart rendering area |
| `tooltip` | The hover tooltip element |

## Basic Usage

```typescript
import 'snice/components/treemap/snice-treemap';
```

```html
<snice-treemap show-labels show-values style="height: 400px;"></snice-treemap>
```

```typescript
treemap.data = {
  label: 'Disk Usage',
  value: 0,
  children: [
    { label: 'Documents', value: 45 },
    { label: 'Photos', value: 30 },
    { label: 'Videos', value: 80 },
    { label: 'Music', value: 25 }
  ]
};
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

```typescript
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

```typescript
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
```

### Programmatic Navigation

```typescript
treemap.drillDown(node);       // Drill into a node
treemap.drillUp();              // Go back one level
treemap.drillToRoot();          // Reset to root
console.log(treemap.drillPath); // Current path
```
