import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-textarea';
import type { TextareaSize, TextareaVariant, TextareaResize } from './snice-textarea.types';

type Args = {
  size?: TextareaSize;
  variant?: TextareaVariant;
  resize?: TextareaResize;
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
  rows?: number;
  autoGrow?: boolean;
};

const SIZES: TextareaSize[] = ['small', 'medium', 'large'];
const VARIANTS: TextareaVariant[] = ['outlined', 'filled', 'underlined'];
const RESIZES: TextareaResize[] = ['none', 'vertical', 'horizontal', 'both'];

function makeTA(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-textarea');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
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
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:500px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Textarea',
  component: 'snice-textarea',
  tags: ['autodocs'],
  argTypes: {
    size:       { control: 'select', options: SIZES },
    variant:    { control: 'select', options: VARIANTS },
    resize:     { control: 'select', options: RESIZES },
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
    rows:       { control: 'number' },
    autoGrow:   { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-textarea');
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.variant     !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.resize      !== undefined) el.setAttribute('resize',      String(args.resize));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.placeholder !== undefined) el.setAttribute('placeholder', String(args.placeholder));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.helperText  !== undefined) el.setAttribute('helper-text', String(args.helperText));
    if (args.errorText   !== undefined) el.setAttribute('error-text',  String(args.errorText));
    if (args.rows        !== undefined) el.setAttribute('rows',        String(args.rows));
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    if (args.readonly)  el.toggleAttribute('readonly',  true);
    if (args.loading)   el.toggleAttribute('loading',   true);
    if (args.required)  el.toggleAttribute('required',  true);
    if (args.invalid)   el.toggleAttribute('invalid',   true);
    if (args.autoGrow)  el.toggleAttribute('auto-grow', true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Enter text...', size: 'medium', variant: 'outlined', rows: 3, label: 'Textarea' },
};

// h2: Variants
export const Variants: Story = {
  render: () => grid(
    makeTA({ variant: 'outlined',   label: 'Outlined',   placeholder: 'Outlined variant'   }),
    makeTA({ variant: 'filled',     label: 'Filled',     placeholder: 'Filled variant'     }),
    makeTA({ variant: 'underlined', label: 'Underlined', placeholder: 'Underlined variant' }),
  ),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => grid(
    makeTA({ size: 'small',  label: 'Small',  placeholder: 'Small textarea'  }),
    makeTA({ size: 'medium', label: 'Medium', placeholder: 'Medium textarea' }),
    makeTA({ size: 'large',  label: 'Large',  placeholder: 'Large textarea'  }),
  ),
};

// h2: Size x Variant
export const SizeXVariant: Story = {
  render: () => grid(
    makeTA({ size: 'small',  variant: 'outlined',   label: 'Small Outlined',   placeholder: '...' }),
    makeTA({ size: 'small',  variant: 'filled',     label: 'Small Filled',     placeholder: '...' }),
    makeTA({ size: 'small',  variant: 'underlined', label: 'Small Underlined', placeholder: '...' }),
    makeTA({ size: 'medium', variant: 'outlined',   label: 'Medium Outlined',  placeholder: '...' }),
    makeTA({ size: 'medium', variant: 'filled',     label: 'Medium Filled',    placeholder: '...' }),
    makeTA({ size: 'medium', variant: 'underlined', label: 'Medium Underlined',placeholder: '...' }),
    makeTA({ size: 'large',  variant: 'outlined',   label: 'Large Outlined',   placeholder: '...' }),
    makeTA({ size: 'large',  variant: 'filled',     label: 'Large Filled',     placeholder: '...' }),
    makeTA({ size: 'large',  variant: 'underlined', label: 'Large Underlined', placeholder: '...' }),
  ),
};

// h2: Resize Options
export const ResizeOptions: Story = {
  render: () => grid(
    makeTA({ resize: 'none',       label: 'resize=none',       placeholder: 'Cannot resize'       }),
    makeTA({ resize: 'vertical',   label: 'resize=vertical',   placeholder: 'Vertical only (default)' }),
    makeTA({ resize: 'horizontal', label: 'resize=horizontal', placeholder: 'Horizontal only'     }),
    makeTA({ resize: 'both',       label: 'resize=both',       placeholder: 'Both directions'     }),
  ),
};

// h2: Rows
export const Rows: Story = {
  render: () => grid(
    makeTA({ rows: '1',  label: '1 Row'           }),
    makeTA({ rows: '3',  label: '3 Rows (default)' }),
    makeTA({ rows: '5',  label: '5 Rows'           }),
    makeTA({ rows: '10', label: '10 Rows'          }),
  ),
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => grid(
    makeTA({ disabled: true, label: 'Disabled',  value: 'This textarea is disabled' }),
    makeTA({ readonly: true, label: 'Readonly',  value: 'This textarea is readonly' }),
    makeTA({ required: true, label: 'Required',  placeholder: 'Required field'       }),
    makeTA({ loading:  true, label: 'Loading',   value: 'Content is loading...'      }),
    makeTA({ invalid:  true, label: 'Invalid',   value: 'Bad input'                  }),
  ),
};

// h2: Disabled x Variant
export const DisabledXVariant: Story = {
  render: () => grid(
    makeTA({ disabled: true, variant: 'outlined',   label: 'Disabled Outlined',   value: 'Disabled' }),
    makeTA({ disabled: true, variant: 'filled',     label: 'Disabled Filled',     value: 'Disabled' }),
    makeTA({ disabled: true, variant: 'underlined', label: 'Disabled Underlined', value: 'Disabled' }),
  ),
};

// h2: Invalid x Variant
export const InvalidXVariant: Story = {
  render: () => grid(
    makeTA({ invalid: true, variant: 'outlined',   label: 'Invalid Outlined',   value: 'Error', 'error-text': 'Validation failed' }),
    makeTA({ invalid: true, variant: 'filled',     label: 'Invalid Filled',     value: 'Error', 'error-text': 'Validation failed' }),
    makeTA({ invalid: true, variant: 'underlined', label: 'Invalid Underlined', value: 'Error', 'error-text': 'Validation failed' }),
  ),
};

// h2: Helper Text
export const HelperText: Story = {
  render: () => grid(
    makeTA({ label: 'With Helper', 'helper-text': 'This is helpful information', placeholder: 'Type here...' }),
    makeTA({ label: 'Long Helper', 'helper-text': 'Please provide detailed information including context, timeline, and expected outcomes for best results' }),
  ),
};

// h2: Error Text
export const ErrorText: Story = {
  render: () => grid(
    makeTA({ invalid: true, 'error-text': 'This field is required',        label: 'Required Error',  placeholder: 'Cannot be empty' }),
    makeTA({ invalid: true, 'error-text': 'Must be at least 50 characters', label: 'Minlength Error', value: 'Too short'              }),
  ),
};

// h2: Helper vs Error Priority
export const HelperVsErrorPriority: Story = {
  render: () => grid(
    makeTA({ label: 'Helper only',        'helper-text': 'Helpful text shown'                                              }),
    makeTA({ label: 'Error only',  invalid: true, 'error-text': 'Error text shown'                                        }),
    makeTA({ label: 'Both set, error wins', invalid: true, 'helper-text': 'This is hidden', 'error-text': 'Error takes priority' }),
  ),
};

// h2: Character Count (maxlength)
export const CharacterCountMaxlength: Story = {
  render: () => grid(
    makeTA({ maxlength: '50',  label: 'Max 50 chars',  placeholder: 'Type to see counter...' }),
    makeTA({ maxlength: '100', label: 'Max 100 chars', value: 'Pre-filled text to show the counter with some content already present.' }),
    makeTA({ maxlength: '200', label: 'Max 200 chars', 'helper-text': 'Character counter appears automatically' }),
  ),
};

// h2: Auto-grow
export const AutoGrow: Story = {
  render: () => col(
    makeTA({ 'auto-grow': true, rows: '1', label: 'Auto-grow (1 row start)', placeholder: 'Type multiple lines to expand...', 'helper-text': 'Height adjusts to content' }),
    makeTA({ 'auto-grow': true, rows: '3', label: 'Auto-grow (3 row start)', placeholder: 'Starts at 3 rows, grows as needed...' }),
    makeTA({ 'auto-grow': true, rows: '2', label: 'Auto-grow with value', value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5' }),
  ),
};

// h2: Auto-grow x Variant
export const AutoGrowXVariant: Story = {
  render: () => grid(
    makeTA({ 'auto-grow': true, variant: 'outlined',   label: 'Auto-grow Outlined',   placeholder: 'Type to grow...' }),
    makeTA({ 'auto-grow': true, variant: 'filled',     label: 'Auto-grow Filled',     placeholder: 'Type to grow...' }),
    makeTA({ 'auto-grow': true, variant: 'underlined', label: 'Auto-grow Underlined', placeholder: 'Type to grow...' }),
  ),
};

// h2: Loading x Variant
export const LoadingXVariant: Story = {
  render: () => grid(
    makeTA({ loading: true, variant: 'outlined',   label: 'Loading Outlined',   value: 'Processing...' }),
    makeTA({ loading: true, variant: 'filled',     label: 'Loading Filled',     value: 'Processing...' }),
    makeTA({ loading: true, variant: 'underlined', label: 'Loading Underlined', value: 'Processing...' }),
  ),
};
