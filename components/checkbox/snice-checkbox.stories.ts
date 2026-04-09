import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-checkbox';
import type { CheckboxSize } from './snice-checkbox.types';

type Args = {
  size?: CheckboxSize;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
};

const SIZES: CheckboxSize[] = ['small', 'medium', 'large'];

function makeCB(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-checkbox');
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

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Checkbox',
  component: 'snice-checkbox',
  tags: ['autodocs'],
  argTypes: {
    size:          { control: 'select', options: SIZES },
    checked:       { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled:      { control: 'boolean' },
    loading:       { control: 'boolean' },
    required:      { control: 'boolean' },
    invalid:       { control: 'boolean' },
    label:         { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-checkbox');
    if (args.size  !== undefined) el.setAttribute('size', String(args.size));
    if (args.label !== undefined) el.setAttribute('label', String(args.label));
    if (args.checked)       el.toggleAttribute('checked',       true);
    if (args.indeterminate) el.toggleAttribute('indeterminate', true);
    if (args.disabled)      el.toggleAttribute('disabled',      true);
    if (args.loading)       el.toggleAttribute('loading',       true);
    if (args.required)      el.toggleAttribute('required',      true);
    if (args.invalid)       el.toggleAttribute('invalid',       true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Accept terms', size: 'medium' },
};

// h2: Default (unchecked)
export const Unchecked: Story = {
  render: () => col(makeCB({ label: 'Unchecked checkbox' })),
};

// h2: Checked
export const Checked: Story = {
  render: () => col(makeCB({ label: 'Checked checkbox', checked: true })),
};

// h2: Indeterminate
export const Indeterminate: Story = {
  render: () => col(makeCB({ label: 'Indeterminate', indeterminate: true })),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} checkbox` })),
  ),
};

// h2: Sizes x Checked
export const SizesXChecked: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} (checked)`, checked: true })),
  ),
};

// h2: Sizes x Indeterminate
export const SizesXIndeterminate: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} (indeterminate)`, indeterminate: true })),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(
    makeCB({ label: 'Disabled (unchecked)', disabled: true }),
    makeCB({ label: 'Disabled (checked)',   disabled: true, checked: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(
    makeCB({ label: 'Loading (unchecked)', loading: true }),
    makeCB({ label: 'Loading (checked)',   loading: true, checked: true }),
  ),
};

// h2: Loading x Sizes
export const LoadingXSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeCB({ size, label: `Loading ${size}`, loading: true })),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeCB({ label: 'Required checkbox', required: true })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeCB({ label: 'Invalid checkbox', invalid: true })),
};

// h2: Required + Invalid
export const RequiredAndInvalid: Story = {
  render: () => col(makeCB({ label: 'Required + Invalid', required: true, invalid: true })),
};

// h2: No label
export const NoLabel: Story = {
  render: () => row(
    makeCB({ checked: true }),
    makeCB({ indeterminate: true }),
    makeCB({}),
  ),
};

// h2: Long label
export const LongLabel: Story = {
  render: () => col(
    makeCB({ label: 'I agree to the terms and conditions of service, privacy policy, and all associated legal documents as outlined in the user agreement' }),
  ),
};

// h2: Form: name + value
export const FormIntegration: Story = {
  render: () => col(
    makeCB({ name: 'agree', value: 'yes', label: 'I agree (name=agree, value=yes)', checked: true }),
  ),
};

export const AllVariants: Story = {
  render: () => col(
    makeCB({ label: 'Unchecked' }),
    makeCB({ label: 'Checked',       checked: true }),
    makeCB({ label: 'Indeterminate', indeterminate: true }),
    makeCB({ label: 'Disabled',      disabled: true }),
    makeCB({ label: 'Disabled + Checked', disabled: true, checked: true }),
    makeCB({ label: 'Invalid',       invalid: true }),
    makeCB({ label: 'Loading',       loading: true }),
    makeCB({ label: 'Required',      required: true }),
  ),
};
