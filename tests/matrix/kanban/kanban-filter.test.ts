/**
 * MATRIX slice — snice-kanban filtering and search.
 *
 * Dimensions:
 *   filterByLabels: label kind (2) x filter set (3)   = 6
 *   search:         field (2) x query (2)             = 4
 *   clearFilters:   after each dimension              = 2
 *
 * docs/components/kanban.md is the oracle's wording: `filterByLabels()`
 * "Filter cards by labels (shows cards with ANY match)" — matched against the
 * label's TEXT, because the parameter is `labels: string[]` while a card's
 * labels are `string | KanbanLabel` and `KanbanLabel.text` is the only string
 * a filter could match. `search()` "Search cards by title or description".
 * `clearFilters()` "Clear all active filters".
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, captureEvents, settle, unmountAll } from '../matrix-utils';
import { mountKanban, setBoard, cardEls, type KanbanCombo } from './kanban-support';
import type { KanbanColumn } from '../../../packages/components/src/kanban/snice-kanban.types';
import '../../../packages/components/src/kanban/snice-kanban';

const plain = (over: Partial<KanbanCombo> = {}): KanbanCombo => ({
  family: 'titled-cards', showCardCount: true, allowDragDrop: true,
  channel: 'attr', ...over,
});

const visibleIds = (el: HTMLElement): string[] =>
  cardEls(el).map(card => card.getAttribute('data-card-id') as string);

/** Cards carrying both spellings of the same label text plus an unmatched one. */
function filterBoard(): KanbanColumn[] {
  return [
    { id: 'todo', title: 'To Do', cards: [
      { id: 's1', title: 'String labelled', labels: ['bug'] },
      { id: 'o1', title: 'Object labelled', labels: [{ text: 'bug', color: '#fff', background: '#000' }] },
      { id: 'x1', title: 'Unlabelled' },
    ] },
    { id: 'done', title: 'Done', cards: [
      { id: 's2', title: 'Other label', labels: ['feature'] },
    ] },
  ];
}

/** Cards matched by title, by description, and by neither. */
function searchBoard(): KanbanColumn[] {
  return [
    { id: 'todo', title: 'To Do', cards: [
      { id: 't1', title: 'Landing page', description: 'Redesign' },
      { id: 'd1', title: 'Auth', description: 'Landing page copy' },
      { id: 'n1', title: 'Repo setup' },
    ] },
  ];
}

describe('kanban matrix: filterByLabels shows cards with ANY match', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  const COMBOS = product({
    labelKind: ['string', 'object'] as const,
    // The filter set either matches the shared text, matches the other text,
    // or matches nothing at all.
    filter: ['bug-set', 'feature-set', 'no-match'] as const,
  });

  for (const { labelKind, filter } of COMBOS) {
    const expected = filter === 'bug-set'
      // Both spellings of "bug" match an ANY-match filter; the kind changes
      // which card carries the text, not which cards survive.
      ? ['s1', 'o1']
      : filter === 'feature-set' ? ['s2'] : [];

    it(`${labelKind}/${filter}: visible cards are exactly the ANY-match set`, async () => {
      el = await mountKanban(plain());
      const board = filterBoard();
      // Keep only the requested spelling of the "bug" label on o1.
      if (labelKind === 'string') {
        board[0].cards[1] = { id: 'o1', title: 'Object labelled', labels: ['bug'] };
      } else {
        board[0].cards[0] = { id: 's1', title: 'String labelled', labels: [{ text: 'bug' }] };
      }
      await setBoard(el, board);

      const filters = filter === 'bug-set' ? ['bug']
        : filter === 'feature-set' ? ['feature'] : ['nope'];
      (el as any).filterByLabels(filters);
      await settle(el, 20);

      expect(visibleIds(el)).toEqual(expected);
    });
  }
});

describe('kanban matrix: search matches title or description', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  const COMBOS = product({
    field: ['title', 'description'] as const,
    hit: [true, false] as const,
  });

  for (const { field, hit } of COMBOS) {
    it(`search ${field} ${hit ? 'hit' : 'miss'}: visible cards are exactly the matches`, async () => {
      el = await mountKanban(plain());
      await setBoard(el, searchBoard());

      const query = field === 'title'
        ? (hit ? 'Landing' : 'Nowhere')
        : (hit ? 'Redesign' : 'Nowhere');
      (el as any).search(query);
      await settle(el, 20);

      // 'Landing page' the title and 'Landing page copy' the description share
      // their text, so a 'Landing' query hits both spellings; a description
      // query hits only the one card whose description matches.
      const expected = field === 'title'
        ? (hit ? ['t1', 'd1'] : [])
        : (hit ? ['t1'] : []);
      expect(visibleIds(el)).toEqual(expected);
    });
  }
});

describe('kanban matrix: clearFilters restores the full board', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('after a label filter: every card is visible again', async () => {
    el = await mountKanban(plain());
    await setBoard(el, filterBoard());
    const k = el as any;
    k.filterByLabels(['bug']);
    await settle(el, 20);
    expect(visibleIds(el)).toEqual(['s1', 'o1']);

    k.clearFilters();
    await settle(el, 20);
    expect(visibleIds(el)).toEqual(['s1', 'o1', 'x1', 's2']);
  });

  it('after a search: every card is visible again', async () => {
    el = await mountKanban(plain());
    await setBoard(el, searchBoard());
    const k = el as any;
    k.search('Redesign');
    await settle(el, 20);
    expect(visibleIds(el)).toEqual(['t1']);

    k.clearFilters();
    await settle(el, 20);
    expect(visibleIds(el)).toEqual(['t1', 'd1', 'n1']);
  });

  it('filtering emits no kanban events of any documented kind', async () => {
    el = await mountKanban(plain());
    await setBoard(el, filterBoard());
    const seen = captureEvents(el, ['kanban-card-move', 'kanban-card-click']);
    (el as any).filterByLabels(['bug']);
    await settle(el, 20);
    (el as any).search('Landing');
    await settle(el, 20);
    (el as any).clearFilters();
    await settle(el, 20);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });
});
