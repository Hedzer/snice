import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-date-picker';
import type { DatePickerSize, DatePickerVariant, DateFormat, SniceDatePickerElement } from './snice-date-picker.types';

type Args = {
  size?: DatePickerSize;
  variant?: DatePickerVariant;
  value?: string;
  defaultValue?: string;
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
  title: 'DatePicker',
  component: 'snice-date-picker',
  tags: ['autodocs'],
  argTypes: {
    size:           { control: 'select', options: SIZES },
    variant:        { control: 'select', options: VARIANTS },
    value:          { control: 'text' },
    defaultValue:   { control: 'text' },
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
    const el = document.createElement('snice-date-picker') as SniceDatePickerElement;
    if (args.size           !== undefined) el.setAttribute('size',               String(args.size));
    if (args.variant        !== undefined) el.setAttribute('variant',            String(args.variant));
    if (args.defaultValue   !== undefined) el.defaultValue =                     String(args.defaultValue);
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
    if (args.value          !== undefined) el.value = String(args.value);
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

// h2: Native form integration
export const FormIntegration: Story = {
  render: () => {
    const form = document.createElement('form');
    form.id = 'date-picker-story-form';
    form.style.cssText = 'display:flex;flex-direction:column;gap:.875rem;max-width:32rem;';
    form.innerHTML = `
      <snice-date-picker
        id="date-picker-story-delivery"
        name="delivery-date"
        value="2026-03-15"
        format="dd/mm/yyyy"
        min="2026-03-10"
        max="2026-03-20"
        label="Delivery date"
        helper-text="Displayed as DD/MM/YYYY; submitted as YYYY-MM-DD"
        clearable
        required
      ></snice-date-picker>
      <snice-date-picker
        id="date-picker-story-readonly"
        name="confirmed-date"
        value="2026-03-16"
        format="mmmm dd, yyyy"
        label="Confirmed date"
        readonly
      ></snice-date-picker>
      <fieldset disabled style="display:flex;flex-direction:column;gap:.75rem;border:1px solid var(--snice-color-border, #475569);border-radius:.5rem;padding:.75rem;">
        <legend>
          Disabled fieldset
          <snice-date-picker
            id="date-picker-story-legend"
            name="legend-date"
            value="2026-03-12"
            label="First legend remains enabled"
          ></snice-date-picker>
        </legend>
        <snice-date-picker
          id="date-picker-story-fieldset"
          name="disabled-date"
          value="2026-03-13"
          label="Descendant is effectively disabled"
        ></snice-date-picker>
      </fieldset>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
        <button type="submit">Submit</button>
        <button type="reset">Reset defaults</button>
      </div>
      <output aria-live="polite">Ready</output>
    `;

    const output = form.querySelector('output')!;
    const describeData = () => Array.from(new FormData(form).entries())
      .map(([name, value]) => `${name}=${String(value)}`)
      .join(', ') || '(empty)';
    form.addEventListener('submit', event => {
      event.preventDefault();
      output.textContent = `Submitted: ${describeData()}`;
    });
    form.addEventListener('reset', () => {
      requestAnimationFrame(() => { output.textContent = `Reset: ${describeData()}`; });
    });
    return form;
  },
};

// h2: Disabled + value + clearable (clear hidden when disabled)
export const DisabledValueClearable: Story = {
  render: () => row(
    makePicker({ disabled: true, clearable: true, value: '2025-06-15', format: 'yyyy-mm-dd', label: 'Disabled (clear hidden)' }),
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

      /* Styled: frosted glass / indigo theme */
      .parts-demo__glass snice-date-picker::part(input) {
        background: rgba(99,102,241,0.08);
        border: 2px solid rgba(99,102,241,0.4);
        border-radius: 10px;
        color: #312e81;
        font-weight: 600;
        padding: 0.5rem 1rem;
        box-shadow: 0 2px 8px rgba(99,102,241,0.15);
      }
      .parts-demo__glass snice-date-picker::part(calendar-toggle) {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.35rem 0.6rem;
        box-shadow: 0 2px 6px rgba(99,102,241,0.4);
        cursor: pointer;
      }
      .parts-demo__glass snice-date-picker::part(clear) {
        color: #6366f1;
        background: rgba(99,102,241,0.1);
        border-radius: 50%;
      }
      .parts-demo__glass snice-date-picker::part(helper-text) {
        color: #6366f1;
        font-style: italic;
        font-size: 0.75rem;
      }

      /* Styled: dark emerald terminal */
      .parts-demo__emerald snice-date-picker::part(input) {
        background: #001a0d;
        border: 1px solid #00c853;
        border-radius: 4px;
        color: #00e676;
        font-family: 'Courier New', monospace;
        font-weight: 500;
        letter-spacing: 0.05em;
        box-shadow: 0 0 8px rgba(0,200,83,0.2);
      }
      .parts-demo__emerald snice-date-picker::part(calendar-toggle) {
        background: #003300;
        color: #00c853;
        border: 1px solid #00c853;
        border-radius: 3px;
        box-shadow: 0 0 6px rgba(0,200,83,0.4);
        cursor: pointer;
      }
      .parts-demo__emerald snice-date-picker::part(clear) {
        color: #00c853;
        opacity: 0.8;
      }
      .parts-demo__emerald snice-date-picker::part(error-text) {
        color: #ff1744;
        font-family: 'Courier New', monospace;
        font-weight: 600;
      }
      .parts-demo__emerald snice-date-picker::part(helper-text) {
        color: #00c853;
        font-family: 'Courier New', monospace;
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
    defaultSection.appendChild(makePicker({ label: 'Select Date', clearable: true, 'helper-text': 'Default styles', value: '2025-06-15', format: 'yyyy-mm-dd' }));
    container.appendChild(defaultSection);

    // Glass section
    const glassSection = document.createElement('div');
    glassSection.className = 'parts-demo__section parts-demo__glass';
    const glassLabel = document.createElement('div');
    glassLabel.className = 'parts-demo__label';
    glassLabel.textContent = '::part(input/calendar-toggle/clear/helper-text) — Frosted indigo';
    glassSection.appendChild(glassLabel);
    glassSection.appendChild(makePicker({ label: 'Departure Date', clearable: true, 'helper-text': 'Pick your travel date', value: '2025-06-15', format: 'yyyy-mm-dd' }));
    container.appendChild(glassSection);

    // Emerald section
    const emeraldSection = document.createElement('div');
    emeraldSection.className = 'parts-demo__section parts-demo__emerald';
    const emeraldLabel = document.createElement('div');
    emeraldLabel.className = 'parts-demo__label';
    emeraldLabel.textContent = '::part(input/calendar-toggle/clear/error-text/helper-text) — Terminal green';
    emeraldSection.appendChild(emeraldLabel);
    emeraldSection.appendChild(makePicker({ label: 'Expiry Date', clearable: true, 'helper-text': 'YYYY-MM-DD format', value: '2025-06-15', format: 'yyyy-mm-dd' }));
    emeraldSection.appendChild(makePicker({ label: 'Invalid Date', invalid: true, 'error-text': 'INVALID DATE VALUE' }));
    container.appendChild(emeraldSection);

    return container;
  },
};
