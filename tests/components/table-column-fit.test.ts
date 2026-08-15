/**
 * Regression coverage for snice-table COLUMN GEOMETRY.
 *
 * Three defects share one theme — a column width that is decided without ever
 * consulting the frame it has to live in:
 *
 *  1. `TableColumnManager` handed every column that declared no `width` a flat
 *     150px. In a frame wider than the sum, fixed table layout stretched them;
 *     in a NARROWER one (a half-width card) nothing gave, so the trailing
 *     columns were pushed outside the frame and read as "cut off". A column
 *     that never declared a width must instead SHARE the frame, down to its
 *     `minWidth`, and only then overflow into the frame's own scroller.
 *
 *  2. The virtualizer's spacer rows carried `colspan="999"`. Fixed layout
 *     therefore believed the table had 999 columns and spread the frame's
 *     leftover width across the ~990 phantom ones, leaving the real columns
 *     short of the right edge with a dead strip beside them. A spacer spans
 *     exactly the columns that exist.
 *
 *  3. Pinned columns rendered with no edge affordance, so "Name is pinned
 *     left" was invisible until something scrolled. The last left-pinned and
 *     first right-pinned cells own the divider that marks the frozen edge.
 *
 * happy-dom has no layout, so anything that needs real pixels (auto-size
 * measurement, the frame actually filling) is pinned in
 * tests/live/components/table/table-column-layout.spec.ts. What is expressible
 * here is the geometry contract itself.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import { TableColumnManager } from '../../packages/components/src/table/table-column-manager';
import '../../packages/components/src/table/snice-table';

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'dept', label: 'Department', type: 'text' },
];

const ROWS = Array.from({ length: 6 }, (_, i) => ({
  name: `Person ${i}`, age: 20 + i, dept: 'Engineering',
}));

async function makeTable(columns: any[] = COLUMNS, attrs: Record<string, any> = {}): Promise<any> {
  const table = await createComponent<any>('snice-table');
  Object.assign(table, attrs);
  table.columns = columns;
  table.data = ROWS;
  table.unsortedData = [...ROWS];
  table.columnManager.initialize(columns, table);
  await wait(20);
  table.renderHeader();
  table.renderBody();
  await wait(40);
  return table;
}

describe('table column fitting', () => {
  let table: any = null;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  describe('unsized columns share the available width', () => {
    const manager = (columns: any[]) => {
      const cm = new TableColumnManager();
      cm.initialize(columns, document.createElement('div'));
      return cm;
    };

    it('shrinks columns that never declared a width to fit a narrow frame', () => {
      const cm = manager(COLUMNS);
      // 300px of content box for three columns: 100 each, well under the 150
      // default that used to overflow the frame instead.
      expect(cm.fitVisibleColumns(300)).toBe(true);
      expect(cm.getVisibleColumns().map(c => c.width)).toEqual([100, 100, 100]);
    });

    it('grows the same columns when the frame is wider than their default', () => {
      const cm = manager(COLUMNS);
      cm.fitVisibleColumns(900);
      expect(cm.getVisibleColumns().map(c => c.width)).toEqual([300, 300, 300]);
    });

    it('never touches a width the column author declared', () => {
      const cm = manager([
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age', width: '80' },
        { key: 'dept', label: 'Department' },
      ]);
      cm.fitVisibleColumns(480);
      const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
      expect(byKey.age).toBe(80);
      // The declared 80 comes off the budget; the rest is split evenly.
      expect(byKey.name).toBe(200);
      expect(byKey.dept).toBe(200);
    });

    it('never touches a width the user resized to', () => {
      const cm = manager(COLUMNS);
      const state: any = cm.getState('age');
      cm.fitVisibleColumns(300);
      state.width = 42;
      state.authored = true;
      cm.fitVisibleColumns(300);
      expect(cm.getState('age')!.width).toBe(42);
    });

    it('stops at minWidth and lets the frame scroll rather than collapsing', () => {
      const cm = manager(COLUMNS.map(c => ({ ...c, minWidth: 120 })));
      cm.fitVisibleColumns(90);
      expect(cm.getVisibleColumns().map(c => c.width)).toEqual([120, 120, 120]);
    });

    it('reports no change when the fit is already correct', () => {
      const cm = manager(COLUMNS);
      cm.fitVisibleColumns(300);
      expect(cm.fitVisibleColumns(300)).toBe(false);
    });

    it('reserves per-column chrome so the fitted content boxes still fit', () => {
      const cm = manager(COLUMNS);
      // 25px of padding + border per column is not content the column can use.
      cm.fitVisibleColumns(375, 25);
      expect(cm.getVisibleColumns().map(c => c.width)).toEqual([100, 100, 100]);
    });

    it('ignores a frame that has not been laid out yet', () => {
      const cm = manager(COLUMNS);
      expect(cm.fitVisibleColumns(0)).toBe(false);
      expect(cm.getVisibleColumns().map(c => c.width)).toEqual([150, 150, 150]);
    });
  });

  describe('virtual spacers span the real columns', () => {
    it('spans exactly the rendered column count, not a magic 999', async () => {
      // Enough rows that the window leaves a spacer outside it.
      const many = Array.from({ length: 400 }, (_, i) => ({
        name: `Person ${i}`, age: i, dept: 'Engineering',
      }));
      table = await createComponent<any>('snice-table');
      table.virtualize = true;
      table.rowHeight = 36;
      table.selectable = true;
      table.columns = COLUMNS;
      table.data = many;
      table.unsortedData = [...many];
      table.columnManager.initialize(COLUMNS, table);
      await wait(20);
      table.renderHeader();
      table.renderBody();
      await wait(80);

      const spacers = Array.from(
        table.shadowRoot.querySelectorAll('tbody tr.virtual-spacer td'),
      ) as HTMLTableCellElement[];
      expect(spacers.length).toBeGreaterThan(0);

      const headerCells = table.shadowRoot
        .querySelectorAll('thead tr.column-header-row > th').length;
      for (const spacer of spacers) {
        expect(spacer.colSpan).toBe(headerCells);
      }
    });
  });

  describe('pinned columns carry an edge affordance', () => {
    const PINNED = [
      { key: 'name', label: 'Name', type: 'text', pinned: 'left' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'dept', label: 'Department', type: 'text', pinned: 'right' },
    ];

    it('marks the frozen edges on the header and the body cells', async () => {
      table = await makeTable(PINNED);
      const cell = (sel: string) => table.shadowRoot.querySelector(sel) as HTMLElement;

      const leftHead = cell('th[data-key="name"]');
      const rightHead = cell('th[data-key="dept"]');
      const middleHead = cell('th[data-key="age"]');

      expect(leftHead.classList.contains('pinned-cell')).toBe(true);
      expect(leftHead.classList.contains('pinned-cell--left')).toBe(true);
      expect(leftHead.classList.contains('pinned-cell--edge')).toBe(true);
      expect(rightHead.classList.contains('pinned-cell--right')).toBe(true);
      expect(rightHead.classList.contains('pinned-cell--edge')).toBe(true);
      expect(middleHead.classList.contains('pinned-cell')).toBe(false);

      const leftBody = cell('tbody td[data-key="name"]');
      expect(leftBody.classList.contains('pinned-cell--left')).toBe(true);
      expect(leftBody.classList.contains('pinned-cell--edge')).toBe(true);
    });

    it('puts the divider only on the inner-most frozen column', async () => {
      table = await makeTable([
        { key: 'name', label: 'Name', type: 'text', pinned: 'left' },
        { key: 'age', label: 'Age', type: 'number', pinned: 'left' },
        { key: 'dept', label: 'Department', type: 'text' },
      ]);
      const name = table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement;
      const age = table.shadowRoot.querySelector('th[data-key="age"]') as HTMLElement;

      expect(name.classList.contains('pinned-cell--left')).toBe(true);
      expect(name.classList.contains('pinned-cell--edge')).toBe(false);
      expect(age.classList.contains('pinned-cell--edge')).toBe(true);
    });

    it('names the frozen state for assistive technology', async () => {
      table = await makeTable(PINNED, { sortable: true });
      const leftHead = table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement;
      expect(leftHead.getAttribute('aria-label')).toContain('pinned left');
      const plain = table.shadowRoot.querySelector('th[data-key="age"]') as HTMLElement;
      expect(plain.getAttribute('aria-label')).toBe('Sort by Age');
    });

    it('drops the affordance when the column is unpinned again', async () => {
      table = await makeTable(PINNED);
      table.unpinColumn('name');
      await wait(30);
      const leftHead = table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement;
      expect(leftHead.classList.contains('pinned-cell')).toBe(false);
      expect(leftHead.classList.contains('pinned-cell--edge')).toBe(false);
    });
  });
});
