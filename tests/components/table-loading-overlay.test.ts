/**
 * SNICE-142 — snice-table must offer a loading affordance while rows are
 * present ("keep the old rows, show a spinner" refetch), not only dim them.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const DATA = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

async function makeTable(): Promise<any> {
  const table = await createComponent<any>('snice-table');
  table.columns = [{ key: 'name', label: 'Name', type: 'text' }];
  table.data = DATA.map(r => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

describe('snice-table loading affordance with rows (SNICE-142)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
  });

  it('shows a spinner overlay while loading with existing rows, and keeps the rows', async () => {
    table = await makeTable();

    table.loading = true;
    await wait(30);

    const overlay = table.shadowRoot.querySelector('[part~="loading-overlay"]');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('snice-progress')).toBeTruthy();
    // Rows stay on screen during the refetch
    expect(table.shadowRoot.querySelectorAll('tbody tr[data-index]').length).toBe(DATA.length);

    table.loading = false;
    await wait(30);

    expect(table.shadowRoot.querySelector('[part~="loading-overlay"]')).toBeNull();
    expect(table.shadowRoot.querySelectorAll('tbody tr[data-index]').length).toBe(DATA.length);
  });

  it('keeps the full-row spinner for the no-data load', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = [{ key: 'name', label: 'Name', type: 'text' }];
    table.loading = true;
    table.renderHeader();
    table.renderBody();
    await wait(20);

    // Empty-table loading uses the existing single message row, not the overlay
    expect(table.shadowRoot.querySelector('.no-data snice-progress')).toBeTruthy();
    expect(table.shadowRoot.querySelector('[part~="loading-overlay"]')).toBeNull();
  });
});
