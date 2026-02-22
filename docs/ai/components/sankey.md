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

- `@snice/sankey-node-click` - `{ node: SankeyNode }` - Node clicked
- `@snice/sankey-link-click` - `{ link: SankeyLink }` - Link clicked
- `@snice/sankey-hover` - `{ type: 'node'|'link', item: SankeyNode|SankeyLink } | null` - Hover change

## Usage

```html
<snice-sankey id="my-sankey" show-labels show-values animation></snice-sankey>

<script>
  document.getElementById('my-sankey').data = {
    nodes: [
      { id: 'a', label: 'Source', color: '#2196f3' },
      { id: 'b', label: 'Target', color: '#4caf50' }
    ],
    links: [
      { source: 'a', target: 'b', value: 100 }
    ]
  };
</script>
```

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
