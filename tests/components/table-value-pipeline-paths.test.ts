// The documented value pipeline — `valueGetter` derives the working value,
// then `formatter` (row-aware) or `valueFormatter` produce the display text —
// must be the same on every path that reads a row: the table's own cells, the
// declarative <snice-row>, and CSV / clipboard export.
//
// Docs: docs/components/table.md ("Value pipeline"), docs/ai/components/table.md
// (ColumnDefinition: `valueGetter` "runs for display, sort, aggregation").
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';
import '../../packages/components/src/table/snice-row';

const COLUMNS = [
  { key: 'company', label: 'Company', type: 'text',
    valueGetter: (_v: any, row: any) => row.companyName },
  { key: 'amount', label: 'Amount', type: 'number',
    formatter: (v: any) => `#${v}`,
    valueFormatter: (v: any) => `!${v}` },
];

const ROWS = () => [
  { companyName: 'Acme', amount: 10 },
  { companyName: 'Globex', amount: 20 },
];

function cellValues(table: any, key: string): string[] {
  const cells = [...table.shadowRoot.querySelectorAll(`tbody td[data-key="${key}"]`)] as HTMLElement[];
  return cells.map(td => td.querySelector('[value]')?.getAttribute('value') ?? td.textContent?.trim() ?? '');
}

function displayTexts(table: any, key: string): string[] {
  const cells = [...table.shadowRoot.querySelectorAll(`tbody td[data-key="${key}"]`)] as HTMLElement[];
  return cells.map(td => {
    const host = td.querySelector('[value]') as any;
    const content = host?.shadowRoot?.querySelector('[part~="content"]');
    return String(content?.textContent ?? td.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
}

async function makeTable(columns: any[] = COLUMNS, data: any[] = ROWS()) {
  const table = await createComponent<any>('snice-table');
  table.columns = columns;
  table.data = data;
  await wait(30);
  return table;
}

describe('table value pipeline — rendered cells', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  it('reflects the display value into the cell value channel', async () => {
    table = await makeTable();
    expect(cellValues(table, 'company')).toEqual(['Acme', 'Globex']);
    // formatter wins over valueFormatter, in the value channel and on screen.
    expect(cellValues(table, 'amount')).toEqual(['#10', '#20']);
    expect(displayTexts(table, 'amount')).toEqual(['#10', '#20']);
  });

  it('falls back to valueFormatter when no formatter is declared', async () => {
    table = await makeTable([{ key: 'amount', label: 'Amount', type: 'number',
      valueFormatter: (v: any) => `!${v}` }]);
    expect(cellValues(table, 'amount')).toEqual(['!10', '!20']);
    expect(displayTexts(table, 'amount')).toEqual(['!10', '!20']);
  });

  it('repaints cells of a row that was mutated in place and re-delivered', async () => {
    const rows = ROWS();
    table = await makeTable(COLUMNS, rows);

    rows[0].companyName = 'Acme Corp';
    rows[0].amount = 11;
    table.data = [...rows]; // same row identities — the reconciler recycles them
    await wait(30);

    expect(cellValues(table, 'company')).toEqual(['Acme Corp', 'Globex']);
    expect(cellValues(table, 'amount')).toEqual(['#11', '#20']);
  });
});

describe('table value pipeline — sorting', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  it('applies the active sort to newly assigned data', async () => {
    table = await makeTable(COLUMNS, []);
    table.toggleSort('company');
    await wait(30);

    table.data = [{ companyName: 'Globex', amount: 1 }, { companyName: 'Acme', amount: 2 }];
    await wait(30);

    expect(cellValues(table, 'company')).toEqual(['Acme', 'Globex']);
  });

  it('hands a custom comparator the valueGetter-derived value', async () => {
    table = await makeTable(COLUMNS, [
      { companyName: 'Umbrella', amount: 1 },
      { companyName: 'Acme', amount: 2 },
      { companyName: 'Globex', amount: 3 },
    ]);
    const seen: any[] = [];
    table.setSortComparator('company', (a: any, b: any, direction: 'asc' | 'desc') => {
      seen.push(a, b);
      const cmp = String(a).length - String(b).length;
      return direction === 'asc' ? cmp : -cmp;
    });
    table.toggleSort('company');
    await wait(30);

    expect(seen.every(v => typeof v === 'string')).toBe(true);
    expect(cellValues(table, 'company')).toEqual(['Acme', 'Globex', 'Umbrella']);
  });
});

describe('table value pipeline — declarative <snice-row>', () => {
  let row: any;
  afterEach(() => { if (row) removeComponent(row); row = undefined; });

  it('runs valueGetter and the display formatter for slotted rows', async () => {
    row = await createComponent<any>('snice-row');
    row.columns = COLUMNS;
    row.data = { companyName: 'Acme', amount: 10 };
    await wait(40);

    const cells = [...row.shadowRoot.querySelectorAll('[data-column-index]')] as any[];
    expect(cells).toHaveLength(2);
    expect(cells[0].value).toBe('Acme');
    expect(cells[1].value).toBe('#10');
  });
});

describe('table value pipeline — export', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = undefined; });

  it('copies the getter-derived value, formatted or raw', async () => {
    table = await makeTable();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await table.copyToClipboard();
    expect(writeText).toHaveBeenLastCalledWith('Acme\t#10\nGlobex\t#20');

    await table.copyToClipboard({ useFormatted: false });
    expect(writeText).toHaveBeenLastCalledWith('Acme\t10\nGlobex\t20');
  });

  it('writes the getter-derived value to CSV', async () => {
    table = await makeTable();
    const chunks: string[] = [];
    const OriginalBlob = globalThis.Blob;
    class CapturingBlob extends OriginalBlob {
      constructor(parts: any[], options?: any) {
        chunks.push(parts.join(''));
        super(parts, options);
      }
    }
    (globalThis as any).Blob = CapturingBlob;
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    try {
      table.exportCSV();
    } finally {
      (globalThis as any).Blob = OriginalBlob;
    }

    expect(chunks[0]).toContain('Acme');
    expect(chunks[0]).toContain('Globex');
    expect(chunks[0]).not.toContain('undefined');
  });
});
