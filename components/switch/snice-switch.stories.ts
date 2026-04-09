import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-switch';
import type { SwitchSize } from './snice-switch.types';

type Args = {
  size?: SwitchSize;
  checked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
  labelOn?: string;
  labelOff?: string;
};

const SIZES: SwitchSize[] = ['small', 'medium', 'large'];

function makeSw(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-switch');
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
  wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Switch',
  component: 'snice-switch',
  tags: ['autodocs'],
  argTypes: {
    size:     { control: 'select', options: SIZES },
    checked:  { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading:  { control: 'boolean' },
    required: { control: 'boolean' },
    invalid:  { control: 'boolean' },
    label:    { control: 'text' },
    labelOn:  { control: 'text' },
    labelOff: { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-switch');
    if (args.size     !== undefined) el.setAttribute('size',      String(args.size));
    if (args.label    !== undefined) el.setAttribute('label',     String(args.label));
    if (args.labelOn  !== undefined) el.setAttribute('label-on',  String(args.labelOn));
    if (args.labelOff !== undefined) el.setAttribute('label-off', String(args.labelOff));
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
  args: { size: 'medium', label: 'Dark mode' },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeSw({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} switch` })),
  ),
};

// h2: Checked State
export const CheckedState: Story = {
  render: () => col(
    makeSw({ label: 'Off (default)' }),
    makeSw({ label: 'On',  checked: true }),
  ),
};

// h2: Sizes x Checked
export const SizesXChecked: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:.75rem 2rem;align-items:center;';
    for (const size of SIZES) {
      wrap.appendChild(makeSw({ size, label: `${size} off` }));
      wrap.appendChild(makeSw({ size, label: `${size} on`, checked: true }));
    }
    return wrap;
  },
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(
    makeSw({ label: 'Disabled (off)', disabled: true }),
    makeSw({ label: 'Disabled (on)',  disabled: true, checked: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(
    makeSw({ label: 'Loading (off)', loading: true }),
    makeSw({ label: 'Loading (on)',  loading: true, checked: true }),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeSw({ label: 'Required switch', required: true })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeSw({ label: 'Invalid switch', invalid: true })),
};

// h2: State Labels (On/Off Text)
export const StateLabels: Story = {
  render: () => col(
    makeSw({ 'label-on': 'On',      'label-off': 'Off'     }),
    makeSw({ 'label-on': 'On',      'label-off': 'Off',    checked: true }),
    makeSw({ 'label-on': 'Enabled', 'label-off': 'Disabled', label: 'Feature flag' }),
    makeSw({ 'label-on': 'Yes',     'label-off': 'No',     label: 'Accept cookies', checked: true }),
  ),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => row(
    makeSw({}),
    makeSw({ checked: true }),
    makeSw({ disabled: true }),
    makeSw({ disabled: true, checked: true }),
  ),
};

// h2: All States Matrix (Size x State)
export const AllStatesMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(4,auto);gap:.75rem 1.5rem;align-items:center;';
    for (const size of SIZES) {
      wrap.appendChild(makeSw({ size, label: `${size}` }));
      wrap.appendChild(makeSw({ size, label: `${size} on`, checked: true }));
      wrap.appendChild(makeSw({ size, label: `${size} dis`, disabled: true }));
      wrap.appendChild(makeSw({ size, label: `${size} inv`, invalid: true }));
    }
    return wrap;
  },
};

// h2: Named (Form Integration)
export const NamedFormIntegration: Story = {
  render: () => col(
    makeSw({ name: 'notifications', value: 'enabled', label: 'Enable notifications', checked: true }),
    makeSw({ name: 'marketing',     value: 'yes',     label: 'Receive marketing emails' }),
  ),
};

export const AllVariants: Story = {
  render: () => col(
    makeSw({ label: 'Default (off)' }),
    makeSw({ label: 'Checked (on)', checked: true }),
    makeSw({ label: 'Disabled', disabled: true }),
    makeSw({ label: 'Loading', loading: true }),
    makeSw({ label: 'Invalid', invalid: true }),
    makeSw({ label: 'Required', required: true }),
    makeSw({ label: 'With state labels', 'label-on': 'On', 'label-off': 'Off', checked: true }),
  ),
};
