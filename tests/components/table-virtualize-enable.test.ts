import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

/**
 * `virtualize` requested but virtualizer not yet enabled must never produce
 * an empty table: renderBody self-heals by running setup, then windows.
 * (Real-browser finding: property-assigned virtualize after ready rendered
 * ZERO rows — the setup only ran via a one-shot gate at @ready.)
 */
describe('snice-table virtualize enablement', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  const COLS = [{ key: 'n', label: 'N', type: 'text' }];
  const DATA = (n: number) => Array.from({ length: n }, (_, i) => ({ n: 'r' + i }));

  it('virtualize set as a PROPERTY after ready still renders rows', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.virtualize = true;
    table.rowHeight = 36;
    table.setData(DATA(500));
    // current documented API: body fill is explicit (auto-render is Phase 2)
    table.renderBody();
    await wait(50);

    const rows = table.shadowRoot.querySelectorAll('tbody tr:not(.virtual-spacer):not(.pinned-row)').length;
    expect(rows).toBeGreaterThan(0);
    expect(table.virtualizer.isEnabled()).toBe(true);
  });

  it('virtualized render is windowed, not the full dataset', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.virtualize = true;
    table.rowHeight = 36;
    table.setData(DATA(500));
    table.renderBody();
    await wait(50);

    const rows = table.shadowRoot.querySelectorAll('tbody tr:not(.virtual-spacer):not(.pinned-row)').length;
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(500);
  });

  it('virtualizer attaches to the element that actually scrolls (.table-frame)', async () => {
    table = await createComponent<any>('snice-table');
    table.setColumns(COLS);
    table.virtualize = true;
    table.setData(DATA(100));
    table.renderBody();
    await wait(30);

    const frame = table.shadowRoot.querySelector('.table-frame');
    expect(table.virtualizer.isEnabled()).toBe(true);
    // scroll math and listeners must live on the overflow:auto element
    expect((table.virtualizer as any).options.scrollContainer).toBe(frame);
  });
});
