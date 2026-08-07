/**
 * SNICE-140 — snice-table must expose `row`/`cell` CSS parts and cell
 * border/padding custom properties, so a page can match an established table
 * design (e.g. horizontal rules only) from outside the shadow root.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const DATA = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'user' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
];

async function makeTable(): Promise<any> {
  const table = await createComponent<any>('snice-table');
  table.columns = COLUMNS.map(c => ({ ...c }));
  table.data = DATA.map(r => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

describe('snice-table cell/row styling surface (SNICE-140)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
  });

  it('exposes part="row" on body rows and part="cell" on body cells', async () => {
    table = await makeTable();

    const rows = table.shadowRoot.querySelectorAll('tbody tr[part~="row"]');
    const cells = table.shadowRoot.querySelectorAll('tbody td[part~="cell"]');

    expect(rows.length).toBe(DATA.length);
    expect(cells.length).toBe(DATA.length * COLUMNS.length);
  });

  it('wires cell padding and borders through component CSS custom properties', async () => {
    table = await makeTable();

    const cssText = (table.styles() as any).cssText ?? String(table.styles());

    // Independent vertical/horizontal levers: removing grid lines must not
    // remove the horizontal rules.
    expect(cssText).toContain('--snice-table-cell-border');
    expect(cssText).toContain('--snice-table-row-border');
    expect(cssText).toContain('--snice-table-cell-padding');
    expect(cssText).toMatch(/border-right:\s*var\(--snice-table-cell-border,/);
    expect(cssText).toMatch(/border-bottom:\s*var\(--snice-table-row-border,/);
    expect(cssText).toMatch(/padding:\s*var\(--snice-table-cell-padding,/);
  });
});
