import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-treemap';

type Args = {
  colorScheme?: string;
  showLabels?: boolean;
  showValues?: boolean;
  padding?: number;
  animation?: boolean;
};

const COLOR_SCHEMES = ['default', 'blue', 'green', 'purple', 'orange', 'warm', 'cool', 'rainbow'];

const sampleData = {
  label: 'Portfolio', value: 0,
  children: [
    { label: 'Stocks', value: 450 },
    { label: 'Bonds', value: 280 },
    { label: 'Real Estate', value: 200 },
    { label: 'Crypto', value: 120 },
    { label: 'Cash', value: 80 },
    { label: 'Commodities', value: 60 },
  ],
};

function makeTreemap(attrs: Record<string, string | number | boolean>, data: object, style?: string) {
  const el = document.createElement('snice-treemap');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  el.style.cssText = style ?? 'display:block;height:300px;';
  (el as any).data = JSON.parse(JSON.stringify(data));
  return el;
}

const meta: Meta<Args> = {
  title: 'Treemap',
  component: 'snice-treemap',
  tags: ['autodocs'],
  argTypes: {
    colorScheme: { control: 'select', options: COLOR_SCHEMES },
    showLabels: { control: 'boolean' },
    showValues: { control: 'boolean' },
    padding: { control: 'number' },
    animation: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-treemap');
    if (args.colorScheme !== undefined) el.setAttribute('color-scheme', String(args.colorScheme));
    if (args.showLabels) el.toggleAttribute('show-labels', true);
    if (args.showValues) el.toggleAttribute('show-values', true);
    if (args.padding !== undefined) el.setAttribute('padding', String(args.padding));
    if (args.animation) el.toggleAttribute('animation', true);
    el.style.cssText = 'display:block;height:300px;';
    (el as any).data = JSON.parse(JSON.stringify(sampleData));
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { colorScheme: 'default', showLabels: true } };

// h2: Color Scheme: default
export const ColorSchemeDefault: Story = {
  render: () => makeTreemap({ 'show-labels': true, 'color-scheme': 'default' }, sampleData),
};

// h2: All Color Schemes
export const AllColorSchemes: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:1.5rem;';
    COLOR_SCHEMES.forEach(s => {
      const wrap = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      lbl.textContent = s;
      wrap.appendChild(lbl);
      wrap.appendChild(makeTreemap({ 'show-labels': true, 'color-scheme': s }, sampleData, 'display:block;height:200px;'));
      grid.appendChild(wrap);
    });
    return grid;
  },
};

// h2: Show Labels: true vs false
export const ShowLabelsTrueVsFalse: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const wrap1 = document.createElement('div');
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl1.textContent = 'show-labels';
    wrap1.appendChild(lbl1);
    wrap1.appendChild(makeTreemap({ 'show-labels': true }, sampleData, 'display:block;height:200px;'));
    const wrap2 = document.createElement('div');
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl2.textContent = 'no show-labels';
    wrap2.appendChild(lbl2);
    wrap2.appendChild(makeTreemap({}, sampleData, 'display:block;height:200px;'));
    grid.appendChild(wrap1);
    grid.appendChild(wrap2);
    return grid;
  },
};

// h2: Show Values: true vs false
export const ShowValuesTrueVsFalse: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const wrap1 = document.createElement('div');
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl1.textContent = 'show-values';
    wrap1.appendChild(lbl1);
    wrap1.appendChild(makeTreemap({ 'show-labels': true, 'show-values': true }, sampleData, 'display:block;height:200px;'));
    const wrap2 = document.createElement('div');
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl2.textContent = 'show-labels only';
    wrap2.appendChild(lbl2);
    wrap2.appendChild(makeTreemap({ 'show-labels': true }, sampleData, 'display:block;height:200px;'));
    grid.appendChild(wrap1);
    grid.appendChild(wrap2);
    return grid;
  },
};

// h2: Padding Values
export const PaddingValues: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:1.5rem;';
    [0, 2, 5, 10].forEach(p => {
      const wrap = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      lbl.textContent = `padding=${p}${p === 2 ? ' (default)' : ''}`;
      wrap.appendChild(lbl);
      wrap.appendChild(makeTreemap({ 'show-labels': true, padding: p }, sampleData, 'display:block;height:200px;'));
      grid.appendChild(wrap);
    });
    return grid;
  },
};

// h2: Animation: true (default) vs false
export const AnimationTrueVsFalse: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const wrap1 = document.createElement('div');
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl1.textContent = 'animation=true';
    wrap1.appendChild(lbl1);
    wrap1.appendChild(makeTreemap({ 'show-labels': true, animation: true }, sampleData, 'display:block;height:200px;'));
    const wrap2 = document.createElement('div');
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl2.textContent = 'animation=false';
    wrap2.appendChild(lbl2);
    const el2 = makeTreemap({ 'show-labels': true }, sampleData, 'display:block;height:200px;');
    (el2 as any).animation = false;
    wrap2.appendChild(el2);
    grid.appendChild(wrap1);
    grid.appendChild(wrap2);
    return grid;
  },
};

// h2: Drill-Down (click a cell with children)
export const DrillDown: Story = {
  render: () => {
    const el = document.createElement('snice-treemap');
    el.toggleAttribute('show-labels', true);
    el.toggleAttribute('show-values', true);
    el.style.cssText = 'display:block;height:350px;';
    (el as any).data = {
      label: 'Company', value: 0,
      children: [
        { label: 'Engineering', value: 0, children: [
          { label: 'Frontend', value: 300 },
          { label: 'Backend', value: 250 },
          { label: 'DevOps', value: 150 },
          { label: 'QA', value: 100 },
        ] },
        { label: 'Sales', value: 0, children: [
          { label: 'Enterprise', value: 400 },
          { label: 'SMB', value: 200 },
        ] },
        { label: 'Marketing', value: 180 },
        { label: 'HR', value: 90 },
      ],
    };
    return el;
  },
};

// h2: Custom Node Colors
export const CustomNodeColors: Story = {
  render: () => {
    const el = document.createElement('snice-treemap');
    el.toggleAttribute('show-labels', true);
    el.toggleAttribute('show-values', true);
    el.style.cssText = 'display:block;height:250px;';
    (el as any).data = {
      label: 'Status', value: 0,
      children: [
        { label: 'Passed', value: 85, color: '#22c55e' },
        { label: 'Failed', value: 10, color: '#ef4444' },
        { label: 'Skipped', value: 5, color: '#eab308' },
      ],
    };
    return el;
  },
};

// h2: Many Items (20+)
export const ManyItems: Story = {
  render: () => {
    const el = document.createElement('snice-treemap');
    el.toggleAttribute('show-labels', true);
    el.style.cssText = 'display:block;height:350px;';
    (el as any).data = {
      label: 'Countries', value: 0,
      children: Array.from({ length: 20 }, (_, i) => ({
        label: `Country ${String.fromCharCode(65 + i)}`,
        value: (i + 1) * 50,
      })),
    };
    return el;
  },
};

// h2: Single Item
export const SingleItem: Story = {
  render: () => {
    const el = document.createElement('snice-treemap');
    el.toggleAttribute('show-labels', true);
    el.toggleAttribute('show-values', true);
    el.style.cssText = 'display:block;height:150px;';
    (el as any).data = { label: 'Root', value: 0, children: [{ label: 'Only child', value: 100 }] };
    return el;
  },
};

// h2: Two Items (extreme ratio)
export const TwoItemsExtremeRatio: Story = {
  render: () => {
    const el = document.createElement('snice-treemap');
    el.toggleAttribute('show-labels', true);
    el.toggleAttribute('show-values', true);
    el.style.cssText = 'display:block;height:200px;';
    (el as any).data = {
      label: 'Root', value: 0,
      children: [
        { label: 'Large', value: 950 },
        { label: 'Tiny', value: 5 },
      ],
    };
    return el;
  },
};

// h2: CSS Parts Styling
// Available parts: breadcrumbs, base, chart, tooltip
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .treemap-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
      .treemap-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .treemap-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outer container */
      .treemap-parts-demo--styled snice-treemap::part(base) {
        border-radius: 12px;
        overflow: hidden;
        outline: 2px solid rgba(99,102,241,0.5);
        box-shadow: 0 8px 32px rgba(99,102,241,0.25);
      }

      /* Styled: ::part(chart) - chart rendering area */
      .treemap-parts-demo--styled snice-treemap::part(chart) {
        filter: saturate(1.3) contrast(1.1);
      }

      /* Styled: ::part(breadcrumbs) - drill-down nav trail */
      .treemap-parts-demo--styled snice-treemap::part(breadcrumbs) {
        background: #1e1b4b;
        color: #a5b4fc;
        border-bottom: 1px solid rgba(99,102,241,0.3);
        font-size: 0.75rem;
        padding: 4px 8px;
        font-weight: 600;
      }

      /* Styled: ::part(tooltip) - hover tooltip */
      .treemap-parts-demo--styled snice-treemap::part(tooltip) {
        background: #312e81;
        color: #e0e7ff;
        border: 1px solid #6366f1;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(99,102,241,0.5);
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'treemap-parts-demo';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'treemap-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'treemap-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeTreemap({ 'show-labels': true, 'show-values': true }, sampleData, 'display:block;height:260px;'));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'treemap-parts-demo__item treemap-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'treemap-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(chart) ::part(breadcrumbs) ::part(tooltip)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeTreemap({ 'show-labels': true, 'show-values': true, 'color-scheme': 'purple' }, sampleData, 'display:block;height:260px;'));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};
