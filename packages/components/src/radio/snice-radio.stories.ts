import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-radio';
import type { RadioSize, RadioVariant, SniceRadioElement } from './snice-radio.types';

type Args = {
  size?: RadioSize;
  variant?: RadioVariant;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
  description?: string;
  name?: string;
  value?: string;
};

const SIZES: RadioSize[] = ['small', 'medium', 'large'];
const VARIANTS: RadioVariant[] = ['default', 'block'];

function makeRadio(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-radio');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Radio',
  component: 'snice-radio',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    variant:     { control: 'select', options: VARIANTS },
    checked:     { control: 'boolean', description: 'Live checked property' },
    defaultChecked: { control: 'boolean', description: 'Reset default / checked attribute' },
    disabled:    { control: 'boolean' },
    loading:     { control: 'boolean' },
    required:    { control: 'boolean' },
    invalid:     { control: 'boolean' },
    label:       { control: 'text' },
    description: { control: 'text' },
    name:        { control: 'text' },
    value:       { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-radio') as SniceRadioElement;
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.variant     !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.description !== undefined) el.setAttribute('description', String(args.description));
    if (args.name        !== undefined) el.name = args.name;
    if (args.value       !== undefined) el.value = args.value;
    if (args.defaultChecked !== undefined) el.defaultChecked = args.defaultChecked;
    if (args.checked !== undefined) el.checked = args.checked;
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.loading)  el.toggleAttribute('loading',  true);
    if (args.required) el.toggleAttribute('required', true);
    if (args.invalid)  el.toggleAttribute('invalid',  true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Option A', size: 'medium', variant: 'default', value: 'a' },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => col(
    makeRadio({ label: 'Option A', variant: 'default', name: 'vd', value: 'a', checked: true }),
    makeRadio({ label: 'Option B', variant: 'default', name: 'vd', value: 'b' }),
    makeRadio({ label: 'Option C', variant: 'default', name: 'vd', value: 'c' }),
  ),
};

// h2: Variant: block
export const VariantBlock: Story = {
  render: () => col(
    makeRadio({ label: 'Block Option A', variant: 'block', name: 'vb', value: 'a', checked: true }),
    makeRadio({ label: 'Block Option B', variant: 'block', name: 'vb', value: 'b' }),
    makeRadio({ label: 'Block Option C', variant: 'block', name: 'vb', value: 'c' }),
  ),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeRadio({ size, label: `${size.charAt(0).toUpperCase() + size.slice(1)} radio`, checked: true })),
  ),
};

// h2: Checked: true / false
export const CheckedStates: Story = {
  render: () => col(
    makeRadio({ label: 'Unchecked' }),
    makeRadio({ label: 'Checked', checked: true }),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(
    makeRadio({ label: 'Disabled (unchecked)', disabled: true }),
    makeRadio({ label: 'Disabled (checked)',   disabled: true, checked: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(
    makeRadio({ label: 'Loading', loading: true }),
    makeRadio({ label: 'Loading (checked)', loading: true, checked: true }),
  ),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeRadio({ label: 'Required radio', required: true })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeRadio({ label: 'Invalid radio', invalid: true })),
};

// h2: No label
export const NoLabel: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;align-items:center;';
    wrap.appendChild(makeRadio({ name: 'nl', value: 'a', checked: true }));
    wrap.appendChild(makeRadio({ name: 'nl', value: 'b' }));
    wrap.appendChild(makeRadio({ name: 'nl', value: 'c' }));
    return wrap;
  },
};

// h2: Block variant with description
export const BlockVariantWithDescription: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Standard Plan',  description: '$9/month — Up to 5 users',      name: 'plan', value: 'standard', checked: true }),
    makeRadio({ variant: 'block', label: 'Pro Plan',       description: '$29/month — Up to 25 users',    name: 'plan', value: 'pro'       }),
    makeRadio({ variant: 'block', label: 'Enterprise Plan',description: '$99/month — Unlimited users',   name: 'plan', value: 'enterprise' }),
  ),
};

// h2: Block variant: disabled
export const BlockVariantDisabled: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Active option',   name: 'bd', value: 'a', checked: true  }),
    makeRadio({ variant: 'block', label: 'Disabled option', name: 'bd', value: 'b', disabled: true }),
  ),
};

// h2: Block variant: loading
export const BlockVariantLoading: Story = {
  render: () => col(
    makeRadio({ variant: 'block', label: 'Loading state', loading: true }),
    makeRadio({ variant: 'block', label: 'Loading + checked', loading: true, checked: true }),
  ),
};

// h2: Block variant: sizes
export const BlockVariantSizes: Story = {
  render: () => col(
    ...SIZES.map(size => makeRadio({ variant: 'block', size, label: `Block ${size}`, description: 'Description text', checked: true })),
  ),
};

// h2: State matrix: size x disabled/loading/invalid
export const StateMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;';
    for (const size of SIZES) {
      wrap.appendChild(makeRadio({ size, label: `${size} default`,  checked: true }));
      wrap.appendChild(makeRadio({ size, label: `${size} disabled`, disabled: true, checked: true }));
      wrap.appendChild(makeRadio({ size, label: `${size} invalid`,  invalid: true  }));
    }
    return wrap;
  },
};

// h2: Native form integration
export const FormIntegration: Story = {
  render: () => {
    const form = document.createElement('form');
    form.id = 'radio-story-form';
    form.style.cssText = 'display:flex;flex-direction:column;gap:.875rem;max-width:32rem;';
    form.innerHTML = `
      <fieldset style="display:flex;flex-direction:column;gap:.75rem;border:1px solid var(--snice-color-border, #475569);border-radius:.5rem;padding:.75rem;">
        <legend>Choose a plan</legend>
        <snice-radio
          id="radio-story-basic"
          name="plan"
          value="basic"
          label="Basic"
          required
        ></snice-radio>
        <snice-radio
          id="radio-story-pro"
          name="plan"
          value="pro"
          label="Pro (selected by default)"
          checked
        ></snice-radio>
      </fieldset>
      <fieldset disabled style="display:flex;flex-direction:column;gap:.75rem;border:1px solid var(--snice-color-border, #475569);border-radius:.5rem;padding:.75rem;">
        <legend>
          Disabled fieldset
          <snice-radio
            id="radio-story-legend"
            name="legend-plan"
            value="kept"
            label="First legend remains enabled"
            checked
          ></snice-radio>
        </legend>
        <snice-radio
          id="radio-story-fieldset"
          name="disabled-plan"
          value="omitted"
          label="Descendant is effectively disabled"
          checked
        ></snice-radio>
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

export const AllVariants: Story = {
  render: () => col(
    makeRadio({ label: 'Default (unchecked)' }),
    makeRadio({ label: 'Checked', checked: true }),
    makeRadio({ label: 'Disabled', disabled: true }),
    makeRadio({ label: 'Loading', loading: true }),
    makeRadio({ label: 'Invalid', invalid: true }),
    makeRadio({ label: 'Required', required: true }),
    makeRadio({ variant: 'block', label: 'Block variant', description: 'Block description', checked: true }),
  ),
};

// Available CSS Parts: input, radio, dot, spinner, content, label, description
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(col(
      makeRadio({ label: 'Option A', name: 'def', value: 'a', checked: true }),
      makeRadio({ label: 'Option B', name: 'def', value: 'b' }),
      makeRadio({ variant: 'block', label: 'Block Option', description: 'With description', name: 'defb', value: 'x', checked: true }),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-radio';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-radio snice-radio::part(radio) {
        border: 2px solid #f59e0b;
        background: #1c1407;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.35);
        transition: box-shadow 0.2s;
        width: 20px;
        height: 20px;
      }
      .parts-demo-radio snice-radio.styled-default-checked::part(radio) {
        border-color: #fbbf24;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.65);
        background: #451a03;
      }
      .parts-demo-radio snice-radio::part(dot) {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 6px rgba(251, 191, 36, 0.8);
      }
      .parts-demo-radio snice-radio::part(label) {
        color: #fde68a;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .parts-demo-radio snice-radio::part(description) {
        color: #b45309;
        font-size: 0.78rem;
        font-style: italic;
      }
      .parts-demo-radio snice-radio::part(content) {
        gap: 2px;
      }
      .parts-demo-radio snice-radio::part(spinner) {
        border-color: rgba(245, 158, 11, 0.3);
        border-top-color: #f59e0b;
      }
    `;
    styledSection.appendChild(style);

    styledSection.appendChild(col(
      makeRadio({ class: 'styled-default-checked', label: 'Styled Option A', name: 'sty', value: 'a', checked: true }),
      makeRadio({ label: 'Styled Option B', name: 'sty', value: 'b' }),
      makeRadio({ variant: 'block', label: 'Styled Block', description: 'Custom description styling', name: 'styb', value: 'x', checked: true }),
    ));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
