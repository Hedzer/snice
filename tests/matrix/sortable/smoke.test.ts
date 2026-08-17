/**
 * Smoke slice of the snice-sortable matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/sortable/`, 32 combos across shell and
 * gesture) is excluded from the default Vitest include and runs via
 * `npm run test:matrix`. This file lives at `smoke.test.ts` so it stays
 * collected, and every assertion routes through the matrix's own oracle, so it
 * cannot claim less than the suite it stands in for.
 *
 * The marquee combos: the doc's default markup (shell + auto-draggable), a
 * vertical reorder, the horizontal axis (the one thing `direction` changes),
 * the `disabled` veto, the `handle` entry point, and the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, ITEM_IDS, Problems, captureSort, checkGesture, checkShell, drag,
  dragStart, expectClean, expectedOrder, items, makeSortable, order,
  removeComponent, wait, type Sortable,
} from './sortable-support';

let el: Sortable | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('sortable matrix smoke', () => {
  it('the documented default markup renders the shell and makes items draggable', async () => {
    el = await makeSortable();
    const problems = new Problems();
    checkShell(problems, el, DEFAULTS);
    expectClean(problems, 'smoke/shell');
  });

  it('a vertical drop past the midpoint reorders and announces the move', async () => {
    el = await makeSortable();
    const seen = captureSort(el);
    drag(el, 0, 2, DEFAULTS, 'after');
    await wait(10);

    const expected = expectedOrder(0, 2, 'after');
    const problems = new Problems();
    checkGesture(problems, el, seen, DEFAULTS, { from: 0, to: expected.indexOf('a'), order: expected });
    expectClean(problems, 'smoke/vertical');
  });

  it('the horizontal axis measures the pointer on x, not y', async () => {
    // The only thing `direction` changes is which coordinate is compared to
    // the target's midpoint; a component that ignored it would drop on the
    // same side in both axes.
    const vector = { ...DEFAULTS, direction: 'horizontal' as const };
    el = await makeSortable(vector);
    const seen = captureSort(el);
    drag(el, 2, 0, vector, 'before');
    await wait(10);

    const expected = expectedOrder(2, 0, 'before');
    const problems = new Problems();
    checkGesture(problems, el, seen, vector, { from: 2, to: expected.indexOf('c'), order: expected });
    expectClean(problems, 'smoke/horizontal');
  });

  it('disabled sorts nothing and announces nothing', async () => {
    const vector = { ...DEFAULTS, disabled: true };
    el = await makeSortable(vector);
    const seen = captureSort(el);
    drag(el, 0, 2, vector, 'after');
    await wait(10);
    expect(seen).toEqual([]);
    expect(order(el)).toEqual([...ITEM_IDS]);
  });

  it('handle narrows the drag surface to the named selector', async () => {
    const vector = { ...DEFAULTS, handle: '.grip' as const };
    el = await makeSortable(vector);
    const seen = captureSort(el);
    items(el)[0].dispatchEvent(new MouseEvent('dragstart', { bubbles: true, composed: true }));
    await wait(10);
    expect(seen.map(e => e.type), 'a grab outside the handle started a drag').toEqual([]);
  });

  // ── Standing findings — see tests/matrix/sortable/gesture.test.ts ──────────

  // MATRIX-sortable-1: the documented `.sortable-ghost` class is never applied.
  it.fails('MATRIX-sortable-1: a drag in progress marks a ghost placeholder', async () => {
    el = await makeSortable();
    dragStart(el, 0, DEFAULTS);
    expect(items(el).filter(item => item.classList.contains('sortable-ghost')).length).toBe(1);
  });

  // MATRIX-sortable-2: `group` is declared, reflected, and never read.
  it.fails('MATRIX-sortable-2: an item dragged into a same-group container moves there', async () => {
    const source = await makeSortable({ group: 'tasks' });
    const target = await makeSortable({ group: 'tasks' });
    el = source;
    try {
      dragStart(source, 0, { ...DEFAULTS, group: 'tasks' });
      items(target)[0].dispatchEvent(new MouseEvent('dragover', {
        bubbles: true, composed: true, cancelable: true, clientX: 100, clientY: 10,
      }));
      await wait(10);
      expect(items(target).length).toBe(4);
    } finally {
      removeComponent(target as HTMLElement);
    }
  });
});
