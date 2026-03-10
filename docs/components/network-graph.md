<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/network-graph.md -->

# Network Graph
`<snice-network-graph>`

An SVG-based force-directed graph visualization for displaying relationships between nodes.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `NetworkGraphData` | `{ nodes: [], edges: [] }` | Graph data (set via JS) |
| `layout` | `'force' \| 'circular' \| 'grid'` | `'force'` | Layout algorithm |
| `chargeStrength` (attr: `charge-strength`) | `number` | `-300` | Node repulsion force |
| `linkDistance` (attr: `link-distance`) | `number` | `80` | Target distance between connected nodes |
| `zoomEnabled` (attr: `zoom-enabled`) | `boolean` | `true` | Enable zoom and pan |
| `dragEnabled` (attr: `drag-enabled`) | `boolean` | `true` | Enable dragging nodes |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show node and edge labels |
| `animation` | `boolean` | `true` | Animate force simulation |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `node-click` | `{ node: NetworkNode }` | Node clicked |
| `edge-click` | `{ edge: NetworkEdge }` | Edge clicked |
| `node-drag` | `{ node: NetworkNode, x: number, y: number }` | Node dragged |
| `graph-zoom` | `{ scale: number, x: number, y: number }` | Zoom changed |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer graph container |
| `canvas` | `<svg>` | The SVG element where nodes and edges are rendered |
| `tooltip` | `<div>` | The hover tooltip showing node label and degree |

```css
snice-network-graph::part(base) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

snice-network-graph::part(tooltip) {
  font-size: 0.875rem;
}
```

## Basic Usage

```typescript
import 'snice/components/network-graph/snice-network-graph';
```

```html
<snice-network-graph id="graph" style="height: 400px;"></snice-network-graph>

<script type="module">
  document.getElementById('graph').data = {
    nodes: [
      { id: 'alice', label: 'Alice', group: 'team-a' },
      { id: 'bob', label: 'Bob', group: 'team-b' },
    ],
    edges: [
      { source: 'alice', target: 'bob', label: 'collaborates' },
    ],
  };
</script>
```

## Examples

### Layout Types

Use the `layout` attribute to switch between layout algorithms.

```html
<snice-network-graph layout="force" style="height: 400px;"></snice-network-graph>
<snice-network-graph layout="circular" style="height: 400px;"></snice-network-graph>
<snice-network-graph layout="grid" style="height: 400px;"></snice-network-graph>
```

### Custom Node Sizes and Colors

```html
<snice-network-graph id="custom" style="height: 400px;"></snice-network-graph>

<script type="module">
  document.getElementById('custom').data = {
    nodes: [
      { id: 'server', label: 'Server', size: 20, color: 'rgb(220 38 38)' },
      { id: 'db', label: 'Database', size: 16, color: 'rgb(37 99 235)' },
      { id: 'client', label: 'Client', size: 10, color: 'rgb(22 163 74)' },
    ],
    edges: [
      { source: 'client', target: 'server', weight: 2 },
      { source: 'server', target: 'db', label: 'queries', weight: 4 },
    ],
  };
</script>
```

### Group-Based Coloring

Nodes with the same `group` value are automatically assigned the same color.

```typescript
graph.data = {
  nodes: [
    { id: 'a', group: 'frontend' },
    { id: 'b', group: 'backend' },
    { id: 'c', group: 'frontend' }, // same color as 'a'
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
  ],
};
```

### Tuning the Force Simulation

Use `charge-strength` and `link-distance` to adjust node spacing.

```html
<snice-network-graph charge-strength="-500" link-distance="120"></snice-network-graph>
<snice-network-graph charge-strength="-100" link-distance="50"></snice-network-graph>
```

### Pinned Nodes

Provide `x` and `y` on nodes to pin them at fixed positions.

```typescript
graph.data = {
  nodes: [
    { id: 'fixed', label: 'Pinned', x: 300, y: 200 },
    { id: 'free', label: 'Free' },
  ],
  edges: [{ source: 'fixed', target: 'free' }],
};
```

### Event Handling

```typescript
graph.addEventListener('node-click', (e) => {
  console.log('Clicked:', e.detail.node.label);
});

graph.addEventListener('node-drag', (e) => {
  console.log(`Dragged ${e.detail.node.id} to (${e.detail.x}, ${e.detail.y})`);
});

graph.addEventListener('graph-zoom', (e) => {
  console.log('Zoom:', e.detail.scale);
});
```

### Static Display

Disable drag and zoom for a non-interactive view.

```html
<snice-network-graph zoom-enabled="false" drag-enabled="false"></snice-network-graph>
```

## Accessibility

- The graph container has `role="img"` with `aria-label="Network graph visualization"`
- Hover tooltips display node label and connection count
- Responsive via ResizeObserver

## Data Types

```typescript
interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface NetworkNode {
  id: string;
  label?: string;
  group?: string;   // Auto color-coded
  size?: number;     // Custom radius
  color?: string;    // Custom fill color
  x?: number;        // Fixed X position
  y?: number;        // Fixed Y position
}

interface NetworkEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;   // Stroke width
  color?: string;
}
```
