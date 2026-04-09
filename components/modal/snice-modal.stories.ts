import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-modal';
import type { ModalSize } from './snice-modal.types';

type Args = {
  size?: ModalSize;
  label?: string;
  noBackdropDismiss?: boolean;
  noEscapeDismiss?: boolean;
  noFocusTrap?: boolean;
  noCloseButton?: boolean;
  noHeader?: boolean;
  noFooter?: boolean;
};

const SIZES: ModalSize[] = ['small', 'medium', 'large', 'fullscreen'];

function makeModal(id: string, attrs: Record<string, string | boolean>, headerText: string, bodyText: string, footerText = 'Close') {
  const modal = document.createElement('snice-modal');
  modal.id = id;
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) modal.toggleAttribute(k, true); }
    else modal.setAttribute(k, v);
  }
  if (headerText) {
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.textContent = headerText;
    modal.appendChild(hdr);
  }
  const p = document.createElement('p'); p.textContent = bodyText;
  modal.appendChild(p);
  if (footerText) {
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    closeBtn.textContent = footerText;
    closeBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(closeBtn);
    modal.appendChild(ftrDiv);
  }
  return modal;
}

function triggerButton(label: string, modalId: string) {
  const btn = document.createElement('button');
  btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    const modal = document.getElementById(modalId);
    if (modal) (modal as any).show?.();
  });
  return btn;
}

function storyContainer(...nodes: Node[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  nodes.forEach(n => wrap.appendChild(n));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Layout/Modal',
  component: 'snice-modal',
  tags: ['autodocs'],
  argTypes: {
    size:             { control: 'select', options: SIZES },
    label:            { control: 'text' },
    noBackdropDismiss:{ control: 'boolean' },
    noEscapeDismiss:  { control: 'boolean' },
    noFocusTrap:      { control: 'boolean' },
    noCloseButton:    { control: 'boolean' },
    noHeader:         { control: 'boolean' },
    noFooter:         { control: 'boolean' },
  },
  render: (args) => {
    const id = 'modal-playground-' + Math.random().toString(36).slice(2);
    const modal = makeModal(id, {
      size:  args.size  ?? 'medium',
      label: args.label ?? 'Playground Modal',
      ...(args.noBackdropDismiss ? { 'no-backdrop-dismiss': true } : {}),
      ...(args.noEscapeDismiss   ? { 'no-escape-dismiss': true }   : {}),
      ...(args.noFocusTrap       ? { 'no-focus-trap': true }       : {}),
      ...(args.noCloseButton     ? { 'no-close-button': true }     : {}),
      ...(args.noHeader          ? { 'no-header': true }           : {}),
      ...(args.noFooter          ? { 'no-footer': true }           : {}),
    }, 'Modal', 'This is the modal body content.');
    const btn = triggerButton('Open Modal', id);
    return storyContainer(btn, modal);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { size: 'medium', label: 'Default Modal' } };

// h2: Size: small
export const SizeSmall: Story = {
  render: () => {
    const id = 'modal-sm-story';
    const modal = makeModal(id, { size: 'small', label: 'Small Modal' }, 'Small Modal', 'This is a small-sized modal dialog.');
    return storyContainer(triggerButton('Open Small', id), modal);
  },
};

// h2: Size: medium (default)
export const SizeMediumDefault: Story = {
  render: () => {
    const id = 'modal-md-story';
    const modal = makeModal(id, { size: 'medium', label: 'Medium Modal' }, 'Medium Modal', 'This is the default medium-sized modal dialog.');
    return storyContainer(triggerButton('Open Medium', id), modal);
  },
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => {
    const id = 'modal-lg-story';
    const modal = makeModal(id, { size: 'large', label: 'Large Modal' }, 'Large Modal', 'This is a large-sized modal dialog with more room for content.');
    return storyContainer(triggerButton('Open Large', id), modal);
  },
};

// h2: Size: fullscreen
export const SizeFullscreen: Story = {
  render: () => {
    const id = 'modal-fs-story';
    const modal = makeModal(id, { size: 'fullscreen', label: 'Fullscreen Modal' }, 'Fullscreen Modal', 'This modal takes up the entire viewport.');
    return storyContainer(triggerButton('Open Fullscreen', id), modal);
  },
};

// h2: No backdrop dismiss
export const NoBackdropDismiss: Story = {
  render: () => {
    const id = 'modal-nobd-story';
    const modal = makeModal(id, { 'no-backdrop-dismiss': true, label: 'No Backdrop Dismiss' }, 'No Backdrop Dismiss', 'Clicking the backdrop will NOT close this modal. Use the close button or Escape.');
    return storyContainer(triggerButton('Open (no backdrop dismiss)', id), modal);
  },
};

// h2: No escape dismiss
export const NoEscapeDismiss: Story = {
  render: () => {
    const id = 'modal-noesc-story';
    const modal = makeModal(id, { 'no-escape-dismiss': true, label: 'No Escape Dismiss' }, 'No Escape Dismiss', 'Pressing Escape will NOT close this modal.');
    return storyContainer(triggerButton('Open (no escape dismiss)', id), modal);
  },
};

// h2: No focus trap
export const NoFocusTrap: Story = {
  render: () => {
    const id = 'modal-noft-story';
    const modal = makeModal(id, { 'no-focus-trap': true, label: 'No Focus Trap' }, 'No Focus Trap', 'Tab will not be trapped within this modal.');
    return storyContainer(triggerButton('Open (no focus trap)', id), modal);
  },
};

// h2: No close button
export const NoCloseButton: Story = {
  render: () => {
    const id = 'modal-nocb-story';
    const modal = makeModal(id, { 'no-close-button': true, label: 'No Close Button' }, 'No Close Button', 'The X button is hidden. Use backdrop click, Escape, or footer button.');
    return storyContainer(triggerButton('Open (no close button)', id), modal);
  },
};

// h2: No header
export const NoHeader: Story = {
  render: () => {
    const id = 'modal-noh-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.toggleAttribute('no-header', true);
    modal.setAttribute('label', 'No Header');
    const p = document.createElement('p'); p.textContent = 'This modal has no header section at all.';
    modal.appendChild(p);
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(closeBtn); modal.appendChild(ftrDiv);
    return storyContainer(triggerButton('Open (no header)', id), modal);
  },
};

// h2: No footer
export const NoFooter: Story = {
  render: () => {
    const id = 'modal-nof-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.toggleAttribute('no-footer', true);
    modal.setAttribute('label', 'No Footer');
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.textContent = 'No Footer';
    modal.appendChild(hdr);
    const p = document.createElement('p'); p.textContent = 'This modal has no footer section.';
    modal.appendChild(p);
    return storyContainer(triggerButton('Open (no footer)', id), modal);
  },
};

// h2: No header + No footer
export const NoHeaderNoFooter: Story = {
  render: () => {
    const id = 'modal-bare-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.toggleAttribute('no-header', true);
    modal.toggleAttribute('no-footer', true);
    modal.setAttribute('label', 'Body Only');
    const p = document.createElement('p'); p.textContent = 'Content only. No header, no footer. Click backdrop or press Escape to close.';
    modal.appendChild(p);
    return storyContainer(triggerButton('Open (body only)', id), modal);
  },
};

// h2: No close button + No backdrop + No escape (forced interaction)
export const ForcedInteraction: Story = {
  render: () => {
    const id = 'modal-forced-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.toggleAttribute('no-close-button', true);
    modal.toggleAttribute('no-backdrop-dismiss', true);
    modal.toggleAttribute('no-escape-dismiss', true);
    modal.setAttribute('label', 'Forced Interaction');
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.textContent = 'Confirm Required';
    modal.appendChild(hdr);
    const p = document.createElement('p'); p.textContent = 'You must click a button to close this modal. No escape routes.';
    modal.appendChild(p);
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    ftrDiv.style.cssText = 'display:flex;gap:.5rem;';
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => (modal as any).close?.());
    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = 'padding:.5rem 1rem;border:none;border-radius:6px;background:var(--snice-color-primary,#2563eb);color:white;cursor:pointer;font-size:.875rem;';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(cancelBtn); ftrDiv.appendChild(confirmBtn);
    modal.appendChild(ftrDiv);
    return storyContainer(triggerButton('Open (forced)', id), modal);
  },
};

// h2: All boolean flags: false (defaults)
export const AllBooleanFlagsDefaults: Story = {
  render: () => {
    const id = 'modal-defaults-story';
    const modal = makeModal(id, { label: 'Default Modal' }, 'All Defaults', 'Backdrop dismiss, escape dismiss, focus trap, close button, header, footer - all enabled.');
    return storyContainer(triggerButton('Open (all defaults)', id), modal);
  },
};

// h2: Custom label (accessibility)
export const CustomLabel: Story = {
  render: () => {
    const id = 'modal-label-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.setAttribute('label', 'Delete Confirmation Dialog');
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.textContent = 'Delete Item';
    modal.appendChild(hdr);
    const p = document.createElement('p'); p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';
    modal.appendChild(p);
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    ftrDiv.style.cssText = 'display:flex;gap:.5rem;';
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => (modal as any).close?.());
    const deleteBtn = document.createElement('button');
    deleteBtn.style.cssText = 'padding:.5rem 1rem;border:none;border-radius:6px;background:var(--snice-color-primary,#2563eb);color:white;cursor:pointer;font-size:.875rem;';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(cancelBtn); ftrDiv.appendChild(deleteBtn);
    modal.appendChild(ftrDiv);
    return storyContainer(triggerButton('Open (custom label)', id), modal);
  },
};

// h2: Slots: header, default body, footer
export const SlotsHeaderBodyFooter: Story = {
  render: () => {
    const id = 'modal-slots-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.setAttribute('label', 'Slotted Modal');
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.style.margin = '0'; hdr.textContent = 'Custom Header Content';
    modal.appendChild(hdr);
    const bodyDiv = document.createElement('div');
    const p1 = document.createElement('p'); p1.textContent = 'Body content in default slot.';
    const p2 = document.createElement('p'); p2.textContent = 'Can contain any HTML.';
    bodyDiv.appendChild(p1); bodyDiv.appendChild(p2); modal.appendChild(bodyDiv);
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    ftrDiv.style.cssText = 'display:flex;gap:.5rem;justify-content:flex-end;';
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => (modal as any).close?.());
    const saveBtn = document.createElement('button');
    saveBtn.style.cssText = 'padding:.5rem 1rem;border:none;border-radius:6px;background:var(--snice-color-primary,#2563eb);color:white;cursor:pointer;font-size:.875rem;';
    saveBtn.textContent = 'Save Changes';
    saveBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(cancelBtn); ftrDiv.appendChild(saveBtn);
    modal.appendChild(ftrDiv);
    return storyContainer(triggerButton('Open (all slots)', id), modal);
  },
};

// h2: Long scrollable content
export const LongScrollableContent: Story = {
  render: () => {
    const id = 'modal-scroll-story';
    const modal = document.createElement('snice-modal');
    modal.id = id;
    modal.setAttribute('label', 'Scrollable Content');
    const hdr = document.createElement('h3'); hdr.slot = 'header'; hdr.textContent = 'Long Content';
    modal.appendChild(hdr);
    const bodyDiv = document.createElement('div');
    for (let i = 1; i <= 10; i++) {
      const p = document.createElement('p');
      p.textContent = `Paragraph ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
      bodyDiv.appendChild(p);
    }
    modal.appendChild(bodyDiv);
    const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => (modal as any).close?.());
    ftrDiv.appendChild(closeBtn); modal.appendChild(ftrDiv);
    return storyContainer(triggerButton('Open (long content)', id), modal);
  },
};

// h2: Size x No header matrix
export const SizeXNoHeaderMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;';
    const configs = [
      ['modal-sm-noh-story', 'Small + No Header', 'small'],
      ['modal-lg-noh-story', 'Large + No Header', 'large'],
    ] as [string, string, ModalSize][];
    for (const [id, btnLabel, size] of configs) {
      const modal = document.createElement('snice-modal');
      modal.id = id;
      modal.setAttribute('size', size);
      modal.toggleAttribute('no-header', true);
      modal.setAttribute('label', btnLabel);
      const p = document.createElement('p'); p.textContent = `${size[0].toUpperCase() + size.slice(1)} with no header.`;
      modal.appendChild(p);
      const ftrDiv = document.createElement('div'); ftrDiv.slot = 'footer';
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', () => (modal as any).close?.());
      ftrDiv.appendChild(closeBtn); modal.appendChild(ftrDiv);
      wrap.appendChild(triggerButton(btnLabel, id));
      wrap.appendChild(modal);
    }
    return wrap;
  },
};
