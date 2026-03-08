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

## Events

- `treemap-click` → `{ node, depth }`
- `treemap-hover` → `{ node, depth } | null`
- `treemap-drill` → `{ node, path }`

## Methods

- `drillDown(node)` - Drill into node's children
- `drillUp()` - Go back one level
- `drillToRoot()` - Reset to root

## Usage

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

**CSS Parts:**
- `breadcrumbs` - Breadcrumb navigation for drill-down
- `base` - Main treemap container
- `chart` - Chart rendering area
- `tooltip` - Hover tooltip element
