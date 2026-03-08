import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/spreadsheet/snice-spreadsheet';
import type { SniceSpreadsheetElement } from '../../components/spreadsheet/snice-spreadsheet.types';

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
});
