# snice-network-graph

SVG-based force-directed network/relationship graph visualization.

## Properties

```typescript
data: NetworkGraphData = { nodes: [], edges: [] };
layout: 'force'|'circular'|'grid' = 'force';
chargeStrength: number = -300;  // attribute: charge-strength
linkDistance: number = 80;       // attribute: link-distance
zoomEnabled: boolean = true;     // attribute: zoom-enabled
dragEnabled: boolean = true;     // attribute: drag-enabled
showLabels: boolean = true;      // attribute: show-labels
animation: boolean = true;
```

## Types

```typescript
interface NetworkNode {
  id: string;
  label?: string;
  group?: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
  color?: string;
}

interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}
```

## Events

```typescript
'@snice/node-click': { node: NetworkNode }
'@snice/edge-click': { edge: NetworkEdge }
'@snice/node-drag': { node: NetworkNode; x: number; y: number }
'@snice/graph-zoom': { scale: number; x: number; y: number }
```

## Usage

```html
<snice-network-graph id="graph" layout="force" show-labels></snice-network-graph>

<script>
  graph.data = {
    nodes: [
      { id: 'a', label: 'Node A', group: 'g1' },
      { id: 'b', label: 'Node B', group: 'g2' },
    ],
    edges: [
      { source: 'a', target: 'b', label: 'connects' },
    ],
  };
</script>
```

## Features

- Force-directed layout simulation (repulsion + attraction + centering)
- Circular and grid static layouts
- Zoom and pan (mouse wheel + drag on background)
- Draggable nodes (pin on drag, double-click to unpin)
- Curves for multi-edges between same node pairs
- Node sizing by degree or custom `size`
- Color coding by `group` with 10-color palette
- Custom colors on individual nodes/edges
- Edge weight as stroke width
- Labels on nodes and edges
- Hover highlighting (connected subgraph, dimmed unconnected)
- Tooltips showing label and degree
- Responsive sizing via ResizeObserver
- Accessible: role="img" with aria-label
