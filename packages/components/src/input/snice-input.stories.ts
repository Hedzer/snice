import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-input';
import type { InputType, InputSize, InputVariant } from './snice-input.types';

type Args = {
  type?: InputType;
  size?: InputSize;
  variant?: InputVariant;
  value?: string;
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
  password?: boolean;
};

const SIZES: InputSize[] = ['small', 'medium', 'large'];
const VARIANTS: InputVariant[] = ['outlined', 'filled', 'underlined'];
const TYPES: InputType[] = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'];

function makeInput(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-input');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function grid(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;width:100%;max-width:900px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:300px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Input',
  component: 'snice-input',
  tags: ['autodocs'],
  argTypes: {
    type:       { control: 'select', options: TYPES },
    size:       { control: 'select', options: SIZES },
    variant:    { control: 'select', options: VARIANTS },
    value:      { control: 'text' },
    placeholder:{ control: 'text' },
    label:      { control: 'text' },
    helperText: { control: 'text' },
    errorText:  { control: 'text' },
    disabled:   { control: 'boolean' },
    readonly:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    required:   { control: 'boolean' },
    invalid:    { control: 'boolean' },
    clearable:  { control: 'boolean' },
    password:   { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-input');
    if (args.type        !== undefined) el.setAttribute('type',        String(args.type));
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.variant     !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.placeholder !== undefined) el.setAttribute('placeholder', String(args.placeholder));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.helperText  !== undefined) el.setAttribute('helper-text', String(args.helperText));
    if (args.errorText   !== undefined) el.setAttribute('error-text',  String(args.errorText));
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    if (args.readonly)  el.toggleAttribute('readonly',  true);
    if (args.loading)   el.toggleAttribute('loading',   true);
    if (args.required)  el.toggleAttribute('required',  true);
    if (args.invalid)   el.toggleAttribute('invalid',   true);
    if (args.clearable) el.toggleAttribute('clearable', true);
    if (args.password)  el.toggleAttribute('password',  true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Enter text...', size: 'medium', variant: 'outlined', label: 'Text Input' },
};

// h2: All Types
export const AllTypes: Story = {
  render: () => grid(
    makeInput({ type: 'text',           label: 'text',           placeholder: 'Text'       }),
    makeInput({ type: 'email',          label: 'email',          placeholder: 'Email'      }),
    makeInput({ type: 'password',       label: 'password',       placeholder: 'Password', password: true }),
    makeInput({ type: 'number',         label: 'number',         placeholder: '0'          }),
    makeInput({ type: 'tel',            label: 'tel',            placeholder: 'Phone'      }),
    makeInput({ type: 'url',            label: 'url',            placeholder: 'URL'        }),
    makeInput({ type: 'search',         label: 'search',         placeholder: 'Search', clearable: true }),
    makeInput({ type: 'date',           label: 'date'                                      }),
    makeInput({ type: 'time',           label: 'time'                                      }),
    makeInput({ type: 'datetime-local', label: 'datetime-local'                            }),
  ),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;';
    for (const size of SIZES) {
      wrap.appendChild(makeInput({ size, label: size.charAt(0).toUpperCase() + size.slice(1), placeholder: `${size} input` }));
    }
    return wrap;
  },
};

// h2: All Variants Compared
export const AllVariantsCompared: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;';
    for (const variant of VARIANTS) {
      wrap.appendChild(makeInput({ variant, label: variant.charAt(0).toUpperCase() + variant.slice(1), placeholder: 'Text' }));
    }
    return wrap;
  },
};

// h2: Disabled
export const Disabled: Story = {
  render: () => col(makeInput({ disabled: true, label: 'Disabled', value: 'Cannot edit' })),
};

// h2: Readonly
export const Readonly: Story = {
  render: () => col(makeInput({ readonly: true, label: 'Readonly', value: 'Read only value' })),
};

// h2: Loading
export const Loading: Story = {
  render: () => col(makeInput({ loading: true, label: 'Loading', placeholder: 'Searching...' })),
};

// h2: Required
export const Required: Story = {
  render: () => col(makeInput({ required: true, label: 'Required Field', placeholder: 'This is required' })),
};

// h2: Invalid
export const Invalid: Story = {
  render: () => col(makeInput({ invalid: true, label: 'Invalid', 'error-text': 'This field has an error.', value: 'bad value' })),
};

// h2: Clearable
export const Clearable: Story = {
  render: () => col(makeInput({ clearable: true, label: 'Clearable', value: 'Clear me' })),
};

// h2: Password Toggle
export const PasswordToggle: Story = {
  render: () => col(makeInput({ type: 'password', password: true, label: 'Password', value: 'secret123' })),
};

// h2: Helper Text
export const HelperText: Story = {
  render: () => col(makeInput({ label: 'Username', 'helper-text': 'Choose a unique username.', placeholder: 'username' })),
};

// h2: Error Text
export const ErrorText: Story = {
  render: () => col(makeInput({ label: 'Email', 'error-text': 'Invalid email format.', invalid: true, value: 'not-an-email' })),
};

// h2: Prefix Icon (emoji)
export const PrefixIconEmoji: Story = {
  render: () => col(makeInput({ 'prefix-icon': 'search', label: 'Search', placeholder: 'Search...' })),
};

// h2: Suffix Icon (emoji)
export const SuffixIconEmoji: Story = {
  render: () => col(makeInput({ 'suffix-icon': 'envelope', label: 'Email', placeholder: 'user@example.com' })),
};

// h2: Prefix Icon (Material Symbol)
export const PrefixIconMaterial: Story = {
  render: () => col(makeInput({ 'prefix-icon': 'search', label: 'Search', placeholder: 'Search...' })),
};

// h2: Suffix Icon (Material Symbol)
export const SuffixIconMaterial: Story = {
  render: () => col(makeInput({ 'suffix-icon': 'envelope', label: 'Email', placeholder: 'user@example.com' })),
};

// h2: Both Prefix + Suffix Icons
export const BothPrefixSuffixIcons: Story = {
  render: () => col(makeInput({ 'prefix-icon': 'user', 'suffix-icon': 'check-circle', label: 'Username', value: 'john_doe' })),
};

// h2: Min/Max (number)
export const MinMaxNumber: Story = {
  render: () => col(makeInput({ type: 'number', label: 'Quantity', min: '1', max: '99', step: '1', value: '5' })),
};

// h2: Stretch: true
export const Stretch: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;max-width:600px;';
    wrap.appendChild(makeInput({ stretch: true, label: 'Full Width', placeholder: 'Takes full width' }));
    return wrap;
  },
};

// h2: Size x Variant Matrix
export const SizeXVariantMatrix: Story = {
  render: () => {
    const g = document.createElement('div');
    g.style.cssText = 'display:grid;grid-template-columns:repeat(3,280px);gap:1rem;';
    for (const size of SIZES) {
      for (const variant of VARIANTS) {
        g.appendChild(makeInput({ size, variant, label: `${size} / ${variant}`, placeholder: '...' }));
      }
    }
    return g;
  },
};

// Available CSS Parts: wrapper, label, container, prefix-icon, input, clear, spinner, password-toggle, suffix-icon, error-text, helper-text
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
      makeInput({ label: 'Text Input', placeholder: 'Enter text...', 'prefix-icon': 'search', clearable: true }),
      makeInput({ label: 'With helper', 'helper-text': 'Helper text below', placeholder: 'Type here...' }),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-input';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-input snice-input::part(wrapper) {
        gap: 6px;
      }
      .parts-demo-input snice-input::part(label) {
        color: #7c3aed;
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .parts-demo-input snice-input::part(container) {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #7c3aed;
        border-radius: 12px;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2), inset 0 1px 3px rgba(0,0,0,0.4);
      }
      .parts-demo-input snice-input::part(input) {
        color: #e0e0ff;
        font-family: 'Courier New', monospace;
        font-size: 0.95rem;
        background: transparent;
        caret-color: #a78bfa;
      }
      .parts-demo-input snice-input::part(prefix-icon) {
        color: #a78bfa;
        font-size: 1.1em;
      }
      .parts-demo-input snice-input::part(suffix-icon) {
        color: #a78bfa;
      }
      .parts-demo-input snice-input::part(clear) {
        color: #f87171;
        opacity: 0.8;
      }
      .parts-demo-input snice-input::part(helper-text) {
        color: #a78bfa;
        font-style: italic;
        font-size: 0.75rem;
      }
      .parts-demo-input snice-input::part(error-text) {
        color: #f87171;
        font-weight: 600;
      }
    `;
    styledSection.appendChild(style);

    styledSection.appendChild(col(
      makeInput({ label: 'Styled Input', placeholder: 'Type something...', 'prefix-icon': 'search', clearable: true }),
      makeInput({ label: 'With helper', 'helper-text': 'Custom helper styling', placeholder: 'Type here...' }),
      makeInput({ label: 'With error', invalid: true, 'error-text': 'Custom error styling', value: 'bad value' }),
    ));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
