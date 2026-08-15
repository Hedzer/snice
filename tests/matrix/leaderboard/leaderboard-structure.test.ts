/**
 * Matrix slice LEADERBOARD / STRUCTURE — the documented parts and the podium
 * split, crossed with both halves of the dual API.
 *
 * Dimensions: variant (3) x entry count (4: 0/1/3/5) x source (2) = 24 combos,
 * plus variant x size (9) for the appearance attributes and variant x title
 * channel (6) for the "title is JS-only" rule. 39 cases.
 *
 * Contract asserted (docs/ai/components/leaderboard.md, docs/components/leaderboard.md):
 *   · Parts `base`, `title`, `list`, `empty`.
 *   · "The top 3 entries are displayed in a podium layout (2nd, 1st, 3rd).
 *     Remaining entries appear as a regular list below." — podium only.
 *   · `default` and `compact` render every entry as a regular list.
 *   · An empty board renders the `empty` part and no entries.
 *   · `title` is JS-only: the property renders the `title` part, and a `title`
 *     ATTRIBUTE is the native tooltip and must render nothing.
 *   · `variant` and `size` are attributes and reflect.
 *   · Both API halves produce the SAME rendered board.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import {
  cleanup, cross, part, all, text, Problems, expectClean,
} from './matrix-utils';
import {
  VARIANTS, SIZES, SOURCES, COUNTS, boardOf, mountBoard,
  podiumEntries, listEntries, scoreText,
} from './leaderboard-support';

const ENTRY = '.leaderboard__entry';
const PODIUM_ENTRY = '.leaderboard__podium-entry';

describe('leaderboard matrix: structure', () => {
  afterEach(() => cleanup());

  // ── The podium split, both API halves, every board size ───────────────────

  for (const combo of cross({ variant: VARIANTS, count: COUNTS, source: SOURCES })) {
    it(`${combo.id}: the documented parts and the podium split`, async () => {
      const entries = boardOf(combo.count);
      const el = await mountBoard({
        variant: combo.variant,
        entries,
        source: combo.source,
      });
      const p = new Problems();

      // `base` wraps everything, always.
      p.ok(part(el, 'base') !== null, 'no part="base"');

      const wantPodium = podiumEntries(combo.variant, entries);
      const wantList = listEntries(combo.variant, entries);

      // Podium region: the top three entries, and only in the podium variant.
      const podiumNodes = all(el, PODIUM_ENTRY);
      p.eq('podium entry count', podiumNodes.length, wantPodium.length);
      p.eq('podium names', podiumNodes.map(node =>
        text(node.querySelector('.leaderboard__podium-name'))), wantPodium.map(e => e.name));
      p.eq('podium scores', podiumNodes.map(node =>
        text(node.querySelector('.leaderboard__podium-score'))), wantPodium.map(scoreText));

      // The regular list: everything the podium did not take, in order.
      const listNodes = all(el, ENTRY);
      p.eq('list entry count', listNodes.length, wantList.length);
      p.eq('list names', listNodes.map(node =>
        text(node.querySelector('.leaderboard__name'))), wantList.map(e => e.name));
      p.eq('list ranks', listNodes.map(node =>
        text(node.querySelector('.leaderboard__rank'))), wantList.map(e => String(e.rank)));

      // The `list` part exists exactly when there are list entries to hold.
      const listPart = part(el, 'list');
      p.ok(
        (listPart !== null) === (wantList.length > 0),
        `part="list" ${listPart ? 'present' : 'absent'} for ${wantList.length} list entries`,
      );

      // The `empty` part is the zero-entry state, and only that.
      const emptyPart = part(el, 'empty');
      p.ok(
        (emptyPart !== null) === (entries.length === 0),
        `part="empty" ${emptyPart ? 'present' : 'absent'} for ${entries.length} entries`,
      );

      expectClean(p, combo.id);
    });
  }

  // ── title: a JS-only property, never the attribute ────────────────────────

  for (const combo of cross({ variant: VARIANTS, channel: ['property', 'attribute'] as const })) {
    it(`${combo.id}: only the title PROPERTY renders the title part`, async () => {
      const entries = boardOf(3);
      const el = await mountBoard({
        variant: combo.variant,
        entries,
        ...(combo.channel === 'property'
          ? { title: 'Top Players' }
          : { titleAttr: 'Top Players' }),
      });
      const p = new Problems();
      const titlePart = part(el, 'title');

      if (combo.channel === 'property') {
        p.ok(titlePart !== null, 'title property rendered no part="title"');
        p.eq('title text', text(titlePart), 'Top Players');
      } else {
        // "a title attribute is the native tooltip, not this"
        p.ok(titlePart === null,
          `title attribute rendered a part="title" reading "${text(titlePart)}"`);
      }

      expectClean(p, combo.id);
    });
  }

  // ── variant / size: documented attributes, reflected for the stylesheet ───

  for (const combo of cross({ variant: VARIANTS, size: SIZES })) {
    it(`${combo.id}: the appearance attributes survive onto the host`, async () => {
      const entries = boardOf(5);
      const el = await mountBoard({ variant: combo.variant, size: combo.size, entries });
      const p = new Problems();

      p.eq('variant attribute', el.getAttribute('variant'), combo.variant);
      p.eq('size attribute', el.getAttribute('size'), combo.size);
      p.eq('variant property', (el as any).variant, combo.variant);
      p.eq('size property', (el as any).size, combo.size);

      // The board still renders in full: the appearance axes are CSS, and no
      // size may drop an entry.
      const rendered = all(el, PODIUM_ENTRY).length + all(el, ENTRY).length;
      p.eq('rendered entries', rendered, entries.length);

      expectClean(p, combo.id);
    });
  }
});
