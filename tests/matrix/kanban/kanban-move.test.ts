/**
 * MATRIX slice — snice-kanban card movement.
 *
 * Dimensions:
 *   cross-column: id spelling (2) x target position (3)          = 6
 *   same-column:  id spelling (2) x target position (2)          = 4
 *   unknown card: id spelling (2)                                = 2
 *
 * `moveCard(cardId, targetColumnId, targetIndex?)` is the documented
 * programmatic move ("Move card to different column and optional position",
 * with the docs' own "Move to top" example for `0`), and
 * `kanban-card-move -> { card, fromColumn, toColumn, kanban }` is documented
 * as "Fired when card is moved between columns" — so the EVENT assertion runs
 * on cross-column moves only; a same-column reorder asserts its data result,
 * which is all the docs commit to there.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, captureEvents, removeComponent, settle } from '../matrix-utils';
import {
  mountKanban, setBoard, boardMap, type KanbanCombo,
} from './kanban-support';
import type { KanbanColumn } from '../../../packages/components/src/kanban/snice-kanban.types';
import '../../../packages/components/src/kanban/snice-kanban';

const plain = (over: Partial<KanbanCombo> = {}): KanbanCombo => ({
  family: 'titled-cards', showCardCount: true, allowDragDrop: true,
  channel: 'attr', ...over,
});

/** A two-column board with a distinctive card order, in either id spelling. */
function movableBoard(ids: 'string' | 'number'): KanbanColumn[] {
  const id = (n: number) => (ids === 'string' ? `c${n}` : n);
  return [
    { id: ids === 'string' ? 'src' : 10, title: 'Source', cards: [
      { id: id(1), title: 'First' },
      { id: id(2), title: 'Second' },
      { id: id(3), title: 'Third' },
    ] },
    { id: ids === 'string' ? 'dst' : 20, title: 'Target', cards: [
      { id: id(4), title: 'Anchor' },
    ] },
  ];
}

/** The id spelling helper, shared by the board and the expectations. */
const idOf = (ids: 'string' | 'number', n: number) => (ids === 'string' ? `c${n}` : String(n));

describe('kanban matrix: moveCard across columns', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    ids: ['string', 'number'] as const,
    // `targetIndex` omitted (the documented default is the end), `0` (the
    // docs' "Move to top" example), and a middle index.
    position: ['end', 'top', 'middle'] as const,
  });

  for (const { ids, position } of COMBOS) {
    const id = `${ids}/move-${position}`;

    it(`${id}: the card lands at the requested position and one kanban-card-move fires`, async () => {
      el = await mountKanban(plain());
      await setBoard(el, movableBoard(ids));
      const k = el as any;
      const srcId = ids === 'string' ? 'src' : 10;
      const dstId = ids === 'string' ? 'dst' : 20;

      const seen = captureEvents(el, ['kanban-card-move']);
      k.moveCard(ids === 'string' ? 'c2' : 2, dstId, position === 'end' ? undefined : position === 'top' ? 0 : 1);
      await settle(el, 20);

      // Data: card 2 left Source (1,3 remain) and entered Target at the index.
      const srcKey = String(ids === 'string' ? 'src' : 10);
      const dstKey = String(ids === 'string' ? 'dst' : 20);
      expect(boardMap(k.columns)).toEqual(position === 'end'
        ? [[srcKey, [idOf(ids, 1), idOf(ids, 3)]], [dstKey, [idOf(ids, 4), idOf(ids, 2)]]]
        : position === 'top'
          ? [[srcKey, [idOf(ids, 1), idOf(ids, 3)]], [dstKey, [idOf(ids, 2), idOf(ids, 4)]]]
          : [[srcKey, [idOf(ids, 1), idOf(ids, 3)]], [dstKey, [idOf(ids, 4), idOf(ids, 2)]]]);

      // Event: exactly one, carrying the documented payload — the moved card,
      // both column ids, and the board itself.
      expect(seen.types()).toEqual(['kanban-card-move']);
      const detail = seen.events[0].detail;
      expect(String(detail.card.id)).toBe(idOf(ids, 2));
      expect(String(detail.fromColumn)).toBe(String(srcId));
      expect(String(detail.toColumn)).toBe(String(dstId));
      expect(detail.kanban).toBe(el);
      seen.stop();

      // The rendered board follows the data.
      const dstCards = [...(el.shadowRoot!.querySelectorAll('.column') as NodeListOf<HTMLElement>)]
        .map(column => [...column.querySelectorAll('.card')].map(c => c.getAttribute('data-card-id')));
      expect(dstCards).toEqual([
        [idOf(ids, 1), idOf(ids, 3)],
        position === 'top' ? [idOf(ids, 2), idOf(ids, 4)] : [idOf(ids, 4), idOf(ids, 2)],
      ]);
    });
  }
});

describe('kanban matrix: moveCard within a column', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    ids: ['string', 'number'] as const,
    position: ['top', 'middle'] as const,
  });

  for (const { ids, position } of COMBOS) {
    it(`${ids}/reorder-${position}: the card lands at the requested index`, async () => {
      el = await mountKanban(plain());
      await setBoard(el, movableBoard(ids));
      const k = el as any;

      k.moveCard(ids === 'string' ? 'c3' : 3, ids === 'string' ? 'src' : 10, position === 'top' ? 0 : 1);
      await settle(el, 20);

      // The documented contract here is the data move itself; "between
      // columns" event wording does not cover a same-column reorder.
      const srcKey = String(ids === 'string' ? 'src' : 10);
      const dstKey = String(ids === 'string' ? 'dst' : 20);
      expect(boardMap(k.columns)).toEqual(position === 'top'
        ? [[srcKey, [idOf(ids, 3), idOf(ids, 1), idOf(ids, 2)]], [dstKey, [idOf(ids, 4)]]]
        : [[srcKey, [idOf(ids, 1), idOf(ids, 3), idOf(ids, 2)]], [dstKey, [idOf(ids, 4)]]]);
    });
  }
});

describe('kanban matrix: moving an unknown card changes nothing', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const ids of ['string', 'number'] as const) {
    it(`${ids}: an unknown card id is a no-op and emits nothing`, async () => {
      el = await mountKanban(plain());
      await setBoard(el, movableBoard(ids));
      const k = el as any;
      const before = boardMap(k.columns);
      const seen = captureEvents(el, ['kanban-card-move']);

      k.moveCard(ids === 'string' ? 'nope' : 999, ids === 'string' ? 'dst' : 20);
      await settle(el, 20);

      expect(boardMap(k.columns)).toEqual(before);
      expect(seen.types()).toEqual([]);
      seen.stop();
    });
  }
});
