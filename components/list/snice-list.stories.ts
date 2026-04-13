import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-list';

type Args = {
  dividers?: boolean;
  searchable?: boolean;
  loading?: boolean;
  noResults?: boolean;
  infinite?: boolean;
  skeletonCount?: number;
};

function makeList(attrs: Record<string, boolean | string | number> = {}, items: Array<{ heading: string; description?: string }> = []): HTMLElement {
  const list = document.createElement('snice-list') as any;
  list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) list.toggleAttribute(k, true); }
    else list.setAttribute(k, String(v));
  }
  for (const item of items) {
    const li = document.createElement('snice-list-item');
    li.setAttribute('heading', item.heading);
    if (item.description) li.setAttribute('description', item.description);
    list.appendChild(li);
  }
  return list;
}

const baseItems = [
  { heading: 'Inbox', description: '3 unread messages' },
  { heading: 'Drafts', description: '2 drafts' },
  { heading: 'Sent', description: 'Last sent 2h ago' },
];

const meta: Meta<Args> = {
  title: 'Data/List',
  component: 'snice-list',
  tags: ['autodocs'],
  argTypes: {
    dividers:      { control: 'boolean' },
    searchable:    { control: 'boolean' },
    loading:       { control: 'boolean' },
    noResults:     { control: 'boolean' },
    infinite:      { control: 'boolean' },
    skeletonCount: { control: 'number' },
  },
  render: (args) => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    if (args.dividers)   list.toggleAttribute('dividers', true);
    if (args.searchable) list.toggleAttribute('searchable', true);
    if (args.loading)    list.toggleAttribute('loading', true);
    if (args.noResults)  list.toggleAttribute('no-results', true);
    if (args.infinite)   list.toggleAttribute('infinite', true);
    if (args.skeletonCount !== undefined) list.setAttribute('skeleton-count', String(args.skeletonCount));
    for (const item of baseItems) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      li.setAttribute('description', item.description);
      list.appendChild(li);
    }
    return list;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { dividers: true },
};

// h2: Basic list with items
export const BasicListWithItems: Story = {
  render: () => makeList({}, baseItems),
};

// h2: Dividers
export const Dividers: Story = {
  render: () => makeList({ dividers: true }, [
    { heading: 'Inbox', description: '3 unread messages' },
    { heading: 'Drafts', description: '2 drafts' },
    { heading: 'Sent', description: 'Last sent 2h ago' },
    { heading: 'Trash', description: 'Empty' },
  ]),
};

// h2: Searchable
export const Searchable: Story = {
  render: () => makeList({ searchable: true, dividers: true }, [
    { heading: 'Apple', description: 'A fruit' },
    { heading: 'Banana', description: 'Another fruit' },
    { heading: 'Cherry', description: 'A small fruit' },
  ]),
};

// h2: Loading state
export const LoadingState: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('loading', true);
    return list;
  },
};

// h2: Loading with custom skeleton-count: 3
export const LoadingWithCustomSkeletonCount3: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('loading', true);
    list.setAttribute('skeleton-count', '3');
    return list;
  },
};

// h2: Loading with skeleton-count: 8
export const LoadingWithSkeletonCount8: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('loading', true);
    list.setAttribute('skeleton-count', '8');
    return list;
  },
};

// h2: No results state
export const NoResultsState: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('no-results', true);
    return list;
  },
};

// h2: No results with custom slot
export const NoResultsWithCustomSlot: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('no-results', true);
    const slot = document.createElement('div');
    slot.slot = 'no-results';
    slot.style.cssText = 'padding:2rem;text-align:center;color:#888;';
    slot.textContent = 'Nothing here. Try a different search.';
    list.appendChild(slot);
    return list;
  },
};

// h2: List item: selected
export const ListItemSelected: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const items = [
      { heading: 'Normal item', selected: false },
      { heading: 'Selected item', selected: true },
      { heading: 'Normal item', selected: false },
    ];
    for (const item of items) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      if (item.selected) li.toggleAttribute('selected', true);
      list.appendChild(li);
    }
    return list;
  },
};

// h2: List item: disabled
export const ListItemDisabled: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const items = [
      { heading: 'Normal item', disabled: false },
      { heading: 'Disabled item', disabled: true },
      { heading: 'Normal item', disabled: false },
    ];
    for (const item of items) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      if (item.disabled) li.toggleAttribute('disabled', true);
      list.appendChild(li);
    }
    return list;
  },
};

// h2: List item: selected + disabled
export const ListItemSelectedDisabled: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const li1 = document.createElement('snice-list-item');
    li1.setAttribute('heading', 'Selected + Disabled');
    li1.toggleAttribute('selected', true);
    li1.toggleAttribute('disabled', true);
    const li2 = document.createElement('snice-list-item');
    li2.setAttribute('heading', 'Normal item');
    list.appendChild(li1);
    list.appendChild(li2);
    return list;
  },
};

// h2: List item: before slot (icon)
export const ListItemBeforeSlotIcon: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const items = [
      { heading: 'Downloads', description: '12 files', icon: '📥' },
      { heading: 'Photos', description: '456 items', icon: '📷' },
      { heading: 'Documents', description: '89 files', icon: '📄' },
    ];
    for (const item of items) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      li.setAttribute('description', item.description);
      const before = document.createElement('span');
      before.slot = 'before';
      before.textContent = item.icon;
      li.appendChild(before);
      list.appendChild(li);
    }
    return list;
  },
};

// h2: List item: after slot (badge/metadata)
export const ListItemAfterSlotBadgeMetadata: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const items = [
      { heading: 'Notifications', count: '5', color: 'red' },
      { heading: 'Messages', count: '12', color: 'blue' },
    ];
    for (const item of items) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      const after = document.createElement('span');
      after.slot = 'after';
      after.style.cssText = `background:${item.color};color:white;border-radius:10px;padding:0.125rem 0.5rem;font-size:0.75rem;`;
      after.textContent = item.count;
      li.appendChild(after);
      list.appendChild(li);
    }
    return list;
  },
};

// h2: List item: before + after slots
export const ListItemBeforeAfterSlots: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const items = [
      { heading: 'Settings', description: 'App preferences', icon: '⚙️' },
      { heading: 'Account', description: 'Profile & security', icon: '👤' },
    ];
    for (const item of items) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', item.heading);
      li.setAttribute('description', item.description);
      const before = document.createElement('span');
      before.slot = 'before';
      before.textContent = item.icon;
      const after = document.createElement('span');
      after.slot = 'after';
      after.style.cssText = 'font-size:0.75rem;color:#888;';
      after.textContent = '→';
      li.appendChild(before);
      li.appendChild(after);
      list.appendChild(li);
    }
    return list;
  },
};

// h2: List item: custom default slot content
export const ListItemCustomDefaultSlotContent: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const li = document.createElement('snice-list-item');
    const content = document.createElement('div');
    content.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
    const star = document.createElement('span');
    star.textContent = '⭐';
    const text = document.createElement('span');
    text.textContent = 'Fully custom content via default slot';
    content.appendChild(star);
    content.appendChild(text);
    li.appendChild(content);
    list.appendChild(li);
    return list;
  },
};

// h2: Before slot (list level)
export const BeforeSlotListLevel: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const header = document.createElement('div');
    header.slot = 'before';
    header.style.cssText = 'padding:0.75rem 1rem;font-size:0.875rem;font-weight:600;border-bottom:1px solid rgba(128,128,128,0.2);';
    header.textContent = 'Section Header';
    list.appendChild(header);
    const li1 = document.createElement('snice-list-item');
    li1.setAttribute('heading', 'Item A');
    const li2 = document.createElement('snice-list-item');
    li2.setAttribute('heading', 'Item B');
    list.appendChild(li1);
    list.appendChild(li2);
    return list;
  },
};

// h2: After slot (list level)
export const AfterSlotListLevel: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const li1 = document.createElement('snice-list-item');
    li1.setAttribute('heading', 'Item A');
    const li2 = document.createElement('snice-list-item');
    li2.setAttribute('heading', 'Item B');
    list.appendChild(li1);
    list.appendChild(li2);
    const footer = document.createElement('div');
    footer.slot = 'after';
    footer.style.cssText = 'padding:0.75rem 1rem;font-size:0.75rem;color:#888;text-align:center;';
    footer.textContent = 'End of list';
    list.appendChild(footer);
    return list;
  },
};

// h2: Loading slot (custom)
export const LoadingSlotCustom: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('loading', true);
    const slot = document.createElement('div');
    slot.slot = 'loading';
    slot.style.cssText = 'padding:2rem;text-align:center;color:#888;';
    slot.textContent = 'Loading data...';
    list.appendChild(slot);
    return list;
  },
};

// h2: Infinite scroll (requires scrollable parent)
export const InfiniteScrollRequiresScrollableParent: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'height:200px;overflow-y:auto;border:1px solid rgba(128,128,128,0.2);border-radius:8px;max-width:400px;';
    const list = document.createElement('snice-list') as any;
    list.toggleAttribute('infinite', true);
    list.toggleAttribute('dividers', true);
    for (let i = 1; i <= 5; i++) {
      const li = document.createElement('snice-list-item');
      li.setAttribute('heading', `Item ${i}`);
      if (i === 1) li.setAttribute('description', 'Scroll down for infinite loading');
      list.appendChild(li);
    }
    container.appendChild(list);
    return container;
  },
};

// h2: Searchable + dividers + loading combination
export const SearchableDividersLoadingCombination: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('searchable', true);
    list.toggleAttribute('dividers', true);
    list.toggleAttribute('loading', true);
    list.setAttribute('skeleton-count', '2');
    const li = document.createElement('snice-list-item');
    li.setAttribute('heading', 'Partial load');
    list.appendChild(li);
    return list;
  },
};

// h2: Empty list (no items, no flags)
export const EmptyListNoItemsNoFlags: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    return list;
  },
};

// h2: Heading only (no description)
export const HeadingOnlyNoDescription: Story = {
  render: () => {
    const list = document.createElement('snice-list') as any;
    list.style.cssText = 'max-width:400px;display:block;border:1px solid rgba(128,128,128,0.2);border-radius:8px;overflow:hidden;';
    list.toggleAttribute('dividers', true);
    const li1 = document.createElement('snice-list-item');
    li1.setAttribute('heading', 'Heading Only');
    const li2 = document.createElement('snice-list-item');
    li2.setAttribute('heading', 'Another Heading');
    list.appendChild(li1);
    list.appendChild(li2);
    return list;
  },
};

// h2: CSS Parts Styling
// Parts available on snice-list: container, search, loading, sentinel
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'list-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .list-parts-demo { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
      .list-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.4rem;
      }

      /* Styled list parts */
      .list-parts-demo .styled-list::part(container) {
        background: linear-gradient(180deg, #0f172a, #1e293b);
        border: 2px solid #334155;
        border-radius: 12px;
        overflow: hidden;
      }
      .list-parts-demo .styled-list::part(search) {
        background: #1e293b;
        border-bottom: 2px solid #3b82f6;
        padding: 0.6rem 1rem;
      }
      .list-parts-demo .styled-list::part(loading) {
        background: #0f172a;
        color: #60a5fa;
        text-align: center;
        padding: 1.5rem;
      }
      .list-parts-demo .styled-list::part(sentinel) {
        height: 2px;
        background: #3b82f6;
      }
    `;
    wrap.appendChild(style);

    const makeList = (label: string, cls: string, items: Array<{ heading: string; description: string }>): HTMLElement => {
      const box = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      box.appendChild(lbl);
      const list = document.createElement('snice-list') as any;
      list.style.cssText = 'max-width:360px;display:block;';
      list.toggleAttribute('searchable', true);
      list.toggleAttribute('dividers', true);
      if (cls) list.classList.add(cls);
      for (const item of items) {
        const li = document.createElement('snice-list-item');
        li.setAttribute('heading', item.heading);
        li.setAttribute('description', item.description);
        list.appendChild(li);
      }
      box.appendChild(list);
      return box;
    };

    const items = [
      { heading: 'Inbox', description: '3 unread messages' },
      { heading: 'Drafts', description: '2 saved drafts' },
      { heading: 'Sent', description: 'Last sent 2h ago' },
    ];

    wrap.appendChild(makeList('Default (no ::part() styles)', '', items));
    wrap.appendChild(makeList('Styled via ::part() — container, search, loading, sentinel', 'styled-list', items));

    return wrap;
  },
};
