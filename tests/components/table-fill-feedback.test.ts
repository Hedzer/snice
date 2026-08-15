/**
 * Regression: the height-fill row must never feed back into its own trigger.
 *
 * The filler is sized to `frame.clientHeight - table.offsetHeight` and appended
 * to the tbody, and `@observe('resize', '.table-frame')` re-derives it whenever
 * the frame's box changes. When the host's height is CONTENT-DRIVEN — the
 * documented `:host { height: 100% }` resolving against an auto/max-content
 * container, i.e. a grid or flex item that stretches, or a plain block parent —
 * the filler it just appended becomes part of the content the frame is sized
 * from. The frame grows, the resize observer fires, the leftover computes
 * positive again, and the table inflates by one slack per animation frame,
 * forever (observed live: ~8300px -> ~10000px in 0.7s and climbing).
 *
 * The invariant: the filler may only consume space the frame ALREADY has.
 * Space that only exists BECAUSE of the filler must be given back.
 *
 * happy-dom computes no layout, so both height regimes are modelled by
 * stubbing `clientHeight`/`offsetHeight` on the two elements the algorithm
 * measures: a constrained frame reports a fixed box, a content-driven one
 * reports "whatever the table currently is, plus a constant slack".
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLS = [{ key: 'name', label: 'Name', type: 'text' }];
const ROWS = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Eve' }];

const ROW_H = 30;   // simulated data-row height
const SLACK = 19;   // constant gap a stretched item keeps over its content

interface Geometry {
  frame: HTMLElement;
  tableEl: HTMLElement;
  fillHeight: () => number;
  tableHeight: () => number;
}

/**
 * Model the layout engine: the table is as tall as its data rows plus the
 * filler's inline height. `mode` decides where the frame's height comes from.
 */
function stubGeometry(table: any, mode: 'constrained' | 'content-driven', frameBox = 400): Geometry {
  const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
  const tableEl = frame.querySelector('table') as HTMLElement;

  const fillHeight = () => {
    const fill = tableEl.querySelector('tbody tr.table-fill-row') as HTMLElement | null;
    return fill ? parseFloat(fill.style.height) || 0 : 0;
  };
  const tableHeight = () =>
    tableEl.querySelectorAll('tbody tr[data-index]').length * ROW_H + fillHeight();

  Object.defineProperty(tableEl, 'offsetHeight', { configurable: true, get: tableHeight });
  Object.defineProperty(frame, 'clientHeight', {
    configurable: true,
    get: () => (mode === 'constrained' ? frameBox : tableHeight() + SLACK),
  });

  return { frame, tableEl, fillHeight, tableHeight };
}

describe('snice-table height fill never feeds its own trigger', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  it('fills a constrained frame down to its bottom edge', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const geo = stubGeometry(table, 'constrained', 400);
    table.handleFrameResize();

    // 400px box, 3 rows of 30px -> 310px of genuinely free space.
    expect(geo.fillHeight()).toBe(310);
    expect(geo.tableHeight()).toBe(400);
  });

  it('does not grow a content-driven frame, however often resize fires', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const geo = stubGeometry(table, 'content-driven');
    const natural = ROWS.length * ROW_H;

    for (let tick = 0; tick < 20; tick++) {
      table.handleFrameResize();
      // Every tick is an animation frame in the live page: any per-tick gain at
      // all is the runaway.
      expect(geo.tableHeight()).toBeLessThanOrEqual(natural + 1);
    }

    expect(geo.frame.clientHeight).toBe(natural + SLACK);
  });

  it('keeps the fill it can afford when only part of the space is self-made', async () => {
    // A stretched grid item sized by a TALLER sibling: the frame really does
    // own free space (the sibling holds the row open), but the last SLACK px of
    // it only appear once the filler pushes the row taller. Fill the honest
    // part, give the self-made part back, and stay there.
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    const tableEl = frame.querySelector('table') as HTMLElement;
    const SIBLING = 300; // the row's height while our content is shorter

    const fillHeight = () => {
      const fill = tableEl.querySelector('tbody tr.table-fill-row') as HTMLElement | null;
      return fill ? parseFloat(fill.style.height) || 0 : 0;
    };
    const tableHeight = () =>
      tableEl.querySelectorAll('tbody tr[data-index]').length * ROW_H + fillHeight();

    Object.defineProperty(tableEl, 'offsetHeight', { configurable: true, get: tableHeight });
    Object.defineProperty(frame, 'clientHeight', {
      configurable: true,
      // The grid row is the tallest contribution; ours only counts once it
      // exceeds the sibling's.
      get: () => Math.max(SIBLING, tableHeight() + SLACK),
    });

    for (let tick = 0; tick < 20; tick++) table.handleFrameResize();

    expect(frame.clientHeight).toBe(SIBLING);
    expect(tableHeight()).toBeLessThanOrEqual(SIBLING);
    expect(fillHeight()).toBeGreaterThan(0);
  });
});
