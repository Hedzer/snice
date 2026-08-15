/**
 * Regression coverage for what the zero-row LOADING state actually tells a
 * user.
 *
 * Field report (table showcase, "Loading + Empty States"): the loading card
 * painted a ~14px ring, near-black on a near-black surface, with no text. The
 * state was technically present — `querySelector('snice-progress')` succeeded —
 * and communicated nothing: no size, no contrast, no words, and nothing for a
 * screen reader to announce.
 *
 * tests/components/table-loading-empty-states.test.ts pins WHICH state the body
 * shows. This suite pins whether that state is legible once shown, so the two
 * cannot both pass on a spinner nobody can see. Paint (contrast, drawn size) is
 * proved in tests/live/components/table/table-stripes-and-loading.spec.ts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

const COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'text' },
];

let table: any;

afterEach(() => {
  if (table) removeComponent(table as HTMLElement);
  table = null;
});

async function loadingTable(rows: any[] = []): Promise<any> {
  table = await createComponent<any>('snice-table');
  table.columns = COLUMNS;
  table.data = rows;
  table.unsortedData = [...rows];
  table.columnManager.initialize(COLUMNS, table);
  await wait(20);
  table.renderHeader();
  table.renderBody();
  await wait(40);
  table.loading = true;
  await wait(60);
  return table;
}

const messageCell = (el: any) => el.shadowRoot.querySelector('tbody td.no-data') as HTMLElement | null;

describe('snice-table zero-row loading affordance', () => {
  it('wraps the spinner in a live region a screen reader can announce', async () => {
    await loadingTable();
    const status = messageCell(table)?.querySelector('[role="status"]') as HTMLElement;

    expect(status).toBeTruthy();
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('says "Loading" in words next to the spinner', async () => {
    await loadingTable();
    const status = messageCell(table)?.querySelector('[role="status"]') as HTMLElement;

    expect(status.textContent?.trim()).toMatch(/loading/i);
  });

  it('draws the spinner large enough to read as a spinner', async () => {
    await loadingTable();
    const spinner = messageCell(table)?.querySelector('snice-progress') as HTMLElement;

    expect(spinner).toBeTruthy();
    expect(spinner.getAttribute('variant')).toBe('circular');
    expect(spinner.hasAttribute('indeterminate')).toBe(true);
    // `small` is the 24px ring the field report could not see. The zero-row
    // body is an empty rectangle — it has room for the real thing.
    expect(spinner.getAttribute('size')).not.toBe('small');
    expect(['medium', 'large']).toContain(spinner.getAttribute('size'));
  });

  it('tears the whole block down when loading ends', async () => {
    await loadingTable();
    expect(messageCell(table)?.querySelector('[role="status"]')).toBeTruthy();

    const rows = [{ name: 'a', role: 'b' }];
    table.unsortedData = [...rows];
    table.data = rows;
    table.loading = false;
    await wait(60);

    expect(messageCell(table)).toBeNull();
    expect(table.shadowRoot.querySelector('[role="status"]')).toBeNull();
  });

  it('announces the refetch overlay too, when rows are already on screen', async () => {
    // With rows on screen the body dims and an overlay spinner appears instead
    // of the message row. A sighted user sees the dim; everyone else got
    // nothing at all.
    await loadingTable([{ name: 'a', role: 'b' }, { name: 'c', role: 'd' }]);
    const overlay = table.shadowRoot.querySelector('.table-loading-overlay') as HTMLElement;

    expect(overlay).toBeTruthy();
    expect(overlay.getAttribute('role')).toBe('status');
    expect(overlay.getAttribute('aria-live')).toBe('polite');
    expect(overlay.getAttribute('aria-label')).toMatch(/loading/i);
  });
});
