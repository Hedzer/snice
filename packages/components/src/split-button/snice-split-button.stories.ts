import type { Meta, StoryObj } from '@storybook/html-vite';
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
  title: 'SplitButton',
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

// Available CSS Parts: base, primary, spinner, divider, toggle, menu, menu-items, action
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(row(
      makeSB({ label: 'Save', variant: 'primary' }),
      makeSB({ label: 'Deploy', variant: 'success' }),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-split-button';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-split-button snice-split-button::part(base) {
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4);
        overflow: hidden;
      }
      .parts-demo-split-button snice-split-button::part(primary) {
        background: linear-gradient(135deg, #ea580c, #dc2626);
        border: none;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        padding: 0 1.25rem;
        transition: filter 0.2s;
      }
      .parts-demo-split-button snice-split-button::part(primary):hover {
        filter: brightness(1.15);
      }
      .parts-demo-split-button snice-split-button::part(divider) {
        background: rgba(255,255,255,0.35);
        width: 1px;
      }
      .parts-demo-split-button snice-split-button::part(toggle) {
        background: linear-gradient(135deg, #c2410c, #b91c1c);
        border: none;
        color: #fff;
        transition: filter 0.2s;
      }
      .parts-demo-split-button snice-split-button::part(toggle):hover {
        filter: brightness(1.2);
      }
      .parts-demo-split-button snice-split-button::part(spinner) {
        border-color: rgba(255,255,255,0.3);
        border-top-color: #fff;
      }
      .parts-demo-split-button snice-split-button::part(menu) {
        background: #1c0a00;
        border: 2px solid #ea580c;
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(234, 88, 12, 0.45);
      }
      .parts-demo-split-button snice-split-button::part(action) {
        color: #fed7aa;
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
        transition: background 0.15s;
      }
      .parts-demo-split-button snice-split-button::part(action):hover {
        background: rgba(234, 88, 12, 0.25);
        color: #ffedd5;
      }
    `;
    styledSection.appendChild(style);

    styledSection.appendChild(row(
      makeSB({ label: 'Styled Save', variant: 'primary' }),
      makeSB({ label: 'Styled Deploy', variant: 'danger' }),
    ));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
