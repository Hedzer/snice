/**
 * SNICE-141 — snice-table `list` mode must be drivable declaratively through
 * a `listRenderer` property (bindable via `.listRenderer=${fn}`), not only
 * through the imperative `setListViewRenderer(fn)`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const DATA = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'user' },
];

async function makeListTable(): Promise<any> {
  const table = await createComponent<any>('snice-table');
  table.columns = [{ key: 'name', label: 'Name', type: 'text' }];
  table.list = true;
  table.data = DATA.map(r => ({ ...r }));
  table.unsortedData = [...table.data];
  (table as any).columnManager.initialize(table.columns, table);
  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(20);
  return table;
}

function cardRenderer(row: any): HTMLElement {
  const card = document.createElement('div');
  card.className = 'roster-card';
  card.textContent = `${row.name} — ${row.role}`;
  return card;
}

describe('snice-table declarative list renderer (SNICE-141)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table as HTMLElement);
  });

  it('renders custom full-width rows from the listRenderer property', async () => {
    table = await makeListTable();
    table.listRenderer = cardRenderer;
    await wait(30);

    const cards = table.shadowRoot.querySelectorAll('tbody .roster-card');
    expect(cards.length).toBe(DATA.length);
    expect(cards[0].textContent).toBe('Alice — admin');
  });

  it('re-renders when the listRenderer property is replaced', async () => {
    table = await makeListTable();
    table.listRenderer = cardRenderer;
    await wait(30);

    table.listRenderer = (row: any) => {
      const el = document.createElement('span');
      el.className = 'name-only';
      el.textContent = row.name;
      return el;
    };
    await wait(30);

    expect(table.shadowRoot.querySelectorAll('tbody .roster-card').length).toBe(0);
    expect(table.shadowRoot.querySelectorAll('tbody .name-only').length).toBe(DATA.length);
  });

  it('keeps the imperative setListViewRenderer working', async () => {
    table = await makeListTable();
    table.setListViewRenderer(cardRenderer);
    await wait(30);

    expect(table.shadowRoot.querySelectorAll('tbody .roster-card').length).toBe(DATA.length);
  });
});
