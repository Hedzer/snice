import type { Meta, StoryObj } from '@storybook/web-components-vite';
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

// h2: CSS Parts Styling
// Available parts: base, label, input, toggle, clear, spinner, dropdown, error-text, helper-text, hours, minutes, seconds, period
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: cyberpunk cyan */
      .parts-demo__cyber snice-time-picker::part(base) {
        background: #050f1a;
        border: 1px solid #00e5ff;
        border-radius: 8px;
        box-shadow: 0 0 16px rgba(0,229,255,0.2);
        padding: 0.25rem;
      }
      .parts-demo__cyber snice-time-picker::part(label) {
        color: #00e5ff;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .parts-demo__cyber snice-time-picker::part(input) {
        background: transparent;
        border: none;
        color: #00e5ff;
        font-family: 'Courier New', monospace;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        box-shadow: none;
      }
      .parts-demo__cyber snice-time-picker::part(toggle) {
        background: rgba(0,229,255,0.15);
        color: #00e5ff;
        border: 1px solid rgba(0,229,255,0.3);
        border-radius: 4px;
        cursor: pointer;
      }
      .parts-demo__cyber snice-time-picker::part(clear) {
        color: #00e5ff;
        opacity: 0.7;
      }
      .parts-demo__cyber snice-time-picker::part(helper-text) {
        color: rgba(0,229,255,0.6);
        font-family: monospace;
        font-size: 0.7rem;
      }
      .parts-demo__cyber snice-time-picker::part(hours),
      .parts-demo__cyber snice-time-picker::part(minutes) {
        background: #050f1a;
        border: 1px solid rgba(0,229,255,0.2);
      }

      /* Styled: warm sunset */
      .parts-demo__sunset snice-time-picker::part(base) {
        background: linear-gradient(135deg, #fff3e0, #fbe9e7);
        border: 2px solid #ff6f00;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(255,111,0,0.15);
      }
      .parts-demo__sunset snice-time-picker::part(label) {
        color: #bf360c;
        font-weight: 700;
        font-size: 0.8rem;
      }
      .parts-demo__sunset snice-time-picker::part(input) {
        background: rgba(255,255,255,0.6);
        border: 1px solid #ffab40;
        border-radius: 8px;
        color: #bf360c;
        font-weight: 600;
      }
      .parts-demo__sunset snice-time-picker::part(toggle) {
        background: linear-gradient(135deg, #ff6f00, #ff8f00);
        color: #fff;
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(255,111,0,0.4);
        cursor: pointer;
      }
      .parts-demo__sunset snice-time-picker::part(helper-text) {
        color: #e65100;
        font-style: italic;
      }
      .parts-demo__sunset snice-time-picker::part(error-text) {
        color: #c62828;
        font-weight: 700;
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
    defaultSection.appendChild(makePicker({ label: 'Time', value: '14:30', 'helper-text': 'Default styles' }));
    container.appendChild(defaultSection);

    // Cyber section
    const cyberSection = document.createElement('div');
    cyberSection.className = 'parts-demo__section parts-demo__cyber';
    const cyberLabel = document.createElement('div');
    cyberLabel.className = 'parts-demo__label';
    cyberLabel.textContent = '::part(base/label/input/toggle/clear/helper-text/hours/minutes) — Cyberpunk';
    cyberSection.appendChild(cyberLabel);
    cyberSection.appendChild(makePicker({ label: 'System Time', value: '23:59', 'helper-text': 'HH:MM UTC' }));
    container.appendChild(cyberSection);

    // Sunset section
    const sunsetSection = document.createElement('div');
    sunsetSection.className = 'parts-demo__section parts-demo__sunset';
    const sunsetLabel = document.createElement('div');
    sunsetLabel.className = 'parts-demo__label';
    sunsetLabel.textContent = '::part(base/label/input/toggle/helper-text/error-text) — Warm sunset';
    sunsetSection.appendChild(sunsetLabel);
    sunsetSection.appendChild(makePicker({ label: 'Meeting Time', value: '09:00', 'helper-text': 'Business hours only' }));
    container.appendChild(sunsetSection);

    return container;
  },
};

// h2: CSS Parts Advanced
// Demonstrates column parts: hours, minutes, seconds, period
export const CSSPartsAdvanced: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-adv { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-adv__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-adv__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Column-level styling: different color per time column */
      .parts-adv__columns snice-time-picker::part(hours) {
        background: rgba(233,30,99,0.08);
        border-radius: 6px 0 0 6px;
        border-right: 1px solid rgba(233,30,99,0.2);
      }
      .parts-adv__columns snice-time-picker::part(minutes) {
        background: rgba(33,150,243,0.08);
        border-right: 1px solid rgba(33,150,243,0.2);
      }
      .parts-adv__columns snice-time-picker::part(seconds) {
        background: rgba(76,175,80,0.08);
        border-right: 1px solid rgba(76,175,80,0.2);
        border-radius: 0 6px 6px 0;
      }
      .parts-adv__columns snice-time-picker::part(period) {
        background: rgba(255,152,0,0.08);
        border-radius: 6px;
        font-weight: 700;
        color: #e65100;
      }
      .parts-adv__columns snice-time-picker::part(dropdown) {
        background: #1a1a2e;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      }
    `;

    const container = document.createElement('div');
    container.className = 'parts-adv';
    container.appendChild(style);

    const colSection = document.createElement('div');
    colSection.className = 'parts-adv__section parts-adv__columns';
    const colLabel = document.createElement('div');
    colLabel.className = 'parts-adv__label';
    colLabel.textContent = '::part(hours/minutes/seconds/period/dropdown) — Color-coded columns';
    colSection.appendChild(colLabel);
    const tp = makePicker({ label: 'Full Time', value: '10:30:45', format: '12h', 'show-seconds': true });
    colSection.appendChild(tp);
    container.appendChild(colSection);

    return container;
  },
};
