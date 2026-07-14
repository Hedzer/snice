import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-banner';
import type { BannerVariant, BannerPosition } from './snice-banner.types';

type Args = {
  variant?: BannerVariant;
  position?: BannerPosition;
  message?: string;
  dismissible?: boolean;
  icon?: string;
  actionText?: string;
  open?: boolean;
};

const VARIANTS: BannerVariant[] = ['info', 'success', 'warning', 'error'];
const POSITIONS: BannerPosition[] = ['top', 'bottom'];

function makeBanner(variant: BannerVariant, message: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-banner');
  el.setAttribute('variant', variant);
  el.setAttribute('message', message);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  el.toggleAttribute('open', true);
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;width:100%;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Banner',
  component: 'snice-banner',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'select', options: VARIANTS },
    position:   { control: 'select', options: POSITIONS },
    message:    { control: 'text' },
    dismissible:{ control: 'boolean' },
    icon:       { control: 'text' },
    actionText: { control: 'text' },
    open:       { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-banner');
    if (args.variant    !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.position   !== undefined) el.setAttribute('position', String(args.position));
    if (args.message    !== undefined) el.setAttribute('message', String(args.message));
    if (args.icon       !== undefined) el.setAttribute('icon', String(args.icon));
    if (args.actionText !== undefined) el.setAttribute('action-text', String(args.actionText));
    if (args.dismissible) el.toggleAttribute('dismissible', true);
    el.toggleAttribute('open', args.open !== false);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'info', message: 'New version available!', dismissible: true, actionText: 'Update Now', open: true },
};

// h2: All variants
export const AllVariants: Story = {
  render: () => col(
    makeBanner('info',    'Informational banner message.', { dismissible: true }),
    makeBanner('success', 'Operation completed successfully.', { dismissible: true }),
    makeBanner('warning', 'Your trial expires in 3 days.', { dismissible: true }),
    makeBanner('error',   'An error occurred. Please try again.', { dismissible: true }),
  ),
};

// h2: All positions
export const AllPositions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;width:100%;';
    for (const pos of POSITIONS) {
      const el = makeBanner('info', `Position: ${pos}`, { position: pos });
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Dismissible (default: true)
export const Dismissible: Story = {
  render: () => col(
    makeBanner('info',    'Dismissible (default).', { dismissible: true }),
    makeBanner('warning', 'Non-dismissible.', {}),
  ),
};

// h2: With action-text
export const WithActionText: Story = {
  render: () => col(
    makeBanner('info',    'New version available!', { 'action-text': 'Update Now', dismissible: true }),
    makeBanner('warning', 'Storage is 90% full.',  { 'action-text': 'Manage',    dismissible: true }),
    makeBanner('success', 'Backup complete.',       { 'action-text': 'View',      dismissible: true }),
  ),
};

// h2: Custom icon (emoji)
export const CustomIconEmoji: Story = {
  render: () => col(
    makeBanner('info',    'Custom emoji icon banner.', { icon: '🔔', dismissible: true }),
    makeBanner('success', 'Celebration time!',         { icon: '🎉', dismissible: true }),
    makeBanner('warning', 'Low battery.',              { icon: '🔋', dismissible: true }),
  ),
};

// h2: Custom icon via slot (Material Symbols)
export const CustomIconViaSlotMaterialSymbols: Story = {
  render: () => {
    const el = document.createElement('snice-banner');
    el.setAttribute('variant', 'info');
    el.setAttribute('message', 'Update available via icon slot.');
    el.toggleAttribute('open', true);
    el.toggleAttribute('dismissible', true);
    const iconSpan = document.createElement('span');
    iconSpan.slot = 'icon';
    iconSpan.style.fontFamily = 'Material Symbols Outlined';
    iconSpan.textContent = 'system_update';
    el.appendChild(iconSpan);
    return el;
  },
};

// h2: Open property (controls visibility)
export const OpenPropertyControlsVisibility: Story = {
  render: () => {
    const el = makeBanner('info', 'This banner is open.', { dismissible: true });
    const btn = document.createElement('button');
    btn.textContent = 'Toggle Banner';
    btn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;margin-bottom:.5rem;';
    btn.onclick = () => (el as any).toggle();
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;width:100%;';
    wrap.appendChild(btn);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Slotted content (default slot)
export const SlottedContent: Story = {
  render: () => {
    const el = document.createElement('snice-banner');
    el.setAttribute('variant', 'info');
    el.setAttribute('message', 'Banner with slotted content:');
    el.toggleAttribute('open', true);
    el.toggleAttribute('dismissible', true);
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Learn more';
    link.style.cssText = 'color:inherit;font-weight:bold;';
    el.appendChild(link);
    return el;
  },
};

// h2: Variant x dismissible x action-text matrix
export const VariantXDismissibleXActionTextMatrix: Story = {
  render: () => col(
    ...VARIANTS.map(v => makeBanner(v, `${v} with action`, { dismissible: true, 'action-text': 'Act Now' })),
  ),
};

// h2: Edge case: very long message
export const EdgeCaseVeryLongMessage: Story = {
  render: () => makeBanner(
    'info',
    'This is a very long banner message that should wrap gracefully. It tests multi-line handling, overflow, and layout stability when the content is significantly longer than usual.',
    { dismissible: true },
  ),
};

// h2: Edge case: single character message
export const EdgeCaseSingleCharacterMessage: Story = {
  render: () => col(
    makeBanner('info', 'A', {}),
    makeBanner('warning', '!', {}),
  ),
};

// h2: Edge case: empty message
export const EdgeCaseEmptyMessage: Story = {
  render: () => col(
    makeBanner('info', '', { dismissible: true }),
    makeBanner('warning', '', { dismissible: true, 'action-text': 'Act' }),
  ),
};

// h2: CSS Parts Styling
// Parts: banner, icon, message, action, close
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-banner exposes the following CSS parts:
         ::part(banner)  — the root banner container
         ::part(icon)    — the icon slot element
         ::part(message) — the message text span
         ::part(action)  — the action button
         ::part(close)   — the close/dismiss button */
      .parts-demo .styled-banner::part(banner) {
        background: linear-gradient(90deg, #0f172a, #1e3a5f);
        border-left: 4px solid #38bdf8;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(56,189,248,.2);
      }
      .parts-demo .styled-banner::part(icon) {
        font-size: 1.4rem;
        filter: drop-shadow(0 0 4px #38bdf8);
      }
      .parts-demo .styled-banner::part(message) {
        font-weight: 600;
        color: #bae6fd;
        letter-spacing: .03em;
      }
      .parts-demo .styled-banner::part(action) {
        background: #38bdf8;
        color: #0f172a;
        border: none;
        border-radius: 6px;
        padding: 4px 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .parts-demo .styled-banner::part(close) {
        color: #38bdf8;
        opacity: 1;
        font-size: 1.1rem;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;width:100%;';

    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default (no ::part() overrides)';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const defaultBanner = document.createElement('snice-banner');
    defaultBanner.setAttribute('variant', 'info');
    defaultBanner.setAttribute('message', 'Your session expires in 5 minutes.');
    defaultBanner.setAttribute('action-text', 'Renew');
    defaultBanner.toggleAttribute('dismissible', true);

    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(banner/icon/message/action/close) — dark blue with sky glow';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const styledBanner = document.createElement('snice-banner');
    styledBanner.className = 'styled-banner';
    styledBanner.setAttribute('variant', 'info');
    styledBanner.setAttribute('message', 'Your session expires in 5 minutes.');
    styledBanner.setAttribute('action-text', 'Renew');
    styledBanner.toggleAttribute('dismissible', true);

    wrap.appendChild(style);
    wrap.appendChild(lbl1);
    wrap.appendChild(defaultBanner);
    wrap.appendChild(lbl2);
    wrap.appendChild(styledBanner);
    return wrap;
  },
};
