/**
 * Smoke slice of the snice-leaderboard matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full leaderboard matrix (96 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected by the everyday loop.
 *
 * One marquee combo per feature family, chosen so a family that breaks cannot
 * hide:
 *   · podium split — top 3 on the podium, the rest as a list;
 *   · entry fields — rank, name, score, avatar, change indicator;
 *   · dual API     — slot children take precedence over `setEntries`;
 *   · interaction  — `entry-click` carries the entry and its index;
 *   · empty state  — the `empty` part, and only when there is nothing;
 *   · title        — the JS-only property, never the attribute.
 *
 * Every assertion routes through the matrix's own oracle module
 * (matrix/leaderboard/leaderboard-support.ts), so this file cannot drift into
 * asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, all, part, text, click, record } from './matrix-utils';
import {
  board, boardOf, mountBoard, asDelivered, AVATAR, digits,
} from './leaderboard-support';

const rows = (el: HTMLElement) => all(el, '.leaderboard__entry');
const tiles = (el: HTMLElement) => all(el, '.leaderboard__podium-entry');

describe('leaderboard matrix smoke', () => {
  afterEach(() => cleanup());

  it('podium: the top three go on the podium and the rest into the list', async () => {
    const entries = board();
    const el = await mountBoard({ variant: 'podium', entries });

    expect(tiles(el).map(t => text(t.querySelector('.leaderboard__podium-name'))))
      .toEqual(['Alice', 'Bob', 'Cleo']);
    expect(rows(el).map(r => text(r.querySelector('.leaderboard__name'))))
      .toEqual(['Dev', 'Eve']);
  });

  it('entry: rank, name, score, avatar and change all render', async () => {
    const el = await mountBoard({ variant: 'default', entries: board() });
    const first = rows(el)[0];

    expect(text(first.querySelector('.leaderboard__rank'))).toBe('1');
    expect(text(first.querySelector('.leaderboard__name'))).toBe('Alice');
    expect(text(first.querySelector('.leaderboard__score'))).toBe('2500');
    expect(first.querySelector('img')?.getAttribute('src')).toBe(AVATAR);
    expect(digits(text(first.querySelector('[class*="change"]')))).toBe('3');
  });

  it('dual API: declarative children take precedence over setEntries', async () => {
    const declared = boardOf(3);
    const el = await mountBoard({ variant: 'default', entries: declared, source: 'slot' });

    el.setEntries([{ rank: 9, name: 'Imperative', score: 1 }]);
    await new Promise(resolve => setTimeout(resolve, 30));

    expect(rows(el).map(r => text(r.querySelector('.leaderboard__name'))))
      .toEqual(declared.map(e => e.name));
  });

  it('interaction: entry-click reports the entry and its index', async () => {
    const entries = boardOf(3);
    const el = await mountBoard({ variant: 'default', entries });
    const seen = record(el, ['entry-click']);

    click(rows(el)[2]);

    expect(seen.events).toHaveLength(1);
    expect(seen.events[0].detail)
      .toEqual({ entry: asDelivered(entries, 'imperative')[2], index: 2 });
  });

  it('empty: a board with no entries renders the empty part and nothing else', async () => {
    const el = await mountBoard({ variant: 'default', entries: [] });
    expect(part(el, 'empty')).not.toBeNull();
    expect(rows(el)).toHaveLength(0);
    expect(part(el, 'list')).toBeNull();
  });

  it('title: the property renders the heading, the attribute does not', async () => {
    const byProperty = await mountBoard({ entries: boardOf(1), title: 'Top Players' });
    expect(text(part(byProperty, 'title'))).toBe('Top Players');
    cleanup();

    const byAttribute = await mountBoard({ entries: boardOf(1), titleAttr: 'Top Players' });
    expect(part(byAttribute, 'title'), 'the title attribute is the native tooltip').toBeNull();
  });
});
