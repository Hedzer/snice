import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-menu';
import './snice-menu-item';
import './snice-menu-divider';
import type { MenuPlacement, MenuTrigger } from './snice-menu.types';

type Args = {
  open?: boolean;
  placement?: MenuPlacement;
  trigger?: MenuTrigger;
  closeOnSelect?: boolean;
  distance?: number;
};

const PLACEMENTS: MenuPlacement[] = [
  'bottom-start', 'bottom-end', 'top-start', 'top-end',
  'right-start', 'right-end', 'left-start', 'left-end',
];
const TRIGGERS: MenuTrigger[] = ['click', 'hover', 'manual'];

function makeMenu(
  triggerLabel: string,
  items: Array<{ value: string; label: string; disabled?: boolean; selected?: boolean; icon?: string; shortcut?: string }>,
  attrs: Record<string, string | boolean> = {},
) {
  const menu = document.createElement('snice-menu');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) menu.toggleAttribute(k, true); }
    else menu.setAttribute(k, v);
  }
  const btn = document.createElement('button');
  btn.slot = 'trigger';
  btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
  btn.textContent = triggerLabel;
  menu.appendChild(btn);
  for (const item of items) {
    const mi = document.createElement('snice-menu-item');
    mi.setAttribute('value', item.value);
    if (item.disabled) mi.toggleAttribute('disabled', true);
    if (item.selected) mi.toggleAttribute('selected', true);
    if (item.icon) {
      const span = document.createElement('span');
      span.slot = 'icon';
      span.textContent = item.icon;
      mi.appendChild(span);
    }
    mi.appendChild(document.createTextNode(item.label));
    if (item.shortcut) {
      const span = document.createElement('span');
      span.slot = 'shortcut';
      span.textContent = item.shortcut;
      mi.appendChild(span);
    }
    menu.appendChild(mi);
  }
  return menu;
}

const BASIC_ITEMS = [
  { value: 'new', label: 'New File' },
  { value: 'open', label: 'Open' },
  { value: 'save', label: 'Save' },
];

function spacer() {
  const d = document.createElement('div');
  d.style.height = '14rem';
  return d;
}

function wrap(...els: HTMLElement[]) {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;';
  els.forEach(el => div.appendChild(el));
  return div;
}

const meta: Meta<Args> = {
  title: 'Navigation/Menu',
  component: 'snice-menu',
  tags: ['autodocs'],
  argTypes: {
    open:         { control: 'boolean' },
    placement:    { control: 'select', options: PLACEMENTS },
    trigger:      { control: 'select', options: TRIGGERS },
    closeOnSelect:{ control: 'boolean' },
    distance:     { control: 'number' },
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'padding-bottom:12rem;';
    const menu = makeMenu('Menu', BASIC_ITEMS, {
      ...(args.placement    ? { placement: args.placement }   : {}),
      ...(args.trigger      ? { trigger: args.trigger }       : {}),
      ...(args.distance !== undefined ? { distance: String(args.distance) } : {}),
    });
    if (args.open) menu.toggleAttribute('open', true);
    if (args.closeOnSelect === false) menu.setAttribute('close-on-select', 'false');
    container.appendChild(menu);
    return container;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { placement: 'bottom-start', trigger: 'click' } };

// h2: Trigger: click (default)
export const TriggerClick: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('Click Menu', BASIC_ITEMS)));
    return c;
  },
};

// h2: Trigger: hover
export const TriggerHover: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('Hover Menu', [
      { value: 'cut', label: 'Cut' },
      { value: 'copy', label: 'Copy' },
      { value: 'paste', label: 'Paste' },
    ], { trigger: 'hover' })));
    return c;
  },
};

// h2: Trigger: manual
export const TriggerManual: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    const menu = makeMenu('Manual Toggle', [
      { value: 'a', label: 'Action A' },
      { value: 'b', label: 'Action B' },
    ], { trigger: 'manual' });
    const triggerBtn = menu.querySelector('[slot="trigger"]') as HTMLElement;
    triggerBtn.addEventListener('click', () => (menu as any).toggleMenu());
    c.appendChild(wrap(menu));
    return c;
  },
};

// h2: Placement: bottom-start (default)
export const PlacementBottomStart: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('bottom-start', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'bottom-start' })));
    return c;
  },
};

// h2: Placement: bottom-end
export const PlacementBottomEnd: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;display:flex;justify-content:flex-end;';
    c.appendChild(makeMenu('bottom-end', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'bottom-end' }));
    return c;
  },
};

// h2: Placement: top-start
export const PlacementTopStart: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-top:12rem;';
    c.appendChild(makeMenu('top-start', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'top-start' }));
    return c;
  },
};

// h2: Placement: top-end
export const PlacementTopEnd: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-top:12rem;display:flex;justify-content:flex-end;';
    c.appendChild(makeMenu('top-end', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'top-end' }));
    return c;
  },
};

// h2: Placement: right-start
export const PlacementRightStart: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('right-start', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'right-start' })));
    return c;
  },
};

// h2: Placement: right-end
export const PlacementRightEnd: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('right-end', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'right-end' })));
    return c;
  },
};

// h2: Placement: left-start
export const PlacementLeftStart: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;padding-left:15rem;';
    c.appendChild(makeMenu('left-start', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'left-start' }));
    return c;
  },
};

// h2: Placement: left-end
export const PlacementLeftEnd: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;padding-left:15rem;';
    c.appendChild(makeMenu('left-end', [{ value: '1', label: 'Item 1' }, { value: '2', label: 'Item 2' }], { placement: 'left-end' }));
    return c;
  },
};

// h2: Close on select: true (default)
export const CloseOnSelectTrue: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('Auto-close', [
      { value: 'a', label: 'Click me (closes)' },
      { value: 'b', label: 'Click me too' },
    ], { 'close-on-select': 'true' })));
    return c;
  },
};

// h2: Close on select: false
export const CloseOnSelectFalse: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('Stays open', [
      { value: 'a', label: 'Click me (stays open)' },
      { value: 'b', label: 'Click me too' },
    ], { 'close-on-select': 'false' })));
    return c;
  },
};

// h2: Custom distance
export const CustomDistance: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(
      makeMenu('Distance: 0',  [{ value: '1', label: 'Item 1' }], { distance: '0' }),
      makeMenu('Distance: 4',  [{ value: '1', label: 'Item 1' }], { distance: '4' }),
      makeMenu('Distance: 12', [{ value: '1', label: 'Item 1' }], { distance: '12' }),
    ));
    return c;
  },
};

// h2: Menu item: disabled
export const MenuItemDisabled: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('With Disabled', [
      { value: 'a', label: 'Enabled' },
      { value: 'b', label: 'Disabled', disabled: true },
      { value: 'c', label: 'Enabled' },
    ])));
    return c;
  },
};

// h2: Menu item: selected
export const MenuItemSelected: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('With Selected', [
      { value: 'a', label: 'Normal' },
      { value: 'b', label: 'Selected', selected: true },
      { value: 'c', label: 'Normal' },
    ])));
    return c;
  },
};

// h2: Menu item: icon slot
export const MenuItemIconSlot: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('With Icons', [
      { value: 'new', label: 'New File', icon: '📄' },
      { value: 'save', label: 'Save', icon: '💾' },
      { value: 'delete', label: 'Delete', icon: '🗑️' },
    ])));
    return c;
  },
};

// h2: Menu item: shortcut slot
export const MenuItemShortcutSlot: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('With Shortcuts', [
      { value: 'save', label: 'Save', icon: '💾', shortcut: '⌘S' },
      { value: 'copy', label: 'Copy', shortcut: '⌘C' },
      { value: 'paste', label: 'Paste', shortcut: '⌘V' },
    ])));
    return c;
  },
};

// h2: Menu divider
export const MenuDivider: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    const menu = document.createElement('snice-menu');
    const btn = document.createElement('button');
    btn.slot = 'trigger';
    btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    btn.textContent = 'With Dividers';
    menu.appendChild(btn);
    const items = [
      { value: 'new', label: 'New' },
      { value: 'open', label: 'Open' },
      null,
      { value: 'save', label: 'Save' },
      { value: 'saveas', label: 'Save As' },
      null,
      { value: 'exit', label: 'Exit' },
    ];
    for (const item of items) {
      if (item === null) {
        menu.appendChild(document.createElement('snice-menu-divider'));
      } else {
        const mi = document.createElement('snice-menu-item');
        mi.setAttribute('value', item.value);
        mi.textContent = item.label;
        menu.appendChild(mi);
      }
    }
    c.appendChild(wrap(menu));
    return c;
  },
};

// h2: Image-left and image-right slots
export const ImageLeftAndRightSlots: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    const menu = document.createElement('snice-menu');
    const imgLeft = document.createElement('span');
    imgLeft.slot = 'image-left';
    imgLeft.style.fontSize = '1.25rem';
    imgLeft.textContent = '📁';
    menu.appendChild(imgLeft);
    const btn = document.createElement('button');
    btn.slot = 'trigger';
    btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    btn.textContent = 'With Images';
    menu.appendChild(btn);
    const imgRight = document.createElement('span');
    imgRight.slot = 'image-right';
    imgRight.style.fontSize = '0.75rem';
    imgRight.textContent = '▼';
    menu.appendChild(imgRight);
    for (const item of [{ value: 'a', label: 'Item A' }, { value: 'b', label: 'Item B' }]) {
      const mi = document.createElement('snice-menu-item');
      mi.setAttribute('value', item.value);
      mi.textContent = item.label;
      menu.appendChild(mi);
    }
    c.appendChild(wrap(menu));
    return c;
  },
};

// h2: Initially open
export const InitiallyOpen: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(makeMenu('Pre-opened', [
      { value: 'a', label: 'Item A' },
      { value: 'b', label: 'Item B' },
    ], { open: true }));
    return c;
  },
};

// h2: Full example: file menu
export const FullExampleFileMenu: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    const menu = document.createElement('snice-menu');
    const btn = document.createElement('button');
    btn.slot = 'trigger';
    btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:var(--snice-color-background-element,#f9f9f9);cursor:pointer;font-size:.875rem;';
    btn.textContent = 'File';
    menu.appendChild(btn);
    const fileItems = [
      { value: 'new', label: 'New', icon: '📄', shortcut: '⌘N' },
      { value: 'open', label: 'Open', icon: '📂', shortcut: '⌘O' },
      null,
      { value: 'save', label: 'Save', icon: '💾', shortcut: '⌘S' },
      { value: 'saveas', label: 'Save As', shortcut: '⇧⌘S' },
      null,
      { value: 'print', label: 'Print', shortcut: '⌘P' },
      { value: 'export', label: 'Export (disabled)', disabled: true },
      null,
      { value: 'exit', label: 'Exit', icon: '🚪' },
    ];
    for (const item of fileItems) {
      if (item === null) {
        menu.appendChild(document.createElement('snice-menu-divider'));
      } else {
        const mi = document.createElement('snice-menu-item');
        mi.setAttribute('value', item.value);
        if ((item as any).disabled) mi.toggleAttribute('disabled', true);
        if (item.icon) {
          const span = document.createElement('span');
          span.slot = 'icon';
          span.textContent = item.icon;
          mi.appendChild(span);
        }
        mi.appendChild(document.createTextNode(item.label));
        if (item.shortcut) {
          const span = document.createElement('span');
          span.slot = 'shortcut';
          span.textContent = item.shortcut;
          mi.appendChild(span);
        }
        menu.appendChild(mi);
      }
    }
    c.appendChild(wrap(menu));
    return c;
  },
};

// h2: Disabled + selected item states combined
export const DisabledSelectedStatesCombined: Story = {
  render: () => {
    const c = document.createElement('div');
    c.style.cssText = 'padding-bottom:14rem;';
    c.appendChild(wrap(makeMenu('States', [
      { value: 'a', label: 'Normal' },
      { value: 'b', label: 'Selected', selected: true },
      { value: 'c', label: 'Disabled', disabled: true },
      { value: 'd', label: 'Selected + Disabled', selected: true, disabled: true },
    ])));
    return c;
  },
};
