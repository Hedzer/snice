import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-range-slider';
import type { RangeSliderOrientation } from './snice-range-slider.types';

type Args = {
  min?: number;
  max?: number;
  step?: number;
  valueLow?: number;
  valueHigh?: number;
  disabled?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  orientation?: RangeSliderOrientation;
};

const ORIENTATIONS: RangeSliderOrientation[] = ['horizontal', 'vertical'];

function makeRange(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-range-slider');
  el.style.width = '280px';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'RangeSlider',
  component: 'snice-range-slider',
  tags: ['autodocs'],
  argTypes: {
    min:         { control: 'number' },
    max:         { control: 'number' },
    step:        { control: 'number' },
    valueLow:    { control: 'number' },
    valueHigh:   { control: 'number' },
    disabled:    { control: 'boolean' },
    showTooltip: { control: 'boolean' },
    showLabels:  { control: 'boolean' },
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  render: (args) => {
    const el = document.createElement('snice-range-slider');
    el.style.width = '280px';
    if (args.min         !== undefined) el.setAttribute('min',          String(args.min));
    if (args.max         !== undefined) el.setAttribute('max',          String(args.max));
    if (args.step        !== undefined) el.setAttribute('step',         String(args.step));
    if (args.valueLow    !== undefined) el.setAttribute('value-low',    String(args.valueLow));
    if (args.valueHigh   !== undefined) el.setAttribute('value-high',   String(args.valueHigh));
    if (args.orientation !== undefined) el.setAttribute('orientation',  String(args.orientation));
    if (args.disabled)    el.toggleAttribute('disabled',     true);
    if (args.showTooltip) el.toggleAttribute('show-tooltip', true);
    if (args.showLabels)  el.toggleAttribute('show-labels',  true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { min: 0, max: 100, valueLow: 20, valueHigh: 80 },
};

// h2: Default (0-100, horizontal)
export const DefaultHorizontal: Story = {
  render: () => row(makeRange({ min: 0, max: 100, 'value-low': 20, 'value-high': 80 })),
};

// h2: Orientation: horizontal (default)
export const OrientationHorizontal: Story = {
  render: () => row(
    makeRange({ orientation: 'horizontal', 'value-low': 25, 'value-high': 75 }),
  ),
};

// h2: Orientation: vertical
export const OrientationVertical: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;align-items:flex-end;height:200px;';
    const el = document.createElement('snice-range-slider');
    el.setAttribute('orientation', 'vertical');
    el.setAttribute('value-low', '25');
    el.setAttribute('value-high', '75');
    el.style.cssText = 'height:180px;width:auto;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: show-tooltip
export const ShowTooltip: Story = {
  render: () => row(
    makeRange({ 'show-tooltip': true, 'value-low': 30, 'value-high': 70 }),
  ),
};

// h2: show-labels
export const ShowLabels: Story = {
  render: () => row(
    makeRange({ 'show-labels': true, 'value-low': 20, 'value-high': 80 }),
  ),
};

// h2: show-tooltip + show-labels
export const ShowTooltipPlusShowLabels: Story = {
  render: () => row(
    makeRange({ 'show-tooltip': true, 'show-labels': true, 'value-low': 30, 'value-high': 70 }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeRange({ disabled: true, 'value-low': 25, 'value-high': 75 }),
  ),
};

// h2: Step: 1 (default)
export const Step1: Story = {
  render: () => row(makeRange({ step: 1, 'value-low': 30, 'value-high': 70 })),
};

// h2: Step: 5
export const Step5: Story = {
  render: () => row(makeRange({ step: 5, 'value-low': 25, 'value-high': 75 })),
};

// h2: Step: 10
export const Step10: Story = {
  render: () => row(makeRange({ step: 10, 'value-low': 20, 'value-high': 80 })),
};

// h2: Step: 25
export const Step25: Story = {
  render: () => row(makeRange({ step: 25, 'value-low': 25, 'value-high': 75 })),
};

// h2: Custom range: min=0 max=1000
export const CustomRangeMin0Max1000: Story = {
  render: () => row(makeRange({ min: 0, max: 1000, 'value-low': 200, 'value-high': 800 })),
};

// h2: Custom range: min=-50 max=50
export const CustomRangeMinNeg50Max50: Story = {
  render: () => row(makeRange({ min: -50, max: 50, 'value-low': -20, 'value-high': 20 })),
};

// h2: Narrow range (thumbs close)
export const NarrowRange: Story = {
  render: () => row(makeRange({ 'value-low': 45, 'value-high': 55 })),
};

// h2: Full range (thumbs at extremes)
export const FullRange: Story = {
  render: () => row(makeRange({ 'value-low': 0, 'value-high': 100 })),
};

// h2: Same value (collapsed)
export const SameValueCollapsed: Story = {
  render: () => row(makeRange({ 'value-low': 50, 'value-high': 50 })),
};

// h2: Vertical + show-tooltip
export const VerticalShowTooltip: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;align-items:flex-end;height:200px;';
    const el = document.createElement('snice-range-slider');
    el.setAttribute('orientation', 'vertical');
    el.setAttribute('value-low', '25');
    el.setAttribute('value-high', '75');
    el.toggleAttribute('show-tooltip', true);
    el.style.cssText = 'height:180px;width:auto;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Vertical + disabled
export const VerticalDisabled: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;align-items:flex-end;height:200px;';
    const el = document.createElement('snice-range-slider');
    el.setAttribute('orientation', 'vertical');
    el.setAttribute('value-low', '25');
    el.setAttribute('value-high', '75');
    el.toggleAttribute('disabled', true);
    el.style.cssText = 'height:180px;width:auto;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Vertical + show-labels
export const VerticalShowLabels: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;align-items:flex-end;height:200px;';
    const el = document.createElement('snice-range-slider');
    el.setAttribute('orientation', 'vertical');
    el.setAttribute('value-low', '20');
    el.setAttribute('value-high', '80');
    el.toggleAttribute('show-labels', true);
    el.style.cssText = 'height:180px;width:auto;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Available parts: track, range, thumb-low, thumb-high, label-min, label-max
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }
      .parts-demo__default snice-range-slider { width: 280px; }

      /* Styled: ocean gradient range + distinct thumbs */
      .parts-demo__ocean snice-range-slider::part(track) {
        background: #0d2137;
        height: 8px;
        border-radius: 4px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
      }
      .parts-demo__ocean snice-range-slider::part(range) {
        background: linear-gradient(90deg, #00b4db, #0083b0);
        box-shadow: 0 0 10px rgba(0,180,219,0.5);
      }
      .parts-demo__ocean snice-range-slider::part(thumb-low) {
        background: radial-gradient(circle, #80deea, #00838f);
        border: 3px solid #00b4db;
        box-shadow: 0 0 10px rgba(0,180,219,0.7);
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }
      .parts-demo__ocean snice-range-slider::part(thumb-high) {
        background: radial-gradient(circle, #b2ebf2, #006064);
        border: 3px solid #0083b0;
        box-shadow: 0 0 10px rgba(0,131,176,0.7);
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }
      .parts-demo__ocean snice-range-slider::part(label-min),
      .parts-demo__ocean snice-range-slider::part(label-max) {
        color: #00b4db;
        font-weight: 700;
        font-size: 0.8rem;
      }
      .parts-demo__ocean snice-range-slider { width: 280px; }

      /* Styled: fire range */
      .parts-demo__fire snice-range-slider::part(track) {
        background: #1a0a00;
        height: 6px;
        border-radius: 3px;
      }
      .parts-demo__fire snice-range-slider::part(range) {
        background: linear-gradient(90deg, #ff6200, #ffca28);
        box-shadow: 0 0 12px rgba(255,98,0,0.6);
      }
      .parts-demo__fire snice-range-slider::part(thumb-low) {
        background: #ff6200;
        border: 2px solid #ff9800;
        box-shadow: 0 0 8px rgba(255,98,0,0.8);
        border-radius: 3px;
        width: 14px;
        height: 22px;
      }
      .parts-demo__fire snice-range-slider::part(thumb-high) {
        background: #ffca28;
        border: 2px solid #ff9800;
        box-shadow: 0 0 8px rgba(255,202,40,0.8);
        border-radius: 3px;
        width: 14px;
        height: 22px;
      }
      .parts-demo__fire snice-range-slider::part(label-min),
      .parts-demo__fire snice-range-slider::part(label-max) {
        color: #ff9800;
        font-weight: 700;
      }
      .parts-demo__fire snice-range-slider { width: 280px; }
    `;

    const container = document.createElement('div');
    container.className = 'parts-demo';
    container.appendChild(style);

    // Default section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'parts-demo__section parts-demo__default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'parts-demo__label';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultSection.appendChild(defaultLabel);
    const r1 = makeRange({ 'value-low': 25, 'value-high': 75, 'show-labels': true });
    defaultSection.appendChild(r1);
    container.appendChild(defaultSection);

    // Ocean styled section
    const oceanSection = document.createElement('div');
    oceanSection.className = 'parts-demo__section parts-demo__ocean';
    const oceanLabel = document.createElement('div');
    oceanLabel.className = 'parts-demo__label';
    oceanLabel.textContent = '::part(track/range/thumb-low/thumb-high/label-min/label-max) — Ocean gradient';
    oceanSection.appendChild(oceanLabel);
    const r2 = makeRange({ 'value-low': 20, 'value-high': 70, 'show-labels': true });
    oceanSection.appendChild(r2);
    container.appendChild(oceanSection);

    // Fire styled section
    const fireSection = document.createElement('div');
    fireSection.className = 'parts-demo__section parts-demo__fire';
    const fireLabel = document.createElement('div');
    fireLabel.className = 'parts-demo__label';
    fireLabel.textContent = '::part(track/range/thumb-low/thumb-high/label-min/label-max) — Fire gradient';
    fireSection.appendChild(fireLabel);
    const r3 = makeRange({ 'value-low': 30, 'value-high': 80, 'show-labels': true });
    fireSection.appendChild(r3);
    container.appendChild(fireSection);

    return container;
  },
};
