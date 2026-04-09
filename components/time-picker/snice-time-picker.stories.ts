import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-time-picker';
import type { TimePickerFormat, TimePickerStep, TimePickerVariant, TimePickerSize } from './snice-time-picker.types';

type Args = {
  value?: string;
  format?: TimePickerFormat;
  step?: TimePickerStep;
  minTime?: string;
  maxTime?: string;
  showSeconds?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  variant?: TimePickerVariant;
  size?: TimePickerSize;
  loading?: boolean;
  clearable?: boolean;
};

const FORMATS: TimePickerFormat[] = ['24h', '12h'];
const STEPS: TimePickerStep[] = [1, 5, 10, 15, 30];
const VARIANTS: TimePickerVariant[] = ['dropdown', 'inline'];
const SIZES: TimePickerSize[] = ['small', 'medium', 'large'];

function makePicker(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-time-picker');
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
  title: 'Form/TimePicker',
  component: 'snice-time-picker',
  tags: ['autodocs'],
  argTypes: {
    value:       { control: 'text' },
    format:      { control: 'select', options: FORMATS },
    step:        { control: 'select', options: STEPS },
    minTime:     { control: 'text' },
    maxTime:     { control: 'text' },
    showSeconds: { control: 'boolean' },
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
    size:        { control: 'select', options: SIZES },
    loading:     { control: 'boolean' },
    clearable:   { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-time-picker');
    if (args.value       !== undefined) el.setAttribute('value',        String(args.value));
    if (args.format      !== undefined) el.setAttribute('format',       String(args.format));
    if (args.step        !== undefined) el.setAttribute('step',         String(args.step));
    if (args.minTime     !== undefined) el.setAttribute('min-time',     String(args.minTime));
    if (args.maxTime     !== undefined) el.setAttribute('max-time',     String(args.maxTime));
    if (args.placeholder !== undefined) el.setAttribute('placeholder',  String(args.placeholder));
    if (args.label       !== undefined) el.setAttribute('label',        String(args.label));
    if (args.helperText  !== undefined) el.setAttribute('helper-text',  String(args.helperText));
    if (args.errorText   !== undefined) el.setAttribute('error-text',   String(args.errorText));
    if (args.name        !== undefined) el.setAttribute('name',         String(args.name));
    if (args.variant     !== undefined) el.setAttribute('variant',      String(args.variant));
    if (args.size        !== undefined) el.setAttribute('size',         String(args.size));
    if (args.showSeconds) el.toggleAttribute('show-seconds', true);
    if (args.disabled)    el.toggleAttribute('disabled',     true);
    if (args.readonly)    el.toggleAttribute('readonly',     true);
    if (args.required)    el.toggleAttribute('required',     true);
    if (args.invalid)     el.toggleAttribute('invalid',      true);
    if (args.loading)     el.toggleAttribute('loading',      true);
    if (args.clearable)   el.toggleAttribute('clearable',    true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Time', size: 'medium', variant: 'dropdown', format: '24h' },
};

// h2: Format: 24h (default) vs 12h
export const FormatComparison: Story = {
  render: () => row(
    makePicker({ format: '24h', label: '24h (default)' }),
    makePicker({ format: '12h', label: '12h' }),
  ),
};

// h2: Variant: dropdown (default) vs inline
export const VariantComparison: Story = {
  render: () => row(
    makePicker({ variant: 'dropdown', label: 'Dropdown' }),
    makePicker({ variant: 'inline', label: 'Inline' }),
  ),
};

// h2: Inline + 12h
export const Inline12h: Story = {
  render: () => row(
    makePicker({ variant: 'inline', format: '12h', label: 'Inline 12h' }),
  ),
};

// h2: Show Seconds
export const ShowSeconds: Story = {
  render: () => row(
    makePicker({ 'show-seconds': true, label: 'With Seconds (24h)' }),
    makePicker({ 'show-seconds': true, format: '12h', label: 'With Seconds (12h)' }),
  ),
};

// h2: Step Values (minute increments)
export const StepValues: Story = {
  render: () => row(
    ...STEPS.map(s => makePicker({ step: s, label: `step=${s}` })),
  ),
};

// h2: Min/Max Time Constraints
export const MinMaxTimeConstraints: Story = {
  render: () => row(
    makePicker({ 'min-time': '09:00', 'max-time': '17:00', label: '9am-5pm only' }),
  ),
};

// h2: Min/Max + 12h Format
export const MinMaxPlus12h: Story = {
  render: () => row(
    makePicker({ 'min-time': '09:00', 'max-time': '17:00', format: '12h', label: '9am-5pm (12h)' }),
  ),
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => row(
    makePicker({ disabled: true, label: 'Disabled' }),
    makePicker({ readonly: true, value: '14:30', label: 'Readonly' }),
    makePicker({ required: true, label: 'Required' }),
    makePicker({ invalid: true, label: 'Invalid' }),
  ),
};

// h2: Helper Text
export const HelperText: Story = {
  render: () => row(
    makePicker({ label: 'Meeting Time', 'helper-text': 'Business hours: 9am - 5pm' }),
  ),
};

// h2: Error Text
export const ErrorText: Story = {
  render: () => row(
    makePicker({ label: 'Appointment', invalid: true, 'error-text': 'Please select a valid time' }),
  ),
};

// h2: Placeholder
export const Placeholder: Story = {
  render: () => row(
    makePicker({ placeholder: 'HH:MM', label: 'Custom placeholder' }),
  ),
};

// h2: With Value
export const WithValue: Story = {
  render: () => row(
    makePicker({ value: '14:30', label: '24h value' }),
    makePicker({ value: '14:30', format: '12h', label: '12h value' }),
  ),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => row(
    makePicker({ value: '09:00' }),
  ),
};

// h2: Name (form integration)
export const NameFormIntegration: Story = {
  render: () => row(
    makePicker({ name: 'meeting_time', label: 'Meeting Time (name=meeting_time)' }),
  ),
};

// h2: Combination: 12h + seconds + step 5 + inline
export const Combination12hSecondsStep5Inline: Story = {
  render: () => row(
    makePicker({ format: '12h', 'show-seconds': true, step: 5, variant: 'inline', label: '12h + sec + step5 + inline' }),
  ),
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
  render: () => row(makePicker({ clearable: true, value: '14:30', label: 'Clearable' })),
};

// h2: Edge Cases
export const EdgeCases: Story = {
  render: () => row(
    makePicker({ value: '00:00', label: 'Midnight (00:00)' }),
    makePicker({ value: '23:59', label: 'Late night (23:59)' }),
    makePicker({ value: '12:00', format: '12h', label: 'Noon 12h' }),
  ),
};
