import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-message-strip';

type MessageStripVariant = 'info' | 'success' | 'warning' | 'danger';

type Args = {
  variant?: MessageStripVariant;
  dismissable?: boolean;
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
  title: 'Data/MessageStrip',
  component: 'snice-message-strip',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'select', options: VARIANTS },
    dismissable:{ control: 'boolean' },
    icon:       { control: 'text' },
    message:    { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-message-strip');
    el.style.cssText = 'display:block;max-width:600px;';
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.icon    !== undefined) el.setAttribute('icon', args.icon);
    if (args.dismissable) el.toggleAttribute('dismissable', true);
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

// h2: Dismissable: true
export const DismissableTrue: Story = {
  render: () => col(
    makeStrip('Dismissable info message. Click X to close.', { variant: 'info',    dismissable: true }),
    makeStrip('Dismissable success message.',                 { variant: 'success', dismissable: true }),
    makeStrip('Dismissable warning message.',                 { variant: 'warning', dismissable: true }),
    makeStrip('Dismissable danger message.',                  { variant: 'danger',  dismissable: true }),
  ),
};

// h2: Dismissable: false (default)
export const DismissableFalse: Story = {
  render: () => makeStrip('Non-dismissable. No close button.', { variant: 'info' }),
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

// h2: Variant x Dismissable matrix
export const VariantXDismissableMatrix: Story = {
  render: () => col(
    makeStrip('Info + Dismissable',    { variant: 'info',    dismissable: true }),
    makeStrip('Success + Dismissable', { variant: 'success', dismissable: true }),
    makeStrip('Warning + Dismissable', { variant: 'warning', dismissable: true }),
    makeStrip('Danger + Dismissable',  { variant: 'danger',  dismissable: true }),
  ),
};

// h2: Variant x Custom icon x Dismissable
export const VariantXCustomIconXDismissable: Story = {
  render: () => col(
    makeStrip('Info + Custom icon + Dismissable',   { variant: 'info',   icon: '📧', dismissable: true }),
    makeStrip('Danger + Custom icon + Dismissable', { variant: 'danger', icon: '⛔', dismissable: true }),
  ),
};

// h2: Variant x No icon x Dismissable
export const VariantXNoIconXDismissable: Story = {
  render: () => col(
    makeStrip('Info + No icon + Dismissable',    { variant: 'info',    icon: 'none', dismissable: true }),
    makeStrip('Warning + No icon + Dismissable', { variant: 'warning', icon: 'none', dismissable: true }),
  ),
};

// h2: Long content
export const LongContent: Story = {
  render: () => makeStrip(
    'This is a message strip with much longer content to show how it wraps. It contains enough text to demonstrate multi-line behavior within the component boundaries. The dismiss button should remain aligned properly regardless of content length.',
    { variant: 'info', dismissable: true },
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
    const strip = makeStrip('Toggle this message strip with show() and hide().', { variant: 'warning', dismissable: true });
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
    el.toggleAttribute('dismissable', true);
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
