/**
 * MATRIX slice — snice-kanban programmatic board management.
 *
 * The documented method set, each crossed with the shape it produces:
 *   addColumn (2) x removeColumn (2) x addCard (2) x removeCard (2)
 *   + getColumn/getCard lookups (4)
 *
 * "Add new column to board", "Remove column from board", "Add card to specific
 * column", "Remove card from board", "Get column by ID", "Get card by ID" —
 * docs/components/kanban.md Methods table. Every mutation is judged twice:
 * once on the `columns` data and once through the full render shape oracle,
 * because a method that updates data without re-rendering (or the reverse)
 * breaks only one of the two.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, removeComponent, settle, unmountAll } from '../matrix-utils';
import {
  mountKanban, setBoard, expectedShape, readShape, cardEls, columnEls,
  type KanbanCombo,
} from './kanban-support';
import type { KanbanColumn, KanbanCard } from '../../../packages/components/src/kanban/snice-kanban.types';
import '../../../packages/components/src/kanban/snice-kanban';

const plain = (over: Partial<KanbanCombo> = {}): KanbanCombo => ({
  family: 'titled-cards', showCardCount: true, allowDragDrop: true,
  channel: 'attr', ...over,
});

const BASE: KanbanColumn[] = [
  { id: 'todo', title: 'To Do', cards: [{ id: 1, title: 'Task' }] },
  { id: 'doing', title: 'Doing', cards: [] },
  { id: 'done', title: 'Done', cards: [{ id: 2, title: 'Shipped' }] },
];

const shapeOf = (el: HTMLElement, combo: KanbanCombo, board: KanbanColumn[]) =>
  expectShape(readShape(el), expectedShape(combo, board), 'rendered board');

describe('kanban matrix: addColumn', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('adds an empty column at the end of the board', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.addColumn({ id: 'review', title: 'Review', cards: [] });
    await settle(el, 20);

    expect(k.columns.map((c: KanbanColumn) => c.id)).toEqual(['todo', 'doing', 'done', 'review']);
    expect(columnEls(el).length).toBe(4);
    shapeOf(el, plain(), k.columns);
  });

  it('adds a column that already carries cards', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.addColumn({ id: 'urgent', title: 'Urgent', cards: [
      { id: 9, title: 'Now', labels: ['bug'] },
    ] });
    await settle(el, 20);

    expect(k.columns[3].cards.map((c: KanbanCard) => c.id)).toEqual([9]);
    shapeOf(el, plain(), k.columns);
  });
});

describe('kanban matrix: removeColumn', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('removes the first column by string id', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.removeColumn('todo');
    await settle(el, 20);

    expect(k.columns.map((c: KanbanColumn) => c.id)).toEqual(['doing', 'done']);
    shapeOf(el, plain(), k.columns);
  });

  it('removes a middle column and its cards go with it', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.removeColumn('doing');
    await settle(el, 20);

    expect(k.columns.map((c: KanbanColumn) => c.id)).toEqual(['todo', 'done']);
    expect(cardEls(el).map(c => c.getAttribute('data-card-id'))).toEqual(['1', '2']);
    shapeOf(el, plain(), k.columns);
  });
});

describe('kanban matrix: addCard', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('appends a card to the end of an occupied column', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.addCard('todo', { id: 3, title: 'Follow-up', description: 'Later.' });
    await settle(el, 20);

    expect(k.columns[0].cards.map((c: KanbanCard) => c.id)).toEqual([1, 3]);
    shapeOf(el, plain(), k.columns);
  });

  it('appends a card to an empty column', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.addCard('doing', { id: 4, title: 'Started' });
    await settle(el, 20);

    expect(k.columns[1].cards.map((c: KanbanCard) => c.id)).toEqual([4]);
    shapeOf(el, plain(), k.columns);
  });
});

describe('kanban matrix: removeCard', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { unmountAll(); el = undefined; });

  it('removes the first card of its column', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;

    k.removeCard(1);
    await settle(el, 20);

    expect(k.columns[0].cards).toEqual([]);
    shapeOf(el, plain(), k.columns);
  });

  it('removes a card from the middle of its column', async () => {
    el = await mountKanban(plain());
    await setBoard(el, [
      { id: 'todo', title: 'To Do', cards: [
        { id: 1, title: 'A' }, { id: 2, title: 'B' }, { id: 3, title: 'C' },
      ] },
    ]);
    const k = el as any;

    k.removeCard(2);
    await settle(el, 20);

    expect(k.columns[0].cards.map((c: KanbanCard) => c.id)).toEqual([1, 3]);
    shapeOf(el, plain(), k.columns);
  });
});

describe('kanban matrix: getColumn and getCard', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('getColumn returns the declared column object', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const k = el as any;
    const column = k.getColumn('doing');
    expect(column?.id).toBe('doing');
    expect(column?.title).toBe('Doing');
    expect(column).toBe(k.columns[1]);
  });

  it('getColumn returns undefined for an unknown id', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    expect((el as any).getColumn('nope')).toBeUndefined();
  });

  it('getCard finds a card in any column', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    const card = (el as any).getCard(2);
    expect(card?.id).toBe(2);
    expect(card?.title).toBe('Shipped');
  });

  it('getCard returns undefined for an unknown id', async () => {
    el = await mountKanban(plain());
    await setBoard(el, BASE);
    expect((el as any).getCard(99)).toBeUndefined();
  });
});
