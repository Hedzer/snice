import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-message-strip';

type MessageStripVariant = 'info' | 'success' | 'warning' | 'danger';

type Args = {
  variant?: MessageStripVariant;
  dismissible?: boolean;
  icon?: string;
  message?: string;
};

const VARIANTS: MessageStripVariant[] = ['info', 'success', 'warning', 'danger'];

function makeStrip(text: string, attrs: Record<string, string | boolean> = {}): HTMLElement {
  const el = document.createElement('snice-message-strip');
  el.style.cssText = 'display:block;max-width:600px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  el.textContent = text;
  return el;
}

function col(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;max-width:600px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'MessageStrip',
  component: 'snice-message-strip',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'select', options: VARIANTS },
    dismissible:{ control: 'boolean' },
    icon:       { control: 'text' },
    message:    { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-message-strip');
    el.style.cssText = 'display:block;max-width:600px;';
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.icon    !== undefined) el.setAttribute('icon', args.icon);
    if (args.dismissible) el.toggleAttribute('dismissible', true);
    el.textContent = args.message ?? 'This is a message strip.';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'info', message: 'This is an informational message.' } };

// h2: Variant: info (default)
export const VariantInfo: Story = {
  render: () => makeStrip('This is an informational message.', { variant: 'info' }),
};

// h2: Variant: success
export const VariantSuccess: Story = {
  render: () => makeStrip('Operation completed successfully.', { variant: 'success' }),
};

// h2: Variant: warning
export const VariantWarning: Story = {
  render: () => makeStrip('Please review your changes before submitting.', { variant: 'warning' }),
};

// h2: Variant: danger
export const VariantDanger: Story = {
  render: () => makeStrip('An error occurred while processing your request.', { variant: 'danger' }),
};

// h2: All variants
export const AllVariants: Story = {
  render: () => col(
    makeStrip('Info variant',    { variant: 'info' }),
    makeStrip('Success variant', { variant: 'success' }),
    makeStrip('Warning variant', { variant: 'warning' }),
    makeStrip('Danger variant',  { variant: 'danger' }),
  ),
};

// h2: Dismissible: true
export const DismissibleTrue: Story = {
  render: () => col(
    makeStrip('Dismissible info message. Click X to close.', { variant: 'info',    dismissible: true }),
    makeStrip('Dismissible success message.',                 { variant: 'success', dismissible: true }),
    makeStrip('Dismissible warning message.',                 { variant: 'warning', dismissible: true }),
    makeStrip('Dismissible danger message.',                  { variant: 'danger',  dismissible: true }),
  ),
};

// h2: Dismissible: false (default)
export const DismissibleFalse: Story = {
  render: () => makeStrip('Non-dismissible. No close button.', { variant: 'info' }),
};

// h2: Custom icon (emoji)
export const CustomIconEmoji: Story = {
  render: () => col(
    makeStrip('Custom bell icon notification.',  { variant: 'info',    icon: '🔔' }),
    makeStrip('Celebration icon for success.',   { variant: 'success', icon: '🎉' }),
    makeStrip('Construction icon for warning.',  { variant: 'warning', icon: '🚧' }),
    makeStrip('Siren icon for danger.',          { variant: 'danger',  icon: '🚨' }),
  ),
};

// h2: Icon: "none" (hides icon)
export const IconNoneHidesIcon: Story = {
  render: () => col(
    makeStrip('No icon displayed.',    { variant: 'info',    icon: 'none' }),
    makeStrip('Success without icon.', { variant: 'success', icon: 'none' }),
    makeStrip('Warning without icon.', { variant: 'warning', icon: 'none' }),
    makeStrip('Danger without icon.',  { variant: 'danger',  icon: 'none' }),
  ),
};

// h2: Icon slot
export const IconSlot: Story = {
  render: () => {
    const el = document.createElement('snice-message-strip');
    el.style.cssText = 'display:block;max-width:600px;';
    el.setAttribute('variant', 'info');
    const iconSpan = document.createElement('span');
    iconSpan.slot = 'icon';
    iconSpan.style.fontSize = '1.25rem';
    iconSpan.textContent = 'ℹ️';
    el.appendChild(iconSpan);
    el.appendChild(document.createTextNode('Custom slotted icon content.'));
    return el;
  },
};

// h2: Empty icon (default icon per variant)
export const EmptyIconDefaultIconPerVariant: Story = {
  render: () => col(
    makeStrip('Default info icon.',    { variant: 'info' }),
    makeStrip('Default success icon.', { variant: 'success' }),
    makeStrip('Default warning icon.', { variant: 'warning' }),
    makeStrip('Default danger icon.',  { variant: 'danger' }),
  ),
};

// h2: Variant x Dismissible matrix
export const VariantXDismissibleMatrix: Story = {
  render: () => col(
    makeStrip('Info + Dismissible',    { variant: 'info',    dismissible: true }),
    makeStrip('Success + Dismissible', { variant: 'success', dismissible: true }),
    makeStrip('Warning + Dismissible', { variant: 'warning', dismissible: true }),
    makeStrip('Danger + Dismissible',  { variant: 'danger',  dismissible: true }),
  ),
};

// h2: Variant x Custom icon x Dismissible
export const VariantXCustomIconXDismissible: Story = {
  render: () => col(
    makeStrip('Info + Custom icon + Dismissible',   { variant: 'info',   icon: '📧', dismissible: true }),
    makeStrip('Danger + Custom icon + Dismissible', { variant: 'danger', icon: '⛔', dismissible: true }),
  ),
};

// h2: Variant x No icon x Dismissible
export const VariantXNoIconXDismissible: Story = {
  render: () => col(
    makeStrip('Info + No icon + Dismissible',    { variant: 'info',    icon: 'none', dismissible: true }),
    makeStrip('Warning + No icon + Dismissible', { variant: 'warning', icon: 'none', dismissible: true }),
  ),
};

// h2: Long content
export const LongContent: Story = {
  render: () => makeStrip(
    'This is a message strip with much longer content to show how it wraps. It contains enough text to demonstrate multi-line behavior within the component boundaries. The dismiss button should remain aligned properly regardless of content length.',
    { variant: 'info', dismissible: true },
  ),
};

// h2: Short content
export const ShortContent: Story = {
  render: () => makeStrip('Done.', { variant: 'success' }),
};

// h2: Programmatic show/hide
export const ProgrammaticShowHide: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;max-width:600px;';
    const strip = makeStrip('Toggle this message strip with show() and hide().', { variant: 'warning', dismissible: true });
    strip.id = 'ms-story-toggle';
    wrap.appendChild(strip);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.5rem;margin-top:.5rem;';
    const showBtn = document.createElement('button');
    showBtn.style.cssText = 'padding:.25rem .75rem;border:1px solid var(--snice-color-border,#ddd);border-radius:4px;cursor:pointer;';
    showBtn.textContent = 'show()';
    showBtn.addEventListener('click', () => (strip as any).show?.());
    const hideBtn = document.createElement('button');
    hideBtn.style.cssText = 'padding:.25rem .75rem;border:1px solid var(--snice-color-border,#ddd);border-radius:4px;cursor:pointer;';
    hideBtn.textContent = 'hide()';
    hideBtn.addEventListener('click', () => (strip as any).hide?.());
    btnRow.appendChild(showBtn);
    btnRow.appendChild(hideBtn);
    wrap.appendChild(btnRow);
    return wrap;
  },
};

// h2: Rich slot content
export const RichSlotContent: Story = {
  render: () => {
    const el = document.createElement('snice-message-strip');
    el.style.cssText = 'display:block;max-width:600px;';
    el.setAttribute('variant', 'info');
    el.toggleAttribute('dismissible', true);
    const strong = document.createElement('strong');
    strong.textContent = 'Update available:';
    el.appendChild(strong);
    el.appendChild(document.createTextNode(' Version 2.0 is ready. '));
    const a = document.createElement('a');
    a.href = '#';
    a.style.cssText = 'color:inherit;text-decoration:underline;';
    a.textContent = 'Learn more';
    el.appendChild(a);
    return el;
  },
};

// h2: CSS Parts Styling
// Parts: icon, content, dismiss
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; max-width: 640px; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; margin-bottom: .25rem; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .25rem; }

      /* ::part(icon) — the leading icon area */
      .parts-demo snice-message-strip.styled-icon::part(icon) {
        background: #1e1b4b;
        color: #818cf8;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
        align-self: center;
      }

      /* ::part(content) — the message text area */
      .parts-demo snice-message-strip.styled-content::part(content) {
        font-family: 'Courier New', monospace;
        font-size: .85rem;
        font-weight: 700;
        letter-spacing: .04em;
        color: #065f46;
        background: #d1fae5;
        border-radius: 4px;
        padding: .25rem .5rem;
      }

      /* ::part(dismiss) — the × dismiss button */
      .parts-demo snice-message-strip.styled-dismiss::part(dismiss) {
        background: #ef4444;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 1.5rem;
        height: 1.5rem;
        font-size: .85rem;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(239,68,68,.4);
        transition: transform .15s;
      }
      .parts-demo snice-message-strip.styled-dismiss::part(dismiss):hover {
        transform: scale(1.15);
      }

      /* Combined: all three parts styled */
      .parts-demo snice-message-strip.styled-all::part(icon) {
        color: #6366f1;
        font-size: 1.25rem;
      }
      .parts-demo snice-message-strip.styled-all::part(content) {
        font-weight: 600;
        color: #1e1b4b;
      }
      .parts-demo snice-message-strip.styled-all::part(dismiss) {
        background: #6366f1;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: .15rem .5rem;
        font-size: .75rem;
        font-weight: 700;
        cursor: pointer;
      }
    `;

    const wrap = document.createElement('div');
    wrap.appendChild(style);

    const demo = document.createElement('div');
    demo.className = 'parts-demo';

    const makeItem = (label: string, el: HTMLElement) => {
      const item = document.createElement('div');
      item.className = 'item';
      const lbl = document.createElement('div');
      lbl.className = 'label';
      lbl.textContent = label;
      item.appendChild(lbl);
      item.appendChild(el);
      return item;
    };

    const def = makeStrip('Default message strip — no part overrides applied.', { variant: 'info', dismissible: true });
    demo.appendChild(makeItem('default', def));

    const icon = makeStrip('Custom ::part(icon) styling — rounded dark bubble.', { variant: 'info', dismissible: true });
    icon.className = 'styled-icon';
    demo.appendChild(makeItem('::part(icon) — dark rounded bubble', icon));

    const content = makeStrip('Custom ::part(content) styling — monospace success theme.', { variant: 'success', dismissible: true });
    content.className = 'styled-content';
    demo.appendChild(makeItem('::part(content) — monospace green bg', content));

    const dismiss = makeStrip('Custom ::part(dismiss) — bold red dismiss button with hover scale.', { variant: 'warning', dismissible: true });
    dismiss.className = 'styled-dismiss';
    demo.appendChild(makeItem('::part(dismiss) — red circle with hover', dismiss));

    const all = makeStrip('All three parts styled together for a coherent custom theme.', { variant: 'danger', dismissible: true });
    all.className = 'styled-all';
    demo.appendChild(makeItem('all parts combined', all));

    wrap.appendChild(demo);
    return wrap;
  },
};
