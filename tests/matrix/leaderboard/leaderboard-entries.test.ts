/**
 * Matrix slice LEADERBOARD / ENTRY RENDERING — one entry's documented fields
 * crossed with every variant and both API halves.
 *
 * Dimensions: variant (3) x change (4: absent / up / down / no-movement)
 * x avatar (2) = 24 combos, plus variant x highlighted (6) and
 * variant x source (6) for the field round-trip. 36 cases.
 *
 * Contract asserted (docs/ai/components/leaderboard.md):
 *   · An entry renders its `rank`, `name` and `score` (`number | string`).
 *   · `avatar?` — "avatars": a declared avatar renders an image OF THAT URL;
 *     an entry without one renders no image at all.
 *   · `change?` — "change indicators": a declared change renders an indicator
 *     carrying its MAGNITUDE, up and down are distinguishable, and an entry
 *     with no `change` renders no indicator.
 *   · `highlighted?` — a highlighted entry is marked as such.
 *   · Both halves of the dual API deliver the same fields.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, all, one, text, Problems, expectClean } from './matrix-utils';
import {
  VARIANTS, SOURCES, CHANGES, AVATAR, entryWith, board, mountBoard, digits, scoreText,
} from './leaderboard-support';

/**
 * The node that renders one entry, whichever region it landed in. A `podium`
 * variant with a single entry paints it on the podium; every other case paints
 * a list row — and the documented fields are the same either way.
 */
function soleEntryNode(el: HTMLElement): { node: Element | null; podium: boolean } {
  const podium = all(el, '.leaderboard__podium-entry');
  if (podium.length) return { node: podium[0], podium: true };
  const list = all(el, '.leaderboard__entry');
  return { node: list[0] ?? null, podium: false };
}

describe('leaderboard matrix: entry rendering', () => {
  afterEach(() => cleanup());

  // ── change + avatar, across the variants ──────────────────────────────────

  for (const combo of cross({ variant: VARIANTS, change: CHANGES, avatar: [false, true] })) {
    it(`${combo.id}: the entry renders its documented fields`, async () => {
      const entry = entryWith({
        change: combo.change,
        ...(combo.avatar ? { avatar: AVATAR } : {}),
      });
      const el = await mountBoard({ variant: combo.variant, entries: [entry] });
      const p = new Problems();

      const { node, podium } = soleEntryNode(el);
      if (node === null) {
        p.say('the entry rendered nowhere');
        expectClean(p, combo.id);
        return;
      }

      const line = text(node);
      p.ok(line.includes(entry.name), `entry text "${line}" omits the name`);
      p.ok(line.includes(scoreText(entry)), `entry text "${line}" omits the score`);
      p.ok(line.includes(String(entry.rank)), `entry text "${line}" omits the rank`);

      // avatar: an image of the declared URL, or no image at all.
      const img = node!.querySelector('img');
      if (combo.avatar) {
        p.ok(img !== null, 'declared avatar rendered no image');
        p.eq('avatar src', img?.getAttribute('src'), AVATAR);
      } else {
        p.ok(img === null, `entry without an avatar rendered <img src="${img?.getAttribute('src')}">`);
      }

      // change: the podium layout documents no change indicator; the list rows
      // are where "change indicators" live.
      if (!podium) {
        const indicator = node!.querySelector('[class*="change"]');
        if (combo.change === undefined) {
          p.ok(indicator === null,
            `entry with no change rendered an indicator reading "${text(indicator)}"`);
        } else if (indicator === null) {
          p.say(`change=${combo.change} rendered no indicator`);
        } else {
          p.eq('indicator magnitude', digits(text(indicator)),
            combo.change === 0 ? '' : String(Math.abs(combo.change!)));
        }
      }

      expectClean(p, combo.id);
    });
  }

  // ── up and down must be TELLABLE APART ────────────────────────────────────
  //
  // "change indicators" is only a feature if +3 and -3 do not render the same
  // thing. One case per variant, because the list rows exist in all three.

  for (const variant of VARIANTS) {
    it(`variant=${variant}: a rise and a fall of the same size render differently`, async () => {
      const p = new Problems();
      const readings: Record<string, string> = {};

      for (const change of [3, -3]) {
        // Four entries, the moving one last, so it is a LIST row in every
        // variant — the podium takes the first three and has its own layout.
        const entries = board().slice(0, 4).map((entry, i) =>
          i === 3 ? { ...entry, change } : { ...entry, change: undefined });
        const el = await mountBoard({ variant, entries });
        const rows = all(el, '.leaderboard__entry');
        const node = rows[rows.length - 1];
        const indicator = node?.querySelector('[class*="change"]');
        readings[change] = `${text(indicator)}|${indicator?.className ?? ''}`;
        cleanup();
      }

      p.ok(readings['3'] !== readings['-3'],
        `change=3 and change=-3 both render "${readings['3']}"`);
      p.eq('rise magnitude', digits(readings['3'].split('|')[0]), '3');
      p.eq('fall magnitude', digits(readings['-3'].split('|')[0]), '3');

      expectClean(p, `variant=${variant}`);
    });
  }

  // ── highlighted ───────────────────────────────────────────────────────────

  for (const combo of cross({ variant: VARIANTS, highlighted: [false, true] })) {
    it(`${combo.id}: a highlighted entry is marked as highlighted`, async () => {
      // Four entries so the marked one is a LIST row in every variant, podium
      // included — the podium has its own layout and no highlight contract.
      const entries = board().slice(0, 4).map((entry, i) => ({
        ...entry, highlighted: i === 3 ? combo.highlighted : false,
      }));
      const el = await mountBoard({ variant: combo.variant, entries });
      const p = new Problems();

      const rows = all(el, '.leaderboard__entry');
      const target = rows[rows.length - 1];
      if (target === undefined) {
        p.say('no list row to carry the highlight');
      } else {
        p.eq('highlighted marking', /highlight/.test(target.className), combo.highlighted);
        // …and no other row picked it up.
        const others = rows.slice(0, -1).filter(row => /highlight/.test(row.className));
        p.eq('rows wrongly highlighted', others.length, 0);
      }

      expectClean(p, combo.id);
    });
  }

  // ── The dual API delivers the same fields ─────────────────────────────────

  for (const combo of cross({ variant: VARIANTS, source: SOURCES })) {
    it(`${combo.id}: both API halves render the same board`, async () => {
      const entries = board();
      const el = await mountBoard({
        variant: combo.variant, entries, source: combo.source,
      });
      const p = new Problems();

      const names = [
        ...all(el, '.leaderboard__podium-entry').map(n =>
          text(n.querySelector('.leaderboard__podium-name'))),
        ...all(el, '.leaderboard__entry').map(n =>
          text(n.querySelector('.leaderboard__name'))),
      ];
      p.eq('names', names, entries.map(e => e.name));

      const scores = [
        ...all(el, '.leaderboard__podium-entry').map(n =>
          text(n.querySelector('.leaderboard__podium-score'))),
        ...all(el, '.leaderboard__entry').map(n =>
          text(n.querySelector('.leaderboard__score'))),
      ];
      p.eq('scores', scores, entries.map(scoreText));

      // Avatars survive the declarative channel too.
      p.eq('avatar images', all(el, 'img').map(img => img.getAttribute('src')),
        entries.filter(e => e.avatar).map(e => e.avatar));

      // And a shadow-rendered board never leaves the slotted data elements
      // visible as content: the light-DOM children are DATA, not display.
      p.ok(one(el, 'slot') !== null, 'no slot for the declarative children');

      expectClean(p, combo.id);
    });
  }
});
