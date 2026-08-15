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
 *
 * The `column-fit` suite at the bottom covers the SECOND fitting policy:
 * `column-fit="squish"` makes the frame width a hard constraint instead of a
 * suggestion. Its pixel-level guarantees (no horizontal scrollbar, right edge
 * on the frame edge, ellipsised content) live in
 * tests/live/components/table/table-column-fit.spec.ts.
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

  // ── column-fit="squish" ────────────────────────────────────────────────
  //
  // `scroll` (default) treats minWidth as inviolable and lets the frame
  // scroll. `squish` inverts that: the frame is inviolable, minWidth relaxes to
  // a legibility floor, and the columns always add up to the frame.
  describe('column-fit', () => {
    const manager = (columns: any[], mode: 'scroll' | 'squish' = 'squish') => {
      const cm = new TableColumnManager();
      cm.initialize(columns, document.createElement('div'));
      cm.setFitMode(mode);
      return cm;
    };
    const total = (cm: TableColumnManager) =>
      cm.getVisibleColumns().reduce((sum, c) => sum + c.width, 0);

    describe('the property/attribute channel', () => {
      it('defaults to scroll and reflects an assignment to the attribute', async () => {
        table = await makeTable();
        expect(table.columnFit).toBe('scroll');

        // The squish stylesheet is written as `:host([column-fit="squish"])`,
        // so a PROPERTY assignment has to reach the attribute for the mode to
        // paint at all.
        table.columnFit = 'squish';
        await wait(20);
        expect(table.getAttribute('column-fit')).toBe('squish');
      });

      it('reads the attribute as the property', async () => {
        table = await createComponent<any>('snice-table');
        table.setAttribute('column-fit', 'squish');
        await wait(20);
        expect(table.columnFit).toBe('squish');
      });

      it('hands the mode down to the column manager', async () => {
        table = await makeTable(COLUMNS, { columnFit: 'squish' });
        expect(table.columnManager.getFitMode()).toBe('squish');
      });
    });

    describe('columns share the frame instead of scrolling out of it', () => {
      it('shrinks past minWidth rather than overflowing the frame', () => {
        const cm = manager(COLUMNS.map(c => ({ ...c, minWidth: 120 })));
        // scroll mode parks these at 120 each (360 > 240) and lets the frame
        // scroll; squish has no such escape hatch.
        expect(cm.fitVisibleColumns(240)).toBe(true);
        expect(cm.getVisibleColumns().map(c => c.width)).toEqual([80, 80, 80]);
        expect(total(cm)).toBe(240);
      });

      it('spends the whole frame, not a rounded-down share of it', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(250); // 250/3 does not divide evenly
        expect(total(cm)).toBe(250);
      });

      it('reserves the per-column chrome the same way scroll does', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(375, 25);
        expect(total(cm)).toBe(300);
      });

      it('still keeps a declared width and splits what is left', () => {
        const cm = manager([
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age', width: '80' },
          { key: 'dept', label: 'Department' },
        ]);
        cm.fitVisibleColumns(280);
        const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
        expect(byKey.age).toBe(80);
        expect(byKey.name).toBe(100);
        expect(byKey.dept).toBe(100);
      });

      it('squishes declared widths too when they alone overflow the frame', () => {
        // Nothing is left to give: every column was authored, and together they
        // want 600 in a 300 frame. Scrolling is not on the table, so all three
        // scale down proportionally.
        const cm = manager([
          { key: 'name', label: 'Name', width: '300' },
          { key: 'age', label: 'Age', width: '100' },
          { key: 'dept', label: 'Department', width: '200' },
        ]);
        expect(cm.fitVisibleColumns(300)).toBe(true);
        expect(cm.getVisibleColumns().map(c => c.width)).toEqual([150, 50, 100]);
        expect(total(cm)).toBe(300);
      });

      it('settles — a second fit at the same width reports no change', () => {
        const cm = manager([
          { key: 'name', label: 'Name', width: '300' },
          { key: 'age', label: 'Age', width: '100' },
          { key: 'dept', label: 'Department', width: '170' },
        ]);
        cm.fitVisibleColumns(311);
        expect(cm.fitVisibleColumns(311)).toBe(false);
      });

      it('stops at the legibility floor when even squishing cannot fit', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(12);
        const floor = TableColumnManager.SQUISH_MIN_WIDTH;
        expect(cm.getVisibleColumns().map(c => c.width)).toEqual([floor, floor, floor]);
      });

      it('ignores a frame that has not been laid out yet', () => {
        const cm = manager(COLUMNS);
        expect(cm.fitVisibleColumns(0)).toBe(false);
        expect(cm.getVisibleColumns().map(c => c.width)).toEqual([150, 150, 150]);
      });

      it('leaves scroll mode exactly as it was', () => {
        const cm = manager(COLUMNS.map(c => ({ ...c, minWidth: 120 })), 'scroll');
        cm.fitVisibleColumns(240);
        expect(cm.getVisibleColumns().map(c => c.width)).toEqual([120, 120, 120]);
      });
    });

    describe('resizing rebalances inside the frame', () => {
      const drag = (cm: TableColumnManager, key: string, from: number, to: number) => {
        cm.startResize(key, from);
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: to }));
        document.dispatchEvent(new MouseEvent('mouseup'));
      };

      it('takes the width the drag gained out of the other columns', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(300);              // 100 / 100 / 100
        drag(cm, 'name', 0, 60);                // name wants 160
        const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
        expect(byKey.name).toBe(160);
        expect(total(cm)).toBe(300);
        expect(byKey.age).toBe(byKey.dept);
      });

      it('gives the width back when the drag shrinks a column', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(300);
        drag(cm, 'age', 0, -60);
        const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
        expect(byKey.age).toBe(40);
        expect(total(cm)).toBe(300);
      });

      it('never lets one column eat the frame', () => {
        const cm = manager(COLUMNS);
        cm.fitVisibleColumns(300);
        drag(cm, 'name', 0, 5000);
        const floor = TableColumnManager.SQUISH_MIN_WIDTH;
        const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
        expect(byKey.name).toBe(300 - 2 * floor);
        expect(byKey.age).toBe(floor);
        expect(byKey.dept).toBe(floor);
        expect(total(cm)).toBe(300);
      });

      it('leaves scroll-mode resizing free to overflow the frame', () => {
        const cm = manager(COLUMNS, 'scroll');
        cm.fitVisibleColumns(300);
        drag(cm, 'name', 0, 400);
        const byKey = Object.fromEntries(cm.getVisibleColumns().map(c => [c.key, c.width]));
        expect(byKey.name).toBe(500);
        expect(byKey.age).toBe(100);
        expect(total(cm)).toBe(700);
      });
    });
  });
});
