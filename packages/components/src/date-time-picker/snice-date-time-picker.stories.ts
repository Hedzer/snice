import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-date-time-picker';
import type { DateTimePickerVariant, DateTimePickerTimeFormat, DateTimePickerSize, DateTimePickerDateFormat } from './snice-date-time-picker.types';

type Args = {
  size?: DateTimePickerSize;
  value?: string;
  defaultValue?: string;
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
  title: 'DateTimePicker',
  component: 'snice-date-time-picker',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    value:       { control: 'text' },
    defaultValue:{ control: 'text', description: 'Authored value attribute / form-reset default' },
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
    if (args.defaultValue !== undefined) (el as any).defaultValue =     String(args.defaultValue);
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

// h2: Native form integration
export const FormIntegration: Story = {
  render: () => {
    const form = document.createElement('form');
    form.id = 'date-time-picker-story-form';
    form.style.cssText = 'display:flex;flex-direction:column;gap:.875rem;max-width:40rem;';
    form.innerHTML = `
      <snice-date-time-picker
        id="date-time-picker-story-appointment"
        name="appointment"
        value="2026-03-10T14:05"
        date-format="dd/mm/yyyy"
        min="2026-03-01T00:00"
        max="2026-03-31T23:59"
        label="Appointment"
        helper-text="Displayed locally; submitted as a canonical local datetime"
        show-seconds
        clearable
        required
      ></snice-date-time-picker>
      <snice-date-time-picker
        id="date-time-picker-story-readonly"
        name="confirmed"
        value="2026-03-12T16:30"
        date-format="mmmm dd, yyyy"
        time-format="12h"
        label="Confirmed appointment"
        readonly
      ></snice-date-time-picker>
      <fieldset disabled style="display:flex;flex-direction:column;gap:.75rem;border:1px solid var(--snice-color-border, rgb(226 226 226));border-radius:.5rem;padding:.75rem;">
        <legend>
          Disabled fieldset
          <snice-date-time-picker
            id="date-time-picker-story-legend"
            name="legend-time"
            value="2026-03-04T11:00"
            label="First legend remains enabled"
          ></snice-date-time-picker>
        </legend>
        <snice-date-time-picker
          id="date-time-picker-story-fieldset"
          name="disabled-time"
          value="2026-03-06T12:00"
          label="Descendant is effectively disabled"
        ></snice-date-time-picker>
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

// h2: External label lifecycle and composite naming
export const ExternalLabelLifecycle: Story = {
  render: () => {
    const fixture = document.createElement('section');
    fixture.id = 'date-time-picker-label-story';
    fixture.innerHTML = `
      <style>
        #date-time-picker-label-story { display:grid;gap:1rem;max-width:46rem; }
        #date-time-picker-label-story .label-row { display:flex;gap:.35rem;align-items:baseline;flex-wrap:wrap; }
        #date-time-picker-label-story .controls { display:flex;gap:.5rem;flex-wrap:wrap; }
        #date-time-picker-label-story button { padding:.45rem .7rem; }
      </style>
      <div>
        <div class="label-row">
          <label id="datetime-story-primary" for="datetime-story-picker">Appointment</label>
          <label id="datetime-story-secondary" for="datetime-story-picker">required</label>
        </div>
        <snice-date-time-picker
          id="datetime-story-picker"
          label="Internal date-time fallback"
          helper-text="Times are displayed locally."
          show-seconds
          time-format="12h"
          required
        ></snice-date-time-picker>
      </div>
      <div>
        <label for="datetime-story-inline">Inline schedule</label>
        <snice-date-time-picker
          id="datetime-story-inline"
          variant="inline"
          helper-text="The date and each time group retain distinct names."
        ></snice-date-time-picker>
      </div>
      <div>
        <label for="datetime-story-disabled">Disabled appointment</label>
        <snice-date-time-picker id="datetime-story-disabled" disabled></snice-date-time-picker>
      </div>
      <div class="controls">
        <button type="button" data-action="name">Change label</button>
        <button type="button" data-action="error">Show error</button>
        <button type="button" data-action="association">Remove external labels</button>
      </div>
      <output aria-live="polite">Accessible name: Appointment required</output>
    `;

    const picker = fixture.querySelector('#datetime-story-picker') as any;
    const primary = fixture.querySelector('#datetime-story-primary') as HTMLLabelElement;
    const secondary = fixture.querySelector('#datetime-story-secondary') as HTMLLabelElement;
    const output = fixture.querySelector('output')!;
    let labelsAttached = true;
    const updateOutput = () => requestAnimationFrame(() => {
      const input = picker.shadowRoot?.querySelector('.input');
      output.textContent = `Accessible name: ${input?.getAttribute('aria-label') || ''}`;
    });
    fixture.querySelector('[data-action="name"]')!.addEventListener('click', () => {
      primary.textContent = primary.textContent === 'Appointment' ? 'Event starts' : 'Appointment';
      updateOutput();
    });
    fixture.querySelector('[data-action="error"]')!.addEventListener('click', event => {
      const button = event.currentTarget as HTMLButtonElement;
      const showing = picker.errorText !== '';
      picker.invalid = !showing;
      picker.errorText = showing ? '' : 'Choose an available date and time.';
      button.textContent = showing ? 'Show error' : 'Clear error';
      updateOutput();
    });
    fixture.querySelector('[data-action="association"]')!.addEventListener('click', event => {
      labelsAttached = !labelsAttached;
      primary.htmlFor = labelsAttached ? picker.id : '';
      secondary.htmlFor = labelsAttached ? picker.id : '';
      (event.currentTarget as HTMLButtonElement).textContent = labelsAttached ? 'Remove external labels' : 'Restore external labels';
      updateOutput();
    });
    return fixture;
  },
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

// h2: CSS Parts Styling
// Available parts: base, label, input, toggle, clear, spinner, panel, calendar, time, error-text, helper-text
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: violet glass */
      .parts-demo__violet snice-date-time-picker::part(base) {
        background: rgba(94,23,235,0.04);
        border: 2px solid rgba(94,23,235,0.3);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(94,23,235,0.1);
        padding: 0.25rem;
      }
      .parts-demo__violet snice-date-time-picker::part(label) {
        color: #5e17eb;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.06em;
      }
      .parts-demo__violet snice-date-time-picker::part(input) {
        background: rgba(94,23,235,0.05);
        border: 1px solid rgba(94,23,235,0.25);
        border-radius: 8px;
        color: #3a0ca3;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(94,23,235,0.1);
      }
      .parts-demo__violet snice-date-time-picker::part(toggle) {
        background: linear-gradient(135deg, #5e17eb, #7b2ff7);
        color: #fff;
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(94,23,235,0.4);
        cursor: pointer;
      }
      .parts-demo__violet snice-date-time-picker::part(clear) {
        color: #7b2ff7;
        opacity: 0.8;
      }
      .parts-demo__violet snice-date-time-picker::part(panel) {
        background: #f5f0ff;
        border: 1px solid rgba(94,23,235,0.2);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(94,23,235,0.15);
      }
      .parts-demo__violet snice-date-time-picker::part(calendar) {
        border-right: 1px solid rgba(94,23,235,0.1);
      }
      .parts-demo__violet snice-date-time-picker::part(time) {
        background: rgba(94,23,235,0.03);
      }
      .parts-demo__violet snice-date-time-picker::part(helper-text) {
        color: #7b2ff7;
        font-style: italic;
        font-size: 0.75rem;
      }

      /* Styled: dark carbon */
      .parts-demo__carbon snice-date-time-picker::part(base) {
        background: #111;
        border: 1px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      }
      .parts-demo__carbon snice-date-time-picker::part(label) {
        color: #aaa;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .parts-demo__carbon snice-date-time-picker::part(input) {
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        color: #e8e8e8;
        font-family: 'Courier New', monospace;
      }
      .parts-demo__carbon snice-date-time-picker::part(toggle) {
        background: #2a2a2a;
        color: #aaa;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
      }
      .parts-demo__carbon snice-date-time-picker::part(panel) {
        background: #181818;
        border: 1px solid #333;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      }
      .parts-demo__carbon snice-date-time-picker::part(error-text) {
        color: #f44336;
        font-weight: 600;
      }
      .parts-demo__carbon snice-date-time-picker::part(helper-text) {
        color: #666;
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
    defaultSection.appendChild(makePicker({ label: 'Date & Time', 'helper-text': 'Default styles', value: '2025-06-15T14:30' }));
    container.appendChild(defaultSection);

    // Violet section
    const violetSection = document.createElement('div');
    violetSection.className = 'parts-demo__section parts-demo__violet';
    const violetLabel = document.createElement('div');
    violetLabel.className = 'parts-demo__label';
    violetLabel.textContent = '::part(base/label/input/toggle/clear/panel/calendar/time/helper-text) — Violet glass';
    violetSection.appendChild(violetLabel);
    violetSection.appendChild(makePicker({ label: 'Event Date & Time', 'helper-text': 'Select when the event starts', value: '2025-06-15T14:30', clearable: true }));
    container.appendChild(violetSection);

    // Carbon section
    const carbonSection = document.createElement('div');
    carbonSection.className = 'parts-demo__section parts-demo__carbon';
    const carbonLabel = document.createElement('div');
    carbonLabel.className = 'parts-demo__label';
    carbonLabel.textContent = '::part(base/label/input/toggle/panel/error-text/helper-text) — Dark carbon';
    carbonSection.appendChild(carbonLabel);
    carbonSection.appendChild(makePicker({ label: 'Timestamp', 'helper-text': 'ISO format', value: '2025-12-31T23:59' }));
    container.appendChild(carbonSection);

    return container;
  },
};
