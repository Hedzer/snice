import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-network-graph';

type Args = {
  layout?: string;
  showLabels?: boolean;
  zoomEnabled?: boolean;
  dragEnabled?: boolean;
  animation?: boolean;
  chargeStrength?: number;
  linkDistance?: number;
};

const basicData = {
  nodes: [
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
    { id: 'c', label: 'Charlie' },
    { id: 'd', label: 'Diana' },
    { id: 'e', label: 'Eve' },
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
    { source: 'c', target: 'd' },
    { source: 'd', target: 'e' },
    { source: 'e', target: 'a' },
    { source: 'a', target: 'c' },
  ],
};

function makeGraph(attrs: Record<string, string | boolean | number>, data: object, style?: string) {
  const el = document.createElement('snice-network-graph');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  el.style.cssText = style ?? 'display:block;height:350px;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;overflow:hidden;';
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'NetworkGraph',
  component: 'snice-network-graph',
  tags: ['autodocs'],
  argTypes: {
    layout: { control: 'select', options: ['force', 'circular', 'grid'] },
    showLabels: { control: 'boolean' },
    zoomEnabled: { control: 'boolean' },
    dragEnabled: { control: 'boolean' },
    animation: { control: 'boolean' },
    chargeStrength: { control: 'number' },
    linkDistance: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-network-graph');
    if (args.layout !== undefined) el.setAttribute('layout', String(args.layout));
    if (args.showLabels !== undefined) el.setAttribute('show-labels', String(args.showLabels));
    if (args.zoomEnabled !== undefined) el.setAttribute('zoom-enabled', String(args.zoomEnabled));
    if (args.dragEnabled !== undefined) el.setAttribute('drag-enabled', String(args.dragEnabled));
    if (args.animation !== undefined) el.setAttribute('animation', String(args.animation));
    if (args.chargeStrength !== undefined) el.setAttribute('charge-strength', String(args.chargeStrength));
    if (args.linkDistance !== undefined) el.setAttribute('link-distance', String(args.linkDistance));
    el.style.cssText = 'display:block;height:350px;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;overflow:hidden;';
    (el as any).data = basicData;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { layout: 'force', showLabels: true } };

// h2: Layout: force (default)
export const LayoutForce: Story = {
  render: () => makeGraph({ layout: 'force' }, basicData),
};

// h2: Layout: circular
export const LayoutCircular: Story = {
  render: () => makeGraph({ layout: 'circular' }, basicData),
};

// h2: Layout: grid
export const LayoutGrid: Story = {
  render: () => makeGraph({ layout: 'grid' }, basicData),
};

// h2: Show labels: true (default)
export const ShowLabelsTrue: Story = {
  render: () => makeGraph({ layout: 'circular', 'show-labels': true }, basicData),
};

// h2: Show labels: false
export const ShowLabelsFalse: Story = {
  render: () => makeGraph({ layout: 'circular', 'show-labels': false }, basicData),
};

// h2: Zoom enabled: true (default)
export const ZoomEnabledTrue: Story = {
  render: () => makeGraph({ layout: 'circular', 'zoom-enabled': true }, basicData),
};

// h2: Zoom enabled: false
export const ZoomEnabledFalse: Story = {
  render: () => makeGraph({ layout: 'circular', 'zoom-enabled': false }, basicData),
};

// h2: Drag enabled: true (default)
export const DragEnabledTrue: Story = {
  render: () => makeGraph({ layout: 'circular', 'drag-enabled': true }, basicData),
};

// h2: Drag enabled: false
export const DragEnabledFalse: Story = {
  render: () => makeGraph({ layout: 'circular', 'drag-enabled': false }, basicData),
};

// h2: Animation: true (default, force layout)
export const AnimationTrue: Story = {
  render: () => makeGraph({ layout: 'force', animation: true }, basicData),
};

// h2: Animation: false (force layout, static positions)
export const AnimationFalse: Story = {
  render: () => makeGraph({ layout: 'force', animation: false }, basicData),
};

// h2: Charge strength: -100 (weak repulsion)
export const ChargeStrengthWeak: Story = {
  render: () => makeGraph({ layout: 'force', 'charge-strength': -100 }, basicData),
};

// h2: Charge strength: -500 (strong repulsion)
export const ChargeStrengthStrong: Story = {
  render: () => makeGraph({ layout: 'force', 'charge-strength': -500 }, basicData),
};

// h2: Link distance: 40 (short)
export const LinkDistanceShort: Story = {
  render: () => makeGraph({ layout: 'force', 'link-distance': 40 }, basicData),
};

// h2: Link distance: 150 (long)
export const LinkDistanceLong: Story = {
  render: () => makeGraph({ layout: 'force', 'link-distance': 150 }, basicData),
};

// h2: Nodes with groups (auto color-coded)
export const NodesWithGroups: Story = {
  render: () => makeGraph({ layout: 'force' }, {
    nodes: [
      { id: 'a', label: 'Alice', group: 'Engineering' },
      { id: 'b', label: 'Bob', group: 'Engineering' },
      { id: 'c', label: 'Charlie', group: 'Design' },
      { id: 'd', label: 'Diana', group: 'Design' },
      { id: 'e', label: 'Eve', group: 'Marketing' },
      { id: 'f', label: 'Frank', group: 'Marketing' },
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
      { source: 'e', target: 'f' },
      { source: 'a', target: 'c' },
      { source: 'b', target: 'e' },
    ],
  }),
};

// h2: Nodes with custom colors
export const NodesWithCustomColors: Story = {
  render: () => makeGraph({ layout: 'circular' }, {
    nodes: [
      { id: 'r', label: 'Red', color: 'rgb(220 38 38)' },
      { id: 'g', label: 'Green', color: 'rgb(22 163 74)' },
      { id: 'b', label: 'Blue', color: 'rgb(37 99 235)' },
      { id: 'p', label: 'Purple', color: 'rgb(147 51 234)' },
    ],
    edges: [
      { source: 'r', target: 'g' },
      { source: 'g', target: 'b' },
      { source: 'b', target: 'p' },
      { source: 'p', target: 'r' },
    ],
  }),
};

// h2: Nodes with custom sizes
export const NodesWithCustomSizes: Story = {
  render: () => makeGraph({ layout: 'circular' }, {
    nodes: [
      { id: 'sm', label: 'Small (6)', size: 6 },
      { id: 'md', label: 'Medium (12)', size: 12 },
      { id: 'lg', label: 'Large (20)', size: 20 },
      { id: 'xl', label: 'XLarge (30)', size: 30 },
    ],
    edges: [
      { source: 'sm', target: 'md' },
      { source: 'md', target: 'lg' },
      { source: 'lg', target: 'xl' },
    ],
  }),
};

// h2: Edges with labels
export const EdgesWithLabels: Story = {
  render: () => makeGraph({ layout: 'circular' }, {
    nodes: [
      { id: 'a', label: 'Server' },
      { id: 'b', label: 'Database' },
      { id: 'c', label: 'Cache' },
    ],
    edges: [
      { source: 'a', target: 'b', label: 'queries' },
      { source: 'a', target: 'c', label: 'reads' },
      { source: 'c', target: 'b', label: 'invalidates' },
    ],
  }),
};

// h2: Edges with weights (stroke widths)
export const EdgesWithWeights: Story = {
  render: () => makeGraph({ layout: 'circular' }, {
    nodes: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
      { id: 'd', label: 'D' },
    ],
    edges: [
      { source: 'a', target: 'b', weight: 1 },
      { source: 'b', target: 'c', weight: 3 },
      { source: 'c', target: 'd', weight: 5 },
      { source: 'd', target: 'a', weight: 2 },
    ],
  }),
};

// h2: Edges with custom colors
export const EdgesWithCustomColors: Story = {
  render: () => makeGraph({ layout: 'circular' }, {
    nodes: [
      { id: 'a', label: 'Node A' },
      { id: 'b', label: 'Node B' },
      { id: 'c', label: 'Node C' },
    ],
    edges: [
      { source: 'a', target: 'b', color: 'rgb(220 38 38)' },
      { source: 'b', target: 'c', color: 'rgb(22 163 74)' },
      { source: 'c', target: 'a', color: 'rgb(37 99 235)' },
    ],
  }),
};

// h2: Single node
export const SingleNode: Story = {
  render: () => makeGraph({ layout: 'force' }, { nodes: [{ id: 'solo', label: 'Solo Node' }], edges: [] }),
};

// h2: Two connected nodes
export const TwoConnectedNodes: Story = {
  render: () => makeGraph({ layout: 'force' }, {
    nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    edges: [{ source: 'a', target: 'b' }],
  }),
};

// h2: Disconnected nodes
export const DisconnectedNodes: Story = {
  render: () => makeGraph({ layout: 'force' }, {
    nodes: [{ id: 'a', label: 'Island A' }, { id: 'b', label: 'Island B' }, { id: 'c', label: 'Island C' }],
    edges: [],
  }),
};

// h2: Dense graph (many connections)
export const DenseGraph: Story = {
  render: () => {
    const nodes = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, label: `N${i}`, group: `g${i % 3}` }));
    const edges: { source: string; target: string }[] = [];
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        if ((i + j) % 3 === 0) edges.push({ source: `n${i}`, target: `n${j}` });
      }
    }
    return makeGraph({ layout: 'force' }, { nodes, edges });
  },
};

// h2: Empty graph
export const EmptyGraph: Story = {
  render: () => {
    const el = document.createElement('snice-network-graph');
    el.style.cssText = 'display:block;height:350px;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;overflow:hidden;';
    return el;
  },
};

// h2: All disabled: no zoom, no drag, no labels
export const AllDisabledNoZoomNoDragNoLabels: Story = {
  render: () => makeGraph({ layout: 'circular', 'zoom-enabled': false, 'drag-enabled': false, 'show-labels': false }, basicData),
};

// h2: CSS Parts Styling
// Available parts: base, canvas, tooltip
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .network-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
      .network-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .network-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outermost container */
      .network-parts-demo--styled snice-network-graph::part(base) {
        background: radial-gradient(ellipse at center, #0f1729 0%, #060d1f 100%);
        border-radius: 16px;
        border: 1px solid rgba(56,189,248,0.3);
        box-shadow: 0 0 60px rgba(56,189,248,0.1), 0 8px 32px rgba(0,0,0,0.6);
      }

      /* Styled: ::part(canvas) - the SVG drawing surface */
      .network-parts-demo--styled snice-network-graph::part(canvas) {
        border-radius: 14px;
        overflow: hidden;
      }

      /* Styled: ::part(tooltip) - hover node tooltip */
      .network-parts-demo--styled snice-network-graph::part(tooltip) {
        background: #0c4a6e;
        color: #bae6fd;
        border: 1px solid #38bdf8;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: monospace;
        box-shadow: 0 0 20px rgba(56,189,248,0.4);
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'network-parts-demo';

    const graphStyle = 'display:block;height:320px;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;overflow:hidden;';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'network-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'network-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeGraph({ layout: 'circular', 'show-labels': true }, basicData, graphStyle));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'network-parts-demo__item network-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'network-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(canvas) ::part(tooltip)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeGraph({ layout: 'circular', 'show-labels': true }, basicData, 'display:block;height:320px;border-radius:16px;overflow:hidden;'));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};
