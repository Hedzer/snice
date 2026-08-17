/**
 * Smoke slice of the snice-kanban matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the ~90-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/kanban.md: the rendered
 * board shape, the style switches' authoring channels, the `kanban-card-move`
 * contract, the `kanban-card-click` contract, and filtering/search. Every
 * structural assertion routes through the matrix's own oracle
 * (`expectedShape`/`readShape`), so this file cannot drift into asserting
 * something weaker than the suite it stands in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, captureEvents, click, unmountAll, settle } from '../matrix-utils';
import {
  board, mountKanban, setBoard, cardEl,
  expectedShape, readShape, expectedAxes, readAxes, type KanbanCombo,
} from './kanban-support';
import '../../../packages/components/src/kanban/snice-kanban';

const plain = (over: Partial<KanbanCombo> = {}): KanbanCombo => ({
  family: 'titled-cards', showCardCount: true, allowDragDrop: true,
  channel: 'attr', ...over,
});

afterEach(() => { unmountAll(); });

describe('kanban matrix smoke', () => {
  it('a bare board renders the documented parts, counts, and cards', async () => {
    const combo = plain();
    const el = await mountKanban(combo);
    const data = board('titled-cards');
    await setBoard(el, data);
    expectShape(readShape(el), expectedShape(combo, data), 'smoke/board shape');
  });

  it('both switches reach their attributes through the property channel', async () => {
    // The interesting channel: a property assignment must reflect to the
    // attribute the markup contract documents (`allow-drag-drop`,
    // `show-card-count`) when it differs from the default.
    const combo = plain({ showCardCount: false, allowDragDrop: false, channel: 'prop' });
    const el = await mountKanban(combo);
    expectShape(readAxes(el), expectedAxes(combo), 'smoke/axes');
    expect(el.hasAttribute('allow-drag-drop')).toBe(false);
    expect(el.hasAttribute('show-card-count')).toBe(false);
  });

  it('moveCard fires kanban-card-move -> { card, fromColumn, toColumn, kanban }', async () => {
    const el = await mountKanban(plain());
    await setBoard(el, [
      { id: 'todo', title: 'To Do', cards: [{ id: 1, title: 'Task' }] },
      { id: 'done', title: 'Done', cards: [] },
    ]);
    const seen = captureEvents(el, ['kanban-card-move']);

    (el as any).moveCard(1, 'done');
    await settle(el, 20);

    expect(seen.types()).toEqual(['kanban-card-move']);
    expect(seen.events[0].detail.card.id).toBe(1);
    expect(seen.events[0].detail.fromColumn).toBe('todo');
    expect(seen.events[0].detail.toColumn).toBe('done');
    expect(seen.events[0].detail.kanban).toBe(el);
  });

  it('clicking a card fires kanban-card-click -> { card, kanban }', async () => {
    const el = await mountKanban(plain());
    await setBoard(el, board('titled-cards'));
    const seen = captureEvents(el, ['kanban-card-click']);

    click(cardEl(el, 1));
    await settle(el, 5);

    expect(seen.types()).toEqual(['kanban-card-click']);
    expect(seen.events[0].detail.card.id).toBe(1);
    expect(seen.events[0].detail.kanban).toBe(el);
  });

  it('filterByLabels and search narrow the visible cards; clearFilters restores', async () => {
    const el = await mountKanban(plain());
    await setBoard(el, [
      { id: 'todo', title: 'To Do', cards: [
        { id: 1, title: 'Landing page', labels: ['bug'] },
        { id: 2, title: 'Auth', description: 'Landing page copy' },
      ] },
    ]);
    const k = el as any;

    k.filterByLabels(['bug']);
    await settle(el, 20);
    expect(cardEl(el, 1) && !cardEl(el, 2)).toBeTruthy();

    k.clearFilters();
    await settle(el, 20);
    k.search('Landing');
    await settle(el, 20);
    expect(cardEl(el, 1) && cardEl(el, 2)).toBeTruthy();

    k.clearFilters();
    await settle(el, 20);
    expect(cardEl(el, 1) && cardEl(el, 2)).toBeTruthy();
  });
});
