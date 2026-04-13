import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-sankey';

type Args = {
  alignment?: string;
  showLabels?: boolean;
  showValues?: boolean;
  animation?: boolean;
  nodeWidth?: number;
  nodePadding?: number;
};

const basicData = {
  nodes: [
    { id: 'source1', label: 'Organic Search' },
    { id: 'source2', label: 'Paid Ads' },
    { id: 'source3', label: 'Social Media' },
    { id: 'mid1', label: 'Landing Page' },
    { id: 'mid2', label: 'Product Page' },
    { id: 'end1', label: 'Purchase' },
    { id: 'end2', label: 'Bounce' },
  ],
  links: [
    { source: 'source1', target: 'mid1', value: 500 },
    { source: 'source1', target: 'mid2', value: 300 },
    { source: 'source2', target: 'mid1', value: 400 },
    { source: 'source3', target: 'mid2', value: 200 },
    { source: 'mid1', target: 'end1', value: 600 },
    { source: 'mid1', target: 'end2', value: 300 },
    { source: 'mid2', target: 'end1', value: 350 },
    { source: 'mid2', target: 'end2', value: 150 },
  ],
};

function makeSankey(attrs: Record<string, string | number | boolean>, data: object, style?: string) {
  const el = document.createElement('snice-sankey');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  el.style.cssText = style ?? 'display:block;width:100%;height:350px;';
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Sankey',
  component: 'snice-sankey',
  tags: ['autodocs'],
  argTypes: {
    alignment: { control: 'select', options: ['left', 'right', 'center', 'justify'] },
    showLabels: { control: 'boolean' },
    showValues: { control: 'boolean' },
    animation: { control: 'boolean' },
    nodeWidth: { control: 'number' },
    nodePadding: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-sankey');
    if (args.alignment !== undefined) el.setAttribute('alignment', String(args.alignment));
    if (args.showLabels) el.toggleAttribute('show-labels', true);
    if (args.showValues) el.toggleAttribute('show-values', true);
    if (args.animation) el.toggleAttribute('animation', true);
    if (args.nodeWidth !== undefined) el.setAttribute('node-width', String(args.nodeWidth));
    if (args.nodePadding !== undefined) el.setAttribute('node-padding', String(args.nodePadding));
    el.style.cssText = 'display:block;width:100%;height:350px;';
    (el as any).data = basicData;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { alignment: 'justify', showLabels: true, showValues: true } };

// h2: Default (justify alignment, labels + values)
export const DefaultJustifyLabelsValues: Story = {
  render: () => makeSankey({ 'show-labels': true, 'show-values': true }, basicData),
};

// h2: Alignment: left
export const AlignmentLeft: Story = {
  render: () => makeSankey({ alignment: 'left' }, basicData),
};

// h2: Alignment: right
export const AlignmentRight: Story = {
  render: () => makeSankey({ alignment: 'right' }, basicData),
};

// h2: Alignment: center
export const AlignmentCenter: Story = {
  render: () => makeSankey({ alignment: 'center' }, basicData),
};

// h2: Alignment: justify (default)
export const AlignmentJustify: Story = {
  render: () => makeSankey({ alignment: 'justify' }, basicData),
};

// h2: show-labels="false"
export const ShowLabelsFalse: Story = {
  render: () => makeSankey({ 'show-labels': false }, basicData),
};

// h2: show-values="false"
export const ShowValuesFalse: Story = {
  render: () => makeSankey({ 'show-values': false }, basicData),
};

// h2: show-labels="false" show-values="false"
export const ShowLabelsFalseShowValuesFalse: Story = {
  render: () => makeSankey({ 'show-labels': false, 'show-values': false }, basicData),
};

// h2: Animation: true
export const AnimationTrue: Story = {
  render: () => makeSankey({ animation: true }, basicData),
};

// h2: Custom node-width="30"
export const CustomNodeWidth30: Story = {
  render: () => makeSankey({ 'node-width': 30 }, basicData),
};

// h2: Custom node-padding="20"
export const CustomNodePadding20: Story = {
  render: () => makeSankey({ 'node-padding': 20 }, basicData),
};

// h2: Custom node colors
export const CustomNodeColors: Story = {
  render: () => makeSankey({}, {
    nodes: [
      { id: 'a', label: 'Revenue', color: '#4caf50' },
      { id: 'b', label: 'Expenses', color: '#f44336' },
      { id: 'c', label: 'Profit', color: '#2196f3' },
      { id: 'd', label: 'Tax', color: '#ff9800' },
    ],
    links: [
      { source: 'a', target: 'c', value: 700 },
      { source: 'a', target: 'b', value: 300 },
      { source: 'c', target: 'd', value: 200 },
    ],
  }),
};

// h2: Custom link colors
export const CustomLinkColors: Story = {
  render: () => makeSankey({}, {
    nodes: [
      { id: 'x', label: 'Input A' },
      { id: 'y', label: 'Input B' },
      { id: 'z', label: 'Output' },
    ],
    links: [
      { source: 'x', target: 'z', value: 400, color: '#e91e63' },
      { source: 'y', target: 'z', value: 600, color: '#00bcd4' },
    ],
  }),
};

// h2: Many nodes (complex flow)
export const ManyNodesComplexFlow: Story = {
  render: () => makeSankey({}, {
    nodes: [
      { id: 'budget', label: 'Budget' },
      { id: 'eng', label: 'Engineering' },
      { id: 'mkt', label: 'Marketing' },
      { id: 'ops', label: 'Operations' },
      { id: 'hr', label: 'HR' },
      { id: 'sal', label: 'Salaries' },
      { id: 'tools', label: 'Tools' },
      { id: 'ads', label: 'Advertising' },
      { id: 'events', label: 'Events' },
      { id: 'infra', label: 'Infrastructure' },
      { id: 'benefits', label: 'Benefits' },
    ],
    links: [
      { source: 'budget', target: 'eng', value: 500 },
      { source: 'budget', target: 'mkt', value: 300 },
      { source: 'budget', target: 'ops', value: 200 },
      { source: 'budget', target: 'hr', value: 150 },
      { source: 'eng', target: 'sal', value: 350 },
      { source: 'eng', target: 'tools', value: 150 },
      { source: 'mkt', target: 'ads', value: 200 },
      { source: 'mkt', target: 'events', value: 100 },
      { source: 'ops', target: 'infra', value: 150 },
      { source: 'ops', target: 'tools', value: 50 },
      { source: 'hr', target: 'sal', value: 50 },
      { source: 'hr', target: 'benefits', value: 100 },
    ],
  }, 'display:block;width:100%;height:500px;'),
};

// h2: Minimal (2 nodes, 1 link)
export const Minimal2Nodes1Link: Story = {
  render: () => makeSankey({}, {
    nodes: [{ id: 'a', label: 'Source' }, { id: 'b', label: 'Target' }],
    links: [{ source: 'a', target: 'b', value: 100 }],
  }, 'display:block;width:100%;height:200px;'),
};

// h2: No data
export const NoData: Story = {
  render: () => {
    const el = document.createElement('snice-sankey');
    el.style.cssText = 'display:block;width:100%;height:350px;';
    return el;
  },
};

// h2: CSS Parts Styling
// Available parts: base, chart, tooltip
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .sankey-parts-demo { display: flex; flex-direction: column; gap: 2rem; }
      .sankey-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .sankey-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outer host wrapper */
      .sankey-parts-demo--styled snice-sankey::part(base) {
        background: #030712;
        border-radius: 16px;
        border: 1px solid rgba(99,102,241,0.25);
        padding: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      }

      /* Styled: ::part(chart) - the SVG rendering area */
      .sankey-parts-demo--styled snice-sankey::part(chart) {
        filter: saturate(1.5) brightness(1.15);
        border-radius: 8px;
      }

      /* Styled: ::part(tooltip) - hover tooltip */
      .sankey-parts-demo--styled snice-sankey::part(tooltip) {
        background: #1e1b4b;
        color: #e0e7ff;
        border: 1px solid #6366f1;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.8rem;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(99,102,241,0.4);
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'sankey-parts-demo';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'sankey-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'sankey-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeSankey({ 'show-labels': true, 'show-values': true }, basicData));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'sankey-parts-demo__item sankey-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'sankey-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(chart) ::part(tooltip)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeSankey({ 'show-labels': true, 'show-values': true }, basicData));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};
