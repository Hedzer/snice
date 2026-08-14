// Field report (snice 7.5.0, finding 2): in remote mode, column keys match the
// server's sort whitelist rather than row fields, and valueGetter bridges the
// display. The renderBody fix covered the initial render path; this guards the
// remote flow end-to-end INCLUDING re-delivery, where the render-path
// reconciler updates recycled row DOM in place instead of rebuilding it.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

describe('snice-table remote mode + valueGetter', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
  });

  function respondWith(rows: any[]) {
    const handler = (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.resolve({ data: rows });
    };
    table.addEventListener('@request/table/data', handler, { once: true });
  }

  function cellTexts(): string[] {
    const cells = [...table.shadowRoot.querySelectorAll('tbody td[data-key="company"]')] as HTMLElement[];
    return cells.map(td => (td.querySelector('[value]')?.getAttribute('value')
      ?? td.textContent?.trim() ?? ''));
  }

  async function makeRemoteTable() {
    table = await createComponent<any>('snice-table');
    table.mode = 'remote';
    table.columns = [
      { key: 'company', label: 'Company', type: 'text', sortable: true,
        valueGetter: (_v: any, row: any) => row.companyName },
    ];
    table.columnManager.initialize(table.columns, table);
    await wait(10);
    table.renderHeader();
  }

  it('renders getter-derived values for server-delivered rows', async () => {
    await makeRemoteTable();

    respondWith([{ companyName: 'Acme' }, { companyName: 'Globex' }]);
    table.getTableData();
    await wait(50);

    expect(cellTexts()).toEqual(['Acme', 'Globex']);
  });

  it('renders getter-derived values when re-delivery recycles row DOM', async () => {
    await makeRemoteTable();

    const first = [{ companyName: 'Acme' }, { companyName: 'Globex' }];
    respondWith(first);
    table.getTableData();
    await wait(50);
    expect(cellTexts()).toEqual(['Acme', 'Globex']);

    // Same row objects again (reconciler reuses their <tr>s) plus a new one.
    respondWith([...first, { companyName: 'Initech' }]);
    table.getTableData();
    await wait(50);
    expect(cellTexts()).toEqual(['Acme', 'Globex', 'Initech']);

    // Mutated re-delivery: same identities, changed field — the in-place cell
    // update must also go through the getter.
    const mutated = [{ ...first[0], companyName: 'Acme Corp' }, first[1]];
    respondWith(mutated);
    table.getTableData();
    await wait(50);
    expect(cellTexts()).toEqual(['Acme Corp', 'Globex']);
  });
});
