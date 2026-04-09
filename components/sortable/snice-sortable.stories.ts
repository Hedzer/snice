import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-sortable';

type SortableDirection = 'vertical' | 'horizontal';

type Args = {
  direction?: SortableDirection;
  disabled?: boolean;
  handle?: string;
  group?: string;
};

const DIRECTIONS: SortableDirection[] = ['vertical', 'horizontal'];

function makeItem(text: string, style = '') {
  const el = document.createElement('div');
  el.style.cssText = `padding:.75rem 1rem;background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:6px;cursor:grab;user-select:none;${style}`;
  el.textContent = text;
  return el;
}

function makeHItem(text: string) {
  const el = document.createElement('div');
  el.style.cssText = 'padding:.75rem 1.25rem;background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:6px;cursor:grab;user-select:none;';
  el.textContent = text;
  return el;
}

function makeSortable(attrs: Record<string, string | boolean>, items: HTMLElement[]) {
  const el = document.createElement('snice-sortable');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  items.forEach(i => el.appendChild(i));
  return el;
}

const meta: Meta<Args> = {
  title: 'Layout/Sortable',
  component: 'snice-sortable',
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: DIRECTIONS },
    disabled:  { control: 'boolean' },
    handle:    { control: 'text' },
    group:     { control: 'text' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {
      direction: args.direction ?? 'vertical',
    };
    if (args.disabled) attrs['disabled'] = true;
    if (args.handle)   attrs['handle']   = args.handle;
    if (args.group)    attrs['group']    = args.group;
    const sortable = makeSortable(attrs, ['Item 1', 'Item 2', 'Item 3', 'Item 4'].map(t => makeItem(t)));
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { direction: 'vertical' } };

// h2: Direction: Vertical (default)
export const DirectionVertical: Story = {
  render: () => {
    const sortable = makeSortable({ direction: 'vertical' }, ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map(t => makeItem(t)));
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};

// h2: Direction: Horizontal
export const DirectionHorizontal: Story = {
  render: () => {
    const sortable = makeSortable({ direction: 'horizontal' }, ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map(t => makeHItem(t)));
    sortable.style.cssText = 'display:flex;gap:.5rem;';
    return sortable;
  },
};

// h2: Disabled
export const Disabled: Story = {
  render: () => {
    const sortable = makeSortable({ direction: 'vertical', disabled: true }, ['Item 1 (disabled)', 'Item 2 (disabled)', 'Item 3 (disabled)'].map(t => makeItem(t, 'opacity:.5;cursor:not-allowed;')));
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};

// h2: With Handle
export const WithHandle: Story = {
  render: () => {
    const items = ['Drag by handle 1', 'Drag by handle 2', 'Drag by handle 3', 'Drag by handle 4'].map(text => {
      const el = document.createElement('div');
      el.style.cssText = 'padding:.75rem 1rem;background:var(--snice-color-background-element,#fcfbf9);border:1px solid var(--snice-color-border,#e2e2e2);border-radius:6px;user-select:none;';
      const handle = document.createElement('span');
      handle.className = 'handle';
      handle.style.cssText = 'cursor:grab;display:inline-block;margin-right:.5rem;color:var(--snice-color-text-tertiary,#888);';
      handle.textContent = '::';
      el.appendChild(handle);
      el.appendChild(document.createTextNode(text));
      return el;
    });
    const sortable = makeSortable({ direction: 'vertical', handle: '.handle' }, items);
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};

// h2: With Group
export const WithGroup: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;';

    const labelStyle = 'font-size:.8rem;color:var(--snice-color-text-secondary);margin-bottom:.25rem;';

    const colA = document.createElement('div');
    colA.style.maxWidth = '250px';
    const lblA = document.createElement('div'); lblA.style.cssText = labelStyle; lblA.textContent = 'Group A';
    const sortA = makeSortable({ direction: 'vertical', group: 'shared' }, ['Group A - Item 1', 'Group A - Item 2', 'Group A - Item 3'].map(t => makeItem(t)));
    colA.appendChild(lblA); colA.appendChild(sortA);

    const colB = document.createElement('div');
    colB.style.maxWidth = '250px';
    const lblB = document.createElement('div'); lblB.style.cssText = labelStyle; lblB.textContent = 'Group B';
    const sortB = makeSortable({ direction: 'vertical', group: 'shared' }, ['Group B - Item 1', 'Group B - Item 2', 'Group B - Item 3'].map(t => makeItem(t)));
    colB.appendChild(lblB); colB.appendChild(sortB);

    wrap.appendChild(colA); wrap.appendChild(colB);
    return wrap;
  },
};

// h2: Many Items
export const ManyItems: Story = {
  render: () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`Item ${i + 1}`));
    const sortable = makeSortable({ direction: 'vertical' }, items);
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};

// h2: Single Item
export const SingleItem: Story = {
  render: () => {
    const sortable = makeSortable({ direction: 'vertical' }, [makeItem('Only one item')]);
    sortable.style.maxWidth = '300px';
    return sortable;
  },
};
