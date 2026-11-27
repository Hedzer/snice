# snice-treemap

Hierarchical data as nested rectangles with squarified layout and drill-down.

## Properties

```typescript
data: TreemapNode = { label: '', value: 0 };
showLabels: boolean = true;      // attr: show-labels
showValues: boolean = false;     // attr: show-values
colorScheme: 'default'|'blue'|'green'|'purple'|'orange'|'warm'|'cool'|'rainbow' = 'default'; // attr: color-scheme
padding: number = 2;
animation: boolean = true;
drillPath: TreemapNode[];        // read-only

interface TreemapNode {
  label: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
}
```

## Methods

- `drillDown(node)` - Drill into node's children
- `drillUp()` - Go back one level
- `drillToRoot()` - Reset to root

## Events

- `treemap-click` -> `{ node, depth }`
- `treemap-hover` -> `{ node, depth } | null`
- `treemap-drill` -> `{ node, path }`

## CSS Parts

- `breadcrumbs` - Breadcrumb navigation for drill-down
- `base` - Main treemap container
- `chart` - Chart rendering area
- `tooltip` - Hover tooltip element
- `svg` - Root `<svg>` of the treemap chart
- `tile` - A treemap rectangle
- `tile-border` - Stroke overlay drawn on top of a tile
- `label` - Tile label text
- `value` - Tile value text
- `breadcrumb` - A breadcrumb entry in the drill-down trail
- `breadcrumb-root` - Added to `breadcrumb` on the root entry
- `breadcrumb-current` - Added to `breadcrumb` on the current (last) entry
- `separator` - Separator between breadcrumb entries

## Basic Usage

```html
<snice-treemap show-labels show-values style="height: 400px;"></snice-treemap>
<snice-treemap color-scheme="blue" show-labels></snice-treemap>
<snice-treemap color-scheme="rainbow" show-labels show-values></snice-treemap>
```

```typescript
treemap.data = {
  label: 'Root',
  value: 0,
  children: [
    { label: 'A', value: 50 },
    { label: 'B', value: 30, color: '#e74c3c' },
    { label: 'C', value: 20, children: [
      { label: 'C1', value: 12 },
      { label: 'C2', value: 8 }
    ]}
  ]
};
```
