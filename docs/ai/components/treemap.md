# snice-treemap

SVG-based treemap visualization for hierarchical data as nested rectangles.

## Properties

```typescript
data: TreemapNode = { label: '', value: 0 };
showLabels: boolean = true;       // attribute: show-labels
showValues: boolean = false;      // attribute: show-values
colorScheme: TreemapColorScheme = 'default'; // attribute: color-scheme
padding: number = 2;
animation: boolean = true;
drillPath: TreemapNode[];         // read-only, current drill path
```

## Types

```typescript
interface TreemapNode {
  label: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
}

type TreemapColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'warm' | 'cool' | 'rainbow';
```

## Methods

```typescript
drillDown(node: TreemapNode): void;  // drill into node's children
drillUp(): void;                      // go back one level
drillToRoot(): void;                  // reset to root
```

## Events

```typescript
'@snice/treemap-click': CustomEvent<{ node: TreemapNode; depth: number }>;
'@snice/treemap-hover': CustomEvent<{ node: TreemapNode; depth: number } | null>;
'@snice/treemap-drill': CustomEvent<{ node: TreemapNode; path: TreemapNode[] }>;
```

## Usage

```html
<!-- Basic -->
<snice-treemap show-labels show-values></snice-treemap>

<!-- Color scheme -->
<snice-treemap show-labels color-scheme="blue"></snice-treemap>

<!-- Set data via JS -->
<script>
  treemap.data = {
    label: 'Root',
    value: 0,
    children: [
      { label: 'A', value: 50 },
      { label: 'B', value: 30 },
      { label: 'C', value: 20 },
    ]
  };
</script>
```

## Features

- Squarified treemap layout algorithm for optimal aspect ratios
- 8 color schemes + custom per-node colors
- Drill-down into child nodes with breadcrumb navigation
- Tooltips on hover
- Labels auto-hide when rectangles are too small
- Responsive sizing via ResizeObserver
- Animated transitions
- Accessible: role="img" with aria-label
