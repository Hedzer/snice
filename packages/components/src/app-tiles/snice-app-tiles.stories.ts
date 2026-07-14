import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-app-tiles';

type Args = {
  variant?: 'grid' | 'list' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  columns?: number;
};

const meta: Meta<Args> = {
  title: 'AppTiles',
  component: 'snice-app-tiles',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['grid', 'list', 'compact'] },
    size:    { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    columns: { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-app-tiles');
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.size    !== undefined) el.setAttribute('size',    args.size);
    if (args.columns !== undefined) el.setAttribute('columns', String(args.columns));
    (el as any).tiles = [
      { id: '1', name: 'Mail',     icon: '✉️' },
      { id: '2', name: 'Calendar', icon: '📅' },
      { id: '3', name: 'Drive',    icon: '📁' },
      { id: '4', name: 'Photos',   icon: '🖼️' },
      { id: '5', name: 'Maps',     icon: '🗺️' },
      { id: '6', name: 'Notes',    icon: '📝' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

const basicTiles = [
  { id: '1', name: 'Mail',     icon: '✉️' },
  { id: '2', name: 'Calendar', icon: '📅' },
  { id: '3', name: 'Drive',    icon: '📁' },
  { id: '4', name: 'Photos',   icon: '🖼️' },
  { id: '5', name: 'Maps',     icon: '🗺️' },
  { id: '6', name: 'Notes',    icon: '📝' },
];

function makeAT(attrs: Record<string, string> = {}, tiles?: object[]) {
  const el = document.createElement('snice-app-tiles');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (tiles) (el as any).tiles = tiles;
  return el;
}

export const Default: Story = {
  args: { variant: 'grid', size: 'md' },
};

// h2: Variant: grid (default)
export const VariantGrid: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, basicTiles));
    return wrap;
  },
};

// h2: Variant: list
export const VariantList: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({ variant: 'list' }, basicTiles));
    return wrap;
  },
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({ variant: 'compact' }, basicTiles));
    return wrap;
  },
};

// h2: All variants side by side
export const AllVariantsSideBySide: Story = {
  render: () => {
    const outer = document.createElement('div');
    outer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;';
    const subset = basicTiles.slice(0, 4);
    for (const [label, v] of [['grid', 'grid'], ['list', 'list'], ['compact', 'compact']] as [string, string][]) {
      const col = document.createElement('div');
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:.5rem;';
      h.textContent = label;
      col.appendChild(h);
      col.appendChild(makeAT({ variant: v }, subset));
      outer.appendChild(col);
    }
    return outer;
  },
};

// h2: All sizes: sm, md (default), lg, xl, 2xl
export const AllSizes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;';
    const sizeTiles = [{ id: '1', name: 'App', icon: '⭐' }, { id: '2', name: 'Docs', icon: '📄' }, { id: '3', name: 'Chat', icon: '💬' }];
    for (const s of ['sm', 'md', 'lg', 'xl', '2xl']) {
      const col = document.createElement('div');
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:.5rem;';
      h.textContent = s;
      col.appendChild(h);
      col.appendChild(makeAT({ size: s, columns: '3' }, sizeTiles));
      wrap.appendChild(col);
    }
    return wrap;
  },
};

// h2: Columns: 2, 3, 4, 5, 6
export const Columns: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const colTiles = Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: `App ${i + 1}`, icon: String.fromCodePoint(0x1F4A0 + i) }));
    for (const cols of ['2', '3', '6']) {
      const section = document.createElement('div');
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:.5rem;';
      h.textContent = `columns=${cols}`;
      section.appendChild(h);
      section.appendChild(makeAT({ columns: cols }, colTiles));
      wrap.appendChild(section);
    }
    return wrap;
  },
};

// h2: Icons: emoji
export const IconsEmoji: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Star',   icon: '⭐' },
      { id: '2', name: 'Heart',  icon: '❤️' },
      { id: '3', name: 'Rocket', icon: '🚀' },
      { id: '4', name: 'Fire',   icon: '🔥' },
    ]));
    return wrap;
  },
};

// h2: Icons: image URLs
export const IconsImageUrls: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'User 1', icon: 'https://i.pravatar.cc/64?img=1' },
      { id: '2', name: 'User 2', icon: 'https://i.pravatar.cc/64?img=2' },
      { id: '3', name: 'User 3', icon: 'https://i.pravatar.cc/64?img=3' },
    ]));
    return wrap;
  },
};

// h2: Icons: Material Symbols ligatures
export const IconsMaterialSymbols: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Home',     icon: 'home' },
      { id: '2', name: 'Settings', icon: 'settings' },
      { id: '3', name: 'Search',   icon: 'search' },
      { id: '4', name: 'Favorite', icon: 'favorite' },
    ]));
    return wrap;
  },
};

// h2: No icon (letter fallback)
export const NoIconLetterFallback: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
      { id: '3', name: 'Gamma' },
      { id: '4', name: 'Delta' },
    ]));
    return wrap;
  },
};

// h2: With badges
export const WithBadges: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Inbox',  icon: '✉️', badge: '12' },
      { id: '2', name: 'Tasks',  icon: '✅', badge: '3' },
      { id: '3', name: 'Alerts', icon: '🔔', badge: '99+' },
      { id: '4', name: 'Clean',  icon: '⭐' },
    ]));
    return wrap;
  },
};

// h2: With custom colors
export const WithCustomColors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Red',    icon: '❤️', color: '#dc2626' },
      { id: '2', name: 'Blue',   icon: '💙', color: '#2563eb' },
      { id: '3', name: 'Green',  icon: '💚', color: '#16a34a' },
      { id: '4', name: 'Purple', icon: '💜', color: '#7c3aed' },
    ]));
    return wrap;
  },
};

// h2: With href (navigation)
export const WithHrefNavigation: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({}, [
      { id: '1', name: 'Link 1', icon: '🔗', href: '#link1' },
      { id: '2', name: 'Link 2', icon: '🔗', href: '#link2' },
    ]));
    return wrap;
  },
};

// h2: Declarative API (child elements)
export const DeclarativeApi: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-app-tiles');
    el.setAttribute('columns', '4');

    for (const [name, icon, badge] of [['Mail', '✉️', ''], ['Calendar', '📅', ''], ['Drive', '📁', '3'], ['Photos', '🖼️', '']] as [string, string, string][]) {
      const tile = document.createElement('snice-app-tile');
      tile.setAttribute('name', name);
      tile.setAttribute('icon', icon);
      if (badge) tile.setAttribute('badge', badge);
      el.appendChild(tile);
    }

    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Single tile
export const SingleTile: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({ columns: '4' }, [{ id: '1', name: 'Sole Tile', icon: '💠' }]));
    return wrap;
  },
};

// h2: Edge case: very long name
export const EdgeCaseVeryLongName: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeAT({ columns: '3' }, [
      { id: '1', name: 'Very Long Application Name That Should Truncate', icon: '💻' },
      { id: '2', name: 'Short', icon: '⭐' },
      { id: '3', name: 'A',     icon: '🚀' },
    ]));
    return wrap;
  },
};

// h2: CSS Parts Styling
// Parts: icon (on ligature/text icons only)
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo--at-styled snice-app-tiles::part(icon) {
        font-size: 1.75rem;
        text-shadow: 0 0 12px currentColor, 0 2px 8px rgba(0,0,0,0.5);
        filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
        transform: scale(1.15);
        display: inline-block;
        transition: transform 0.15s ease;
      }
    `;
    wrap.appendChild(style);

    const tiles = [
      { id: '1', name: 'Mail',     icon: '✉️' },
      { id: '2', name: 'Calendar', icon: '📅' },
      { id: '3', name: 'Drive',    icon: '📁' },
      { id: '4', name: 'Photos',   icon: '🖼️' },
    ];

    const defaultBox = document.createElement('div');
    defaultBox.className = 'parts-demo';
    const defaultLabel = document.createElement('p');
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.05em;';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    const dWrap = document.createElement('div');
    dWrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    dWrap.appendChild(makeAT({ columns: '4' }, tiles));
    defaultBox.appendChild(defaultLabel);
    defaultBox.appendChild(dWrap);

    const styledBox = document.createElement('div');
    styledBox.className = 'parts-demo parts-demo--at-styled';
    const styledLabel = document.createElement('p');
    styledLabel.style.cssText = defaultLabel.style.cssText;
    styledLabel.textContent = 'Styled via ::part(icon) — glow + scale effect on ligature icons';
    const sWrap = document.createElement('div');
    sWrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    sWrap.appendChild(makeAT({ columns: '4' }, tiles));
    styledBox.appendChild(styledLabel);
    styledBox.appendChild(sWrap);

    wrap.appendChild(defaultBox);
    wrap.appendChild(styledBox);
    return wrap;
  },
};
