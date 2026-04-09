import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-radio';
import type { RadioSize, RadioVariant } from './snice-radio.types';

type Args = {
  size?: RadioSize;
  variant?: RadioVariant;
  checked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
  description?: string;
  value?: string;
};

const SIZES: RadioSize[] = ['small', 'medium', 'large'];
const VARIANTS: RadioVariant[] = ['default', 'block'];

function makeRadio(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-radio');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Radio',
  component: 'snice-radio',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    variant:     { control: 'select', options: VARIANTS },
    checked:     { control: 'boolean' },
    disabled:    { control: 'boolean' },
    loading:     { control: 'boolean' },
    required:    { control: 'boolean' },
    invalid:     { control: 'boolean' },
    label:       { control: 'text' },
    description: { control: 'text' },
    value:       { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-radio');
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.variant     !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.description !== undefined) el.setAttribute('description', String(args.description));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.checked)  el.toggleAttribute('checked',  true);
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.loading)  el.toggleAttribute('loading',  true);
    if (args.required) el.toggleAttribute('required', true);
    if (args.invalid)  el.toggleAttribute('invalid',  true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Option A', size: 'medium', variant: 'default', value: 'a' },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => col(
    makeRadio({ label: 'Option A', variant: 'default', name: 'vd', value: 'a', checked: true }),
    makeRadio({ label: 'Option B', variant: 'default', name: 'vd', value: 'b' }),
    makeRadio({ label: 'Option C', variant: 'default', name: 'vd', value: 'c' }),
  ),
};

// h2: Variant: block
export const VariantBlock: Story = {
  render: () => col(
    makeRadio({ label: 'Block Option A', variant: 'block', name: 'vb', value: 'a', checked: true }),
    makeRadio({ label: 'Block Option B', variant: 'block', name: 'vb', value: 'b' }),
    makeRadio({ label: 'Block Option C', variant: 'block', name: 'vb', value: 'c' }),
  ),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeRadio({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} radio`, checked: true })),
  ),
};

// h2: Checked: true / false
export const CheckedStates: Story = {
  render: () => col(
    makeRadio({ label: 'Unchecked' }),
    makeRadio({ label: 'Checked', checked: true }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(
    makeRadio({ label: 'Disabled (unchecked)', disabled: true }),
    makeRadio({ label: 'Disabled (checked)',   disabled: true, checked: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(
    makeRadio({ label: 'Loading', loading: true }),
    makeRadio({ label: 'Loading (checked)', loading: true, checked: true }),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeRadio({ label: 'Required radio', required: true })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeRadio({ label: 'Invalid radio', invalid: true })),
};

// h2: No label
export const NoLabel: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;align-items:center;';
    wrap.appendChild(makeRadio({ name: 'nl', value: 'a', checked: true }));
    wrap.appendChild(makeRadio({ name: 'nl', value: 'b' }));
    wrap.appendChild(makeRadio({ name: 'nl', value: 'c' }));
    return wrap;
  },
};

// h2: Block variant with description
export const BlockVariantWithDescription: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Standard Plan',  description: '$9/month — Up to 5 users',      name: 'plan', value: 'standard', checked: true }),
    makeRadio({ variant: 'block', label: 'Pro Plan',       description: '$29/month — Up to 25 users',    name: 'plan', value: 'pro'       }),
    makeRadio({ variant: 'block', label: 'Enterprise Plan',description: '$99/month — Unlimited users',   name: 'plan', value: 'enterprise' }),
  ),
};

// h2: Block variant: disabled
export const BlockVariantDisabled: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Active option',   name: 'bd', value: 'a', checked: true  }),
    makeRadio({ variant: 'block', label: 'Disabled option', name: 'bd', value: 'b', disabled: true }),
  ),
};

// h2: Block variant: loading
export const BlockVariantLoading: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Loading state', loading: true }),
    makeRadio({ variant: 'block', label: 'Loading + checked', loading: true, checked: true }),
  ),
};

// h2: Block variant: sizes
export const BlockVariantSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeRadio({ variant: 'block', size, label: `Block ${size}`, description: 'Description text', checked: true })),
  ),
};

// h2: State matrix: size x disabled/loading/invalid
export const StateMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;';
    for (const size of SIZES) {
      wrap.appendChild(makeRadio({ size, label: `${size} default`,  checked: true }));
      wrap.appendChild(makeRadio({ size, label: `${size} disabled`, disabled: true, checked: true }));
      wrap.appendChild(makeRadio({ size, label: `${size} invalid`,  invalid: true  }));
    }
    return wrap;
  },
};

export const AllVariants: Story = {
  render: () => col(
    makeRadio({ label: 'Default (unchecked)' }),
    makeRadio({ label: 'Checked', checked: true }),
    makeRadio({ label: 'Disabled', disabled: true }),
    makeRadio({ label: 'Loading', loading: true }),
    makeRadio({ label: 'Invalid', invalid: true }),
    makeRadio({ label: 'Required', required: true }),
    makeRadio({ variant: 'block', label: 'Block variant', description: 'Block description', checked: true }),
  ),
};
