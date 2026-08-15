/**
 * Matrix slice LEADERBOARD / INTERACTION — `entry-click` and the documented
 * precedence rule of the dual API.
 *
 * Dimensions: variant (3) x source (2) x board size (2: 3 and 5 entries), each
 * clicking EVERY rendered entry = 6 combos x 8 clicks, plus the precedence rule
 * (3) and the pinned rank-offset case (3). 12 cases.
 *
 * Contract asserted (docs/ai/components/leaderboard.md):
 *   · `entry-click` → `{ entry: LeaderboardEntry, index: number }` — the entry
 *     that was clicked, and its index in the board.
 *   · Clicking through the declarative channel reports the same entry the
 *     attributes declared (`score` is an attribute, hence a string).
 *   · "setEntries(entries) — Set entries imperatively (slot children take
 *     precedence)".
 *
 * FINDINGS
 *   MATRIX-leaderboard-1  A podium tile reports `index: entry.rank - 1` instead
 *                         of the entry's index in the board, so any board whose
 *                         ranks do not start at 1 (a second page, a filtered
 *                         league) reports an index that addresses nothing.
 *                         The list rows in the SAME component report the array
 *                         index, so the two halves disagree. Pinned below with
 *                         `it.fails`; the assertion is the documented one and is
 *                         NOT weakened.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, all, click, record, Problems, expectClean } from './matrix-utils';
import {
  VARIANTS, SOURCES, board, boardOf, mountBoard, asDelivered,
} from './leaderboard-support';

/** Every clickable entry node, in board order: podium tiles first, then rows. */
function clickable(el: HTMLElement): Element[] {
  return [...all(el, '.leaderboard__podium-entry'), ...all(el, '.leaderboard__entry')];
}

describe('leaderboard matrix: interaction', () => {
  afterEach(() => cleanup());

  for (const combo of cross({ variant: VARIANTS, source: SOURCES, count: [3, 5] as const })) {
    it(`${combo.id}: entry-click reports the clicked entry and its index`, async () => {
      const entries = boardOf(combo.count);
      const el = await mountBoard({
        variant: combo.variant, entries, source: combo.source,
      });
      const p = new Problems();
      const expected = asDelivered(entries, combo.source);

      const nodes = clickable(el);
      p.eq('clickable entries', nodes.length, entries.length);

      for (const [index, node] of nodes.entries()) {
        const seen = record(el, ['entry-click']);
        click(node);
        seen.stop();

        if (seen.events.length !== 1) {
          p.say(`entry ${index}: ${seen.events.length} entry-click events, expected 1`);
          continue;
        }
        const detail = seen.events[0].detail;
        p.eq(`entry ${index} index`, detail.index, index);
        p.eq(`entry ${index} entry`, detail.entry, expected[index]);
      }

      expectClean(p, combo.id);
    });
  }

  // ── Slot children take precedence over setEntries ─────────────────────────

  for (const variant of VARIANTS) {
    it(`variant=${variant}: setEntries cannot override declarative children`, async () => {
      const declared = boardOf(3);
      const el = await mountBoard({ variant, entries: declared, source: 'slot' });
      const p = new Problems();

      el.setEntries([{ rank: 9, name: 'Imperative', score: 1 }]);
      await new Promise(resolve => setTimeout(resolve, 30));

      const nodes = clickable(el);
      p.eq('entry count after setEntries', nodes.length, declared.length);
      p.eq('names after setEntries',
        nodes.map(node => node.textContent?.includes('Imperative') ?? false),
        declared.map(() => false));

      // …and the click contract still reports the DECLARED entries.
      const seen = record(el, ['entry-click']);
      click(nodes[0]);
      seen.stop();
      p.eq('first entry after setEntries', seen.events[0]?.detail?.entry,
        asDelivered(declared, 'slot')[0]);

      expectClean(p, `variant=${variant}`);
    });
  }

  // ── MATRIX-leaderboard-1: a board whose ranks do not start at 1 ───────────
  //
  // `rank` is a declared field, not a position: page two of a league starts at
  // rank 4. `index` is the entry's index in the board either way.

  for (const variant of VARIANTS) {
    const pinned = variant === 'podium';
    const runner = pinned ? it.fails : it;
    const name = pinned
      ? `variant=${variant}: entry-click indexes the board, not the rank [MATRIX-leaderboard-1]`
      : `variant=${variant}: entry-click indexes the board, not the rank`;

    runner(name, async () => {
      // Page two: the same entries, ranks 4..8.
      const entries = board().map((entry, i) => ({ ...entry, rank: i + 4 }));
      const el = await mountBoard({ variant, entries });
      const p = new Problems();

      for (const [index, node] of clickable(el).entries()) {
        const seen = record(el, ['entry-click']);
        click(node);
        seen.stop();
        p.eq(`entry ${index} (rank ${entries[index].rank}) index`,
          seen.events[0]?.detail?.index, index);
      }

      expectClean(p, `variant=${variant}`);
    });
  }
});
