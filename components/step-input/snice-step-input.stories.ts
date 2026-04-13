import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-step-input';
import type { StepInputSize } from './snice-step-input.types';

type Args = {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readonly?: boolean;
  size?: StepInputSize;
  wrap?: boolean;
};

const SIZES: StepInputSize[] = ['small', 'medium', 'large'];

function makeStepInput(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-step-input');
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
  title: 'Form/StepInput',
  component: 'snice-step-input',
  tags: ['autodocs'],
  argTypes: {
    value:    { control: 'number' },
    min:      { control: 'number' },
    max:      { control: 'number' },
    step:     { control: 'number' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    size:     { control: 'select', options: SIZES },
    wrap:     { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-step-input');
    if (args.value !== undefined) el.setAttribute('value', String(args.value));
    if (args.min   !== undefined) el.setAttribute('min',   String(args.min));
    if (args.max   !== undefined) el.setAttribute('max',   String(args.max));
    if (args.step  !== undefined) el.setAttribute('step',  String(args.step));
    if (args.size  !== undefined) el.setAttribute('size',  String(args.size));
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.readonly) el.toggleAttribute('readonly', true);
    if (args.wrap)     el.toggleAttribute('wrap',     true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { value: 0, step: 1, size: 'medium' },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makeStepInput({ size: s, value: 0 }))),
};

// h2: Default Value
export const DefaultValue: Story = {
  render: () => row(
    makeStepInput({ value: 0 }),
    makeStepInput({ value: 5 }),
    makeStepInput({ value: -3 }),
    makeStepInput({ value: 100 }),
  ),
};

// h2: Min and Max
export const MinAndMax: Story = {
  render: () => row(
    makeStepInput({ value: 5, min: 0, max: 10 }),
    makeStepInput({ value: 0, min: -5, max: 5 }),
    makeStepInput({ value: 50, min: 0, max: 100 }),
  ),
};

// h2: At Boundaries
export const AtBoundaries: Story = {
  render: () => row(
    makeStepInput({ value: 0, min: 0, max: 10 }),
    makeStepInput({ value: 10, min: 0, max: 10 }),
  ),
};

// h2: Custom Step
export const CustomStep: Story = {
  render: () => row(
    makeStepInput({ step: 5, value: 0 }),
    makeStepInput({ step: 10, value: 0 }),
    makeStepInput({ step: 0.5, value: 0 }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeStepInput({ disabled: true, value: 5 }),
  ),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => row(
    makeStepInput({ readonly: true, value: 7 }),
  ),
};

// h2: Wrap (Cycles min/max)
export const Wrap: Story = {
  render: () => row(
    makeStepInput({ wrap: true, min: 1, max: 5, value: 5 }),
    makeStepInput({ wrap: true, min: 0, max: 9, value: 0 }),
  ),
};

// h2: No Min/Max (Unbounded)
export const NoMinMaxUnbounded: Story = {
  render: () => row(
    makeStepInput({ value: 0 }),
  ),
};

// h2: Sizes x States
export const SizesXStates: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;align-items:center;';
    for (const size of SIZES) {
      grid.appendChild(makeStepInput({ size, value: 5 }));
      grid.appendChild(makeStepInput({ size, value: 5, disabled: true }));
      grid.appendChild(makeStepInput({ size, value: 5, readonly: true }));
    }
    return grid;
  },
};

// h2: Large Numbers
export const LargeNumbers: Story = {
  render: () => row(
    makeStepInput({ value: 1000, step: 100 }),
    makeStepInput({ value: 9999, min: 0, max: 9999, step: 1000 }),
  ),
};

// h2: CSS Parts Styling
// Available parts: base, decrement-button, input, increment-button
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: purple terminal theme */
      .parts-demo__terminal snice-step-input::part(base) {
        background: #0d0d1a;
        border: 1px solid #6c3483;
        border-radius: 6px;
        box-shadow: 0 0 12px rgba(108,52,131,0.4);
      }
      .parts-demo__terminal snice-step-input::part(input) {
        background: transparent;
        color: #bf00ff;
        font-family: 'Courier New', monospace;
        font-size: 1rem;
        font-weight: 700;
        text-align: center;
        border: none;
        box-shadow: none;
      }
      .parts-demo__terminal snice-step-input::part(decrement-button) {
        background: linear-gradient(135deg, #4a0080, #6c3483);
        color: #df9eff;
        border: none;
        border-radius: 5px 0 0 5px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .parts-demo__terminal snice-step-input::part(increment-button) {
        background: linear-gradient(135deg, #6c3483, #4a0080);
        color: #df9eff;
        border: none;
        border-radius: 0 5px 5px 0;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }

      /* Styled: warm amber banking style */
      .parts-demo__amber snice-step-input::part(base) {
        background: #fffbf0;
        border: 2px solid #f59e0b;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(245,158,11,0.2);
      }
      .parts-demo__amber snice-step-input::part(input) {
        background: transparent;
        color: #92400e;
        font-weight: 600;
        font-size: 1.1rem;
        text-align: center;
      }
      .parts-demo__amber snice-step-input::part(decrement-button) {
        background: #fef3c7;
        color: #d97706;
        border: none;
        border-radius: 6px 0 0 6px;
        font-weight: 700;
        font-size: 1.2rem;
      }
      .parts-demo__amber snice-step-input::part(increment-button) {
        background: #f59e0b;
        color: #fff;
        border: none;
        border-radius: 0 6px 6px 0;
        font-weight: 700;
        font-size: 1.2rem;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
      }
    `;

    const container = document.createElement('div');
    container.className = 'parts-demo';
    container.appendChild(style);

    // Default section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'parts-demo__section';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'parts-demo__label';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(makeStepInput({ value: 5, min: 0, max: 20 }));
    container.appendChild(defaultSection);

    // Terminal section
    const termSection = document.createElement('div');
    termSection.className = 'parts-demo__section parts-demo__terminal';
    const termLabel = document.createElement('div');
    termLabel.className = 'parts-demo__label';
    termLabel.textContent = '::part(base/decrement-button/input/increment-button) — Purple terminal';
    termSection.appendChild(termLabel);
    termSection.appendChild(makeStepInput({ value: 5, min: 0, max: 20 }));
    container.appendChild(termSection);

    // Amber section
    const amberSection = document.createElement('div');
    amberSection.className = 'parts-demo__section parts-demo__amber';
    const amberLabel = document.createElement('div');
    amberLabel.className = 'parts-demo__label';
    amberLabel.textContent = '::part(base/decrement-button/input/increment-button) — Amber banking';
    amberSection.appendChild(amberLabel);
    amberSection.appendChild(makeStepInput({ value: 5, min: 0, max: 20 }));
    container.appendChild(amberSection);

    return container;
  },
};
