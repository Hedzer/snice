import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/spreadsheet/snice-spreadsheet';
import type { SniceSpreadsheetElement } from '../../packages/components/src/spreadsheet/snice-spreadsheet.types';

const SAMPLE_DATA = [
  ['Name', 'Age', 'City'],
  ['Alice', 30, 'NYC'],
  ['Bob', 25, 'LA'],
  ['Charlie', 35, 'Chicago'],
];

const SAMPLE_COLUMNS = [
  { header: 'Name' },
  { header: 'Age', type: 'number' as const },
  { header: 'City' },
];

describe('snice-spreadsheet', () => {
  let sheet: SniceSpreadsheetElement;

  afterEach(() => {
    if (sheet) {
      removeComponent(sheet as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render spreadsheet element', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      expect(sheet).toBeTruthy();
      expect(sheet.tagName).toBe('SNICE-SPREADSHEET');
    });

    it('should have default properties', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      expect(sheet.data).toEqual([]);
      expect(sheet.columns).toEqual([]);
      expect(sheet.readonly).toBe(false);
    });

    it('should render wrapper element', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      const wrapper = queryShadow(sheet as HTMLElement, '.spreadsheet');
      expect(wrapper).toBeTruthy();
    });

    it('should render formula bar', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      const formulaBar = queryShadow(sheet as HTMLElement, '.spreadsheet-formula-bar');
      expect(formulaBar).toBeTruthy();
    });
  });

  describe('data rendering', () => {
    it('should render table from data', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = SAMPLE_DATA.map(r => [...r]);
      await wait(50);

      const table = queryShadow(sheet as HTMLElement, '.spreadsheet-table');
      expect(table).toBeTruthy();
    });

    it('should render correct number of rows', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = SAMPLE_DATA.map(r => [...r]);
      await wait(50);

      const rows = queryShadowAll(sheet as HTMLElement, '.spreadsheet-td[data-row]');
      // 4 rows * 3 cols = 12 cells
      expect(rows.length).toBe(12);
    });

    it('should update when data changes', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = SAMPLE_DATA.map(r => [...r]);
      await wait(50);

      let cells = queryShadowAll(sheet as HTMLElement, '.spreadsheet-td');
      expect(cells.length).toBe(12);

      sheet.data = [['A', 'B'], ['C', 'D']];
      await wait(50);

      cells = queryShadowAll(sheet as HTMLElement, '.spreadsheet-td');
      expect(cells.length).toBe(4);
    });

    it('should show empty state when no data', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      await wait(50);

      const empty = queryShadow(sheet as HTMLElement, '.spreadsheet-empty');
      expect(empty).toBeTruthy();
    });
  });

  describe('public API', () => {
    it('should get cell value', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = [['Hello', 42], ['World', 99]];
      await wait(50);

      expect(sheet.getCell(0, 0)).toBe('Hello');
      expect(sheet.getCell(0, 1)).toBe(42);
      expect(sheet.getCell(1, 0)).toBe('World');
    });

    it('should set cell value', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = [['A', 'B'], ['C', 'D']];
      await wait(50);

      sheet.setCell(0, 0, 'Updated');
      expect(sheet.getCell(0, 0)).toBe('Updated');
    });

    it('should get data copy', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = [['A', 'B']];
      await wait(50);

      const data = sheet.getData();
      expect(data).toEqual([['A', 'B']]);
      // Should be a copy
      data[0][0] = 'Modified';
      expect(sheet.getCell(0, 0)).toBe('A');
    });

    it('should set data', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.setData([['X', 'Y'], ['Z', 'W']]);
      await wait(50);

      expect(sheet.getCell(0, 0)).toBe('X');
      expect(sheet.getCell(1, 1)).toBe('W');
    });
  });

  describe('events', () => {
    it('should emit cell-change when cell is set', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.data = [['A', 'B']];
      await wait(50);

      let changeEvent: CustomEvent | null = null;
      sheet.addEventListener('cell-change', (e) => {
        changeEvent = e as CustomEvent;
      });

      sheet.setCell(0, 0, 'New');

      expect(changeEvent).toBeTruthy();
      expect(changeEvent!.detail.row).toBe(0);
      expect(changeEvent!.detail.col).toBe(0);
      expect(changeEvent!.detail.value).toBe('New');
      expect(changeEvent!.detail.oldValue).toBe('A');
    });
  });

  describe('columns', () => {
    it('should render column headers', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      sheet.columns = SAMPLE_COLUMNS;
      sheet.data = SAMPLE_DATA.map(r => [...r]);
      await wait(50);

      const headers = queryShadowAll(sheet as HTMLElement, '.spreadsheet-th');
      expect(headers.length).toBe(3);
    });
  });

  describe('context menu', () => {
    it('should have context menu element', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet');
      const menu = queryShadow(sheet as HTMLElement, '.spreadsheet-context-menu');
      expect(menu).toBeTruthy();
      expect(menu?.hidden).toBe(true);
    });
  });

  describe('readonly', () => {
    it('should accept readonly property', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        readonly: true
      });
      expect(sheet.readonly).toBe(true);
    });
  });

  describe('handleDragMove perf — uses elementFromPoint, not per-cell getBoundingClientRect', () => {
    it('no getBoundingClientRect calls during a drag mousemove', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: SAMPLE_DATA,
        columns: SAMPLE_COLUMNS,
      });
      await wait(40);

      const sr = (sheet as HTMLElement).shadowRoot!;
      // Stub elementFromPoint on the shadowRoot to return a known cell.
      const targetCell = sr.querySelector('.spreadsheet-td[data-row="2"][data-col="0"]') as HTMLElement | null;
      expect(targetCell).toBeTruthy();
      (sr as any).elementFromPoint = () => targetCell;

      // Spy on Element.prototype.getBoundingClientRect — the old impl called
      // it on every cell per mousemove; the new impl must not call it at all.
      const origGetRect = Element.prototype.getBoundingClientRect;
      let rectCallCount = 0;
      Element.prototype.getBoundingClientRect = function () {
        rectCallCount++;
        return origGetRect.call(this);
      };

      try {
        // Simulate a drag: mousedown on a starting cell (sets isDragging=true)
        const startCell = sr.querySelector('.spreadsheet-td[data-row="0"][data-col="0"]') as HTMLElement;
        startCell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0, clientX: 50, clientY: 50 }));

        const before = rectCallCount;
        // Now fire 10 mousemoves on document — handler is bound there
        for (let i = 0; i < 10; i++) {
          document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100 + i, clientY: 100 + i }));
        }
        const dragRectCalls = rectCallCount - before;

        // Old impl: 10 moves × ~12 cells = ~120 calls. New impl: 0.
        expect(dragRectCalls).toBe(0);

        // And the selection must still update via elementFromPoint hit-test:
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      } finally {
        Element.prototype.getBoundingClientRect = origGetRect;
      }
    });

    it('formats numbers with default 6-digit max (kills floating-point noise)', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [[126.66666666666667]],
        columns: [{ header: 'X', type: 'number' }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent || '').not.toContain('666666666666');
      expect(cell?.textContent || '').toMatch(/126[.,]666667/);
    });

    it('honors column.format.decimals for number type', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [[42.5]],
        columns: [{ header: 'X', type: 'number', format: { decimals: 3 } }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent?.trim()).toMatch(/42[.,]500/);
    });

    it('formats currency with locale + currency code', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [[1234.5]],
        columns: [{ header: 'Price', type: 'currency', format: { currency: 'USD', locale: 'en-US' } }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent || '').toContain('$');
      expect(cell?.textContent || '').toContain('1,234.50');
    });

    it('formats percent values (0.42 → 42%)', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [[0.42]],
        columns: [{ header: 'Rate', type: 'percent', format: { locale: 'en-US' } }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent?.trim()).toBe('42%');
    });

    it('formats dates via Intl.DateTimeFormat (en-US medium → "Mar 15, 2022")', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['2022-03-15']],
        columns: [{ header: 'D', type: 'date', format: { locale: 'en-US', dateStyle: 'medium' } }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent?.trim()).toMatch(/Mar 15, 2022/);
    });

    it('falls back gracefully when number cell holds non-numeric value', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['not a number']],
        columns: [{ header: 'X', type: 'number' }],
      });
      await wait(40);
      const cell = (sheet as HTMLElement).shadowRoot!.querySelector('.spreadsheet-td[data-row="0"][data-col="0"] .spreadsheet-cell');
      expect(cell?.textContent?.trim()).toBe('not a number');
    });

    it('fill handle is visible when a cell is selected and editable', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: SAMPLE_DATA,
        columns: SAMPLE_COLUMNS,
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const cell = sr.querySelector('.spreadsheet-td[data-row="1"][data-col="1"]') as HTMLElement;
      cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);
      const handle = sr.querySelector('.spreadsheet-fill-handle') as HTMLElement;
      expect(handle.hidden).toBe(false);
    });

    it('fill handle is hidden when readonly', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: SAMPLE_DATA,
        columns: SAMPLE_COLUMNS,
        readonly: true,
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const cell = sr.querySelector('.spreadsheet-td[data-row="0"][data-col="0"]') as HTMLElement;
      cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);
      const handle = sr.querySelector('.spreadsheet-fill-handle') as HTMLElement;
      expect(handle.hidden).toBe(true);
    });

    it('fill drag copies a single source value down into target cells', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['x', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']],
        columns: [{ header: 'A' }, { header: 'B' }, { header: 'C' }, { header: 'D' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const src = sr.querySelector('.spreadsheet-td[data-row="0"][data-col="0"]') as HTMLElement;
      src.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      src.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);

      const target = sr.querySelector('.spreadsheet-td[data-row="3"][data-col="0"]') as HTMLElement;
      (sr as any).elementFromPoint = () => target;

      const handle = sr.querySelector('.spreadsheet-fill-handle') as HTMLElement;
      handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 200 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);

      expect(sheet.data[1][0]).toBe('x');
      expect(sheet.data[2][0]).toBe('x');
      expect(sheet.data[3][0]).toBe('x');
      expect(sheet.data[1][1]).toBe('');
    });

    it('fill drag cycles a 2-cell source pattern across the target', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [
          ['a', '', '', '', ''],
          ['b', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
        ],
        columns: Array.from({ length: 5 }, (_, i) => ({ header: `c${i}` })),
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const c00 = sr.querySelector('.spreadsheet-td[data-row="0"][data-col="0"]') as HTMLElement;
      c00.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      const c10 = sr.querySelector('.spreadsheet-td[data-row="1"][data-col="0"]') as HTMLElement;
      c10.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0, shiftKey: true }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);

      const target = sr.querySelector('.spreadsheet-td[data-row="4"][data-col="0"]') as HTMLElement;
      (sr as any).elementFromPoint = () => target;

      const handle = sr.querySelector('.spreadsheet-fill-handle') as HTMLElement;
      handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 300 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await wait(20);

      expect(sheet.data[2][0]).toBe('a');
      expect(sheet.data[3][0]).toBe('b');
      expect(sheet.data[4][0]).toBe('a');
    });

    it('frozen rows: cells in first N rows get spreadsheet-td--fixed-row class', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['a','b'],['c','d'],['e','f']],
        columns: [{ header: 'X' }, { header: 'Y' }],
        'fixed-rows-top': 1,
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const fixedRow0Cells = sr.querySelectorAll('tr[aria-rowindex="2"] .spreadsheet-td--fixed-row');
      const fixedRow1Cells = sr.querySelectorAll('tr[aria-rowindex="3"] .spreadsheet-td--fixed-row');
      expect(fixedRow0Cells.length).toBe(2);
      expect(fixedRow1Cells.length).toBe(0);
    });

    it('frozen cols: cells in first N cols get spreadsheet-td--fixed-col class', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['a','b','c']],
        columns: [{ header: 'X' }, { header: 'Y' }, { header: 'Z' }],
        'fixed-columns-left': 2,
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const fixedColCells = sr.querySelectorAll('.spreadsheet-td--fixed-col');
      expect(fixedColCells.length).toBe(2);
      expect(sr.querySelector('.spreadsheet-td[data-col="0"]')?.classList.contains('spreadsheet-td--fixed-col')).toBe(true);
      expect(sr.querySelector('.spreadsheet-td[data-col="2"]')?.classList.contains('spreadsheet-td--fixed-col')).toBe(false);
    });

    it('frozen row-num cells get sticky top inline + raised z-index class', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['a'],['b']],
        columns: [{ header: 'X' }],
        'fixed-rows-top': 1,
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const rn0 = sr.querySelector('.spreadsheet-row-num[data-row="0"]') as HTMLElement;
      const rn1 = sr.querySelector('.spreadsheet-row-num[data-row="1"]') as HTMLElement;
      expect(rn0.classList.contains('spreadsheet-row-num--fixed-row')).toBe(true);
      expect(rn0.style.top).toBeTruthy();
      expect(rn1.classList.contains('spreadsheet-row-num--fixed-row')).toBe(false);
    });

    it('Ctrl+F opens find bar (replace row hidden)', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['hello'], ['world'], ['hello again']],
        columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const grid = sr.querySelector('.spreadsheet') as HTMLElement;
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const bar = sr.querySelector('.spreadsheet-find-bar') as HTMLElement;
      const replaceRow = sr.querySelector('.spreadsheet-find-replace-row') as HTMLElement;
      expect(bar.hidden).toBe(false);
      expect(replaceRow.hidden).toBe(true);
    });

    it('Ctrl+H opens find bar with replace row visible', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['x']],
        columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      const grid = sr.querySelector('.spreadsheet') as HTMLElement;
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const replaceRow = sr.querySelector('.spreadsheet-find-replace-row') as HTMLElement;
      expect(replaceRow.hidden).toBe(false);
    });

    it('typing in find input highlights matching cells', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['hello'], ['world'], ['hello again']],
        columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      (sr.querySelector('.spreadsheet') as HTMLElement)
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const input = sr.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await wait(20);
      expect(sr.querySelectorAll('.spreadsheet-td.find-match').length).toBe(2);
      expect(sr.querySelector('.spreadsheet-find-count')?.textContent).toBe('1 / 2');
    });

    it('case-insensitive match by default; case toggle restricts', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['Hello'], ['hello'], ['HELLO']],
        columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      (sr.querySelector('.spreadsheet') as HTMLElement)
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const input = sr.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await wait(20);
      expect(sr.querySelectorAll('.spreadsheet-td.find-match').length).toBe(3);

      // Flip case-sensitive
      const caseToggle = sr.querySelector('.spreadsheet-find-toggle input') as HTMLInputElement;
      caseToggle.checked = true;
      caseToggle.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      await wait(20);
      expect(sr.querySelectorAll('.spreadsheet-td.find-match').length).toBe(1);
    });

    it('Replace All replaces every match', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['cat one'], ['cat two'], ['dog']],
        columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      (sr.querySelector('.spreadsheet') as HTMLElement)
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const findInput = sr.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      findInput.value = 'cat';
      findInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await wait(20);
      const replaceInput = sr.querySelector('.spreadsheet-replace-input') as HTMLInputElement;
      replaceInput.value = 'CAT';
      const replaceAllBtn = sr.querySelector('[data-find-action="replace-all"]') as HTMLElement;
      replaceAllBtn.click();
      await wait(20);
      expect(sheet.data[0][0]).toBe('CAT one');
      expect(sheet.data[1][0]).toBe('CAT two');
      expect(sheet.data[2][0]).toBe('dog');
    });

    it('Escape closes find bar and clears highlights', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: [['x']], columns: [{ header: 'A' }],
      });
      await wait(40);
      const sr = (sheet as HTMLElement).shadowRoot!;
      (sr.querySelector('.spreadsheet') as HTMLElement)
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, composed: true }));
      await wait(20);
      const input = sr.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.value = 'x';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await wait(20);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
      await wait(20);
      expect((sr.querySelector('.spreadsheet-find-bar') as HTMLElement).hidden).toBe(true);
      expect(sr.querySelectorAll('.spreadsheet-td.find-match').length).toBe(0);
    });

    it('drag updates selectionEnd to the cell under the pointer', async () => {
      sheet = await createComponent<SniceSpreadsheetElement>('snice-spreadsheet', {
        data: SAMPLE_DATA,
        columns: SAMPLE_COLUMNS,
      });
      await wait(40);

      const sr = (sheet as HTMLElement).shadowRoot!;
      const startCell = sr.querySelector('.spreadsheet-td[data-row="0"][data-col="0"]') as HTMLElement;
      const targetCell = sr.querySelector('.spreadsheet-td[data-row="2"][data-col="2"]') as HTMLElement;
      (sr as any).elementFromPoint = () => targetCell;

      startCell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0, clientX: 10, clientY: 10 }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
      await wait(10);

      expect((sheet as any).selectionEnd).toEqual({ row: 2, col: 2 });

      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
  });
});
