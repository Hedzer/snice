import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-color-picker';
import type { ColorPickerSize, ColorPickerFormat, SniceColorPickerElement } from './snice-color-picker.types';

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
  title: 'ColorPicker',
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

// h2: External label lifecycle and coherent chooser naming
export const ExternalLabelLifecycle: Story = {
  render: () => {
    const fixture = document.createElement('section');
    fixture.id = 'color-picker-label-story';
    fixture.innerHTML = `
      <style>
        #color-picker-label-story { display:grid;gap:1rem;max-width:40rem; }
        #color-picker-label-story .label-row { display:flex;gap:.35rem;align-items:baseline;flex-wrap:wrap; }
        #color-picker-label-story .controls { display:flex;gap:.5rem;flex-wrap:wrap; }
        #color-picker-label-story button { padding:.45rem .7rem; }
      </style>
      <div>
        <div class="label-row">
          <label id="color-story-primary" for="color-story-picker">Brand color</label>
          <label id="color-story-secondary" for="color-story-picker">required</label>
        </div>
        <snice-color-picker
          id="color-story-picker"
          label="Internal color fallback"
          helper-text="Use an approved brand color."
          show-presets
          required
        ></snice-color-picker>
      </div>
      <div>
        <label for="color-story-swatch">Swatch color</label>
        <snice-color-picker
          id="color-story-swatch"
          show-input="false"
          helper-text="The swatch becomes the primary label target."
        ></snice-color-picker>
      </div>
      <div>
        <label for="color-story-disabled">Disabled color</label>
        <snice-color-picker id="color-story-disabled" disabled show-input="false"></snice-color-picker>
      </div>
      <div class="controls">
        <button type="button" data-action="name">Change label</button>
        <button type="button" data-action="error">Show error</button>
        <button type="button" data-action="association">Remove external labels</button>
      </div>
      <output aria-live="polite">Accessible name: Brand color required</output>
    `;

    const picker = fixture.querySelector('#color-story-picker') as SniceColorPickerElement;
    const primary = fixture.querySelector('#color-story-primary') as HTMLLabelElement;
    const secondary = fixture.querySelector('#color-story-secondary') as HTMLLabelElement;
    const output = fixture.querySelector('output')!;
    let labelsAttached = true;
    const updateOutput = () => requestAnimationFrame(() => {
      const input = picker.shadowRoot?.querySelector('.color-input');
      output.textContent = `Accessible name: ${input?.getAttribute('aria-label') || ''}`;
    });
    fixture.querySelector('[data-action="name"]')!.addEventListener('click', () => {
      primary.textContent = primary.textContent === 'Brand color' ? 'Surface color' : 'Brand color';
      updateOutput();
    });
    fixture.querySelector('[data-action="error"]')!.addEventListener('click', event => {
      const button = event.currentTarget as HTMLButtonElement;
      const showing = picker.errorText !== '';
      picker.invalid = !showing;
      picker.errorText = showing ? '' : 'Choose a color with sufficient contrast.';
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

// h2: CSS Parts Styling
// Available parts: spinner, error-text, helper-text
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: bold status text */
      .parts-demo__bold snice-color-picker::part(error-text) {
        color: #c62828;
        font-weight: 700;
        font-size: 0.85rem;
        background: rgba(198,40,40,0.08);
        border-left: 3px solid #c62828;
        padding: 0.25rem 0.5rem;
        border-radius: 0 4px 4px 0;
      }
      .parts-demo__bold snice-color-picker::part(helper-text) {
        color: #1565c0;
        font-weight: 600;
        font-style: italic;
        font-size: 0.75rem;
        background: rgba(21,101,192,0.06);
        border-left: 3px solid #1565c0;
        padding: 0.25rem 0.5rem;
        border-radius: 0 4px 4px 0;
      }

      /* Styled: pill-shaped status */
      .parts-demo__pill snice-color-picker::part(error-text) {
        background: #ffebee;
        color: #b71c1c;
        border-radius: 999px;
        padding: 0.2rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        border: 1px solid rgba(183,28,28,0.3);
      }
      .parts-demo__pill snice-color-picker::part(helper-text) {
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 999px;
        padding: 0.2rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 600;
        border: 1px solid rgba(46,125,50,0.3);
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
    defaultSection.appendChild(makePicker({ label: 'Color', value: '#4f46e5', 'helper-text': 'Pick a color', 'show-input': true }));
    defaultSection.appendChild(makePicker({ label: 'Invalid Color', value: '#ff1744', invalid: true, 'error-text': 'This color is not allowed', 'show-input': true }));
    container.appendChild(defaultSection);

    // Bold section
    const boldSection = document.createElement('div');
    boldSection.className = 'parts-demo__section parts-demo__bold';
    const boldLabel = document.createElement('div');
    boldLabel.className = 'parts-demo__label';
    boldLabel.textContent = '::part(error-text/helper-text) — Bold bordered style';
    boldSection.appendChild(boldLabel);
    boldSection.appendChild(makePicker({ label: 'Brand Color', value: '#1565c0', 'helper-text': 'Choose your brand color', 'show-input': true }));
    boldSection.appendChild(makePicker({ label: 'Restricted', value: '#c62828', invalid: true, 'error-text': 'Color does not meet contrast requirements', 'show-input': true }));
    container.appendChild(boldSection);

    // Pill section
    const pillSection = document.createElement('div');
    pillSection.className = 'parts-demo__section parts-demo__pill';
    const pillLabel = document.createElement('div');
    pillLabel.className = 'parts-demo__label';
    pillLabel.textContent = '::part(error-text/helper-text) — Pill-shaped badges';
    pillSection.appendChild(pillLabel);
    pillSection.appendChild(makePicker({ label: 'Accent Color', value: '#2e7d32', 'helper-text': 'WCAG AA compliant', 'show-input': true }));
    pillSection.appendChild(makePicker({ label: 'Invalid', value: '#b71c1c', invalid: true, 'error-text': 'Fails WCAG contrast ratio', 'show-input': true }));
    container.appendChild(pillSection);

    return container;
  },
};
