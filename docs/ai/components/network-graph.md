# snice-network-graph

SVG-based force-directed network/relationship graph visualization.

## Properties

```typescript
data: NetworkGraphData = { nodes: [], edges: [] };
layout: 'force'|'circular'|'grid' = 'force';
chargeStrength: number = -300;   // attr: charge-strength
linkDistance: number = 80;        // attr: link-distance
zoomEnabled: boolean = true;      // attr: zoom-enabled
dragEnabled: boolean = true;      // attr: drag-enabled
showLabels: boolean = true;       // attr: show-labels
animation: boolean = true;
```

## Types

```typescript
interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface NetworkNode {
  id: string;
  label?: string;
  group?: string;    // Auto color-coded
  size?: number;     // Custom radius
  color?: string;    // Custom fill
  x?: number;        // Fixed position (pins node)
  y?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;   // Stroke width
  color?: string;
}
```

## Events

- `node-click` → `{ node: NetworkNode }`
- `edge-click` → `{ edge: NetworkEdge }`
- `node-drag` → `{ node: NetworkNode, x: number, y: number }`
- `graph-zoom` → `{ scale: number, x: number, y: number }`

## Usage

```html
<snice-network-graph id="graph" layout="force" show-labels style="height:400px"></snice-network-graph>
```

```typescript
graph.data = {
  nodes: [
    { id: 'a', label: 'Node A', group: 'g1' },
    { id: 'b', label: 'Node B', group: 'g2' },
  ],
  edges: [
    { source: 'a', target: 'b', label: 'connects' },
  ],
};

graph.addEventListener('node-click', (e) => console.log(e.detail.node));
```

## Features

- Force-directed, circular, and grid layouts
- Zoom/pan (mouse wheel + drag background)
- Draggable nodes (pin on drag, double-click to unpin)
- Node sizing by degree or custom `size`
- Color coding by `group` (10-color palette)
- Edge weight as stroke width
- Hover highlighting (connected subgraph)
- Tooltips with label and degree
- Responsive via ResizeObserver
- Accessible: role="img" with aria-label
