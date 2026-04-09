import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-split-button';
import type { SplitButtonVariant, SplitButtonSize, SplitButtonAction } from './snice-split-button.types';

type Args = {
  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  outline?: boolean;
  pill?: boolean;
};

const VARIANTS: SplitButtonVariant[] = ['default', 'primary', 'success', 'warning', 'danger'];
const SIZES: SplitButtonSize[] = ['small', 'medium', 'large'];

const BASE_ACTIONS: SplitButtonAction[] = [
  { value: 'draft',      label: 'Save as Draft' },
  { value: 'save-close', label: 'Save & Close'  },
  { value: 'save-new',   label: 'Save & New'    },
];

function makeSB(attrs: Record<string, string | boolean> = {}, actions: SplitButtonAction[] = BASE_ACTIONS) {
  const el = document.createElement('snice-split-button');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).actions = actions;
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/SplitButton',
  component: 'snice-split-button',
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: VARIANTS },
    size:     { control: 'select', options: SIZES },
    label:    { control: 'text' },
    disabled: { control: 'boolean' },
    loading:  { control: 'boolean' },
    outline:  { control: 'boolean' },
    pill:     { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-split-button');
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size    !== undefined) el.setAttribute('size',    String(args.size));
    if (args.label   !== undefined) el.setAttribute('label',   String(args.label));
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.loading)  el.toggleAttribute('loading',  true);
    if (args.outline)  el.toggleAttribute('outline',  true);
    if (args.pill)     el.toggleAttribute('pill',     true);
    (el as any).actions = BASE_ACTIONS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Save', variant: 'default', size: 'medium' },
};

// h2: Variants
export const Variants: Story = {
  render: () => row(
    ...VARIANTS.map(v => makeSB({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
  ),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(
    ...SIZES.map(s => makeSB({ variant: 'primary', size: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  ),
};

// h2: Variant x Size Matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.75rem;align-items:center;';
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        grid.appendChild(makeSB({ variant, size, label: variant.charAt(0).toUpperCase() + variant.slice(1) }));
      }
    }
    return grid;
  },
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeSB({ label: 'Disabled Default',  variant: 'default',  disabled: true }),
    makeSB({ label: 'Disabled Primary',  variant: 'primary',  disabled: true }),
    makeSB({ label: 'Disabled Success',  variant: 'success',  disabled: true }),
  ),
};

// h2: With Disabled Actions
export const WithDisabledActions: Story = {
  render: () => row(
    makeSB({ label: 'With disabled action', variant: 'primary' }, [
      { value: 'edit',   label: 'Edit'   },
      { value: 'copy',   label: 'Copy',   disabled: true },
      { value: 'delete', label: 'Delete', disabled: true },
    ]),
  ),
};

// h2: Many Actions
export const ManyActions: Story = {
  render: () => row(
    makeSB({ label: 'Many Actions', variant: 'primary' }, [
      { value: 'a1', label: 'Action 1' },
      { value: 'a2', label: 'Action 2' },
      { value: 'a3', label: 'Action 3' },
      { value: 'a4', label: 'Action 4' },
      { value: 'a5', label: 'Action 5' },
      { value: 'a6', label: 'Action 6' },
    ]),
  ),
};

// h2: Single Action
export const SingleAction: Story = {
  render: () => row(
    makeSB({ label: 'Single Action', variant: 'primary' }, [
      { value: 'only', label: 'Only Action' },
    ]),
  ),
};

// h2: No Actions (Empty Menu)
export const NoActions: Story = {
  render: () => row(makeSB({ label: 'No Actions', variant: 'default' }, [])),
};

// h2: Warning Variant
export const WarningVariant: Story = {
  render: () => row(
    makeSB({ label: 'Continue', variant: 'warning' }),
    makeSB({ label: 'Continue', variant: 'warning', outline: true }),
    makeSB({ label: 'Continue', variant: 'warning', disabled: true }),
  ),
};

// h2: Outline
export const Outline: Story = {
  render: () => row(
    ...VARIANTS.map(v => makeSB({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1), outline: true })),
  ),
};

// h2: Pill
export const Pill: Story = {
  render: () => row(
    makeSB({ label: 'Primary Pill', variant: 'primary', pill: true }),
    makeSB({ label: 'Success Pill', variant: 'success', pill: true }),
    makeSB({ label: 'Outline Pill', variant: 'primary', pill: true, outline: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(
    ...VARIANTS.map(v => makeSB({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1), loading: true })),
  ),
};

// h2: With Icon
export const WithIcon: Story = {
  render: () => row(
    makeSB({ label: 'Save', variant: 'primary', icon: '💾' }),
    makeSB({ label: 'Upload', variant: 'success', icon: '⬆️' }),
    makeSB({ label: 'Delete', variant: 'danger', icon: '🗑️' }),
  ),
};

// h2: Icon Placement End
export const IconPlacementEnd: Story = {
  render: () => row(
    makeSB({ label: 'Next', variant: 'primary', icon: '➡️', 'icon-placement': 'end' }),
    makeSB({ label: 'Send', variant: 'success', icon: '📤', 'icon-placement': 'end' }),
  ),
};

export const AllVariants: Story = {
  render: () => row(
    ...VARIANTS.map(v => makeSB({ variant: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
  ),
};
