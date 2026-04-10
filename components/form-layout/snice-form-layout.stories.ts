import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-form-layout';
import type { FormLayoutLabelPosition, FormLayoutGap, FormLayoutVariant } from './snice-form-layout.types';

type Args = {
  columns?: number;
  labelPosition?: FormLayoutLabelPosition;
  labelWidth?: string;
  gap?: FormLayoutGap;
  variant?: FormLayoutVariant;
};

const LABEL_POSITIONS: FormLayoutLabelPosition[] = ['top', 'left', 'right'];
const GAPS: FormLayoutGap[] = ['small', 'medium', 'large'];
const VARIANTS: FormLayoutVariant[] = ['default', 'compact', 'inline'];

function makeField(labelText: string, inputType = 'text', placeholder = '') {
  const field = document.createElement('div');
  field.style.cssText = 'display:flex;flex-direction:column;gap:.25rem;';
  const label = document.createElement('label');
  label.style.cssText = 'font-size:.875rem;font-weight:500;';
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = inputType;
  input.placeholder = placeholder;
  input.style.cssText = 'padding:.5rem;border:1px solid rgba(128,128,128,.3);border-radius:4px;font-size:.875rem;background:transparent;color:inherit;';
  field.appendChild(label);
  field.appendChild(input);
  return field;
}

function makeLayout(attrs: Record<string, string | number> = {}) {
  const el = document.createElement('snice-form-layout');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function wrap(...els: HTMLElement[]) {
  const container = document.createElement('div');
  container.style.cssText = 'width:100%;max-width:800px;';
  els.forEach(el => container.appendChild(el));
  return container;
}

const meta: Meta<Args> = {
  title: 'Form/FormLayout',
  component: 'snice-form-layout',
  tags: ['autodocs'],
  argTypes: {
    columns:       { control: 'number' },
    labelPosition: { control: 'select', options: LABEL_POSITIONS },
    labelWidth:    { control: 'text' },
    gap:           { control: 'select', options: GAPS },
    variant:       { control: 'select', options: VARIANTS },
  },
  render: (args) => {
    const el = document.createElement('snice-form-layout');
    if (args.columns       !== undefined) el.setAttribute('columns',        String(args.columns));
    if (args.labelPosition !== undefined) el.setAttribute('label-position', String(args.labelPosition));
    if (args.labelWidth    !== undefined) el.setAttribute('label-width',    String(args.labelWidth));
    if (args.gap           !== undefined) el.setAttribute('gap',            String(args.gap));
    if (args.variant       !== undefined) el.setAttribute('variant',        String(args.variant));
    el.appendChild(makeField('First Name', 'text', 'John'));
    el.appendChild(makeField('Last Name',  'text', 'Doe'));
    el.appendChild(makeField('Email',      'email', 'john@example.com'));
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:800px;';
    container.appendChild(el);
    return container;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { columns: 1, labelPosition: 'top', gap: 'medium', variant: 'default' },
};

// h2: Columns: 1 (default)
export const Columns1: Story = {
  render: () => {
    const layout = makeLayout({ columns: 1 });
    layout.appendChild(makeField('First Name', 'text', 'John'));
    layout.appendChild(makeField('Last Name',  'text', 'Doe'));
    layout.appendChild(makeField('Email',      'email', 'john@example.com'));
    return wrap(layout);
  },
};

// h2: Columns: 2
export const Columns2: Story = {
  render: () => {
    const layout = makeLayout({ columns: 2 });
    layout.appendChild(makeField('First Name', 'text', 'John'));
    layout.appendChild(makeField('Last Name',  'text', 'Doe'));
    layout.appendChild(makeField('Email',      'email', 'john@example.com'));
    layout.appendChild(makeField('Phone',      'tel', '(555) 123-4567'));
    return wrap(layout);
  },
};

// h2: Columns: 3
export const Columns3: Story = {
  render: () => {
    const layout = makeLayout({ columns: 3 });
    layout.appendChild(makeField('City',    'text', 'New York'));
    layout.appendChild(makeField('State',   'text', 'NY'));
    layout.appendChild(makeField('Zip',     'text', '10001'));
    layout.appendChild(makeField('Country', 'text', 'USA'));
    layout.appendChild(makeField('Region',  'text', 'Northeast'));
    layout.appendChild(makeField('County',  'text', 'Manhattan'));
    return wrap(layout);
  },
};

// h2: Columns: 4
export const Columns4: Story = {
  render: () => {
    const layout = makeLayout({ columns: 4 });
    layout.appendChild(makeField('Q1', 'number', '0'));
    layout.appendChild(makeField('Q2', 'number', '0'));
    layout.appendChild(makeField('Q3', 'number', '0'));
    layout.appendChild(makeField('Q4', 'number', '0'));
    return wrap(layout);
  },
};

// h2: Label Position: top (default)
export const LabelPositionTop: Story = {
  render: () => {
    const layout = makeLayout({ 'label-position': 'top', columns: 2 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: Label Position: left
export const LabelPositionLeft: Story = {
  render: () => {
    const layout = makeLayout({ 'label-position': 'left', columns: 1 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    layout.appendChild(makeField('Phone', 'tel'));
    return wrap(layout);
  },
};

// h2: Label Position: right
export const LabelPositionRight: Story = {
  render: () => {
    const layout = makeLayout({ 'label-position': 'right', columns: 1 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    layout.appendChild(makeField('Phone', 'tel'));
    return wrap(layout);
  },
};

// h2: Label Width: 6rem
export const LabelWidth6rem: Story = {
  render: () => {
    const layout = makeLayout({ 'label-position': 'left', 'label-width': '6rem', columns: 1 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: Label Width: 12rem
export const LabelWidth12rem: Story = {
  render: () => {
    const layout = makeLayout({ 'label-position': 'left', 'label-width': '12rem', columns: 1 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: Gap: small
export const GapSmall: Story = {
  render: () => {
    const layout = makeLayout({ gap: 'small', columns: 2 });
    layout.appendChild(makeField('First Name', 'text'));
    layout.appendChild(makeField('Last Name',  'text'));
    layout.appendChild(makeField('Email',      'email'));
    layout.appendChild(makeField('Phone',      'tel'));
    return wrap(layout);
  },
};

// h2: Gap: medium (default)
export const GapMedium: Story = {
  render: () => {
    const layout = makeLayout({ gap: 'medium', columns: 2 });
    layout.appendChild(makeField('First Name', 'text'));
    layout.appendChild(makeField('Last Name',  'text'));
    layout.appendChild(makeField('Email',      'email'));
    layout.appendChild(makeField('Phone',      'tel'));
    return wrap(layout);
  },
};

// h2: Gap: large
export const GapLarge: Story = {
  render: () => {
    const layout = makeLayout({ gap: 'large', columns: 2 });
    layout.appendChild(makeField('First Name', 'text'));
    layout.appendChild(makeField('Last Name',  'text'));
    layout.appendChild(makeField('Email',      'email'));
    layout.appendChild(makeField('Phone',      'tel'));
    return wrap(layout);
  },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => {
    const layout = makeLayout({ variant: 'default', columns: 2 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => {
    const layout = makeLayout({ variant: 'compact', columns: 2 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: Variant: inline
export const VariantInline: Story = {
  render: () => {
    const layout = makeLayout({ variant: 'inline', columns: 2 });
    layout.appendChild(makeField('Name',  'text'));
    layout.appendChild(makeField('Email', 'email'));
    return wrap(layout);
  },
};

// h2: 3 Columns + Left Labels + Small Gap + Compact
export const ThreeColumnsLeftLabelsSmallGapCompact: Story = {
  render: () => {
    const layout = makeLayout({ columns: 3, 'label-position': 'left', gap: 'small', variant: 'compact' });
    layout.appendChild(makeField('City',    'text', 'New York'));
    layout.appendChild(makeField('State',   'text', 'NY'));
    layout.appendChild(makeField('Zip',     'text', '10001'));
    layout.appendChild(makeField('Country', 'text', 'USA'));
    layout.appendChild(makeField('Region',  'text', 'Northeast'));
    layout.appendChild(makeField('County',  'text', 'Manhattan'));
    return wrap(layout);
  },
};

// h2: 2 Columns + Large Gap + Inline Variant
export const TwoColumnsLargeGapInlineVariant: Story = {
  render: () => {
    const layout = makeLayout({ columns: 2, gap: 'large', variant: 'inline' });
    layout.appendChild(makeField('First Name', 'text'));
    layout.appendChild(makeField('Last Name',  'text'));
    layout.appendChild(makeField('Email',      'email'));
    layout.appendChild(makeField('Phone',      'tel'));
    return wrap(layout);
  },
};
