import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-empty-state';

type Args = {
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
};

const SIZES = ['small', 'medium', 'large'] as const;

function makeEmptyState(attrs: Record<string, string>): HTMLElement {
  const el = document.createElement('snice-empty-state');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function box(inner: HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
  wrap.appendChild(inner);
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Data/EmptyState',
  component: 'snice-empty-state',
  tags: ['autodocs'],
  argTypes: {
    size:        { control: 'select', options: SIZES },
    icon:        { control: 'text' },
    title:       { control: 'text' },
    description: { control: 'text' },
    actionText:  { control: 'text' },
    actionHref:  { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-empty-state');
    if (args.size !== undefined)        el.setAttribute('size', args.size);
    if (args.icon !== undefined)        el.setAttribute('icon', args.icon);
    if (args.title !== undefined)       el.setAttribute('title', args.title);
    if (args.description !== undefined) el.setAttribute('description', args.description);
    if (args.actionText !== undefined)  el.setAttribute('action-text', args.actionText);
    if (args.actionHref !== undefined)  el.setAttribute('action-href', args.actionHref);
    return box(el);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { size: 'medium', title: 'No results', description: 'Try a different search term.' },
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => box(makeEmptyState({ size: 'small', title: 'No results', description: 'Try a different search term.' })),
};

// h2: Size: medium (default)
export const SizeMediumDefault: Story = {
  render: () => box(makeEmptyState({ size: 'medium', title: 'No results', description: 'Try a different search term.' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => box(makeEmptyState({ size: 'large', title: 'No results', description: 'Try a different search term.' })),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    grid.appendChild(box(makeEmptyState({ size: 'small', title: 'Small', description: 'Compact size.' })));
    grid.appendChild(box(makeEmptyState({ size: 'medium', title: 'Medium', description: 'Default size.' })));
    grid.appendChild(box(makeEmptyState({ size: 'large', title: 'Large', description: 'Large size.' })));
    return grid;
  },
};

// h2: Icon: Emoji Icons
export const IconEmojiIcons: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    const items = [
      { icon: '📭', title: 'No messages', description: 'Your inbox is empty.' },
      { icon: '🔍', title: 'No results', description: 'No matches found.' },
      { icon: '📁', title: 'No files', description: 'Upload a file to get started.' },
      { icon: '🛒', title: 'Cart is empty', description: 'Add items to your cart.' },
      { icon: '📊', title: 'No data', description: 'No analytics data yet.' },
      { icon: '👥', title: 'No users', description: 'Invite team members.' },
    ];
    items.forEach(item => grid.appendChild(box(makeEmptyState(item))));
    return grid;
  },
};

// h2: Icon: Material Symbols
export const IconMaterialSymbols: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    const items = [
      { icon: 'inbox', title: 'No messages', description: 'Check back later.' },
      { icon: 'search', title: 'No results', description: 'Try different keywords.' },
      { icon: 'folder_open', title: 'No files', description: 'This folder is empty.' },
      { icon: 'notifications_off', title: 'No notifications', description: "You're all caught up." },
    ];
    items.forEach(item => grid.appendChild(box(makeEmptyState(item))));
    return grid;
  },
};

// h2: Title Only (no description)
export const TitleOnlyNoDescription: Story = {
  render: () => box(makeEmptyState({ title: 'Nothing here yet' })),
};

// h2: With Description
export const WithDescription: Story = {
  render: () => box(makeEmptyState({ title: 'No projects', description: 'Create your first project to get started with the dashboard.' })),
};

// h2: Action Button (action-text)
export const ActionButtonActionText: Story = {
  render: () => box(makeEmptyState({ title: 'No tasks', description: 'You have no pending tasks.', 'action-text': 'Create Task' })),
};

// h2: Action as Link (action-text + action-href)
export const ActionAsLinkActionTextActionHref: Story = {
  render: () => box(makeEmptyState({
    title: 'No documentation',
    description: 'Documentation has not been created yet.',
    'action-text': 'Go to Docs',
    'action-href': 'https://example.com',
  })),
};

// h2: Slot: icon (custom icon content)
export const SlotIconCustomIconContent: Story = {
  render: () => {
    const el = document.createElement('snice-empty-state');
    el.setAttribute('title', 'Custom Icon');
    el.setAttribute('description', 'Using a slotted SVG icon.');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('slot', 'icon');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>';
    el.appendChild(svg);
    return box(el);
  },
};

// h2: Slot: Default (custom content below)
export const SlotDefaultCustomContentBelow: Story = {
  render: () => {
    const el = document.createElement('snice-empty-state');
    el.setAttribute('title', 'No integrations');
    el.setAttribute('description', 'Connect your favorite tools.');
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:0.5rem;margin-top:1rem;';
    for (const label of ['Slack', 'GitHub', 'Jira']) {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:0.4rem 0.8rem;border:1px solid rgba(128,128,128,0.2);border-radius:4px;background:transparent;cursor:pointer;';
      btn.textContent = label;
      btnWrap.appendChild(btn);
    }
    el.appendChild(btnWrap);
    return box(el);
  },
};

// h2: Size x Icon Combinations
export const SizeXIconCombinations: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    grid.appendChild(box(makeEmptyState({ size: 'small', icon: '📦', title: 'Small + Emoji', description: 'Compact.' })));
    grid.appendChild(box(makeEmptyState({ size: 'medium', icon: 'cloud_off', title: 'Medium + Material', description: 'Default.' })));
    grid.appendChild(box(makeEmptyState({ size: 'large', icon: '🎯', title: 'Large + Emoji', description: 'Spacious.' })));
    return grid;
  },
};

// h2: Edge: Long Title and Description
export const EdgeLongTitleAndDescription: Story = {
  render: () => box(makeEmptyState({
    title: 'This is a very long title that might wrap to multiple lines depending on container width',
    description: 'This is an equally long description text that provides additional context and information about why this empty state is being shown and what the user might want to do about it.',
    'action-text': 'Take Action Now',
  })),
};

// h2: Edge: Defaults Only
export const EdgeDefaultsOnly: Story = {
  render: () => box(makeEmptyState({})),
};

// h2: CSS Parts Styling
// Parts available: container, icon, title, description, action
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'es-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .es-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
      .es-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.4rem;
      }
      .es-parts-demo .demo-box { display: flex; flex-direction: column; gap: 0.5rem; }

      /* Styled empty-state parts */
      .es-parts-demo .styled-es::part(container) {
        background: linear-gradient(135deg, #1a0533, #2d0e5c);
        border-radius: 16px;
        padding: 2.5rem 2rem;
        text-align: center;
        border: 1px solid #5b21b6;
      }
      .es-parts-demo .styled-es::part(icon) {
        font-size: 3rem;
        background: rgba(139, 92, 246, 0.2);
        border-radius: 50%;
        width: 5rem;
        height: 5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        border: 2px solid #7c3aed;
      }
      .es-parts-demo .styled-es::part(title) {
        color: #c4b5fd;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
      .es-parts-demo .styled-es::part(description) {
        color: #a78bfa;
        font-size: 0.875rem;
        margin: 0 0 1.5rem;
      }
      .es-parts-demo .styled-es::part(action) {
        background: #7c3aed;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .es-parts-demo .styled-es::part(action):hover {
        background: #6d28d9;
      }
    `;
    wrap.appendChild(style);

    const makeBox = (label: string, el: HTMLElement): HTMLElement => {
      const b = document.createElement('div');
      b.className = 'demo-box';
      const lbl = document.createElement('div');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      b.appendChild(lbl);
      b.appendChild(el);
      return b;
    };

    const defaultEl = makeEmptyState({ icon: '📭', title: 'No Messages', description: 'Your inbox is empty.', 'action-text': 'Compose' });
    wrap.appendChild(makeBox('Default (no ::part() styles)', box(defaultEl)));

    const styledEl = makeEmptyState({ icon: '📭', title: 'No Messages', description: 'Your inbox is empty.', 'action-text': 'Compose' });
    styledEl.classList.add('styled-es');
    wrap.appendChild(makeBox('Styled via ::part() — container, icon, title, description, action', styledEl));

    return wrap;
  },
};
