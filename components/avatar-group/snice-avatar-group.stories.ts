import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-avatar-group';
import '../avatar/snice-avatar';
import type { AvatarGroupSize, AvatarGroupItem } from './snice-avatar-group.types';

type Args = {
  max?: number;
  size?: AvatarGroupSize;
  overlap?: number;
};

const SIZES: AvatarGroupSize[] = ['small', 'medium', 'large'];

const PEOPLE: AvatarGroupItem[] = [
  { name: 'Alice Chen',  src: 'https://i.pravatar.cc/80?img=1' },
  { name: 'Bob Smith',   src: 'https://i.pravatar.cc/80?img=2' },
  { name: 'Carol Davis', src: 'https://i.pravatar.cc/80?img=3' },
  { name: 'David Lee',   src: 'https://i.pravatar.cc/80?img=4' },
  { name: 'Eve Park',    src: 'https://i.pravatar.cc/80?img=5' },
  { name: 'Frank Wu',    src: 'https://i.pravatar.cc/80?img=6' },
  { name: 'Grace Kim',   src: 'https://i.pravatar.cc/80?img=7' },
];

function makeGroup(attrs: Record<string, string | number> = {}, avatars?: AvatarGroupItem[]): HTMLElement {
  const el = document.createElement('snice-avatar-group');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  if (avatars !== undefined) (el as any).avatars = avatars;
  return el;
}

function row(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Data/AvatarGroup',
  component: 'snice-avatar-group',
  tags: ['autodocs'],
  argTypes: {
    max:     { control: 'number' },
    size:    { control: 'select', options: SIZES },
    overlap: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-avatar-group');
    if (args.max     !== undefined) el.setAttribute('max',     String(args.max));
    if (args.size    !== undefined) el.setAttribute('size',    String(args.size));
    if (args.overlap !== undefined) el.setAttribute('overlap', String(args.overlap));
    (el as any).avatars = PEOPLE.slice(0, 5);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { max: 5, size: 'medium', overlap: 8 } };

// h2: All sizes — imperative API
export const AllSizesImperativeApi: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1rem;flex-wrap:wrap;';
    for (const size of SIZES) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;gap:.35rem;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.65rem;color:#888;';
      lbl.textContent = size;
      item.appendChild(lbl);
      item.appendChild(makeGroup({ size }, PEOPLE.slice(0, 4)));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Max property — overflow badge
export const MaxPropertyOverflowBadge: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1rem;flex-wrap:wrap;';
    for (const max of [3, 5, 2, 1]) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;gap:.35rem;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.65rem;color:#888;';
      lbl.textContent = `max=${max}`;
      item.appendChild(lbl);
      item.appendChild(makeGroup({ max }, PEOPLE));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Overlap values
export const OverlapValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1rem;flex-wrap:wrap;';
    for (const overlap of [0, 8, 16, 24]) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;gap:.35rem;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.65rem;color:#888;';
      lbl.textContent = `overlap=${overlap}`;
      item.appendChild(lbl);
      item.appendChild(makeGroup({ overlap }, PEOPLE.slice(0, 4)));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: With images
export const WithImages: Story = {
  render: () => makeGroup({}, PEOPLE.slice(0, 5)),
};

// h2: With initials only
export const WithInitialsOnly: Story = {
  render: () => makeGroup({}, PEOPLE.slice(0, 5).map(p => ({ name: p.name }))),
};

// h2: Mixed: images + initials + fallback
export const MixedImagesInitialsFallback: Story = {
  render: () => makeGroup({}, [
    { name: 'Alice', src: 'https://i.pravatar.cc/80?img=1' },
    { name: 'Bob' },
    { name: 'Carol', src: 'https://broken.invalid/404.jpg' },
    {},
    { name: 'Eve', initials: 'EP' },
  ]),
};

// h2: Custom colors
export const CustomColors: Story = {
  render: () => makeGroup({}, [
    { name: 'Red',    color: '#dc2626' },
    { name: 'Blue',   color: '#2563eb' },
    { name: 'Green',  color: '#16a34a' },
    { name: 'Purple', color: '#7c3aed' },
  ]),
};

// h2: Declarative API (child snice-avatar elements)
export const DeclarativeApi: Story = {
  render: () => {
    const group = document.createElement('snice-avatar-group');
    group.setAttribute('size', 'large');
    const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace'];
    for (const name of names) {
      const av = document.createElement('snice-avatar');
      av.setAttribute('name', name);
      group.appendChild(av);
    }
    return group;
  },
};

// h2: Declarative with max=3
export const DeclarativeWithMax3: Story = {
  render: () => {
    const group = document.createElement('snice-avatar-group');
    group.setAttribute('max', '3');
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']) {
      const av = document.createElement('snice-avatar');
      av.setAttribute('name', name);
      group.appendChild(av);
    }
    return group;
  },
};

// h2: Single avatar
export const SingleAvatar: Story = {
  render: () => makeGroup({}, [{ name: 'Solo' }]),
};

// h2: No avatars (empty)
export const NoAvatarsEmpty: Story = {
  render: () => makeGroup({}, []),
};

// h2: Size x max matrix
export const SizeXMaxMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:center;';
    const combos: [string, string, number][] = [
      ['small', 'small, max=3', 3],
      ['medium', 'medium, max=3', 3],
      ['small', 'small, max=5', 5],
      ['large', 'large, max=5', 5],
    ];
    for (const [size, label, max] of combos) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;text-align:right;padding-right:.5rem;';
      lbl.textContent = label;
      grid.appendChild(lbl);
      grid.appendChild(makeGroup({ size, max }, PEOPLE));
    }
    return grid;
  },
};

// h2: CSS Parts Styling
// Parts: base, avatar, overflow
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .7rem; color: #888; }

      /* ::part(base) — the group container */
      .parts-demo snice-avatar-group.styled-base::part(base) {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 2rem;
        padding: .35rem .75rem;
      }

      /* ::part(avatar) — each individual avatar wrapper in the group */
      .parts-demo snice-avatar-group.styled-avatar::part(avatar) {
        outline: 3px solid #6366f1;
        border-radius: 50%;
        transition: transform .2s;
      }
      .parts-demo snice-avatar-group.styled-avatar::part(avatar):hover {
        transform: translateY(-4px) scale(1.1);
        z-index: 10;
      }

      /* ::part(overflow) — the "+N" overflow counter */
      .parts-demo snice-avatar-group.styled-overflow::part(overflow) {
        background: linear-gradient(135deg, #6366f1, #ec4899);
        color: #fff;
        font-weight: 900;
        font-size: .9rem;
        letter-spacing: -.02em;
        border: none;
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

    const def = makeGroup({ size: 'medium', max: 4 }, PEOPLE);
    demo.appendChild(makeItem('default (no ::part overrides)', def));

    const styledBase = makeGroup({ size: 'medium', max: 4 }, PEOPLE);
    styledBase.className = 'styled-base';
    demo.appendChild(makeItem('::part(base) — amber background + border pill', styledBase));

    const styledAvatar = makeGroup({ size: 'medium', max: 4 }, PEOPLE);
    styledAvatar.className = 'styled-avatar';
    demo.appendChild(makeItem('::part(avatar) — indigo outline + hover lift', styledAvatar));

    const styledOverflow = makeGroup({ size: 'medium', max: 3 }, PEOPLE);
    styledOverflow.className = 'styled-overflow';
    demo.appendChild(makeItem('::part(overflow) — gradient overflow counter', styledOverflow));

    wrap.appendChild(demo);
    return wrap;
  },
};
