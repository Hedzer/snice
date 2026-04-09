import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-select';
import type { SelectSize, SelectOption } from './snice-select.types';

type Args = {
  size?: SelectSize;
  value?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  readonly?: boolean;
  loading?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
};

const SIZES: SelectSize[] = ['small', 'medium', 'large'];

const SAMPLE_OPTIONS: SelectOption[] = [
  { value: 'apple',      label: 'Apple'      },
  { value: 'banana',     label: 'Banana'     },
  { value: 'cherry',     label: 'Cherry'     },
  { value: 'date',       label: 'Date'       },
  { value: 'elderberry', label: 'Elderberry', disabled: true },
];

function makeSelect(attrs: Record<string, string | boolean> = {}, options: SelectOption[] = SAMPLE_OPTIONS) {
  const el = document.createElement('snice-select');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).options = options;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:280px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function grid(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;width:100%;max-width:900px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Select',
  component: 'snice-select',
  tags: ['autodocs'],
  argTypes: {
    size:       { control: 'select', options: SIZES },
    value:      { control: 'text' },
    label:      { control: 'text' },
    placeholder:{ control: 'text' },
    disabled:   { control: 'boolean' },
    required:   { control: 'boolean' },
    invalid:    { control: 'boolean' },
    readonly:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    multiple:   { control: 'boolean' },
    searchable: { control: 'boolean' },
    clearable:  { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-select');
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.placeholder !== undefined) el.setAttribute('placeholder', String(args.placeholder));
    if (args.disabled)   el.toggleAttribute('disabled',   true);
    if (args.required)   el.toggleAttribute('required',   true);
    if (args.invalid)    el.toggleAttribute('invalid',    true);
    if (args.readonly)   el.toggleAttribute('readonly',   true);
    if (args.loading)    el.toggleAttribute('loading',    true);
    if (args.multiple)   el.toggleAttribute('multiple',   true);
    if (args.searchable) el.toggleAttribute('searchable', true);
    if (args.clearable)  el.toggleAttribute('clearable',  true);
    (el as any).options = SAMPLE_OPTIONS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { placeholder: 'Select an option', size: 'medium', label: 'Fruit' },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => col(
    makeSelect({ size: 'small',  label: 'Small',  placeholder: 'Small select'  }),
    makeSelect({ size: 'medium', label: 'Medium', placeholder: 'Medium select' }),
    makeSelect({ size: 'large',  label: 'Large',  placeholder: 'Large select'  }),
  ),
};

// h2: Boolean States
export const BooleanStates: Story = {
  render: () => grid(
    makeSelect({ label: 'Default'  }),
    makeSelect({ label: 'Disabled', disabled: true }),
    makeSelect({ label: 'Readonly', readonly: true }),
    makeSelect({ label: 'Required', required: true }),
    makeSelect({ label: 'Invalid',  invalid:  true }),
    makeSelect({ label: 'Loading',  loading:  true }),
  ),
};

// h2: Clearable
export const Clearable: Story = {
  render: () => col(
    makeSelect({ label: 'Clearable (no value)', clearable: true }),
    makeSelect({ label: 'Clearable (with value)', clearable: true, value: 'apple' }),
  ),
};

// h2: Searchable
export const Searchable: Story = {
  render: () => col(makeSelect({ label: 'Searchable', searchable: true, placeholder: 'Search fruits...' })),
};

// h2: Multiple Selection
export const MultipleSelection: Story = {
  render: () => col(makeSelect({ label: 'Multiple', multiple: true, placeholder: 'Select multiple fruits' })),
};

// h2: Multiple + Pre-selected
export const MultiplePreselected: Story = {
  render: () => col(makeSelect({ label: 'Multiple + Pre-selected', multiple: true, value: 'apple,banana' })),
};

// h2: Disabled Options
export const DisabledOptions: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B (disabled)', disabled: true },
      { value: 'c', label: 'Option C' },
      { value: 'd', label: 'Option D (disabled)', disabled: true },
      { value: 'e', label: 'Option E' },
    ];
    return col(makeSelect({ label: 'With disabled options' }, opts));
  },
};

// h2: Options with Icons
export const OptionsWithIcons: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: 'us', label: 'United States', icon: 'https://flagcdn.com/w20/us.png' },
      { value: 'gb', label: 'United Kingdom', icon: 'https://flagcdn.com/w20/gb.png' },
      { value: 'de', label: 'Germany', icon: 'https://flagcdn.com/w20/de.png' },
    ];
    return col(makeSelect({ label: 'Country', placeholder: 'Select country' }, opts));
  },
};

// h2: Editable (Combobox)
export const EditableCombobox: Story = {
  render: () => col(makeSelect({ label: 'Editable', editable: true, placeholder: 'Type or select...' })),
};

// h2: Pre-selected Value
export const PreselectedValue: Story = {
  render: () => col(makeSelect({ label: 'Pre-selected', value: 'banana' })),
};

// h2: Programmatic Options (via JS)
export const ProgrammaticOptions: Story = {
  render: () => {
    const opts: SelectOption[] = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ];
    return col(makeSelect({ label: 'Programmatic', placeholder: 'Options set via JS' }, opts));
  },
};

// h2: Empty Options
export const EmptyOptions: Story = {
  render: () => col(makeSelect({ label: 'No options', placeholder: 'Nothing to select' }, [])),
};

// h2: Sizes x States Matrix
export const AllVariants: Story = {
  render: () => grid(
    makeSelect({ size: 'small',  label: 'Small Default'   }),
    makeSelect({ size: 'medium', label: 'Medium Default'  }),
    makeSelect({ size: 'large',  label: 'Large Default'   }),
    makeSelect({ size: 'small',  label: 'Small Disabled',  disabled: true }),
    makeSelect({ size: 'medium', label: 'Medium Disabled', disabled: true }),
    makeSelect({ size: 'large',  label: 'Large Disabled',  disabled: true }),
  ),
};
