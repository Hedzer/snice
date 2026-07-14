/**
 * Phase 0 — Task 5a: keyboard listener must survive dynamic tables.
 *
 * The listener used to bind to the inner <table> once at @ready. When data /
 * columns arrive after ready (every real app) or a structural rebuild replaces
 * the table body, keydowns originating anywhere but the <table> node itself
 * never reached the handler. Fix: delegate keydown at the shadow root — a
 * stable ancestor that always exists and survives rebuilds — and re-apply
 * role=grid / roving tabindex after each structural build.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  createComponent,
  removeComponent,
  queryShadow,
  getShadowRoot,
  wait,
} from './test-utils';
import '../../packages/components/src/table/snice-table';

function makeCols(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    key: `c${i}`,
    label: `Col ${i}`,
    type: 'text' as const,
  }));
}

function makeRows(n: number, cols = makeCols(3)) {
  return Array.from({ length: n }, (_, r) =>
    Object.fromEntries(cols.map((c) => [c.key, `${c.key}-${r}`])),
  );
}

function dispatchKey(target: EventTarget, key: string, opts: Partial<KeyboardEventInit> = {}) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }),
  );
}

function kbOf(table: any) {
  return (table as any).keyboard;
}

/** Create a bare table (no columns/data at @ready), then populate it after. */
async function createEmptyThenPopulate(rows = 5, cols = 3) {
  const table = await createComponent<any>('snice-table', {});
  table.setColumns(makeCols(cols));
  table.setData(makeRows(rows));
  table.renderHeader();
  table.renderBody();
  await wait(30);
  return table;
}

describe('snice-table keyboard binding survives dynamic tables (Task 5a)', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('columns/data set AFTER ready: keydown at the shadow root navigates', async () => {
    table = await createEmptyThenPopulate();

    const root = getShadowRoot(table as HTMLElement);
    dispatchKey(root, 'ArrowDown'); // -1 (header) -> 0
    dispatchKey(root, 'ArrowDown'); // 0 -> 1

    expect(kbOf(table).getFocus().row).toBe(1);
  });

  it('keydown originating at .table-frame (not the <table>) drives navigation', async () => {
    table = await createEmptyThenPopulate();

    const frame = queryShadow(table as HTMLElement, '.table-frame')!;
    dispatchKey(frame, 'ArrowDown'); // -1 -> 0

    expect(kbOf(table).getFocus().row).toBe(0);
  });

  it('listener survives a structural body rebuild (setData replaces the body)', async () => {
    table = await createEmptyThenPopulate();
    const root = getShadowRoot(table as HTMLElement);

    dispatchKey(root, 'ArrowDown'); // -> 0

    // Rebuild the entire body from a fresh dataset.
    table.setData(makeRows(8));
    table.renderBody();
    await wait(20);

    dispatchKey(root, 'ArrowDown'); // -> 1 only if the listener survived the rebuild
    expect(kbOf(table).getFocus().row).toBe(1);
  });

  it('re-applies role=grid + tabindex on the table once data arrives', async () => {
    table = await createEmptyThenPopulate();

    const tableEl = queryShadow(table as HTMLElement, 'table')!;
    expect(tableEl.getAttribute('role')).toBe('grid');
    expect(tableEl.getAttribute('tabindex')).toBe('0');
  });

  it('restores the roving tabindex on the focused cell after a body re-render', async () => {
    table = await createEmptyThenPopulate(6);
    const root = getShadowRoot(table as HTMLElement);

    dispatchKey(root, 'ArrowDown'); // focus row 0
    dispatchKey(root, 'ArrowDown'); // focus row 1

    // A plain re-render wipes tbody (innerHTML reset) — the focus cell's
    // roving tabindex must be restored afterwards, not left dangling.
    table.renderBody();
    await wait(20);

    const focused = queryShadow(table as HTMLElement, 'tbody [data-grid-focus]');
    expect(focused).toBeTruthy();
    expect(focused!.getAttribute('tabindex')).toBe('0');
  });
});
