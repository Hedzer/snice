import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-alert';
import type { AlertVariant, AlertSize } from './snice-alert.types';

type Args = {
  variant?: AlertVariant;
  size?: AlertSize;
  title?: string;
  dismissible?: boolean;
  icon?: string;
  content?: string;
};

const VARIANTS: AlertVariant[] = ['info', 'success', 'warning', 'error'];
const SIZES: AlertSize[] = ['small', 'medium', 'large'];

function makeAlert(variant: AlertVariant, content: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-alert');
  el.setAttribute('variant', variant);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  el.textContent = content;
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;width:100%;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Alert',
  component: 'snice-alert',
  tags: ['autodocs'],
  argTypes: {
    variant:     { control: 'select', options: VARIANTS },
    size:        { control: 'select', options: SIZES },
    title:       { control: 'text' },
    dismissible: { control: 'boolean' },
    icon:        { control: 'text' },
    content:     { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-alert');
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size    !== undefined) el.setAttribute('size', String(args.size));
    if (args.title   !== undefined) el.setAttribute('title', String(args.title));
    if (args.icon    !== undefined) el.setAttribute('icon', String(args.icon));
    if (args.dismissible) el.toggleAttribute('dismissible', true);
    el.textContent = args.content ?? 'This is an alert message.';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'info', size: 'medium', title: 'Information', dismissible: true, content: 'This is an informational message.' },
};

// h2: All variants
export const AllVariants: Story = {
  render: () => col(
    makeAlert('info',    'Informational message.',     { title: 'Info' }),
    makeAlert('success', 'Your changes were saved.',   { title: 'Success' }),
    makeAlert('warning', 'Please review your input.',  { title: 'Warning' }),
    makeAlert('error',   'An error occurred.',         { title: 'Error' }),
  ),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => col(
    ...SIZES.map(s => makeAlert('info', `Size: ${s}`, { size: s })),
  ),
};

// h2: Variant x Size matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;width:100%;';
    for (const size of SIZES) {
      const rowEl = row(...VARIANTS.map(v => makeAlert(v, `${v} · ${size}`, { size })));
      wrap.appendChild(rowEl);
    }
    return wrap;
  },
};

// h2: With title
export const WithTitle: Story = {
  render: () => col(
    makeAlert('info',    'Message body.',             { title: 'Info Title' }),
    makeAlert('success', 'Operation completed.',      { title: 'Success Title' }),
    makeAlert('warning', 'Review before continuing.', { title: 'Warning Title' }),
    makeAlert('error',   'Something went wrong.',     { title: 'Error Title' }),
  ),
};

// h2: Dismissible
export const Dismissible: Story = {
  render: () => col(
    ...VARIANTS.map(v => makeAlert(v, `Dismissible ${v} alert.`, { dismissible: true, title: v.charAt(0).toUpperCase() + v.slice(1) })),
  ),
};

// h2: Custom icon (emoji)
export const CustomIconEmoji: Story = {
  render: () => col(
    makeAlert('info',    'Custom emoji icon.',  { icon: '🔔', title: 'Notification' }),
    makeAlert('success', 'Task completed.',     { icon: '🎉', title: 'Done!' }),
    makeAlert('warning', 'Low battery.',        { icon: '🔋', title: 'Battery' }),
    makeAlert('error',   'Connection lost.',    { icon: '📡', title: 'Network' }),
  ),
};

// h2: Custom icon (Material Symbols via slot)
export const CustomIconMaterialSymbolsViaSlot: Story = {
  render: () => {
    const el = document.createElement('snice-alert');
    el.setAttribute('variant', 'info');
    el.setAttribute('title', 'Update Available');
    const iconSpan = document.createElement('span');
    iconSpan.slot = 'icon';
    iconSpan.style.fontFamily = 'Material Symbols Outlined';
    iconSpan.textContent = 'system_update';
    el.appendChild(iconSpan);
    el.appendChild(document.createTextNode('A new version is ready to install.'));
    return el;
  },
};

// h2: Icon suppressed (icon="none")
export const IconSuppressed: Story = {
  render: () => col(
    makeAlert('info',    'No icon shown.',    { icon: 'none' }),
    makeAlert('success', 'No icon shown.',    { icon: 'none', title: 'Clean look' }),
    makeAlert('warning', 'No icon variant.',  { icon: 'none' }),
  ),
};

// h2: Edge case: no content (empty body)
export const EdgeCaseNoContent: Story = {
  render: () => col(
    makeAlert('info',    '', { title: 'Title only, no body' }),
    makeAlert('warning', '', {}),
  ),
};

// h2: Edge case: very long text
export const EdgeCaseVeryLongText: Story = {
  render: () => makeAlert(
    'info',
    'This is a very long alert message that should wrap gracefully within the alert container without breaking the layout. It includes enough text to test multi-line behavior and overflow handling.',
    { title: 'Long Content' },
  ),
};

// h2: Edge case: single character
export const EdgeCaseSingleCharacter: Story = {
  render: () => col(
    makeAlert('info',    'A', {}),
    makeAlert('success', '!', {}),
    makeAlert('error',   '?', {}),
  ),
};

// h2: All combinations: variant x dismissible
export const AllCombinationsVariantXDismissible: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;width:100%;';
    for (const v of VARIANTS) {
      const rowEl = row(
        makeAlert(v, 'Non-dismissible', {}),
        makeAlert(v, 'Dismissible', { dismissible: true }),
      );
      wrap.appendChild(rowEl);
    }
    return wrap;
  },
};

// h2: CSS Parts Styling
// Parts: icon
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-alert exposes the following CSS parts:
         ::part(icon) — the icon container element */
      .parts-demo .default-alert::part(icon) { /* no overrides — browser default */ }
      .parts-demo .styled-alert::part(icon) {
        background: #7c3aed;
        color: #fff;
        border-radius: 50%;
        padding: 4px;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        box-shadow: 0 0 0 3px #a78bfa;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:100%;';

    const label1 = document.createElement('p');
    label1.textContent = 'Default (no ::part() overrides)';
    label1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const defaultAlert = document.createElement('snice-alert') as HTMLElement;
    defaultAlert.className = 'default-alert';
    defaultAlert.setAttribute('variant', 'info');
    defaultAlert.setAttribute('title', 'Default icon');
    defaultAlert.textContent = 'This alert uses the default icon styling.';

    const label2 = document.createElement('p');
    label2.textContent = 'Styled via ::part(icon) — purple circle with glow';
    label2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const styledAlert = document.createElement('snice-alert') as HTMLElement;
    styledAlert.className = 'styled-alert';
    styledAlert.setAttribute('variant', 'info');
    styledAlert.setAttribute('title', 'Styled icon');
    styledAlert.textContent = 'The icon part has a purple circle background with a glow ring.';

    wrap.appendChild(style);
    wrap.appendChild(label1);
    wrap.appendChild(defaultAlert);
    wrap.appendChild(label2);
    wrap.appendChild(styledAlert);
    return wrap;
  },
};
