import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-button';
import type { ButtonVariant, ButtonSize } from './snice-button.types';

type Args = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  outline?: boolean;
  pill?: boolean;
  circle?: boolean;
  label?: string;
  icon?: string;
  iconPlacement?: 'start' | 'end';
  type?: 'button' | 'submit' | 'reset';
  href?: string;
};

const VARIANTS: ButtonVariant[] = ['default', 'primary', 'success', 'warning', 'danger', 'text'];
const SIZES: ButtonSize[] = ['small', 'medium', 'large'];

function makeBtn(variant: ButtonVariant, label: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-button');
  el.setAttribute('variant', variant);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  el.textContent = label;
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Button',
  component: 'snice-button',
  tags: ['autodocs'],
  argTypes: {
    variant:       { control: 'select', options: VARIANTS },
    size:          { control: 'select', options: SIZES },
    disabled:      { control: 'boolean' },
    loading:       { control: 'boolean' },
    outline:       { control: 'boolean' },
    pill:          { control: 'boolean' },
    circle:        { control: 'boolean' },
    label:         { control: 'text' },
    icon:          { control: 'text' },
    iconPlacement: { control: 'select', options: ['start', 'end'] },
    type:          { control: 'select', options: ['button', 'submit', 'reset'] },
    href:          { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-button');
    if (args.variant       !== undefined) el.setAttribute('variant',        String(args.variant));
    if (args.size          !== undefined) el.setAttribute('size',           String(args.size));
    if (args.type          !== undefined) el.setAttribute('type',           String(args.type));
    if (args.icon          !== undefined) el.setAttribute('icon',           String(args.icon));
    if (args.iconPlacement !== undefined) el.setAttribute('icon-placement', String(args.iconPlacement));
    if (args.href          !== undefined) el.setAttribute('href',           String(args.href));
    if (args.disabled) el.toggleAttribute('disabled', true);
    if (args.loading)  el.toggleAttribute('loading',  true);
    if (args.outline)  el.toggleAttribute('outline',  true);
    if (args.pill)     el.toggleAttribute('pill',     true);
    if (args.circle)   el.toggleAttribute('circle',   true);
    el.textContent = args.label ?? 'Button';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'default', size: 'medium', label: 'Default' } };

// h2: All variants
export const AllVariants: Story = {
  render: () => row(...VARIANTS.map(v => makeBtn(v, v.charAt(0).toUpperCase() + v.slice(1)))),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => row(...SIZES.map(s => makeBtn('primary', s.charAt(0).toUpperCase() + s.slice(1), { size: s }))),
};

// h2: Variant x Size matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:auto repeat(6,auto);gap:.5rem;align-items:center;';
    for (const size of SIZES) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;text-align:right;padding-right:.5rem;';
      lbl.textContent = size;
      grid.appendChild(lbl);
      for (const variant of VARIANTS) {
        grid.appendChild(makeBtn(variant, variant === 'text' ? 'Text' : variant.charAt(0).toUpperCase() + variant.slice(1), { size }));
      }
    }
    return grid;
  },
};

// h2: Outline variants
export const OutlineVariants: Story = {
  render: () => row(...VARIANTS.map(v => makeBtn(v, v.charAt(0).toUpperCase() + v.slice(1), { outline: true }))),
};

// h2: Variant x Outline matrix
export const VariantXOutlineMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:auto repeat(6,auto);gap:.5rem;align-items:center;';
    for (const [rowLabel, attrs] of [['filled', {}], ['outline', { outline: true }]] as [string, Record<string, boolean>][]) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;text-align:right;padding-right:.5rem;';
      lbl.textContent = rowLabel;
      grid.appendChild(lbl);
      for (const variant of VARIANTS) {
        grid.appendChild(makeBtn(variant, variant.charAt(0).toUpperCase() + variant.slice(1), attrs));
      }
    }
    return grid;
  },
};

// h2: Pill shape
export const PillShape: Story = {
  render: () => row(
    makeBtn('primary', 'Pill Button', { pill: true }),
    makeBtn('success', 'Pill Outline', { pill: true, outline: true }),
    makeBtn('danger',  'Small Pill',   { pill: true, size: 'small' }),
    makeBtn('warning', 'Large Pill',   { pill: true, size: 'large' }),
  ),
};

// h2: Circle shape
export const CircleShape: Story = {
  render: () => {
    const wrap = row(
      makeBtn('primary', '+', { circle: true, size: 'small' }),
      makeBtn('primary', '+', { circle: true, size: 'medium' }),
      makeBtn('primary', '+', { circle: true, size: 'large' }),
      makeBtn('danger',  'X', { circle: true }),
      makeBtn('success', 'V', { circle: true, outline: true }),
    );
    return wrap;
  },
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeBtn('default', 'Default', { disabled: true }),
    makeBtn('primary', 'Primary', { disabled: true }),
    makeBtn('success', 'Success', { disabled: true }),
    makeBtn('danger',  'Outline', { disabled: true, outline: true }),
    makeBtn('text',    'Text',    { disabled: true }),
  ),
};

// h2: Loading
export const Loading: Story = {
  render: () => row(
    makeBtn('default', 'Default', { loading: true }),
    makeBtn('primary', 'Primary', { loading: true }),
    makeBtn('success', 'Success', { loading: true }),
    makeBtn('danger',  'Outline', { loading: true, outline: true }),
    makeBtn('text',    'Text',    { loading: true }),
  ),
};

// h2: Icon property (emoji)
export const IconPropertyEmoji: Story = {
  render: () => row(
    makeBtn('primary', 'Star',   { icon: '⭐' }),
    makeBtn('success', 'Done',   { icon: '✔️' }),
    makeBtn('danger',  'Delete', { icon: '🗑️' }),
  ),
};

// h2: Icon property (Material Symbols ligature)
export const IconPropertyMaterial: Story = {
  render: () => row(
    makeBtn('primary', 'Home',    { icon: 'home' }),
    makeBtn('success', 'Confirm', { icon: 'check' }),
    makeBtn('danger',  'Remove',  { icon: 'delete' }),
  ),
};

// h2: icon-placement: start (default) vs end
export const IconPlacement: Story = {
  render: () => row(
    makeBtn('primary', 'Start', { icon: '➡️', 'icon-placement': 'start' }),
    makeBtn('primary', 'End',   { icon: '➡️', 'icon-placement': 'end'   }),
  ),
};

// h2: All button types
export const AllButtonTypes: Story = {
  render: () => row(
    makeBtn('default', 'type=button', { type: 'button' }),
    makeBtn('primary', 'type=submit', { type: 'submit' }),
    makeBtn('default', 'type=reset',  { type: 'reset'  }),
  ),
};

// h2: Link buttons (href)
export const LinkButtons: Story = {
  render: () => row(
    makeBtn('primary', 'Relative / hash', { href: '#button-link' }),
    makeBtn('primary', 'HTTPS target',    { href: 'https://example.com', target: '_blank' }),
    makeBtn('primary', 'Safe download',   { href: '#download', download: 'file.txt' }),
    makeBtn('danger', 'Unsafe scheme (blocked)', { href: 'javascript:globalThis.__sniceUnsafeButtonStory = true', outline: true }),
  ),
};

// h2: All boolean states combined
export const AllBooleanStatesCombined: Story = {
  render: () => row(
    makeBtn('primary', 'Pill + Outline',          { pill: true, outline: true }),
    makeBtn('primary', 'Pill + Loading',           { pill: true, loading: true }),
    makeBtn('primary', 'Outline + Disabled',       { outline: true, disabled: true }),
    makeBtn('primary', 'Pill + Outline + Disabled',{ pill: true, outline: true, disabled: true }),
    makeBtn('primary', 'L', { circle: true, loading: true }),
  ),
};

// Available CSS Parts: base, spinner, icon, label
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
      makeBtn('primary', 'Primary', { icon: '⭐' }),
      makeBtn('success', 'Success'),
      makeBtn('danger',  'Danger'),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-button';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-button snice-button::part(base) {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        border: 2px solid #c0392b;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(240, 147, 251, 0.5);
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        transition: transform 0.15s, box-shadow 0.15s;
        color: #fff;
      }
      .parts-demo-button snice-button::part(base):hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(240, 147, 251, 0.65);
      }
      .parts-demo-button snice-button::part(label) {
        font-size: 0.8rem;
        color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      .parts-demo-button snice-button::part(icon) {
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
        font-size: 1.1em;
      }
      .parts-demo-button snice-button::part(spinner) {
        border-color: rgba(255,255,255,0.3);
        border-top-color: #fff;
      }
    `;
    styledSection.appendChild(style);

    const btn1 = document.createElement('snice-button');
    btn1.setAttribute('variant', 'primary');
    btn1.setAttribute('icon', '⭐');
    btn1.textContent = 'Styled Button';

    const btn2 = document.createElement('snice-button');
    btn2.setAttribute('variant', 'success');
    btn2.textContent = 'Also Styled';

    const btn3 = document.createElement('snice-button');
    btn3.setAttribute('variant', 'danger');
    btn3.toggleAttribute('loading', true);
    btn3.textContent = 'Loading';

    styledSection.appendChild(row(btn1, btn2, btn3));
    wrap.appendChild(styledSection);

    return wrap;
  },
};
