import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-virtual-scroller';

type Args = {
  itemHeight?: number;
  bufferSize?: number;
  estimatedItemHeight?: number;
};

interface VsItem {
  id: string;
  data: { name: string; index: number };
}

function makeItems(count: number, prefix = 'Item'): VsItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    data: { name: `${prefix} ${i + 1}`, index: i },
  }));
}

function defaultRender(item: VsItem): string {
  return `<div style="padding: 0 1rem; display: flex; align-items: center; height: 100%; border-bottom: 1px solid var(--snice-color-border, #eee); font-size: 0.875rem;">${item.data.name}</div>`;
}

function makeScroller(height: string, itemHeight: number, items: VsItem[], renderFn: (item: VsItem) => string, attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-virtual-scroller');
  el.style.cssText = `height:${height};border:1px solid var(--snice-color-border);border-radius:8px;display:block;`;
  el.setAttribute('item-height', String(itemHeight));
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  (el as any).items = items;
  (el as any).renderItem = renderFn;
  return el;
}

const meta: Meta<Args> = {
  title: 'Layout/VirtualScroller',
  component: 'snice-virtual-scroller',
  tags: ['autodocs'],
  argTypes: {
    itemHeight:          { control: 'number' },
    bufferSize:          { control: 'number' },
    estimatedItemHeight: { control: 'number' },
  },
  render: (args) => {
    const attrs: Record<string, string> = {};
    if (args.bufferSize          !== undefined) attrs['buffer-size']           = String(args.bufferSize);
    if (args.estimatedItemHeight !== undefined) attrs['estimated-item-height'] = String(args.estimatedItemHeight);
    return makeScroller('400px', args.itemHeight ?? 50, makeItems(1000), defaultRender, attrs);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { itemHeight: 50 } };

// h2: Default (10,000 items, item-height=50)
export const DefaultItems10000: Story = {
  render: () => makeScroller('400px', 50, makeItems(10000), defaultRender),
};

// h2: Item Height Values
export const ItemHeightValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.5rem;';
    for (const h of [30, 60, 80, 120]) {
      const col = document.createElement('div');
      const lbl = document.createElement('div'); lbl.style.cssText = 'font-size:.7rem;color:var(--snice-color-text-tertiary);margin-bottom:.25rem;'; lbl.textContent = `item-height=${h}`;
      const vs = makeScroller('300px', h, makeItems(1000), (item) =>
        `<div style="padding: 0 1rem; display: flex; align-items: center; height: 100%; border-bottom: 1px solid var(--snice-color-border, #eee); font-size: 0.875rem;">${item.data.name} (height: ${h}px)</div>`
      );
      col.appendChild(lbl); col.appendChild(vs);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Buffer Size Values
export const BufferSizeValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.5rem;';
    for (const b of [0, 5, 20]) {
      const col = document.createElement('div');
      const lbl = document.createElement('div'); lbl.style.cssText = 'font-size:.7rem;color:var(--snice-color-text-tertiary);margin-bottom:.25rem;'; lbl.textContent = b === 5 ? 'buffer-size=5 (default)' : `buffer-size=${b}`;
      const vs = makeScroller('300px', 50, makeItems(1000), defaultRender, { 'buffer-size': String(b) });
      col.appendChild(lbl); col.appendChild(vs);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Custom Render Function
export const CustomRenderFunction: Story = {
  render: () => {
    const items = makeItems(5000).map((item, i) => ({
      ...item,
      data: {
        ...item.data,
        avatar: `https://i.pravatar.cc/40?img=${(i % 70) + 1}`,
        role: ['Engineer', 'Designer', 'Manager', 'Analyst'][i % 4],
      },
    }));
    const vs = makeScroller('350px', 60, items, (item: any) =>
      `<div style="padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; height: 100%; border-bottom: 1px solid var(--snice-color-border, #eee);">
        <img src="${item.data.avatar}" style="width: 36px; height: 36px; border-radius: 50%;" loading="lazy">
        <div>
          <div style="font-size: 0.875rem; font-weight: 500;">${item.data.name}</div>
          <div style="font-size: 0.75rem; color: var(--snice-color-text-tertiary, #888);">${item.data.role}</div>
        </div>
      </div>`
    );
    return vs;
  },
};

// h2: Large Dataset (100,000 items)
export const LargeDataset100000Items: Story = {
  render: () => makeScroller('400px', 40, makeItems(100000, 'Record'), defaultRender),
};

// h2: Small Dataset (10 items)
export const SmallDataset10Items: Story = {
  render: () => makeScroller('300px', 50, makeItems(10), defaultRender),
};

// h2: Programmatic Scroll
export const ProgrammaticScroll: Story = {
  render: () => {
    const wrap = document.createElement('div');
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap;';

    const items = makeItems(1000);
    const vs = makeScroller('300px', 50, items, (item) =>
      `<div style="padding: 0 1rem; display: flex; align-items: center; height: 100%; border-bottom: 1px solid var(--snice-color-border, #eee); font-size: 0.875rem;">#${item.data.index} - ${item.data.name}</div>`
    );

    const makeBtn = (label: string, handler: () => void) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:.375rem .75rem;border:1px solid var(--snice-color-border);border-radius:6px;background:var(--snice-color-background);color:var(--snice-color-text);cursor:pointer;font-size:.8rem;';
      btn.textContent = label;
      btn.addEventListener('click', handler);
      return btn;
    };

    btnRow.appendChild(makeBtn('Scroll to #0',   () => (vs as any).scrollToIndex?.(0)));
    btnRow.appendChild(makeBtn('Scroll to #250', () => (vs as any).scrollToIndex?.(250)));
    btnRow.appendChild(makeBtn('Scroll to #500', () => (vs as any).scrollToIndex?.(500)));
    btnRow.appendChild(makeBtn('Scroll to #999', () => (vs as any).scrollToIndex?.(999)));
    btnRow.appendChild(makeBtn("scrollToItem('item-42')", () => (vs as any).scrollToItem?.('item-42')));

    wrap.appendChild(btnRow); wrap.appendChild(vs);
    return wrap;
  },
};

// h2: Estimated Item Height
export const EstimatedItemHeight: Story = {
  render: () => makeScroller('300px', 50, makeItems(500), defaultRender, { 'estimated-item-height': '50' }),
};

// h2: Container Heights
export const ContainerHeights: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.5rem;';
    for (const h of [200, 500]) {
      const col = document.createElement('div');
      const lbl = document.createElement('div'); lbl.style.cssText = 'font-size:.7rem;color:var(--snice-color-text-tertiary);margin-bottom:.25rem;'; lbl.textContent = `${h}px height`;
      const vs = makeScroller(`${h}px`, 40, makeItems(1000), defaultRender);
      col.appendChild(lbl); col.appendChild(vs);
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Empty List
export const EmptyList: Story = {
  render: () => {
    const vs = document.createElement('snice-virtual-scroller');
    vs.style.cssText = 'height:200px;border:1px solid var(--snice-color-border);border-radius:8px;display:block;';
    vs.setAttribute('item-height', '50');
    (vs as any).items = [];
    return vs;
  },
};
