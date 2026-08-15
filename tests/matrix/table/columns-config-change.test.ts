/**
 * Matrix slice COLUMNS — the column configuration changed AFTER data is already
 * on screen (`table.columns = [...]` and `setColumns()`), crossed with
 * {local, remote} delivery, the five value pipelines, and re-delivery.
 *
 * Documented contract: `columns:ColumnDefinition[]` is the column
 * configuration; assigning it rerenders, and `setColumns(columns)` assigns and
 * schedules both renders. The definition array carries the painted order and
 * the `pinned` / `width` of each column, so a new array is a new configuration
 * and must be reflected on screen.
 *
 * Every assertion is the DOCUMENTED expectation and runs in every pipeline — no
 * pipeline is exempt, and no `it.fails` remains. The three ids below were one
 * defect family (stale column state won over the new declared configuration),
 * all FIXED by making a `columns` assignment re-apply the declaration:
 *   MATRIX-columns-2 a re-assigned `columns` array did not re-apply the
 *                    declared column order; the first configuration's order
 *                    stuck for every key the table had already seen.
 *   MATRIX-columns-3 a re-assigned `columns` array did not re-apply the
 *                    declared `pinned` side.
 *   MATRIX-columns-4 a re-assigned `columns` array did not re-apply the
 *                    declared `width`.
 * The same family's `visible` member is covered in columns-visibility.test.ts
 * as MATRIX-columns-6.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { expectCellsMatch, dataRows, wait } from './matrix-utils';
import {
  PIPELINES, MODES, columnsFor, rowsFor, mutateRow,
  makeDelivered, redeliver, expectColumnOrder, expectNoBlankCells, headerKeys,
  columnWidth, cellWidths, pinnedSides,
} from './columns-support';

const KEYS = ['a', 'b', 'c', 'd'];
const SPECS = [
  { id: 'r1', values: { a: 'A1', b: 'B1', c: 'C1', d: 'D1', e: 'E1' } },
  { id: 'r2', values: { a: 'A2', b: 'B2', c: 'C2', d: 'D2', e: 'E2' } },
];

describe('columns matrix: column config changed after data is present', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  for (const { remote, label } of MODES) {
    for (const pipeline of PIPELINES) {
      const combo = `${label}/${pipeline}`;

      it(`${combo}: dropping a column from the configuration removes it`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const fewer = columnsFor(['a', 'c', 'd'], pipeline);
        table.columns = fewer;
        await wait(60);

        expectColumnOrder(table, ['a', 'c', 'd']);
        expect(dataRows(table).length).toBe(rows.length);
      });

      it(`${combo}: the surviving columns keep their values after a drop`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const fewer = columnsFor(['a', 'c', 'd'], pipeline);
        table.columns = fewer;
        await wait(60);

        expectCellsMatch(table, rows, fewer);
        expectNoBlankCells(table);
      });

      it(`${combo}: appending a brand-new column paints it last`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const more = columnsFor([...KEYS, 'e'], pipeline);
        table.columns = more;
        await wait(60);

        expectColumnOrder(table, [...KEYS, 'e']);
      });

      it(`${combo}: a brand-new column renders values from the rows already present`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const more = columnsFor([...KEYS, 'e'], pipeline);
        table.columns = more;
        await wait(60);

        expectCellsMatch(table, rows, more);
        expectNoBlankCells(table);
      });

      it(`${combo}: a re-delivery after a column-set change renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const more = columnsFor([...KEYS, 'e'], pipeline);
        table.columns = more;
        await wait(60);
        await redeliver(table, remote, [...rows]);

        expectColumnOrder(table, [...KEYS, 'e']);
        expectCellsMatch(table, rows, more);
      });

      it(`${combo}: a mutated re-delivery after a column-set change renders every value`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const more = columnsFor([...KEYS, 'e'], pipeline);
        table.columns = more;
        await wait(60);
        const mutated = [mutateRow(pipeline, rows[0], 'e', 'E1x'), rows[1]];
        await redeliver(table, remote, mutated);

        expectCellsMatch(table, mutated, more);
      });

      it(`${combo}: swapping to a disjoint key set repaints the whole table`, async () => {
        const cols = columnsFor(['a', 'b'], pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expectColumnOrder(table, ['a', 'b']);

        const next = columnsFor(['c', 'd'], pipeline);
        table.columns = next;
        await wait(60);

        expectColumnOrder(table, ['c', 'd']);
      });

      it(`${combo}: a disjoint key set renders the new columns' values`, async () => {
        const cols = columnsFor(['a', 'b'], pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const next = columnsFor(['c', 'd'], pipeline);
        table.columns = next;
        await wait(60);

        expectCellsMatch(table, rows, next);
        expectNoBlankCells(table);
      });

      it(`${combo}: a changed label reaches the header`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const relabelled = columnsFor(KEYS, pipeline).map(c =>
          c.key === 'b' ? { ...c, label: 'Renamed B' } : c);
        table.columns = relabelled;
        await wait(60);

        const th = table.shadowRoot.querySelector('thead th[data-key="b"]');
        expect(th.textContent).toContain('Renamed B');
      });

      it(`${combo}: a changed resizable flag reaches the header handle`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote, attrs: { 'column-resize': true } });
        expect(table.shadowRoot.querySelector('thead th[data-key="b"] .resize-handle')).not.toBeNull();

        const next = columnsFor(KEYS, pipeline, { b: { resizable: false } });
        table.columns = next;
        await wait(60);

        expect(table.shadowRoot.querySelector('thead th[data-key="b"] .resize-handle')).toBeNull();
      });

      it(`${combo}: a valueGetter added by the new configuration is used`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        const next = columnsFor(KEYS, pipeline).map(c =>
          c.key === 'a' ? { ...c, valueGetter: (_v: any, row: any) => `${row.id}!` } : c);
        table.columns = next;
        await wait(60);

        expectCellsMatch(table, rows, next);
        expectNoBlankCells(table);
      });

      // MATRIX-columns-2: the new configuration's order is ignored for keys the
      // table has already initialized.
      it(`${combo}: a re-ordered configuration array repaints in the new order [MATRIX-columns-2]`, async () => {
        const cols = columnsFor(['a', 'b'], pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expect(headerKeys(table)).toEqual(['a', 'b']);

        table.columns = columnsFor(['b', 'a'], pipeline);
        await wait(60);

        expectColumnOrder(table, ['b', 'a']);
      });

      // MATRIX-columns-2 via the documented setColumns() entry point.
      it(`${combo}: setColumns() repaints in the new declared order [MATRIX-columns-2]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.setColumns(columnsFor(['c', 'b', 'a', 'd'], pipeline));
        await wait(60);

        expectColumnOrder(table, ['c', 'b', 'a', 'd']);
      });

      // MATRIX-columns-2: a column removed and re-declared in a new position.
      it(`${combo}: a re-declared column paints at its new position [MATRIX-columns-2]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.columns = columnsFor(['a', 'c', 'd'], pipeline);
        await wait(60);
        expectColumnOrder(table, ['a', 'c', 'd']);

        table.columns = columnsFor(['a', 'c', 'd', 'b'], pipeline);
        await wait(60);
        expectColumnOrder(table, ['a', 'c', 'd', 'b']);
      });

      // MATRIX-columns-2: a brand-new column declared first must paint first.
      it(`${combo}: a new column declared first paints first [MATRIX-columns-2]`, async () => {
        const cols = columnsFor(['a', 'b'], pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });

        table.columns = columnsFor(['c', 'a', 'b'], pipeline);
        await wait(60);

        expectColumnOrder(table, ['c', 'a', 'b']);
      });

      // MATRIX-columns-3: declared `pinned` is not re-applied.
      it(`${combo}: a newly declared pinned side is applied [MATRIX-columns-3]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expectColumnOrder(table, KEYS);

        table.columns = columnsFor(KEYS, pipeline, { d: { pinned: 'left' } });
        await wait(60);

        expectColumnOrder(table, ['d', 'a', 'b', 'c']);
        expect(pinnedSides(table, 'd').header!.position).toBe('sticky');
      });

      // MATRIX-columns-3: a pin removed from the configuration is not released.
      it(`${combo}: a pin dropped from the configuration is released [MATRIX-columns-3]`, async () => {
        const cols = columnsFor(KEYS, pipeline, { c: { pinned: 'left' } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expectColumnOrder(table, ['c', 'a', 'b', 'd']);

        table.columns = columnsFor(KEYS, pipeline);
        await wait(60);

        expectColumnOrder(table, KEYS);
        expect(pinnedSides(table, 'c').header!.position).toBe('');
      });

      // MATRIX-columns-4: declared `width` is not re-applied.
      it(`${combo}: a narrowed declared width is applied [MATRIX-columns-4]`, async () => {
        const cols = columnsFor(KEYS, pipeline, { b: { width: '300' } });
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expect(columnWidth(table, 'b')).toBe('300px');

        table.columns = columnsFor(KEYS, pipeline, { b: { width: '120' } });
        await wait(60);

        expect(columnWidth(table, 'b')).toBe('120px');
        expect(cellWidths(table, 'b')).toEqual(['120px', '120px']);
      });

      // MATRIX-columns-4: a width introduced by the new configuration.
      it(`${combo}: a width introduced by the new configuration is applied [MATRIX-columns-4]`, async () => {
        const cols = columnsFor(KEYS, pipeline);
        const rows = rowsFor(pipeline, SPECS);
        table = await makeDelivered({ columns: cols, rows, remote });
        expect(columnWidth(table, 'b')).toBe('150px');

        table.columns = columnsFor(KEYS, pipeline, { b: { width: '260' } });
        await wait(60);

        expect(columnWidth(table, 'b')).toBe('260px');
        expect(cellWidths(table, 'b')).toEqual(['260px', '260px']);
      });
    }
  }
});
