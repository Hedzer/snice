import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-leaderboard';
import type { LeaderboardVariant, LeaderboardSize, LeaderboardEntry } from './snice-leaderboard.types';

type Args = {
  variant?: LeaderboardVariant;
  size?: LeaderboardSize;
  title?: string;
};

const VARIANTS: LeaderboardVariant[] = ['default', 'podium', 'compact'];
const SIZES: LeaderboardSize[] = ['small', 'medium', 'large'];

const SAMPLE_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, name: 'Alice', score: 2500, change: 3 },
  { rank: 2, name: 'Bob',   score: 2100, change: -1 },
  { rank: 3, name: 'Charlie', score: 1800, change: 0 },
  { rank: 4, name: 'Diana', score: 1500, change: 2 },
  { rank: 5, name: 'Eve',   score: 1200, change: -2 },
];

function makeLeaderboard(entries: LeaderboardEntry[], attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('snice-leaderboard');
  el.style.cssText = 'max-width:400px;display:block;';
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  (el as any).setEntries(entries);
  return el;
}

const meta: Meta<Args> = {
  title: 'Data/Leaderboard',
  component: 'snice-leaderboard',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size:    { control: 'select', options: SIZES },
    title:   { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-leaderboard');
    el.style.cssText = 'max-width:400px;display:block;';
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.size    !== undefined) el.setAttribute('size',    args.size);
    if (args.title   !== undefined) el.setAttribute('title',   args.title);
    (el as any).setEntries(SAMPLE_ENTRIES);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'default', size: 'medium', title: 'Leaderboard' } };

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { title: 'Default Variant' }),
};

// h2: Variant: podium
export const VariantPodium: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'podium', title: 'Podium Variant' }),
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'compact', title: 'Compact Variant' }),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { size: 'small', title: 'Small' }),
};

// h2: Size: medium (default)
export const SizeMediumDefault: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { size: 'medium', title: 'Medium' }),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { size: 'large', title: 'Large' }),
};

// h2: Variant x Size: podium + small
export const VariantXSizePodiumSmall: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'podium', size: 'small', title: 'Podium Small' }),
};

// h2: Variant x Size: podium + large
export const VariantXSizePodiumLarge: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'podium', size: 'large', title: 'Podium Large' }),
};

// h2: Variant x Size: compact + small
export const VariantXSizeCompactSmall: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'compact', size: 'small', title: 'Compact Small' }),
};

// h2: Variant x Size: compact + large
export const VariantXSizeCompactLarge: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES, { variant: 'compact', size: 'large', title: 'Compact Large' }),
};

// h2: No title
export const NoTitle: Story = {
  render: () => makeLeaderboard(SAMPLE_ENTRIES),
};

// h2: With change indicators (positive, negative, zero)
export const WithChangeIndicatorsPositiveNegativeZero: Story = {
  render: () => makeLeaderboard([
    { rank: 1, name: 'Positive',    score: 3000, change: 5 },
    { rank: 2, name: 'Negative',    score: 2000, change: -3 },
    { rank: 3, name: 'No change',   score: 1000, change: 0 },
    { rank: 4, name: 'No indicator', score: 500 },
  ], { title: 'Change Indicators' }),
};

// h2: With highlighted entry
export const WithHighlightedEntry: Story = {
  render: () => makeLeaderboard([
    { rank: 1, name: 'Normal',      score: 3000 },
    { rank: 2, name: 'Highlighted', score: 2500, highlighted: true },
    { rank: 3, name: 'Normal',      score: 2000 },
  ], { title: 'Highlighted Entry' }),
};

// h2: With avatars
export const WithAvatars: Story = {
  render: () => makeLeaderboard([
    { rank: 1, name: 'Alice',   score: 2500, avatar: 'https://i.pravatar.cc/48?u=alice' },
    { rank: 2, name: 'Bob',     score: 2100, avatar: 'https://i.pravatar.cc/48?u=bob' },
    { rank: 3, name: 'Charlie', score: 1800 },
  ], { title: 'With Avatars' }),
};

// h2: Empty state (no entries)
export const EmptyStateNoEntries: Story = {
  render: () => {
    const el = document.createElement('snice-leaderboard');
    el.style.cssText = 'max-width:400px;display:block;';
    el.setAttribute('title', 'No Data');
    return el;
  },
};

// h2: Single entry
export const SingleEntry: Story = {
  render: () => makeLeaderboard([{ rank: 1, name: 'Solo Player', score: 9999 }], { title: 'Single Entry' }),
};

// h2: Declarative API (child elements)
export const DeclarativeApiChildElements: Story = {
  render: () => {
    const el = document.createElement('snice-leaderboard');
    el.style.cssText = 'max-width:400px;display:block;';
    el.setAttribute('variant', 'default');
    el.setAttribute('title', 'Declarative Children');
    const entries: Array<[string, string, string, string?, boolean?]> = [
      ['1', 'Alice',   '2500', '3',  true],
      ['2', 'Bob',     '2100', '-1', false],
      ['3', 'Charlie', '1800', '0',  false],
      ['4', 'Diana',   '1500', undefined, false],
    ];
    for (const [rank, name, score, change, highlighted] of entries) {
      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank',  rank);
      entry.setAttribute('name',  name);
      entry.setAttribute('score', score);
      if (change !== undefined) entry.setAttribute('change', change);
      if (highlighted) entry.toggleAttribute('highlighted', true);
      el.appendChild(entry);
    }
    return el;
  },
};

// h2: Declarative: podium variant
export const DeclarativePodiumVariant: Story = {
  render: () => {
    const el = document.createElement('snice-leaderboard');
    el.style.cssText = 'max-width:400px;display:block;';
    el.setAttribute('variant', 'podium');
    el.setAttribute('title', 'Declarative Podium');
    const entries: Array<[string, string, string, string]> = [
      ['1', 'Gold',   '3000', '5'],
      ['2', 'Silver', '2500', '2'],
      ['3', 'Bronze', '2000', '-3'],
      ['4', 'Fourth', '1800', ''],
      ['5', 'Fifth',  '1600', ''],
    ];
    for (const [rank, name, score, change] of entries) {
      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank',  rank);
      entry.setAttribute('name',  name);
      entry.setAttribute('score', score);
      if (change) entry.setAttribute('change', change);
      el.appendChild(entry);
    }
    return el;
  },
};

// h2: Many entries (10+)
export const ManyEntries10Plus: Story = {
  render: () => {
    const manyEntries = Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1,
      name: `Player ${i + 1}`,
      score: 5000 - i * 300,
      change: i % 3 === 0 ? 2 : i % 3 === 1 ? -1 : 0,
      highlighted: i === 4,
    }));
    return makeLeaderboard(manyEntries, { title: 'Large List' });
  },
};

// h2: CSS Parts Styling
// Parts: base, title, list, empty
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; padding: 1rem; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; }

      /* ::part(base) — outer container */
      .parts-demo snice-leaderboard.styled::part(base) {
        background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
        border: 1px solid #4c1d95;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(79,70,229,.25);
        overflow: hidden;
      }

      /* ::part(title) — the board title heading */
      .parts-demo snice-leaderboard.styled::part(title) {
        color: #c4b5fd;
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: .05em;
        text-transform: uppercase;
        padding: 1rem 1rem .5rem;
        border-bottom: 1px solid #4c1d95;
        margin: 0;
      }

      /* ::part(list) — the <ol> entries list */
      .parts-demo snice-leaderboard.styled::part(list) {
        padding: .5rem 0;
        margin: 0;
        list-style: none;
      }

      /* ::part(empty) — shown when no entries */
      .parts-demo snice-leaderboard.empty-styled::part(base) {
        background: #fef2f2;
        border: 2px dashed #fca5a5;
        border-radius: 12px;
      }
      .parts-demo snice-leaderboard.empty-styled::part(empty) {
        color: #ef4444;
        font-weight: 700;
        font-size: .9rem;
        padding: 1.5rem;
        text-align: center;
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

    const def = makeLeaderboard(SAMPLE_ENTRIES, { title: 'Top Players' });
    demo.appendChild(makeItem('default', def));

    const styled = makeLeaderboard(SAMPLE_ENTRIES, { title: 'Top Players' });
    styled.className = 'styled';
    demo.appendChild(makeItem('::part(base) + ::part(title) + ::part(list) dark purple', styled));

    const empty = makeLeaderboard([], { title: 'No Data' });
    empty.className = 'empty-styled';
    demo.appendChild(makeItem('::part(empty) — styled empty state', empty));

    wrap.appendChild(demo);
    return wrap;
  },
};
