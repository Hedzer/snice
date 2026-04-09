import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-date-time-picker';
import type { DateTimePickerVariant, DateTimePickerTimeFormat, DateTimePickerSize, DateTimePickerDateFormat } from './snice-date-time-picker.types';

type Args = {
  size?: DateTimePickerSize;
  value?: string;
  dateFormat?: DateTimePickerDateFormat;
  timeFormat?: DateTimePickerTimeFormat;
  min?: string;
  max?: string;
  showSeconds?: boolean;
  loading?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  variant?: DateTimePickerVariant;
};

const SIZES: DateTimePickerSize[] = ['small', 'medium', 'large'];
const DATE_FORMATS: DateTimePickerDateFormat[] = ['yyyy-mm-dd', 'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy/mm/dd', 'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy'];
const TIME_FORMATS: DateTimePickerTimeFormat[] = ['24h', '12h'];
const VARIANTS: DateTimePickerVariant[] = ['dropdown', 'inline'];

function makePicker(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-date-time-picker');
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
  title: 'Form/DateTimePicker',
  component: 'snice-date-time-picker',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    value:       { control: 'text' },
    dateFormat:  { control: 'select', options: DATE_FORMATS },
    timeFormat:  { control: 'select', options: TIME_FORMATS },
    min:         { control: 'text' },
    max:         { control: 'text' },
    showSeconds: { control: 'boolean' },
    loading:     { control: 'boolean' },
    clearable:   { control: 'boolean' },
    disabled:    { control: 'boolean' },
    readonly:    { control: 'boolean' },
    placeholder: { control: 'text' },
    label:       { control: 'text' },
    helperText:  { control: 'text' },
    errorText:   { control: 'text' },
    required:    { control: 'boolean' },
    invalid:     { control: 'boolean' },
    name:        { control: 'text' },
    variant:     { control: 'select', options: VARIANTS },
  },
  render: (args) => {
    const el = document.createElement('snice-date-time-picker');
    if (args.size        !== undefined) el.setAttribute('size',         String(args.size));
    if (args.value       !== undefined) el.setAttribute('value',        String(args.value));
    if (args.dateFormat  !== undefined) el.setAttribute('date-format',  String(args.dateFormat));
    if (args.timeFormat  !== undefined) el.setAttribute('time-format',  String(args.timeFormat));
    if (args.min         !== undefined) el.setAttribute('min',          String(args.min));
    if (args.max         !== undefined) el.setAttribute('max',          String(args.max));
    if (args.placeholder !== undefined) el.setAttribute('placeholder',  String(args.placeholder));
    if (args.label       !== undefined) el.setAttribute('label',        String(args.label));
    if (args.helperText  !== undefined) el.setAttribute('helper-text',  String(args.helperText));
    if (args.errorText   !== undefined) el.setAttribute('error-text',   String(args.errorText));
    if (args.name        !== undefined) el.setAttribute('name',         String(args.name));
    if (args.variant     !== undefined) el.setAttribute('variant',      String(args.variant));
    if (args.showSeconds) el.toggleAttribute('show-seconds', true);
    if (args.loading)     el.toggleAttribute('loading',      true);
    if (args.clearable)   el.toggleAttribute('clearable',    true);
    if (args.disabled)    el.toggleAttribute('disabled',     true);
    if (args.readonly)    el.toggleAttribute('readonly',     true);
    if (args.required)    el.toggleAttribute('required',     true);
    if (args.invalid)     el.toggleAttribute('invalid',      true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Date & Time', size: 'medium', variant: 'dropdown' },
};

// h2: Default (dropdown, 24h)
export const DefaultDropdown24h: Story = {
  render: () => row(makePicker({ label: 'Select Date & Time' })),
};

// h2: With value
export const WithValue: Story = {
  render: () => row(makePicker({ label: 'Date & Time', value: '2025-06-15T14:30' })),
};

// h2: time-format="12h"
export const TimeFormat12h: Story = {
  render: () => row(makePicker({ 'time-format': '12h', label: '12h format' })),
};

// h2: time-format="24h" (default)
export const TimeFormat24h: Story = {
  render: () => row(makePicker({ 'time-format': '24h', label: '24h format (default)' })),
};

// h2: show-seconds
export const ShowSeconds: Story = {
  render: () => row(makePicker({ 'show-seconds': true, label: 'With Seconds' })),
};

// h2: show-seconds + time-format="12h"
export const ShowSecondsPlusTimeFormat12h: Story = {
  render: () => row(makePicker({ 'show-seconds': true, 'time-format': '12h', label: 'Seconds + 12h' })),
};

// h2: Date formats
export const DateFormats: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem;';
    for (const fmt of DATE_FORMATS) {
      wrap.appendChild(makePicker({ 'date-format': fmt, label: fmt }));
    }
    return wrap;
  },
};

// h2: variant="inline" (always visible)
export const VariantInline: Story = {
  render: () => row(makePicker({ variant: 'inline', label: 'Inline always visible' })),
};

// h2: variant="dropdown" (default)
export const VariantDropdown: Story = {
  render: () => row(makePicker({ variant: 'dropdown', label: 'Dropdown' })),
};

// h2: min + max
export const MinMax: Story = {
  render: () => row(makePicker({ min: '2025-01-01T00:00', max: '2025-12-31T23:59', label: 'Min/Max (2025 only)' })),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(makePicker({ disabled: true, label: 'Disabled' })),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => row(makePicker({ readonly: true, value: '2025-06-15T14:30', label: 'Readonly' })),
};

// h2: Required
export const Required: Story = {
  render: () => row(makePicker({ required: true, label: 'Required' })),
};

// h2: Invalid + error-text
export const InvalidPlusErrorText: Story = {
  render: () => row(makePicker({ invalid: true, 'error-text': 'Please select a valid date and time', label: 'Date & Time' })),
};

// h2: helper-text
export const HelperText: Story = {
  render: () => row(makePicker({ label: 'Appointment', 'helper-text': 'Select date and time for your appointment' })),
};

// h2: Custom placeholder
export const CustomPlaceholder: Story = {
  render: () => row(makePicker({ label: 'Schedule', placeholder: 'Pick a date & time...' })),
};

// h2: Form: name
export const FormName: Story = {
  render: () => row(makePicker({ name: 'scheduled_at', label: 'Scheduled At (name=scheduled_at)' })),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makePicker({ size: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(makePicker({ loading: true, label: 'Loading' })),
};

// h2: Clearable
export const Clearable: Story = {
  render: () => row(makePicker({ clearable: true, value: '2025-06-15T14:30', label: 'Clearable' })),
};

// h2: Clearable + disabled (clear hidden)
export const ClearablePlusDisabled: Story = {
  render: () => row(makePicker({ clearable: true, disabled: true, value: '2025-06-15T14:30', label: 'Clearable + Disabled (clear hidden)' })),
};

// h2: variant="inline" + 12h + show-seconds
export const VariantInlinePlus12hPlusShowSeconds: Story = {
  render: () => row(makePicker({ variant: 'inline', 'time-format': '12h', 'show-seconds': true, label: 'Inline + 12h + Seconds' })),
};
