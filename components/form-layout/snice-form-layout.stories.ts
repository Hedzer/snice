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
  title: 'FormLayout',
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

// h2: CSS Parts Styling
// Available parts: base
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem; font-family: sans-serif; }
      .parts-demo__section { display: flex; flex-direction: column; gap: 0.75rem; }
      .parts-demo__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.25rem; }

      /* Styled: card panel with branded header bar */
      .parts-demo__card snice-form-layout::part(base) {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        padding: 1.5rem;
        border-top: 4px solid #5e35b1;
      }

      /* Styled: dark glass morphism */
      .parts-demo__glass snice-form-layout::part(base) {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        padding: 1.5rem;
      }

      /* Styled: pastel notebook */
      .parts-demo__notebook snice-form-layout::part(base) {
        background: linear-gradient(to bottom, #e8f0fe 0%, #fce4ec 100%);
        border: none;
        border-radius: 8px;
        border-left: 5px solid #7c4dff;
        box-shadow: 3px 3px 0 rgba(124,77,255,0.2);
        padding: 1.5rem 1.5rem 1.5rem 2rem;
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
    const l1 = makeLayout({ columns: 2 });
    l1.appendChild(makeField('First Name')); l1.appendChild(makeField('Last Name'));
    l1.appendChild(makeField('Email', 'email')); l1.appendChild(makeField('Phone', 'tel'));
    defaultSection.appendChild(wrap(l1));
    container.appendChild(defaultSection);

    // Card section
    const cardSection = document.createElement('div');
    cardSection.className = 'parts-demo__section parts-demo__card';
    const cardLabel = document.createElement('div');
    cardLabel.className = 'parts-demo__label';
    cardLabel.textContent = '::part(base) — Card with accent top border';
    cardSection.appendChild(cardLabel);
    const l2 = makeLayout({ columns: 2 });
    l2.appendChild(makeField('First Name')); l2.appendChild(makeField('Last Name'));
    l2.appendChild(makeField('Email', 'email')); l2.appendChild(makeField('Phone', 'tel'));
    cardSection.appendChild(wrap(l2));
    container.appendChild(cardSection);

    // Glass section
    const glassSection = document.createElement('div');
    glassSection.className = 'parts-demo__section parts-demo__glass';
    glassSection.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
    glassSection.style.borderRadius = '20px';
    glassSection.style.padding = '0.5rem';
    const glassLabel = document.createElement('div');
    glassLabel.className = 'parts-demo__label';
    glassLabel.style.padding = '0.5rem';
    glassLabel.textContent = '::part(base) — Dark glass morphism';
    glassSection.appendChild(glassLabel);
    const l3 = makeLayout({ columns: 2 });
    l3.appendChild(makeField('First Name')); l3.appendChild(makeField('Last Name'));
    l3.appendChild(makeField('Email', 'email')); l3.appendChild(makeField('Phone', 'tel'));
    glassSection.appendChild(wrap(l3));
    container.appendChild(glassSection);

    // Notebook section
    const notebookSection = document.createElement('div');
    notebookSection.className = 'parts-demo__section parts-demo__notebook';
    const notebookLabel = document.createElement('div');
    notebookLabel.className = 'parts-demo__label';
    notebookLabel.textContent = '::part(base) — Pastel notebook';
    notebookSection.appendChild(notebookLabel);
    const l4 = makeLayout({ columns: 2 });
    l4.appendChild(makeField('First Name')); l4.appendChild(makeField('Last Name'));
    l4.appendChild(makeField('Email', 'email')); l4.appendChild(makeField('Phone', 'tel'));
    notebookSection.appendChild(wrap(l4));
    container.appendChild(notebookSection);

    return container;
  },
};
