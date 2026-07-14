import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-slider';
import type { SliderSize, SliderVariant } from './snice-slider.types';

type Args = {
  size?: SliderSize;
  variant?: SliderVariant;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
  vertical?: boolean;
  name?: string;
};

const SIZES: SliderSize[] = ['small', 'medium', 'large'];
const VARIANTS: SliderVariant[] = ['default', 'primary', 'success', 'warning', 'danger'];

function makeSlider(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-slider');
  el.style.width = '280px';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Slider',
  component: 'snice-slider',
  tags: ['autodocs'],
  argTypes: {
    size:       { control: 'select', options: SIZES },
    variant:    { control: 'select', options: VARIANTS },
    value:      { control: 'number' },
    min:        { control: 'number' },
    max:        { control: 'number' },
    step:       { control: 'number' },
    label:      { control: 'text' },
    helperText: { control: 'text' },
    errorText:  { control: 'text' },
    disabled:   { control: 'boolean' },
    readonly:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    required:   { control: 'boolean' },
    invalid:    { control: 'boolean' },
    showValue:  { control: 'boolean' },
    showTicks:  { control: 'boolean' },
    vertical:   { control: 'boolean' },
    name:       { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-slider');
    el.style.width = '280px';
    if (args.size      !== undefined) el.setAttribute('size',        String(args.size));
    if (args.variant   !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.value     !== undefined) el.setAttribute('value',       String(args.value));
    if (args.min       !== undefined) el.setAttribute('min',         String(args.min));
    if (args.max       !== undefined) el.setAttribute('max',         String(args.max));
    if (args.step      !== undefined) el.setAttribute('step',        String(args.step));
    if (args.label     !== undefined) el.setAttribute('label',       String(args.label));
    if (args.helperText !== undefined) el.setAttribute('helper-text', String(args.helperText));
    if (args.errorText  !== undefined) el.setAttribute('error-text',  String(args.errorText));
    if (args.name      !== undefined) el.setAttribute('name',        String(args.name));
    if (args.disabled)  el.toggleAttribute('disabled',   true);
    if (args.readonly)  el.toggleAttribute('readonly',   true);
    if (args.loading)   el.toggleAttribute('loading',    true);
    if (args.required)  el.toggleAttribute('required',   true);
    if (args.invalid)   el.toggleAttribute('invalid',    true);
    if (args.showValue) el.toggleAttribute('show-value', true);
    if (args.showTicks) el.toggleAttribute('show-ticks', true);
    if (args.vertical)  el.toggleAttribute('vertical',   true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'primary', size: 'medium', value: 50, label: 'Volume' },
};

// h2: Variants
export const Variants: Story = {
  render: () => row(...VARIANTS.map(v => makeSlider({ variant: v, value: 40, label: v.charAt(0).toUpperCase() + v.slice(1) }))),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makeSlider({ size: s, value: 50, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
};

// h2: Variant x Size Matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,280px);gap:.75rem;';
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        grid.appendChild(makeSlider({ variant, size, value: 50, label: `${variant} + ${size}` }));
      }
    }
    return grid;
  },
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => row(
    makeSlider({ disabled: true, value: 40, label: 'Disabled' }),
    makeSlider({ readonly: true, value: 60, label: 'Readonly' }),
    makeSlider({ loading: true, value: 50, label: 'Loading' }),
    makeSlider({ required: true, label: 'Required' }),
    makeSlider({ invalid: true, value: 30, label: 'Invalid' }),
  ),
};

// h2: Show Value
export const ShowValue: Story = {
  render: () => row(
    makeSlider({ 'show-value': true, value: 42, label: 'With value display' }),
    makeSlider({ 'show-value': true, value: 0, label: 'Value at 0' }),
    makeSlider({ 'show-value': true, value: 100, label: 'Value at 100' }),
  ),
};

// h2: Show Ticks
export const ShowTicks: Story = {
  render: () => row(
    makeSlider({ 'show-ticks': true, step: 10, value: 50, label: 'Ticks (step=10)' }),
    makeSlider({ 'show-ticks': true, step: 20, value: 60, label: 'Ticks (step=20)' }),
    makeSlider({ 'show-ticks': true, step: 25, value: 75, label: 'Ticks (step=25)' }),
  ),
};

// h2: Show Ticks + Show Value
export const ShowTicksPlusShowValue: Story = {
  render: () => row(
    makeSlider({ 'show-ticks': true, 'show-value': true, step: 10, value: 40, label: 'Ticks + Value' }),
  ),
};

// h2: Custom Min / Max / Step
export const CustomMinMaxStep: Story = {
  render: () => row(
    makeSlider({ min: 0, max: 10, step: 1, value: 5, 'show-value': true, label: '0-10, step 1' }),
    makeSlider({ min: -50, max: 50, step: 5, value: 0, 'show-value': true, label: '-50 to 50, step 5' }),
    makeSlider({ min: 0, max: 1, step: 0.1, value: 0.5, 'show-value': true, label: '0-1, step 0.1' }),
  ),
};

// h2: Helper Text and Error Text
export const HelperTextAndErrorText: Story = {
  render: () => row(
    makeSlider({ value: 60, label: 'Volume', 'helper-text': 'Adjust the playback volume' }),
    makeSlider({ value: 30, label: 'Brightness', 'error-text': 'Value too low for outdoor use', invalid: true }),
  ),
};

// h2: Vertical Orientation
export const VerticalOrientation: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;align-items:flex-end;height:200px;';
    const v1 = makeSlider({ vertical: true, value: 40, label: 'Vertical' });
    v1.style.cssText = 'height:180px;width:auto;';
    const v2 = makeSlider({ vertical: true, variant: 'primary', value: 60, 'show-value': true });
    v2.style.cssText = 'height:180px;width:auto;';
    const v3 = makeSlider({ vertical: true, variant: 'success', value: 80, 'show-ticks': true, step: 20 });
    v3.style.cssText = 'height:180px;width:auto;';
    const v4 = makeSlider({ vertical: true, variant: 'danger', value: 20, disabled: true });
    v4.style.cssText = 'height:180px;width:auto;';
    wrap.appendChild(v1); wrap.appendChild(v2); wrap.appendChild(v3); wrap.appendChild(v4);
    return wrap;
  },
};

// h2: Vertical Sizes
export const VerticalSizes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;align-items:flex-end;height:200px;';
    for (const size of SIZES) {
      const el = makeSlider({ vertical: true, size, value: 50 });
      el.style.cssText = 'height:180px;width:auto;';
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Edge Cases
export const EdgeCases: Story = {
  render: () => row(
    makeSlider({ value: 0, 'show-value': true, label: 'Min value (0)' }),
    makeSlider({ value: 100, 'show-value': true, label: 'Max value (100)' }),
    makeSlider({ min: 0, max: 0, value: 0, 'show-value': true, label: 'min=max=0' }),
    makeSlider({ min: 50, max: 50, value: 50, 'show-value': true, label: 'min=max=50' }),
  ),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => row(
    makeSlider({ value: 50, variant: 'primary' }),
  ),
};

// h2: Named (Form Integration)
export const NamedFormIntegration: Story = {
  render: () => row(
    makeSlider({ name: 'volume', value: 75, label: 'Volume (name=volume)', 'show-value': true }),
  ),
};

// h2: CSS Parts Styling
// Available parts: track, fill, thumb, spinner, error-text, helper-text
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Default (unstyled) */
      .parts-demo__default snice-slider { width: 280px; }

      /* Styled: neon gradient track + glowing thumb */
      .parts-demo__styled snice-slider::part(track) {
        background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 4px;
        height: 8px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
      }
      .parts-demo__styled snice-slider::part(fill) {
        background: linear-gradient(90deg, #e040fb, #00e5ff);
        border-radius: 4px;
        box-shadow: 0 0 8px rgba(224,64,251,0.6), 0 0 16px rgba(0,229,255,0.4);
      }
      .parts-demo__styled snice-slider::part(thumb) {
        width: 20px;
        height: 20px;
        background: radial-gradient(circle at 35% 35%, #fff, #e040fb);
        border: 3px solid #e040fb;
        box-shadow: 0 0 12px rgba(224,64,251,0.8), 0 2px 8px rgba(0,0,0,0.4);
        border-radius: 50%;
      }
      .parts-demo__styled snice-slider::part(helper-text) {
        color: #00e5ff;
        font-style: italic;
        font-size: 0.75rem;
      }
      .parts-demo__styled snice-slider { width: 280px; }

      /* Styled: warm earth tones */
      .parts-demo__earth snice-slider::part(track) {
        background: #3d2b1f;
        border-radius: 2px;
        height: 6px;
      }
      .parts-demo__earth snice-slider::part(fill) {
        background: linear-gradient(90deg, #8b4513, #d2691e, #f4a460);
        border-radius: 2px;
      }
      .parts-demo__earth snice-slider::part(thumb) {
        background: radial-gradient(circle, #f4a460, #8b4513);
        border: 2px solid #8b4513;
        box-shadow: 0 2px 6px rgba(139,69,19,0.5);
        width: 18px;
        height: 18px;
        border-radius: 50%;
      }
      .parts-demo__earth snice-slider::part(error-text) {
        color: #c0392b;
        font-weight: 600;
      }
      .parts-demo__earth snice-slider { width: 280px; }
    `;

    const container = document.createElement('div');
    container.className = 'parts-demo';
    container.appendChild(style);

    // Default section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'parts-demo__section parts-demo__default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'parts-demo__label';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultSection.appendChild(defaultLabel);
    const s1 = makeSlider({ value: 60, label: 'Volume', 'helper-text': 'Default track, fill, and thumb' });
    defaultSection.appendChild(s1);
    container.appendChild(defaultSection);

    // Neon styled section
    const neonSection = document.createElement('div');
    neonSection.className = 'parts-demo__section parts-demo__styled';
    const neonLabel = document.createElement('div');
    neonLabel.className = 'parts-demo__label';
    neonLabel.textContent = '::part(track) + ::part(fill) + ::part(thumb) — Neon gradient';
    neonSection.appendChild(neonLabel);
    const s2 = makeSlider({ value: 60, label: 'Volume', 'helper-text': 'Neon gradient fill + glowing thumb' });
    neonSection.appendChild(s2);
    container.appendChild(neonSection);

    // Earth tones styled section
    const earthSection = document.createElement('div');
    earthSection.className = 'parts-demo__section parts-demo__earth';
    const earthLabel = document.createElement('div');
    earthLabel.className = 'parts-demo__label';
    earthLabel.textContent = '::part(track) + ::part(fill) + ::part(thumb) + ::part(error-text) — Earth tones';
    earthSection.appendChild(earthLabel);
    const s3 = makeSlider({ value: 40, label: 'Warmth', 'error-text': 'Value out of range', invalid: true });
    earthSection.appendChild(s3);
    container.appendChild(earthSection);

    return container;
  },
};
