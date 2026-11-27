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

## Events

- `node-click` → `{ node: NetworkNode }`
- `edge-click` → `{ edge: NetworkEdge }`
- `node-drag` → `{ node: NetworkNode, x: number, y: number }`
- `graph-zoom` → `{ scale: number, x: number, y: number }`

## CSS Parts

- `base` - The outer graph container
- `canvas` - The SVG element
- `viewport` - Pan/zoom transform `<g>`
- `edges` - `<g>` holding every edge
- `nodes` - `<g>` holding every node
- `edge` - One edge `<path>`
- `edge-label` - One edge label `<text>`
- `node` - One node `<g>`
- `node-circle` - The node's `<circle>`
- `node-label` - The node's label `<text>`
- `tooltip` - The hover tooltip element

State tokens:

- `edge-highlighted` - Added to `edge` when it touches the hovered node
- `edge-dimmed` - Added to `edge` when another node is hovered
- `edge-label-dimmed` - Added to `edge-label` when another node is hovered
- `node-dimmed` - Added to `node` when another, unconnected node is hovered
- `node-dragging` - Added to `node` while it is being dragged
- `node-label-dimmed` - Added to `node-label` when another node is hovered

## Basic Usage

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

## Examples

```html
<!-- Static display -->
<snice-network-graph zoom-enabled="false" drag-enabled="false"></snice-network-graph>

<!-- Custom force tuning -->
<snice-network-graph charge-strength="-500" link-distance="120"></snice-network-graph>
```

## Accessibility

- `role="img"` with `aria-label` on container
- Hover tooltips with label and degree
- Responsive via ResizeObserver

## Types

```typescript
interface NetworkGraphData { nodes: NetworkNode[]; edges: NetworkEdge[]; }
interface NetworkNode { id: string; label?: string; group?: string; size?: number; color?: string; x?: number; y?: number; }
interface NetworkEdge { source: string; target: string; label?: string; weight?: number; color?: string; }
```
