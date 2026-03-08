# snice-sankey

SVG-based Sankey diagram for flow visualization between categories.

## Properties

```typescript
data: SankeyData = { nodes: [], links: [] };
nodeWidth: number = 20;
nodePadding: number = 10;
alignment: 'left'|'right'|'center'|'justify' = 'justify';
showLabels: boolean = true;
showValues: boolean = true;
animation: boolean = false;
```

## Types

```typescript
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
interface SankeyNode { id: string; label?: string; color?: string; }
interface SankeyLink { source: string; target: string; value: number; color?: string; }
```

## Events

- `sankey-node-click` → `{ node: SankeyNode }` — node clicked
- `sankey-link-click` → `{ link: SankeyLink }` — link clicked
- `sankey-hover` → `{ type: 'node'|'link', item: SankeyNode|SankeyLink } | null` — hover change

## Usage

```html
<snice-sankey show-labels show-values animation></snice-sankey>
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

**CSS Parts:**
- `base` - The outer Sankey container
- `chart` - The SVG chart area
- `tooltip` - The hover tooltip element

## Features

- SVG rendering with curved bezier link paths
- Sankey layout algorithm with iterative node relaxation
- Link width proportional to flow value
- Hover highlighting (dims non-connected nodes/links)
- Tooltips on hover for nodes and links
- Responsive sizing via ResizeObserver
- Animation on initial render
- 4 alignment modes
- Custom node/link colors
- Accessible: role="img" with aria-label
