/**
 * snice-sortable matrix — the DRAG GESTURE, across every documented switch.
 *
 * The doc's whole behavioural contract is three events and the reorder they
 * describe:
 *
 *   · `sort-start`  → `{ index, item }`
 *   · `sort-end`    → `{ oldIndex, newIndex, item }`
 *   · `sort-change` → `{ oldIndex, newIndex, item }`
 *
 * and two switches that change whether — or from where — the gesture starts:
 * `disabled` ("false" by default) and `handle` ("CSS selector for drag
 * handle"). `direction` decides which axis the insertion point is measured on,
 * which is the difference between "drop above" and "drop left of".
 *
 * This slice crosses direction x handle x disabled x drop-side (16 combos) over
 * the doc's own three-item list, and judges each one with `checkGesture`, whose
 * expectation is DERIVED from the documented insertion rule (`expectedOrder`)
 * rather than read back from the component.
 */
import { describe, it, afterEach, expect } from 'vitest';
import {
  DEFAULTS, DIRECTIONS, HANDLES, ITEM_IDS, Problems, SIDES, captureSort, checkGesture,
  drag, dragEnd, dragStart, expectClean, expectedOrder, grabPoint, items, makeSortable,
  order, removeComponent, vectorId, wait, type Sortable, type SortableVector,
} from './sortable-support';

let el: Sortable | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

interface DragCombo extends SortableVector { side: typeof SIDES[number] }

const COMBOS: DragCombo[] = [];
for (const direction of DIRECTIONS) {
  for (const handle of HANDLES) {
    for (const disabled of [false, true]) {
      for (const side of SIDES) {
        COMBOS.push({ ...DEFAULTS, direction, handle, disabled, side });
      }
    }
  }
}

describe('snice-sortable matrix: drag A onto C', () => {
  for (const combo of COMBOS) {
    it(`${vectorId(combo)}/drop-${combo.side}`, async () => {
      el = await makeSortable(combo);
      const seen = captureSort(el);

      drag(el, 0, 2, combo, combo.side);
      await wait(10);

      // A disabled container never moves anything, so its expected order is
      // the authored one whatever the pointer did.
      const expectedFinal = combo.disabled ? [...ITEM_IDS] : expectedOrder(0, 2, combo.side);
      const to = combo.disabled ? 0 : expectedFinal.indexOf('a');

      const problems = new Problems();
      checkGesture(problems, el, seen, combo, { from: 0, to, order: expectedFinal });
      expectClean(problems, `${vectorId(combo)}/drop-${combo.side}`);
    });
  }
});

describe('snice-sortable matrix: gesture edges', () => {
  it('a drop back onto the starting position emits sort-start and nothing else', async () => {
    // `sort-end`/`sort-change` are documented with an `oldIndex` AND a
    // `newIndex`; a gesture that changed neither has no reorder to announce.
    el = await makeSortable();
    const seen = captureSort(el);
    dragStart(el, 1, DEFAULTS);
    dragEnd(el);
    await wait(10);
    expect(seen.map(e => e.type)).toEqual(['sort-start']);
    expect(order(el)).toEqual([...ITEM_IDS]);
  });

  it('sort-end and sort-change carry the identical detail object', async () => {
    // Both are documented with the same `{ oldIndex, newIndex, item }` shape,
    // and both describe the same completed move.
    el = await makeSortable();
    const seen = captureSort(el);
    drag(el, 2, 0, DEFAULTS, 'before');
    await wait(10);
    const [, end, change] = seen;
    expect(end.detail).toEqual(change.detail);
    expect(end.detail.oldIndex).toBe(2);
    expect(end.detail.newIndex).toBe(0);
  });

  it('the dragged item carries .sortable-dragging for the length of the drag', async () => {
    // doc, Accessibility: "`.sortable-dragging` / `.sortable-ghost` classes
    // during drag".
    el = await makeSortable();
    const first = items(el)[0];
    dragStart(el, 0, DEFAULTS);
    expect(first.classList.contains('sortable-dragging')).toBe(true);
    dragEnd(el);
    expect(first.classList.contains('sortable-dragging')).toBe(false);
  });

  it('a handle vector ignores a grab that misses the handle', async () => {
    // doc: "handle: string = '' // CSS selector for drag handle". Naming one
    // is the point: everything outside it stops being a drag surface.
    const vector: SortableVector = { ...DEFAULTS, handle: '.grip' };
    el = await makeSortable(vector);
    const seen = captureSort(el);
    // Grab the item body — deliberately NOT `grabPoint`, which finds the handle.
    items(el)[0].dispatchEvent(new MouseEvent('dragstart', { bubbles: true, composed: true }));
    await wait(10);
    expect(seen.map(e => e.type)).toEqual([]);
    expect(order(el)).toEqual([...ITEM_IDS]);
  });

  it('a handle vector starts from the handle', async () => {
    const vector: SortableVector = { ...DEFAULTS, handle: '.grip' };
    el = await makeSortable(vector);
    const seen = captureSort(el);
    grabPoint(items(el)[0], '.grip')
      .dispatchEvent(new MouseEvent('dragstart', { bubbles: true, composed: true }));
    await wait(10);
    expect(seen.map(e => e.type)).toEqual(['sort-start']);
    expect(seen[0].detail.index).toBe(0);
  });
});

// ── Findings ────────────────────────────────────────────────────────────────

/**
 * MATRIX-sortable-1 (fixed) — the documented `.sortable-ghost` class.
 *
 * `docs/ai/components/sortable.md`, Accessibility: "Ghost placeholder with
 * dashed outline" and "`.sortable-dragging` / `.sortable-ghost` classes during
 * drag". The stylesheet ships the rule (`::slotted(.sortable-ghost)` — 0.6
 * opacity plus the dashed outline the doc describes). The dragged element now
 * carries the class for the length of the drag, so the documented ghost
 * placeholder paints.
 */
describe('snice-sortable matrix: findings', () => {
  it('MATRIX-sortable-1 (fixed): a drag in progress marks a ghost placeholder', async () => {
    el = await makeSortable();
    dragStart(el, 0, DEFAULTS);
    const ghosts = items(el).filter(item => item.classList.contains('sortable-ghost'));
    expect(ghosts.length, 'no item carries the documented .sortable-ghost class').toBe(1);
  });

  /**
   * MATRIX-sortable-2 — `group` does not enable cross-container sorting.
   *
   * doc: "group: string = '' // Group name for cross-container sorting", with
   * a worked example of two `<snice-sortable group="tasks">` containers side by
   * side. The property is declared and reflected, but nothing in the component
   * ever reads it: a drag that starts in one container and ends over an item of
   * the other moves nothing, because each container only ever inspects its own
   * assigned items.
   */
  it.fails('MATRIX-sortable-2: an item dragged into a same-group container moves there', async () => {
    const source = await makeSortable({ group: 'tasks' });
    const target = await makeSortable({ group: 'tasks' });
    el = source;
    try {
      dragStart(source, 0, { ...DEFAULTS, group: 'tasks' });
      // Hover the second container's first item, the gesture the doc's
      // cross-container example describes.
      items(target)[0].dispatchEvent(new MouseEvent('dragover', {
        bubbles: true, composed: true, cancelable: true, clientX: 100, clientY: 10,
      }));
      dragEnd(source);
      await wait(10);
      expect(items(target).length, 'the item never crossed into the same-group container')
        .toBe(4);
    } finally {
      removeComponent(target as HTMLElement);
    }
  });
});
