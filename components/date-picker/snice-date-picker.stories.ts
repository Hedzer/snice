import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-date-picker';
import type { DatePickerSize, DatePickerVariant, DateFormat } from './snice-date-picker.types';

type Args = {
  size?: DatePickerSize;
  variant?: DatePickerVariant;
  value?: string;
  format?: DateFormat;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  min?: string;
  max?: string;
  name?: string;
  firstDayOfWeek?: number;
};

const SIZES: DatePickerSize[] = ['small', 'medium', 'large'];
const VARIANTS: DatePickerVariant[] = ['outlined', 'filled', 'underlined'];
const FORMATS: DateFormat[] = ['mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd', 'yyyy/mm/dd', 'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy'];

function makePicker(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-date-picker');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
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
  title: 'Form/DatePicker',
  component: 'snice-date-picker',
  tags: ['autodocs'],
  argTypes: {
    size:           { control: 'select', options: SIZES },
    variant:        { control: 'select', options: VARIANTS },
    value:          { control: 'text' },
    format:         { control: 'select', options: FORMATS },
    placeholder:    { control: 'text' },
    label:          { control: 'text' },
    helperText:     { control: 'text' },
    errorText:      { control: 'text' },
    disabled:       { control: 'boolean' },
    readonly:       { control: 'boolean' },
    loading:        { control: 'boolean' },
    required:       { control: 'boolean' },
    invalid:        { control: 'boolean' },
    clearable:      { control: 'boolean' },
    min:            { control: 'text' },
    max:            { control: 'text' },
    name:           { control: 'text' },
    firstDayOfWeek: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-date-picker');
    if (args.size           !== undefined) el.setAttribute('size',               String(args.size));
    if (args.variant        !== undefined) el.setAttribute('variant',            String(args.variant));
    if (args.value          !== undefined) el.setAttribute('value',              String(args.value));
    if (args.format         !== undefined) el.setAttribute('format',             String(args.format));
    if (args.placeholder    !== undefined) el.setAttribute('placeholder',        String(args.placeholder));
    if (args.label          !== undefined) el.setAttribute('label',              String(args.label));
    if (args.helperText     !== undefined) el.setAttribute('helper-text',        String(args.helperText));
    if (args.errorText      !== undefined) el.setAttribute('error-text',         String(args.errorText));
    if (args.min            !== undefined) el.setAttribute('min',                String(args.min));
    if (args.max            !== undefined) el.setAttribute('max',                String(args.max));
    if (args.name           !== undefined) el.setAttribute('name',               String(args.name));
    if (args.firstDayOfWeek !== undefined) el.setAttribute('first-day-of-week',  String(args.firstDayOfWeek));
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    if (args.readonly)  el.toggleAttribute('readonly',  true);
    if (args.loading)   el.toggleAttribute('loading',   true);
    if (args.required)  el.toggleAttribute('required',  true);
    if (args.invalid)   el.toggleAttribute('invalid',   true);
    if (args.clearable) el.toggleAttribute('clearable', true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Date', size: 'medium', variant: 'outlined', format: 'mm/dd/yyyy' },
};

// h2: Default
export const DefaultPicker: Story = {
  render: () => row(makePicker({ label: 'Select Date' })),
};

// h2: With value
export const WithValue: Story = {
  render: () => row(
    makePicker({ label: 'Date', value: '2025-06-15', format: 'yyyy-mm-dd' }),
    makePicker({ label: 'Date', value: '12/25/2025', format: 'mm/dd/yyyy' }),
  ),
};

// h2: All formats
export const AllFormats: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;';
    for (const format of FORMATS) {
      wrap.appendChild(makePicker({ format, label: format }));
    }
    return wrap;
  },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makePicker({ size: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
};

// h2: Variants
export const Variants: Story = {
  render: () => row(...VARIANTS.map(v => makePicker({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))),
};

// h2: Sizes x Variants
export const SizesXVariants: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;';
    for (const size of SIZES) {
      for (const variant of VARIANTS) {
        grid.appendChild(makePicker({ size, variant, label: `${size} / ${variant}` }));
      }
    }
    return grid;
  },
};

// h2: clearable
export const Clearable: Story = {
  render: () => row(
    makePicker({ clearable: true, value: '2025-06-15', format: 'yyyy-mm-dd', label: 'Clearable' }),
  ),
};

// h2: min + max
export const MinMax: Story = {
  render: () => row(
    makePicker({ min: '2025-01-01', max: '2025-12-31', format: 'yyyy-mm-dd', label: 'Min/Max (2025 only)' }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(makePicker({ disabled: true, label: 'Disabled', value: '2025-06-15', format: 'yyyy-mm-dd' })),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => row(makePicker({ readonly: true, label: 'Readonly', value: '2025-06-15', format: 'yyyy-mm-dd' })),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(makePicker({ loading: true, label: 'Loading' })),
};

// h2: Required
export const Required: Story = {
  render: () => row(makePicker({ required: true, label: 'Required Date' })),
};

// h2: Invalid + error-text
export const InvalidPlusErrorText: Story = {
  render: () => row(
    makePicker({ invalid: true, 'error-text': 'Please select a valid date', label: 'Date', value: 'bad-date' }),
  ),
};

// h2: helper-text
export const HelperText: Story = {
  render: () => row(
    makePicker({ label: 'Start Date', 'helper-text': 'Select the project start date' }),
  ),
};

// h2: Custom placeholder
export const CustomPlaceholder: Story = {
  render: () => row(
    makePicker({ label: 'Appointment', placeholder: 'Pick a date...' }),
  ),
};

// h2: first-day-of-week="1" (Monday)
export const FirstDayOfWeekMonday: Story = {
  render: () => row(
    makePicker({ 'first-day-of-week': 1, label: 'Monday start' }),
  ),
};

// h2: Form: name + required
export const FormNameRequired: Story = {
  render: () => row(
    makePicker({ name: 'start_date', required: true, label: 'Start Date (name=start_date)' }),
  ),
};

// h2: Disabled + value + clearable (clear hidden when disabled)
export const DisabledValueClearable: Story = {
  render: () => row(
    makePicker({ disabled: true, clearable: true, value: '2025-06-15', format: 'yyyy-mm-dd', label: 'Disabled (clear hidden)' }),
  ),
};
