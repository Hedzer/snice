# Network Graph Component

The network graph component renders an SVG-based force-directed graph visualization for displaying relationships between nodes. It supports multiple layout algorithms, interactive zoom/pan, draggable nodes, and hover highlighting.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Data Format](#data-format)
- [Events](#events)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Basic Usage

```html
<snice-network-graph id="graph"></snice-network-graph>

<script type="module">
  import 'snice/components/network-graph/snice-network-graph';

  const graph = document.getElementById('graph');
  graph.data = {
    nodes: [
      { id: 'alice', label: 'Alice', group: 'team-a' },
      { id: 'bob', label: 'Bob', group: 'team-b' },
      { id: 'carol', label: 'Carol', group: 'team-a' },
    ],
    edges: [
      { source: 'alice', target: 'bob', label: 'collaborates' },
      { source: 'bob', target: 'carol' },
      { source: 'alice', target: 'carol' },
    ],
  };
</script>
```

## Properties

| Property | Type | Default | Attribute | Description |
|----------|------|---------|-----------|-------------|
| `data` | `NetworkGraphData` | `{ nodes: [], edges: [] }` | — | Graph data (set via JS property) |
| `layout` | `'force' \| 'circular' \| 'grid'` | `'force'` | `layout` | Layout algorithm |
| `chargeStrength` | `number` | `-300` | `charge-strength` | Repulsion force between nodes (negative = repel) |
| `linkDistance` | `number` | `80` | `link-distance` | Target distance between connected nodes |
| `zoomEnabled` | `boolean` | `true` | `zoom-enabled` | Enable mouse wheel zoom and background pan |
| `dragEnabled` | `boolean` | `true` | `drag-enabled` | Enable dragging nodes |
| `showLabels` | `boolean` | `true` | `show-labels` | Show text labels on nodes and edges |
| `animation` | `boolean` | `true` | `animation` | Animate force simulation |

## Data Format

### NetworkNode

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier |
| `label` | `string` | No | Display label (falls back to `id`) |
| `group` | `string` | No | Group for automatic color coding |
| `size` | `number` | No | Custom circle radius (overrides degree-based sizing) |
| `color` | `string` | No | Custom fill color (overrides group color) |
| `x` | `number` | No | Fixed X position (pins node) |
| `y` | `number` | No | Fixed Y position (pins node) |

### NetworkEdge

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | Yes | Source node `id` |
| `target` | `string` | Yes | Target node `id` |
| `label` | `string` | No | Label displayed at edge midpoint |
| `weight` | `number` | No | Stroke width (default 1) |
| `color` | `string` | No | Custom stroke color |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/node-click` | `{ node: NetworkNode }` | Node clicked |
| `@snice/edge-click` | `{ edge: NetworkEdge }` | Edge clicked |
| `@snice/node-drag` | `{ node: NetworkNode, x: number, y: number }` | Node dragged to new position |
| `@snice/graph-zoom` | `{ scale: number, x: number, y: number }` | Zoom level changed |

## Examples

### Layout Types

```html
<!-- Force-directed (default) -->
<snice-network-graph id="force" layout="force"></snice-network-graph>

<!-- Circular arrangement -->
<snice-network-graph id="circular" layout="circular"></snice-network-graph>

<!-- Grid arrangement -->
<snice-network-graph id="grid" layout="grid"></snice-network-graph>
```

### Custom Node Sizes and Colors

```html
<snice-network-graph id="custom-graph"></snice-network-graph>

<script type="module">
  document.getElementById('custom-graph').data = {
    nodes: [
      { id: 'server', label: 'Server', size: 20, color: 'rgb(220 38 38)' },
      { id: 'db', label: 'Database', size: 16, color: 'rgb(37 99 235)' },
      { id: 'client', label: 'Client', size: 10, color: 'rgb(22 163 74)' },
    ],
    edges: [
      { source: 'client', target: 'server', weight: 2 },
      { source: 'server', target: 'db', label: 'queries', weight: 4, color: 'rgb(37 99 235)' },
    ],
  };
</script>
```

### Group-Based Coloring

Nodes with the same `group` value are automatically assigned the same color from a 10-color palette.

```javascript
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

```html
<!-- Stronger repulsion, longer links -->
<snice-network-graph charge-strength="-500" link-distance="120"></snice-network-graph>

<!-- Weaker repulsion, tighter clustering -->
<snice-network-graph charge-strength="-100" link-distance="50"></snice-network-graph>
```

### Pinned Nodes

Provide `x` and `y` on nodes to pin them at fixed positions. Double-click a dragged node to unpin it.

```javascript
graph.data = {
  nodes: [
    { id: 'fixed', label: 'Pinned', x: 300, y: 200 },
    { id: 'free', label: 'Free' },
  ],
  edges: [{ source: 'fixed', target: 'free' }],
};
```

### Listening to Events

```javascript
graph.addEventListener('@snice/node-click', (e) => {
  console.log('Clicked:', e.detail.node.label);
});

graph.addEventListener('@snice/node-drag', (e) => {
  console.log(`Dragged ${e.detail.node.id} to (${e.detail.x}, ${e.detail.y})`);
});

graph.addEventListener('@snice/graph-zoom', (e) => {
  console.log('Zoom:', e.detail.scale);
});
```

### Disabling Interaction

```html
<!-- Static display, no drag or zoom -->
<snice-network-graph zoom-enabled="false" drag-enabled="false"></snice-network-graph>
```

## Interaction

- **Drag nodes**: Click and drag any node to reposition it. The node becomes pinned.
- **Unpin nodes**: Double-click a pinned node to release it back to the simulation.
- **Pan**: Click and drag on the background to pan the view.
- **Zoom**: Use the mouse wheel to zoom in/out, centered on the cursor.
- **Hover**: Hovering a node highlights its connected subgraph and dims unconnected nodes.
- **Tooltips**: Hovering shows a tooltip with the node label and connection count.

## Accessibility

- Container has `role="img"` with `aria-label="Network graph visualization"`
- Keyboard navigation is not currently supported (future enhancement)
- Color is not the sole indicator of grouping when labels are shown

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Set a height**: The component needs a height set via CSS (e.g., `height: 500px`) since it uses `contain: layout style paint`
2. **Use groups for automatic coloring**: The 10-color palette handles most use cases
3. **Label important nodes**: Labels provide context beyond color
4. **Tune simulation parameters**: Adjust `charge-strength` and `link-distance` for your data density
5. **Use weight for edge importance**: Heavier edges appear thicker
6. **Pin key nodes**: Use `x`/`y` to anchor important nodes
7. **Disable animation for static layouts**: Set `animation="false"` for circular/grid layouts
8. **Keep graph sizes reasonable**: Performance is best with under 200 nodes
9. **Listen to events**: Use node-click and edge-click for interactive dashboards
10. **Test in both themes**: Colors and borders adapt to light/dark mode
