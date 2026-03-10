# snice-sankey

SVG-based Sankey diagram for flow visualization between categories.

## Properties

```typescript
data: SankeyData = { nodes: [], links: [] }; // JS only
nodeWidth: number = 20;              // attr: node-width
nodePadding: number = 10;            // attr: node-padding
alignment: 'left'|'right'|'center'|'justify' = 'justify';
showLabels: boolean = true;          // attr: show-labels
showValues: boolean = true;          // attr: show-values
animation: boolean = false;
```

## Types

```typescript
interface SankeyData { nodes: SankeyNode[]; links: SankeyLink[]; }
interface SankeyNode { id: string; label?: string; color?: string; }
interface SankeyLink { source: string; target: string; value: number; color?: string; }
```

## Events

- `sankey-node-click` → `{ node: SankeyNode }`
- `sankey-link-click` → `{ link: SankeyLink }`
- `sankey-hover` → `{ type: 'node'|'link', item } | null`

## CSS Parts

- `base` - Outer container
- `chart` - SVG chart area
- `tooltip` - Hover tooltip

## Basic Usage

```html
<snice-sankey show-labels show-values animation style="height: 300px;"></snice-sankey>
```

```typescript
sankey.data = {
  nodes: [
    { id: 'a', label: 'Source', color: '#2196f3' },
    { id: 'b', label: 'Target', color: '#4caf50' }
  ],
  links: [
    { source: 'a', target: 'b', value: 100 }
  ]
};
```

## Accessibility

- SVG `role="img"` with `aria-label`
- Hover highlighting dims non-connected elements
- Responsive via ResizeObserver
