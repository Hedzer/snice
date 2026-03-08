# snice-flow

Node-based flow/diagram editor with draggable nodes, input/output ports, bezier curve edges, zoom/pan canvas, snap-to-grid, and minimap.

## Properties

```typescript
nodes: FlowNode[] = [];           // attribute: false (set via JS)
edges: FlowEdge[] = [];           // attribute: false (set via JS)
snapToGrid: boolean = true;       // attr: snap-to-grid
gridSize: number = 20;            // attr: grid-size
zoomEnabled: boolean = true;      // attr: zoom-enabled
panEnabled: boolean = true;       // attr: pan-enabled
minimap: boolean = true;
editable: boolean = true;
```

## Types

```typescript
interface FlowNode {
  id: string;
  x: number;
  y: number;
  type?: string;
  data?: Record<string, unknown>;
  label?: string;
  width?: number;        // default: 160
  height?: number;       // default: 80
  inputs?: FlowPort[];
  outputs?: FlowPort[];
  color?: string;        // header background color
  selected?: boolean;
}

interface FlowPort {
  id: string;
  label?: string;
  type?: string;
}

interface FlowEdge {
  id: string;
  source: string;        // node id
  target: string;        // node id
  sourcePort?: string;   // port id
  targetPort?: string;   // port id
  label?: string;
  color?: string;
  animated?: boolean;    // dashed animated stroke
}
```

## Methods

- `addNode(node: FlowNode): void`
- `removeNode(id: string): void` - also removes connected edges
- `addEdge(edge: FlowEdge): void`
- `removeEdge(id: string): void`
- `fitView(): void` - auto-zoom to fit all nodes

## Events

- `node-drag` -> `{ node: FlowNode, x: number, y: number }`
- `node-select` -> `{ node: FlowNode | null }`
- `edge-connect` -> `{ edge: FlowEdge }`
- `edge-disconnect` -> `{ edge: FlowEdge }`
- `canvas-click` -> `{ x: number, y: number }`

## Usage

```html
<snice-flow id="flow" snap-to-grid minimap style="height:450px"></snice-flow>
```

```typescript
flow.nodes = [
  { id: 'a', x: 50, y: 50, label: 'Start',
    outputs: [{ id: 'out', label: 'Out' }] },
  { id: 'b', x: 300, y: 50, label: 'Process',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [{ id: 'out', label: 'Out' }] },
];
flow.edges = [
  { id: 'e1', source: 'a', target: 'b',
    sourcePort: 'out', targetPort: 'in' },
];
```

**CSS Parts:**
- `base` - Outer flow container div
- `canvas` - SVG edge/connection layer
- `nodes` - Node elements container
- `minimap` - Minimap overview panel

## Features

- Draggable nodes with snap-to-grid
- Input/output ports on nodes
- Bezier curve edges with arrow markers
- Draw edges by dragging from port to port
- Zoom (mouse wheel) and pan (drag background)
- Node selection with visual highlight
- Edge selection
- Minimap showing viewport indicator
- Dot grid background
- Animated edge support (dashed flowing)
- Custom node header colors
- Responsive via ResizeObserver
