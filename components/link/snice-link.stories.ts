import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-link';
import type { LinkVariant, LinkTarget } from './snice-link.types';

type Args = {
  href?: string;
  variant?: LinkVariant;
  target?: LinkTarget;
  disabled?: boolean;
  external?: boolean;
  underline?: boolean;
  hash?: boolean;
  label?: string;
};

const VARIANTS: LinkVariant[] = ['default', 'primary', 'secondary', 'muted'];
const TARGETS: LinkTarget[] = ['_self', '_blank', '_parent', '_top'];

function makeLink(label: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-link');
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
  title: 'Navigation/Link',
  component: 'snice-link',
  tags: ['autodocs'],
  argTypes: {
    href:      { control: 'text' },
    variant:   { control: 'select', options: VARIANTS },
    target:    { control: 'select', options: TARGETS },
    disabled:  { control: 'boolean' },
    external:  { control: 'boolean' },
    underline: { control: 'boolean' },
    hash:      { control: 'boolean' },
    label:     { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-link');
    if (args.href    !== undefined) el.setAttribute('href',    args.href);
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.target  !== undefined) el.setAttribute('target',  args.target);
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    if (args.external)  el.toggleAttribute('external',  true);
    if (args.underline) el.toggleAttribute('underline', true);
    if (args.hash)      el.toggleAttribute('hash',      true);
    el.textContent = args.label ?? 'Link';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { href: '/about', variant: 'default', label: 'Default Link' },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => makeLink('Default Link', { href: '/about' }),
};

// h2: Variant: primary
export const VariantPrimary: Story = {
  render: () => makeLink('Primary Link', { href: '/page', variant: 'primary' }),
};

// h2: Variant: secondary
export const VariantSecondary: Story = {
  render: () => makeLink('Secondary Link', { href: '/page', variant: 'secondary' }),
};

// h2: Variant: muted
export const VariantMuted: Story = {
  render: () => makeLink('Muted Link', { href: '/page', variant: 'muted' }),
};

// h2: All variants side-by-side
export const AllVariants: Story = {
  render: () => row(...VARIANTS.map(v => makeLink(
    v.charAt(0).toUpperCase() + v.slice(1),
    { href: '#', variant: v },
  ))),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(
    makeLink('Disabled Default',   { href: '/page', disabled: true }),
    makeLink('Disabled Primary',   { href: '/page', variant: 'primary',   disabled: true }),
    makeLink('Disabled Secondary', { href: '/page', variant: 'secondary', disabled: true }),
    makeLink('Disabled Muted',     { href: '/page', variant: 'muted',     disabled: true }),
  ),
};

// h2: Underline
export const Underline: Story = {
  render: () => row(
    makeLink('Underlined Default',   { href: '/docs', underline: true }),
    makeLink('Underlined Primary',   { href: '/docs', variant: 'primary',   underline: true }),
    makeLink('Underlined Secondary', { href: '/docs', variant: 'secondary', underline: true }),
    makeLink('Underlined Muted',     { href: '/docs', variant: 'muted',     underline: true }),
  ),
};

// h2: External (auto _blank + noopener + arrow icon)
export const External: Story = {
  render: () => row(
    makeLink('External Default',   { href: 'https://example.com', external: true }),
    makeLink('External Primary',   { href: 'https://example.com', variant: 'primary',   external: true }),
    makeLink('External Secondary', { href: 'https://example.com', variant: 'secondary', external: true }),
    makeLink('External Muted',     { href: 'https://example.com', variant: 'muted',     external: true }),
  ),
};

// h2: External + Underline
export const ExternalUnderline: Story = {
  render: () => row(
    makeLink('External + Underline', { href: 'https://example.com', external: true, underline: true }),
  ),
};

// h2: External + Disabled
export const ExternalDisabled: Story = {
  render: () => row(
    makeLink('External + Disabled', { href: 'https://example.com', external: true, disabled: true }),
  ),
};

// h2: Hash routing (auto-prepend #)
export const HashRouting: Story = {
  render: () => row(
    makeLink('Hash: home',     { href: 'home',     hash: true }),
    makeLink('Hash: settings', { href: 'settings', hash: true, variant: 'primary' }),
    makeLink('Hash: profile',  { href: 'profile',  hash: true, variant: 'secondary' }),
  ),
};

// h2: Target values
export const TargetValues: Story = {
  render: () => row(...TARGETS.map(t => makeLink(t, { href: '/page', target: t }))),
};

// h2: Empty href
export const EmptyHref: Story = {
  render: () => row(
    makeLink('No href', {}),
    makeLink('Empty href', { href: '' }),
  ),
};

// h2: Disabled + Underline
export const DisabledUnderline: Story = {
  render: () => row(
    makeLink('Disabled + Underline', { href: '/page', disabled: true, underline: true }),
  ),
};

// h2: Variant x Disabled x Underline matrix
export const VariantXDisabledXUnderlineMatrix: Story = {
  render: () => row(
    ...VARIANTS.map(v => makeLink(`${v.charAt(0).toUpperCase() + v.slice(1)} Dis+UL`, {
      href: '#', variant: v, disabled: true, underline: true,
    })),
  ),
};

// h2: Inline with text
export const InlineWithText: Story = {
  render: () => {
    const p = document.createElement('p');
    p.textContent = 'Read the ';
    const link1 = makeLink('documentation', { href: '/docs', variant: 'primary', underline: true });
    const link2 = makeLink('project page', { href: 'https://example.com', external: true, variant: 'primary' });
    p.appendChild(link1);
    p.appendChild(document.createTextNode(' for more details, or visit the '));
    p.appendChild(link2);
    p.appendChild(document.createTextNode('.'));
    return p;
  },
};
