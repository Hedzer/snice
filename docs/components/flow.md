<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/flow.md -->

# Flow

A node-based flow/diagram editor component for building visual workflows, data pipelines, and node graphs. Features draggable nodes with input/output ports, bezier curve edges, zoom/pan canvas, snap-to-grid, and a minimap overview.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodes` | `FlowNode[]` | `[]` | Array of node definitions (set via JS) |
| `edges` | `FlowEdge[]` | `[]` | Array of edge definitions (set via JS) |
| `snapToGrid` (attr: `snap-to-grid`) | `boolean` | `true` | Snap node positions to grid |
| `gridSize` (attr: `grid-size`) | `number` | `20` | Grid spacing in pixels |
| `zoomEnabled` (attr: `zoom-enabled`) | `boolean` | `true` | Enable mouse wheel zoom |
| `panEnabled` (attr: `pan-enabled`) | `boolean` | `true` | Enable background pan |
| `minimap` | `boolean` | `true` | Show minimap overview |
| `editable` | `boolean` | `true` | Allow drawing new edges |

### FlowNode Interface

```typescript
interface FlowNode {
  id: string;
  x: number;
  y: number;
  type?: string;                    // Shown as small label above title
  data?: Record<string, unknown>;   // Custom data payload
  label?: string;                   // Node title
  width?: number;                   // Default: 160
  height?: number;                  // Default: 80
  inputs?: FlowPort[];              // Input ports (left side)
  outputs?: FlowPort[];             // Output ports (right side)
  color?: string;                   // Header background color
  selected?: boolean;
}

interface FlowPort {
  id: string;
  label?: string;
  type?: string;
}
```

### FlowEdge Interface

```typescript
interface FlowEdge {
  id: string;
  source: string;          // Source node id
  target: string;          // Target node id
  sourcePort?: string;     // Source port id
  targetPort?: string;     // Target port id
  label?: string;          // Edge label (shown at midpoint)
  color?: string;          // Custom stroke color
  animated?: boolean;      // Dashed animated stroke
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addNode(node)` | `node: FlowNode` | Add a node to the canvas |
| `removeNode(id)` | `id: string` | Remove a node and its connected edges |
| `addEdge(edge)` | `edge: FlowEdge` | Add an edge between two ports |
| `removeEdge(id)` | `id: string` | Remove an edge |
| `fitView()` | -- | Auto-zoom to fit all nodes in view |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `node-drag` | `{ node: FlowNode, x: number, y: number }` | Node was dragged to new position |
| `node-select` | `{ node: FlowNode \| null }` | Node selected (null when deselected) |
| `edge-connect` | `{ edge: FlowEdge }` | New edge created by dragging between ports |
| `edge-disconnect` | `{ edge: FlowEdge }` | Edge removed |
| `canvas-click` | `{ x: number, y: number }` | Background canvas clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer flow container |
| `canvas` | SVG layer for edges and connections |
| `nodes` | Container for all node elements |
| `minimap` | Minimap overview panel |

```css
snice-flow::part(base) {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
}

snice-flow::part(minimap) {
  opacity: 0.8;
}
```

## Basic Usage

```typescript
import 'snice/components/flow/snice-flow';
```

```html
<snice-flow id="flow" snap-to-grid minimap style="height: 450px;"></snice-flow>

<script type="module">
  const flow = document.getElementById('flow');
  flow.nodes = [
    { id: 'start', x: 50, y: 100, label: 'Start',
      outputs: [{ id: 'out', label: 'Out' }] },
    { id: 'process', x: 300, y: 80, label: 'Process',
      inputs: [{ id: 'in', label: 'In' }],
      outputs: [{ id: 'out', label: 'Out' }] },
    { id: 'end', x: 550, y: 100, label: 'End',
      inputs: [{ id: 'in', label: 'In' }] },
  ];
  flow.edges = [
    { id: 'e1', source: 'start', target: 'process',
      sourcePort: 'out', targetPort: 'in' },
    { id: 'e2', source: 'process', target: 'end',
      sourcePort: 'out', targetPort: 'in' },
  ];
</script>
```

## Examples

### Data Pipeline

Build a data processing pipeline with typed nodes and colored headers:

```html
<snice-flow id="pipeline" snap-to-grid minimap style="height: 500px;"></snice-flow>

<script type="module">
  const flow = document.getElementById('pipeline');
  flow.nodes = [
    {
      id: 'input', x: 40, y: 40, label: 'User Input',
      type: 'trigger', color: 'rgb(22 163 74)',
      outputs: [{ id: 'data', label: 'Data' }],
    },
    {
      id: 'validate', x: 280, y: 40, label: 'Validate',
      type: 'transform', color: 'rgb(37 99 235)',
      inputs: [{ id: 'in', label: 'Input' }],
      outputs: [{ id: 'valid', label: 'Valid' }, { id: 'error', label: 'Error' }],
    },
    {
      id: 'save', x: 520, y: 40, label: 'Save to DB',
      type: 'action', color: 'rgb(147 51 234)',
      inputs: [{ id: 'data', label: 'Data' }],
    },
  ];
  flow.edges = [
    { id: 'e1', source: 'input', target: 'validate',
      sourcePort: 'data', targetPort: 'in' },
    { id: 'e2', source: 'validate', target: 'save',
      sourcePort: 'valid', targetPort: 'data' },
  ];
</script>
```

### Animated Edges

Add `animated: true` to an edge for a flowing dashed animation:

```javascript
flow.edges = [
  { id: 'e1', source: 'a', target: 'b',
    sourcePort: 'out', targetPort: 'in',
    animated: true, color: 'rgb(220 38 38)' },
];
```

### Programmatic API

```javascript
flow.addNode({
  id: 'new-node', x: 200, y: 200, label: 'New Node',
  inputs: [{ id: 'in', label: 'In' }],
  outputs: [{ id: 'out', label: 'Out' }],
});

flow.addEdge({
  id: 'new-edge', source: 'start', target: 'new-node',
  sourcePort: 'out', targetPort: 'in',
});

flow.removeNode('new-node'); // also removes connected edges
flow.removeEdge('new-edge');

flow.fitView();
```

### Interaction

- **Drag nodes**: Click and drag a node to move it. Snaps to grid if enabled.
- **Draw edges**: Click and drag from a port dot to another port dot.
- **Pan canvas**: Click and drag on the background.
- **Zoom**: Mouse wheel to zoom in/out around cursor.
- **Select node**: Click a node to select it (blue highlight).
- **Select edge**: Click an edge to select it.
- **Deselect**: Click on the canvas background.
