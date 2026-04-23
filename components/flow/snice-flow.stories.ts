import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-flow';

type Args = {
  snapToGrid?: boolean;
  gridSize?: number;
  minimap?: boolean;
  editable?: boolean;
  zoomEnabled?: boolean;
  panEnabled?: boolean;
};

const basicNodes = [
  { id: 'n1', label: 'Start', x: 40, y: 60, inputs: [], outputs: [{ id: 'o1', label: 'out' }] },
  { id: 'n2', label: 'Process', x: 280, y: 60, inputs: [{ id: 'i1', label: 'in' }], outputs: [{ id: 'o1', label: 'out' }] },
  { id: 'n3', label: 'End', x: 520, y: 60, inputs: [{ id: 'i1', label: 'in' }], outputs: [] },
];
const basicEdges = [
  { id: 'e1', source: 'n1', target: 'n2', sourcePort: 'o1', targetPort: 'i1' },
  { id: 'e2', source: 'n2', target: 'n3', sourcePort: 'o1', targetPort: 'i1' },
];

const meta: Meta<Args> = {
  title: 'Flow',
  component: 'snice-flow',
  tags: ['autodocs'],
  argTypes: {
    snapToGrid:  { control: 'boolean' },
    gridSize:    { control: 'number' },
    minimap:     { control: 'boolean' },
    editable:    { control: 'boolean' },
    zoomEnabled: { control: 'boolean' },
    panEnabled:  { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    if (args.snapToGrid  === false) el.setAttribute('snap-to-grid',  'false');
    if (args.gridSize    !== undefined) el.setAttribute('grid-size', String(args.gridSize));
    if (args.minimap     === false) el.setAttribute('minimap',       'false');
    if (args.editable    === false) el.setAttribute('editable',      'false');
    if (args.zoomEnabled === false) el.setAttribute('zoom-enabled',  'false');
    if (args.panEnabled  === false) el.setAttribute('pan-enabled',   'false');
    (el as any).nodes = basicNodes;
    (el as any).edges = basicEdges;
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { snapToGrid: true, minimap: true, editable: true, zoomEnabled: true, panEnabled: true } };

// h2: Basic Flow (snap-to-grid, zoom, pan, minimap, editable)
export const BasicFlow: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    (el as any).nodes = basicNodes;
    (el as any).edges = basicEdges;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: snap-to-grid: false
export const SnapToGridFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    el.setAttribute('snap-to-grid', 'false');
    (el as any).nodes = [
      { id: 'a', label: 'Input', x: 50, y: 80, outputs: [{ id: 'o1', label: 'out' }] },
      { id: 'b', label: 'Output', x: 300, y: 80, inputs: [{ id: 'i1', label: 'in' }] },
    ];
    (el as any).edges = [{ id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: grid-size: 40
export const GridSize40: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    el.setAttribute('grid-size', '40');
    (el as any).nodes = [
      { id: 'a', label: 'Node A', x: 40, y: 80, outputs: [{ id: 'o1', label: 'out' }] },
      { id: 'b', label: 'Node B', x: 320, y: 80, inputs: [{ id: 'i1', label: 'in' }] },
    ];
    (el as any).edges = [{ id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: minimap: false
export const MinimapFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    el.setAttribute('minimap', 'false');
    (el as any).nodes = [
      { id: 'a', label: 'Alpha', x: 60, y: 60, outputs: [{ id: 'o1' }] },
      { id: 'b', label: 'Beta', x: 300, y: 60, inputs: [{ id: 'i1' }] },
    ];
    (el as any).edges = [{ id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: editable: false (read-only)
export const EditableFalseReadOnly: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    el.setAttribute('editable', 'false');
    (el as any).nodes = [
      { id: 'a', label: 'Source', x: 60, y: 60, outputs: [{ id: 'o1' }], color: '#2563eb' },
      { id: 'b', label: 'Transform', x: 280, y: 60, inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }], color: '#9333ea' },
      { id: 'c', label: 'Sink', x: 500, y: 60, inputs: [{ id: 'i1' }], color: '#16a34a' },
    ];
    (el as any).edges = [
      { id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e2', source: 'b', target: 'c', sourcePort: 'o1', targetPort: 'i1' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Multiple Input/Output Ports
export const MultipleInputOutputPorts: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:500px;';
    (el as any).nodes = [
      { id: 'src', label: 'Data Source', x: 40, y: 40, width: 180, height: 120, outputs: [{ id: 'o1', label: 'success' }, { id: 'o2', label: 'error' }] },
      { id: 'ok', label: 'Success Handler', x: 320, y: 20, inputs: [{ id: 'i1', label: 'data' }], outputs: [{ id: 'o1', label: 'out' }], color: '#16a34a' },
      { id: 'err', label: 'Error Handler', x: 320, y: 160, inputs: [{ id: 'i1', label: 'error' }], color: '#dc2626' },
      { id: 'log', label: 'Logger', x: 560, y: 20, inputs: [{ id: 'i1', label: 'in' }] },
    ];
    (el as any).edges = [
      { id: 'e1', source: 'src', target: 'ok', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e2', source: 'src', target: 'err', sourcePort: 'o2', targetPort: 'i1' },
      { id: 'e3', source: 'ok', target: 'log', sourcePort: 'o1', targetPort: 'i1' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Node Types + Colors
export const NodeTypesColors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:500px;';
    (el as any).nodes = [
      { id: 'a', label: 'Input', type: 'source', x: 40, y: 80, color: '#2563eb', outputs: [{ id: 'o1' }] },
      { id: 'b', label: 'Filter', type: 'transform', x: 260, y: 40, color: '#f59e0b', inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }] },
      { id: 'c', label: 'Map', type: 'transform', x: 260, y: 160, color: '#9333ea', inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }] },
      { id: 'd', label: 'Output', type: 'sink', x: 480, y: 100, color: '#16a34a', inputs: [{ id: 'i1' }, { id: 'i2' }] },
    ];
    (el as any).edges = [
      { id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e2', source: 'a', target: 'c', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e3', source: 'b', target: 'd', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e4', source: 'c', target: 'd', sourcePort: 'o1', targetPort: 'i2' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Edge Labels + Colors + Animation
export const EdgeLabelsColorsAnimation: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:500px;';
    (el as any).nodes = [
      { id: 'a', label: 'API', x: 40, y: 80, outputs: [{ id: 'o1' }] },
      { id: 'b', label: 'Cache', x: 280, y: 40, inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }] },
      { id: 'c', label: 'DB', x: 280, y: 160, inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }] },
      { id: 'd', label: 'Response', x: 520, y: 80, inputs: [{ id: 'i1' }, { id: 'i2' }] },
    ];
    (el as any).edges = [
      { id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1', label: 'fast path', color: '#16a34a' },
      { id: 'e2', source: 'a', target: 'c', sourcePort: 'o1', targetPort: 'i1', label: 'slow path', color: '#dc2626', animated: true },
      { id: 'e3', source: 'b', target: 'd', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e4', source: 'c', target: 'd', sourcePort: 'o1', targetPort: 'i2' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Custom Node Dimensions
export const CustomNodeDimensions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    (el as any).nodes = [
      { id: 'a', label: 'Narrow', x: 40, y: 60, width: 100, height: 60, outputs: [{ id: 'o1' }] },
      { id: 'b', label: 'Wide Node', x: 200, y: 40, width: 220, height: 100, inputs: [{ id: 'i1' }], outputs: [{ id: 'o1' }] },
      { id: 'c', label: 'Tall', x: 480, y: 20, width: 120, height: 140, inputs: [{ id: 'i1' }] },
    ];
    (el as any).edges = [
      { id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' },
      { id: 'e2', source: 'b', target: 'c', sourcePort: 'o1', targetPort: 'i1' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: zoom-enabled: false, pan-enabled: false
export const ZoomEnabledFalsePanEnabledFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-flow');
    el.style.cssText = 'display:block;height:400px;';
    el.setAttribute('zoom-enabled', 'false');
    el.setAttribute('pan-enabled', 'false');
    (el as any).nodes = [
      { id: 'a', label: 'Fixed View', x: 60, y: 60, outputs: [{ id: 'o1' }] },
      { id: 'b', label: 'No Zoom/Pan', x: 300, y: 60, inputs: [{ id: 'i1' }] },
    ];
    (el as any).edges = [{ id: 'e1', source: 'a', target: 'b', sourcePort: 'o1', targetPort: 'i1' }];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Available parts: base, canvas, nodes, minimap
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    // Default
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    const defaultEl = document.createElement('snice-flow');
    defaultEl.style.cssText = 'display:block;height:300px;';
    (defaultEl as any).nodes = basicNodes;
    (defaultEl as any).edges = basicEdges;
    wrap.appendChild(defaultLabel);
    wrap.appendChild(defaultEl);

    // Styled with ::part()
    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-flow';

    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-flow snice-flow::part(base) {
        border: 2px solid #7c3aed;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 0 40px rgba(124,58,237,0.25);
      }
      .parts-demo-flow snice-flow::part(canvas) {
        stroke: rgba(124,58,237,0.4);
      }
      .parts-demo-flow snice-flow::part(nodes) {
        filter: drop-shadow(0 2px 8px rgba(124,58,237,0.4));
      }
      .parts-demo-flow snice-flow::part(minimap) {
        background: rgba(15,10,30,0.9);
        border: 1px solid #7c3aed;
        border-radius: 6px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      }
    `;
    styledSection.appendChild(style);

    const styledEl = document.createElement('snice-flow');
    styledEl.style.cssText = 'display:block;height:300px;';
    (styledEl as any).nodes = basicNodes;
    (styledEl as any).edges = basicEdges;
    styledSection.appendChild(styledEl);
    wrap.appendChild(styledSection);

    return wrap;
  },
};
