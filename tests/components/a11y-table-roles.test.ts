import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('table: column headers have scope="col" and aria-sort', () => {
  async function buildTable(columns: any[], data: any[], sortable = true): Promise<any> {
    await import('../../packages/components/src/table/snice-table');
    const el = document.createElement('snice-table') as any;
    el.sortable = sortable;
    document.body.appendChild(el);
    await el.ready;
    el.columns = columns;
    el.data = data;
    el.columnManager.initialize(columns, el);
    await wait(10);
    el.renderHeader();
    el.renderBody();
    await wait(50);
    return el;
  }

  it('every <th> in header has scope="col"', async () => {
    const el = await buildTable(
      [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'age', label: 'Age', sortable: true },
      ],
      [{ name: 'A', age: 1 }]
    );

    const ths = Array.from(el.shadowRoot.querySelectorAll('thead th')) as HTMLElement[];
    expect(ths.length).toBeGreaterThan(0);
    const missingScope = ths.filter(th => th.getAttribute('scope') !== 'col');
    expect(missingScope.length).toBe(0);
  });

  it('sortable <th> carries aria-sort', async () => {
    const el = await buildTable(
      [{ key: 'x', label: 'X', sortable: true }],
      [{ x: 1 }]
    );

    const th = el.shadowRoot.querySelector('thead th[data-key="x"]') as HTMLElement;
    expect(th).toBeTruthy();
    const sort = th.getAttribute('aria-sort');
    expect(['none', 'ascending', 'descending']).toContain(sort);
  });
});
