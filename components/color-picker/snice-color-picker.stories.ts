import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-color-picker';
import type { ColorPickerSize, ColorPickerFormat } from './snice-color-picker.types';

type Args = {
  size?: ColorPickerSize;
  value?: string;
  format?: ColorPickerFormat;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  showInput?: boolean;
  showPresets?: boolean;
  name?: string;
};

const SIZES: ColorPickerSize[] = ['small', 'medium', 'large'];
const FORMATS: ColorPickerFormat[] = ['hex', 'rgb', 'hsl'];

function makePicker(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-color-picker');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/ColorPicker',
  component: 'snice-color-picker',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    value:       { control: 'color' },
    format:      { control: 'select', options: FORMATS },
    label:       { control: 'text' },
    helperText:  { control: 'text' },
    errorText:   { control: 'text' },
    disabled:    { control: 'boolean' },
    loading:     { control: 'boolean' },
    required:    { control: 'boolean' },
    invalid:     { control: 'boolean' },
    showInput:   { control: 'boolean' },
    showPresets: { control: 'boolean' },
    name:        { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-color-picker');
    if (args.size       !== undefined) el.setAttribute('size',        String(args.size));
    if (args.value      !== undefined) el.setAttribute('value',       String(args.value));
    if (args.format     !== undefined) el.setAttribute('format',      String(args.format));
    if (args.label      !== undefined) el.setAttribute('label',       String(args.label));
    if (args.helperText !== undefined) el.setAttribute('helper-text', String(args.helperText));
    if (args.errorText  !== undefined) el.setAttribute('error-text',  String(args.errorText));
    if (args.name       !== undefined) el.setAttribute('name',        String(args.name));
    if (args.disabled)    el.toggleAttribute('disabled',     true);
    if (args.loading)     el.toggleAttribute('loading',      true);
    if (args.required)    el.toggleAttribute('required',     true);
    if (args.invalid)     el.toggleAttribute('invalid',      true);
    if (args.showInput === false) el.setAttribute('show-input', 'false');
    if (args.showPresets) el.toggleAttribute('show-presets', true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { value: '#3b82f6', size: 'medium', label: 'Color', format: 'hex' },
};

// h2: Default
export const DefaultPicker: Story = {
  render: () => row(makePicker({ value: '#000000', label: 'Color' })),
};

// h2: With value
export const WithValue: Story = {
  render: () => row(
    makePicker({ value: '#ef4444', label: 'Red' }),
    makePicker({ value: '#22c55e', label: 'Green' }),
    makePicker({ value: '#3b82f6', label: 'Blue' }),
  ),
};

// h2: Formats
export const Formats: Story = {
  render: () => row(
    makePicker({ value: '#3b82f6', format: 'hex', label: 'hex' }),
    makePicker({ value: '#3b82f6', format: 'rgb', label: 'rgb' }),
    makePicker({ value: '#3b82f6', format: 'hsl', label: 'hsl' }),
  ),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(
    ...SIZES.map(s => makePicker({ size: s, value: '#6366f1', label: s.charAt(0).toUpperCase() + s.slice(1) })),
  ),
};

// h2: Sizes x Formats
export const SizesXFormats: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;';
    for (const size of SIZES) {
      for (const format of FORMATS) {
        grid.appendChild(makePicker({ size, format, value: '#6366f1', label: `${size} / ${format}` }));
      }
    }
    return grid;
  },
};

// h2: show-presets
export const ShowPresets: Story = {
  render: () => row(
    makePicker({ value: '#3b82f6', 'show-presets': true, label: 'With Presets' }),
  ),
};

// h2: show-input="false"
export const ShowInputFalse: Story = {
  render: () => row(
    makePicker({ value: '#ef4444', 'show-input': 'false', label: 'Swatch Only' }),
  ),
};

// h2: show-input="false" + show-presets
export const ShowInputFalsePlusShowPresets: Story = {
  render: () => row(
    makePicker({ value: '#22c55e', 'show-input': 'false', 'show-presets': true, label: 'Swatch + Presets' }),
  ),
};

// h2: helper-text
export const HelperText: Story = {
  render: () => row(
    makePicker({ value: '#3b82f6', label: 'Brand Color', 'helper-text': 'Choose your brand color' }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makePicker({ value: '#6366f1', label: 'Disabled', disabled: true }),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => row(
    makePicker({ value: '#000000', label: 'Required Field', required: true }),
  ),
};

// h2: Invalid + error-text
export const InvalidPlusErrorText: Story = {
  render: () => row(
    makePicker({ value: '#000000', label: 'Background Color', invalid: true, 'error-text': 'Contrast ratio too low' }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(
    makePicker({ value: '#3b82f6', label: 'Loading', loading: true }),
  ),
};

// h2: Form: name
export const FormName: Story = {
  render: () => row(
    makePicker({ value: '#f59e0b', label: 'Accent Color', name: 'accent-color' }),
  ),
};

// h2: Disabled + presets
export const DisabledPlusPresets: Story = {
  render: () => row(
    makePicker({ value: '#6366f1', label: 'Disabled + Presets', disabled: true, 'show-presets': true }),
  ),
};

// h2: Required + invalid + error-text
export const RequiredInvalidErrorText: Story = {
  render: () => row(
    makePicker({ value: '#000000', label: 'Color', required: true, invalid: true, 'error-text': 'A valid color is required' }),
  ),
};
