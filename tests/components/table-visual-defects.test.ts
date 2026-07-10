import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

/**
 * Visual defect ledger fixes (browser audit 2026-07-10):
 * 1. No focus indicator at rest — the grid paints [data-grid-focus] only
 *    after real user interaction, never on plain render.
 * 2. Pagination page-size select always contains and selects the CURRENT
 *    pageSize, even when it isn't in the pageSizes list.
 */
describe('table visual defects', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  const COLS = [
    { key: 'n', label: 'N', type: 'text' },
    { key: 'v', label: 'V', type: 'text' },
  ];
  const DATA = Array.from({ length: 12 }, (_, i) => ({ n: 'r' + i, v: 'x' + i }));

  it('renders no focus indicator at rest', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.setData(DATA);
    table.renderHeader();
    table.renderBody();
    await wait(30);

    expect(table.shadowRoot.querySelector('[data-grid-focus]')).toBeNull();
  });

  it('paints the focus indicator after a real keydown', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.setData(DATA);
    table.renderHeader();
    table.renderBody();
    await wait(30);

    table.shadowRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await wait(30);
    expect(table.shadowRoot.querySelector('[data-grid-focus]')).toBeTruthy();
  });

  it('re-render after interaction keeps the indicator (refresh restores it)', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.setData(DATA);
    table.renderHeader();
    table.renderBody();
    await wait(30);

    table.shadowRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await wait(30);
    table.renderBody();
    await wait(30);
    expect(table.shadowRoot.querySelector('[data-grid-focus]')).toBeTruthy();
  });

  it('page-size select includes and selects the current pageSize', async () => {
    table = await createComponent<any>('snice-table', { pagination: true });
    table.pageSize = 5; // deliberately NOT in the default pageSizes list
    table.setColumns(COLS);
    table.setData(DATA);
    table.renderHeader();
    table.renderBody();
    await wait(50);

    const select = table.shadowRoot.querySelector('.pagination__size-select');
    expect(select).toBeTruthy();
    const opt5 = select.querySelector('snice-option[value="5"]');
    expect(opt5).toBeTruthy();
    expect(select.value).toBe('5');
  });
});
