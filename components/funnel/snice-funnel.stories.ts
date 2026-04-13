import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-funnel';

type Args = {
  variant?: string;
  orientation?: string;
  showLabels?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  animation?: boolean;
};

const stages = [
  { label: 'Visitors', value: 10000 },
  { label: 'Leads', value: 6500 },
  { label: 'Qualified', value: 3200 },
  { label: 'Proposals', value: 1800 },
  { label: 'Closed', value: 900 },
];

const coloredStages = [
  { label: 'Visitors', value: 10000, color: '#2563eb' },
  { label: 'Leads', value: 6500, color: '#7c3aed' },
  { label: 'Qualified', value: 3200, color: '#db2777' },
  { label: 'Proposals', value: 1800, color: '#ea580c' },
  { label: 'Closed', value: 900, color: '#16a34a' },
];

const twoStages = [
  { label: 'Start', value: 5000 },
  { label: 'End', value: 1000 },
];

const manyStages = [
  { label: 'Awareness', value: 50000 },
  { label: 'Interest', value: 35000 },
  { label: 'Consideration', value: 20000 },
  { label: 'Intent', value: 12000 },
  { label: 'Evaluation', value: 8000 },
  { label: 'Purchase', value: 5000 },
  { label: 'Retention', value: 3500 },
  { label: 'Advocacy', value: 2000 },
];

function makeFunnel(attrs: Record<string, string | boolean>, data: object[], style?: string) {
  const el = document.createElement('snice-funnel');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  if (style) el.style.cssText = style;
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Funnel',
  component: 'snice-funnel',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'gradient'] },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    showLabels: { control: 'boolean' },
    showValues: { control: 'boolean' },
    showPercentages: { control: 'boolean' },
    animation: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-funnel');
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.orientation !== undefined) el.setAttribute('orientation', String(args.orientation));
    if (args.showLabels) el.toggleAttribute('show-labels', true);
    if (args.showValues) el.toggleAttribute('show-values', true);
    if (args.showPercentages) el.toggleAttribute('show-percentages', true);
    if (args.animation) el.toggleAttribute('animation', true);
    el.style.cssText = 'display:block;max-width:500px;';
    (el as any).data = stages;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'default', orientation: 'vertical', showLabels: true, showValues: true } };

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => makeFunnel({ variant: 'default' }, stages, 'display:block;max-width:500px;'),
};

// h2: Variant: gradient
export const VariantGradient: Story = {
  render: () => makeFunnel({ variant: 'gradient' }, stages, 'display:block;max-width:500px;'),
};

// h2: Orientation: vertical (default)
export const OrientationVertical: Story = {
  render: () => makeFunnel({ orientation: 'vertical' }, stages, 'display:block;max-width:500px;'),
};

// h2: Orientation: horizontal
export const OrientationHorizontal: Story = {
  render: () => makeFunnel({ orientation: 'horizontal' }, stages, 'display:block;max-width:600px;'),
};

// h2: show-labels: true (default)
export const ShowLabelsTrue: Story = {
  render: () => makeFunnel({ 'show-labels': true }, stages, 'display:block;max-width:500px;'),
};

// h2: show-labels: false
export const ShowLabelsFalse: Story = {
  render: () => makeFunnel({ 'show-labels': false }, stages, 'display:block;max-width:500px;'),
};

// h2: show-values: true (default)
export const ShowValuesTrue: Story = {
  render: () => makeFunnel({ 'show-values': true }, stages, 'display:block;max-width:500px;'),
};

// h2: show-values: false
export const ShowValuesFalse: Story = {
  render: () => makeFunnel({ 'show-values': false }, stages, 'display:block;max-width:500px;'),
};

// h2: show-percentages: true (default)
export const ShowPercentagesTrue: Story = {
  render: () => makeFunnel({ 'show-percentages': true }, stages, 'display:block;max-width:500px;'),
};

// h2: show-percentages: false
export const ShowPercentagesFalse: Story = {
  render: () => makeFunnel({ 'show-percentages': false }, stages, 'display:block;max-width:500px;'),
};

// h2: All Labels Hidden
export const AllLabelsHidden: Story = {
  render: () => makeFunnel({ 'show-labels': false, 'show-values': false, 'show-percentages': false }, stages, 'display:block;max-width:500px;'),
};

// h2: Animation: true
export const AnimationTrue: Story = {
  render: () => makeFunnel({ animation: true }, stages, 'display:block;max-width:500px;'),
};

// h2: Custom Stage Colors
export const CustomStageColors: Story = {
  render: () => makeFunnel({}, coloredStages, 'display:block;max-width:500px;'),
};

// h2: Gradient + Horizontal
export const GradientHorizontal: Story = {
  render: () => makeFunnel({ variant: 'gradient', orientation: 'horizontal' }, stages, 'display:block;max-width:600px;'),
};

// h2: Default + Horizontal + Animation
export const DefaultHorizontalAnimation: Story = {
  render: () => makeFunnel({ variant: 'default', orientation: 'horizontal', animation: true }, stages, 'display:block;max-width:600px;'),
};

// h2: Edge: Two Stages Only
export const EdgeTwoStagesOnly: Story = {
  render: () => makeFunnel({}, twoStages, 'display:block;max-width:500px;'),
};

// h2: Edge: Many Stages (8)
export const EdgeManyStages8: Story = {
  render: () => makeFunnel({}, manyStages, 'display:block;max-width:500px;'),
};

// h2: Edge: Labels Only (no values/percentages)
export const EdgeLabelsOnly: Story = {
  render: () => makeFunnel({ 'show-labels': true, 'show-values': false, 'show-percentages': false }, stages, 'display:block;max-width:500px;'),
};

// h2: Edge: Values Only (no labels/percentages)
export const EdgeValuesOnly: Story = {
  render: () => makeFunnel({ 'show-labels': false, 'show-values': true, 'show-percentages': false }, stages, 'display:block;max-width:500px;'),
};

// h2: CSS Parts Styling
// Available parts: base, chart, tooltip
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .funnel-parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .funnel-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .funnel-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outermost wrapper */
      .funnel-parts-demo--styled snice-funnel::part(base) {
        background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
        border-radius: 16px;
        padding: 16px;
        border: 1px solid rgba(99,102,241,0.3);
        box-shadow: 0 8px 32px rgba(99,102,241,0.2);
      }

      /* Styled: ::part(chart) - the SVG chart area */
      .funnel-parts-demo--styled snice-funnel::part(chart) {
        filter: saturate(1.4) brightness(1.1);
        border-radius: 8px;
      }

      /* Styled: ::part(tooltip) - hover tooltip */
      .funnel-parts-demo--styled snice-funnel::part(tooltip) {
        background: #312e81;
        color: #e0e7ff;
        border: 1px solid #4f46e5;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.8rem;
        padding: 6px 12px;
        box-shadow: 0 4px 16px rgba(79,70,229,0.5);
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'funnel-parts-demo';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'funnel-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'funnel-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeFunnel({ 'show-labels': true, 'show-values': true }, stages, 'display:block;max-width:400px;'));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'funnel-parts-demo__item funnel-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'funnel-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(chart) ::part(tooltip)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeFunnel({ 'show-labels': true, 'show-values': true }, coloredStages, 'display:block;max-width:400px;'));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};
