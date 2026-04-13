import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-date-range-picker';
import type { DateRangePickerSize, DateRangePickerVariant, DateRangeFormat } from './snice-date-range-picker.types';

type Args = {
  size?: DateRangePickerSize;
  variant?: DateRangePickerVariant;
  start?: string;
  end?: string;
  format?: DateRangeFormat;
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
  columns?: number;
  firstDayOfWeek?: number;
};

const SIZES: DateRangePickerSize[] = ['small', 'medium', 'large'];
const VARIANTS: DateRangePickerVariant[] = ['outlined', 'filled', 'underlined'];
const FORMATS: DateRangeFormat[] = ['mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd', 'yyyy/mm/dd', 'dd-mm-yyyy', 'mm-dd-yyyy', 'mmmm dd, yyyy'];

function makePicker(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-date-range-picker');
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
  title: 'Form/DateRangePicker',
  component: 'snice-date-range-picker',
  tags: ['autodocs'],
  argTypes: {
    size:           { control: 'select', options: SIZES },
    variant:        { control: 'select', options: VARIANTS },
    start:          { control: 'text' },
    end:            { control: 'text' },
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
    columns:        { control: 'number' },
    firstDayOfWeek: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-date-range-picker');
    if (args.size           !== undefined) el.setAttribute('size',              String(args.size));
    if (args.variant        !== undefined) el.setAttribute('variant',           String(args.variant));
    if (args.start          !== undefined) el.setAttribute('start',             String(args.start));
    if (args.end            !== undefined) el.setAttribute('end',               String(args.end));
    if (args.format         !== undefined) el.setAttribute('format',            String(args.format));
    if (args.placeholder    !== undefined) el.setAttribute('placeholder',       String(args.placeholder));
    if (args.label          !== undefined) el.setAttribute('label',             String(args.label));
    if (args.helperText     !== undefined) el.setAttribute('helper-text',       String(args.helperText));
    if (args.errorText      !== undefined) el.setAttribute('error-text',        String(args.errorText));
    if (args.min            !== undefined) el.setAttribute('min',               String(args.min));
    if (args.max            !== undefined) el.setAttribute('max',               String(args.max));
    if (args.name           !== undefined) el.setAttribute('name',              String(args.name));
    if (args.columns        !== undefined) el.setAttribute('columns',           String(args.columns));
    if (args.firstDayOfWeek !== undefined) el.setAttribute('first-day-of-week', String(args.firstDayOfWeek));
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
  args: { label: 'Date Range', size: 'medium', variant: 'outlined', format: 'mm/dd/yyyy' },
};

// h2: Default (single column)
export const DefaultSingleColumn: Story = {
  render: () => row(makePicker({ label: 'Select Range' })),
};

// h2: With start + end values
export const WithStartEndValues: Story = {
  render: () => row(
    makePicker({ label: 'Period', start: '2025-01-01', end: '2025-01-15', format: 'yyyy-mm-dd' }),
  ),
};

// h2: columns="2" (dual calendar)
export const Columns2DualCalendar: Story = {
  render: () => row(
    makePicker({ label: 'Date Range', columns: 2 }),
  ),
};

// h2: With presets (single column)
export const WithPresetsSingleColumn: Story = {
  render: () => row(
    makePicker({ label: 'Range with Presets', 'show-presets': true }),
  ),
};

// h2: columns="2" + presets
export const Columns2PlusPresets: Story = {
  render: () => row(
    makePicker({ label: 'Dual + Presets', columns: 2, 'show-presets': true }),
  ),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makePicker({ size: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
};

// h2: Variants
export const Variants: Story = {
  render: () => row(...VARIANTS.map(v => makePicker({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))),
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

// h2: clearable
export const Clearable: Story = {
  render: () => row(
    makePicker({ clearable: true, start: '2025-01-01', end: '2025-01-31', format: 'yyyy-mm-dd', label: 'Clearable' }),
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
  render: () => row(makePicker({ disabled: true, label: 'Disabled' })),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => row(makePicker({ readonly: true, start: '2025-01-01', end: '2025-01-31', format: 'yyyy-mm-dd', label: 'Readonly' })),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(makePicker({ loading: true, label: 'Loading' })),
};

// h2: Required
export const Required: Story = {
  render: () => row(makePicker({ required: true, label: 'Required Range' })),
};

// h2: Invalid + error-text
export const InvalidPlusErrorText: Story = {
  render: () => row(
    makePicker({ invalid: true, 'error-text': 'Please select a valid date range', label: 'Date Range' }),
  ),
};

// h2: helper-text
export const HelperText: Story = {
  render: () => row(
    makePicker({ label: 'Vacation Period', 'helper-text': 'Select your vacation start and end dates' }),
  ),
};

// h2: first-day-of-week="1" (Monday)
export const FirstDayOfWeekMonday: Story = {
  render: () => row(
    makePicker({ 'first-day-of-week': 1, label: 'Monday start' }),
  ),
};

// h2: Form: name
export const FormName: Story = {
  render: () => row(
    makePicker({ name: 'date_range', label: 'Date Range (name=date_range)' }),
  ),
};

// h2: CSS Parts Styling
// Available parts: input, calendar-toggle, clear, spinner, calendar, error-text, helper-text
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: rose gold / warm luxury */
      .parts-demo__luxury snice-date-range-picker::part(input) {
        background: linear-gradient(135deg, #fff9f5, #fff0e8);
        border: 2px solid #d4876a;
        border-radius: 10px;
        color: #6b3020;
        font-weight: 600;
        box-shadow: 0 2px 10px rgba(212,135,106,0.2);
      }
      .parts-demo__luxury snice-date-range-picker::part(calendar-toggle) {
        background: linear-gradient(135deg, #d4876a, #b85c3a);
        color: #fff;
        border: none;
        border-radius: 8px;
        box-shadow: 0 3px 8px rgba(184,92,58,0.4);
        cursor: pointer;
      }
      .parts-demo__luxury snice-date-range-picker::part(clear) {
        color: #d4876a;
        font-weight: 700;
      }
      .parts-demo__luxury snice-date-range-picker::part(helper-text) {
        color: #b85c3a;
        font-style: italic;
        font-size: 0.75rem;
      }

      /* Styled: midnight blue */
      .parts-demo__midnight snice-date-range-picker::part(input) {
        background: #0a0e27;
        border: 1px solid #3d5afe;
        border-radius: 6px;
        color: #82b1ff;
        font-family: monospace;
        box-shadow: 0 0 10px rgba(61,90,254,0.25);
      }
      .parts-demo__midnight snice-date-range-picker::part(calendar-toggle) {
        background: #1a237e;
        color: #82b1ff;
        border: 1px solid #3d5afe;
        border-radius: 5px;
        box-shadow: 0 0 8px rgba(61,90,254,0.4);
        cursor: pointer;
      }
      .parts-demo__midnight snice-date-range-picker::part(clear) {
        color: #3d5afe;
        opacity: 0.85;
      }
      .parts-demo__midnight snice-date-range-picker::part(error-text) {
        color: #ff5252;
        font-weight: 600;
      }
      .parts-demo__midnight snice-date-range-picker::part(helper-text) {
        color: #448aff;
        font-size: 0.72rem;
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
    defaultSection.appendChild(makePicker({ label: 'Date Range', clearable: true, 'helper-text': 'Default styles' }));
    container.appendChild(defaultSection);

    // Luxury section
    const luxSection = document.createElement('div');
    luxSection.className = 'parts-demo__section parts-demo__luxury';
    const luxLabel = document.createElement('div');
    luxLabel.className = 'parts-demo__label';
    luxLabel.textContent = '::part(input/calendar-toggle/clear/helper-text) — Rose gold luxury';
    luxSection.appendChild(luxLabel);
    luxSection.appendChild(makePicker({ label: 'Booking Period', clearable: true, 'helper-text': 'Select check-in and check-out dates' }));
    container.appendChild(luxSection);

    // Midnight section
    const midSection = document.createElement('div');
    midSection.className = 'parts-demo__section parts-demo__midnight';
    const midLabel = document.createElement('div');
    midLabel.className = 'parts-demo__label';
    midLabel.textContent = '::part(input/calendar-toggle/clear/error-text/helper-text) — Midnight blue';
    midSection.appendChild(midLabel);
    midSection.appendChild(makePicker({ label: 'Report Window', clearable: true, 'helper-text': 'YYYY-MM-DD' }));
    container.appendChild(midSection);

    return container;
  },
};
