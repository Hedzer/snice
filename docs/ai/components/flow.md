# snice-flow

Node-based flow/diagram editor with draggable nodes, input/output ports, bezier curve edges, zoom/pan canvas, snap-to-grid, and minimap.

## Properties

```typescript
nodes: FlowNode[] = [];           // attribute: false (set via JS)
edges: FlowEdge[] = [];           // attribute: false (set via JS)
snapToGrid: boolean = true;       // attribute: snap-to-grid
gridSize: number = 20;            // attribute: grid-size
zoomEnabled: boolean = true;      // attribute: zoom-enabled
panEnabled: boolean = true;       // attribute: pan-enabled
minimap: boolean = true;
editable: boolean = true;
```

```typescript
interface FlowNode {
  id: string; x: number; y: number;
  type?: string; data?: Record<string, unknown>; label?: string;
  width?: number; height?: number; // defaults: 160, 80
  inputs?: FlowPort[]; outputs?: FlowPort[];
  color?: string; selected?: boolean;
}
interface FlowPort { id: string; label?: string; type?: string; }
interface FlowEdge {
  id: string; source: string; target: string;
  sourcePort?: string; targetPort?: string;
  label?: string; color?: string; animated?: boolean;
}
```

## Methods

- `addNode(node: FlowNode)` - Add a node
- `removeNode(id: string)` - Remove node and connected edges
- `addEdge(edge: FlowEdge)` - Add an edge
- `removeEdge(id: string)` - Remove an edge
- `fitView()` - Auto-zoom to fit all nodes

## Events

- `node-drag` → `{ node: FlowNode, x: number, y: number }`
- `node-select` → `{ node: FlowNode | null }`
- `edge-connect` → `{ edge: FlowEdge }`
- `edge-disconnect` → `{ edge: FlowEdge }`
- `canvas-click` → `{ x: number, y: number }`

## CSS Parts

- `base` - Root flow editor container
- `grid` - Background grid layer
- `grid-svg` - SVG holding the grid pattern
- `canvas` - Edge SVG canvas
- `edge` - An edge path
- `edge-label` - An edge label
- `edge-preview` - The edge being drawn from a port
- `nodes` - Node layer
- `node` - A node card
- `node-header` - Node header bar
- `node-type` - Node type chip in the header
- `node-label` - Node label in the header
- `node-body` - Node body
- `node-inputs` - Input port column
- `node-outputs` - Output port column
- `port` - A node port
- `port-input` - An input `port`
- `port-output` - An output `port`
- `port-dot` - Connector dot of a port
- `port-label` - Label of a port
- `minimap` - Minimap container
- `minimap-svg` - Minimap SVG
- `minimap-edge` - An edge line in the minimap
- `minimap-node` - A node rectangle in the minimap
- `minimap-viewport` - Viewport indicator in the minimap

State tokens:

- `edge-selected` - Added to `edge` while it is selected
- `edge-animated` - Added to `edge` while it is animated
- `node-selected` - Added to `node` while it is selected
- `node-dragging` - Added to `node` while it is being dragged
- `port-connected` - Added to `port` while it has a connection

## Basic Usage

```typescript
import 'snice/components/flow/snice-flow';
```

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
flow.addNode({ id: 'c', x: 500, y: 50, label: 'End', inputs: [{ id: 'in' }] });
flow.fitView();
```
