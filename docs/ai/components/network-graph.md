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
- `tooltip` - The hover tooltip element

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
