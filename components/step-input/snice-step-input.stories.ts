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
