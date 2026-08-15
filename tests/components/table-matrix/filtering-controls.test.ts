// Filtering slice × the documented filter ENTRY POINTS the user actually
// reaches, plus the filtering-specific read API and event.
//
// The rest of the slice drives filtering through the programmatic model
// (setColumnFilter / setQuickFilter / setFilterModel). The component has four
// more documented ways in, and they do not all behave the same way:
//
//   `searchable`   docs/components/table.md:39 — debounced input; applies the
//                  local quick filter in local mode, updates `searchText` and
//                  requests `table/data` in remote mode.
//   `quickFilter`  docs/ai:80 — model-backed debounced input.
//   `headerFilters` docs/ai:14 — per-column inline inputs.
//   `filterable`   docs/ai:80 — the legacy remote selector, whose value rides
//                  the request payload as `selector`.
//
// Also covered here because they are filtering-specific and appear in no other
// file of the slice: `getFilterModel()` (docs/ai:94), the `filter-change` →
// `{filters}` event (docs/ai:114), and the zero-row `empty-state` contract
// (docs/components/table.md:1244/1419).
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { deliver, makeTable, wait } from './matrix-utils';
import {
  OracleName, PIPELINES, PipelineName, columnsFor, oracleFor, people,
  typeIntoHeaderFilter, typeIntoQuickFilter, typeIntoSearch,
} from './filtering-fixtures';

// ── The `searchable` control, local mode ───────────────────────────────────
// Documented: the debounced input applies the LOCAL QUICK FILTER, so the row
// set must match what setQuickFilter(text) would produce.
describe('filtering matrix — searchable control (local mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = columnsFor(pipeline as PipelineName);

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        const mk = async (rows: any[]) => {
          table = await makeTable({ columns, data: rows, attrs: { searchable: true } });
          table.searchDebounce = 0;
          table.renderControls();
          await wait(20);
          return table;
        };

        it('typing into the search control applies the local quick filter', async () => {
          const rows = people();
          await mk(rows);
          await check(rows);
          typeIntoSearch(table, 'sales');
          await wait(60);
          await check([rows[1], rows[4]]);
          expect(table.searchText).toBe('sales');
          expect(table.getFilterModel().quickFilter).toBe('sales');
        });

        it('clearing the search control restores every row', async () => {
          const rows = people();
          await mk(rows);
          typeIntoSearch(table, 'ops');
          await wait(60);
          await check([rows[3]]);
          typeIntoSearch(table, '');
          await wait(60);
          await check(rows);
          expect(table.getFilterModel().quickFilter).toBeUndefined();
        });

        it('the search control and setQuickFilter agree on the row set', async () => {
          const rows = people();
          await mk(rows);
          typeIntoSearch(table, 'eng');
          await wait(60);
          await check([rows[0], rows[2], rows[5]]);
          // Same term through the programmatic path, same three rows.
          table.setQuickFilter('eng');
          await check([rows[0], rows[2], rows[5]]);
        });
      });
    }
  }
});

// ── The `searchable` control, remote mode ──────────────────────────────────
// Documented: the input updates `searchText` and REQUESTS `table/data`; the
// response `{data,totalItems?}` is the display set. Unlike the filter-model
// path (MATRIX-filtering-3), the search path does not re-filter the server's
// answer client-side — these tests pin that difference so a change to either
// half of "search" cannot pass unnoticed.
describe('filtering matrix — searchable control (remote mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = columnsFor(pipeline as PipelineName);

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        const mk = async () => {
          table = await makeTable({ columns, remote: true, attrs: { searchable: true } });
          table.searchDebounce = 0;
          table.renderControls();
          await wait(20);
          return table;
        };

        it('typing sends the search term and renders the delivered rows', async () => {
          await mk();
          const rows = people();
          await deliver(table, rows);
          await check(rows);

          const payloads: any[] = [];
          table.addEventListener('@request/table/data', (e: any) => {
            payloads.push(e.detail.payload);
            e.detail.discovery.resolve();
            e.detail.data.resolve({ data: [rows[1], rows[4]] });
          }, { once: true });

          typeIntoSearch(table, 'bob');
          await wait(200);

          expect(table.searchText).toBe('bob');
          expect(payloads).toHaveLength(1);
          expect(payloads[0].search).toBe('bob');
          await check([rows[1], rows[4]]);
        });

        it('a server result the client predicate would reject still renders in full', async () => {
          await mk();
          const rows = people();
          await deliver(table, rows);

          // The server matched a field the table never received, so none of the
          // three returned rows contains 'q7-code' in any delivered column.
          table.addEventListener('@request/table/data', (e: any) => {
            e.detail.discovery.resolve();
            e.detail.data.resolve({ data: [rows[0], rows[2], rows[5]] });
          }, { once: true });

          typeIntoSearch(table, 'q7-code');
          await wait(200);

          await check([rows[0], rows[2], rows[5]]);
        });
      });
    }
  }
});

// ── The `quickFilter` control ──────────────────────────────────────────────
describe('filtering matrix — quickFilter control (local mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = columnsFor(pipeline as PipelineName);

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        it('typing into the quick-filter input drives the same model', async () => {
          const rows = people();
          table = await makeTable({ columns, data: rows, attrs: { 'quick-filter': true } });
          table.renderControls();
          await wait(20);
          await check(rows);

          typeIntoQuickFilter(table, 'sales');
          await wait(250);
          await check([rows[1], rows[4]]);
          expect(table.getFilterModel().quickFilter).toBe('sales');

          typeIntoQuickFilter(table, '');
          await wait(250);
          await check(rows);
        });
      });
    }
  }
});

// ── `headerFilters` inline inputs ──────────────────────────────────────────
describe('filtering matrix — headerFilters inputs (local mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    for (const oracle of ['value-attribute', 'display-text'] as OracleName[]) {
      describe(`pipeline: ${pipeline} | oracle: ${oracle}`, () => {
        const columns = columnsFor(pipeline as PipelineName);

        const check = async (expected: any[]) => {
          await wait(30);
          oracleFor(oracle)(table, expected, columns);
        };

        it('a header filter narrows the body and clearing it restores every row', async () => {
          const rows = people();
          table = await makeTable({ columns, data: rows, attrs: { 'header-filters': true } });
          table.renderHeader();
          await wait(20);
          await check(rows);

          typeIntoHeaderFilter(table, 'dept', 'eng');
          await wait(250);
          await check([rows[0], rows[2], rows[5]]);

          typeIntoHeaderFilter(table, 'dept', '');
          await wait(250);
          await check(rows);
        });

        it('clearAllFilters also clears an active header filter', async () => {
          const rows = people();
          table = await makeTable({ columns, data: rows, attrs: { 'header-filters': true } });
          table.renderHeader();
          await wait(20);

          typeIntoHeaderFilter(table, 'dept', 'ops');
          await wait(250);
          await check([rows[3]]);

          table.clearAllFilters();
          await check(rows);
        });
      });
    }
  }
});

// ── The legacy remote `filterable` selector ────────────────────────────────
describe('filtering matrix — legacy filterable selector (remote mode)', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  for (const pipeline of PIPELINES) {
    it(`the selector value rides the request payload and its rows render (${pipeline})`, async () => {
      const columns = columnsFor(pipeline as PipelineName);
      table = await makeTable({ columns, remote: true, attrs: { filterable: true } });
      table.selectorOptions = [
        { value: 'eng', label: 'Engineering' },
        { value: 'ops', label: 'Operations' },
      ];
      table.renderControls();
      await wait(20);

      const select = table.shadowRoot.querySelector('.selector-input');
      expect(select).toBeTruthy();
      expect(select.querySelectorAll('snice-option')).toHaveLength(2);

      const rows = people();
      const payloads: any[] = [];
      table.addEventListener('@request/table/data', (e: any) => {
        payloads.push(e.detail.payload);
        e.detail.discovery.resolve();
        e.detail.data.resolve({ data: [rows[0], rows[3]] });
      }, { once: true });

      select.dispatchEvent(new CustomEvent('select-change', {
        detail: { value: ['eng', 'ops'] }, bubbles: true, composed: true,
      }));
      await wait(400);

      expect(table.selector).toBe('eng,ops');
      expect(payloads).toHaveLength(1);
      expect(payloads[0].selector).toBe('eng,ops');
      await wait(30);
      oracleFor('value-attribute')(table, [rows[0], rows[3]], columns);
    });
  }
});

// ── getFilterModel() and the filter-change event ───────────────────────────
describe('filtering matrix — getFilterModel() and filter-change', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  const mk = async (pipeline: PipelineName) => {
    table = await makeTable({ columns: columnsFor(pipeline), data: people() });
    return table;
  };

  for (const pipeline of PIPELINES) {
    it(`getFilterModel() round-trips every documented mutation (${pipeline})`, async () => {
      await mk(pipeline as PipelineName);

      expect(table.getFilterModel()).toEqual({ filters: [], logic: 'and' });

      table.setColumnFilter('dept', 'equals', 'eng');
      expect(table.getFilterModel()).toEqual({
        filters: [{ column: 'dept', operator: 'equals', value: 'eng' }],
        logic: 'and',
      });

      table.setQuickFilter('acme');
      expect(table.getFilterModel()).toEqual({
        filters: [{ column: 'dept', operator: 'equals', value: 'eng' }],
        logic: 'and',
        quickFilter: 'acme',
      });

      table.setFilterModel({
        filters: [{ column: 'dept', operator: 'contains', value: 'sal' }],
        logic: 'or',
        quickFilter: 'globex',
        quickFilterLogic: 'or',
      });
      expect(table.getFilterModel()).toEqual({
        filters: [{ column: 'dept', operator: 'contains', value: 'sal' }],
        logic: 'or',
        quickFilter: 'globex',
        quickFilterLogic: 'or',
      });

      table.removeColumnFilter('dept');
      expect(table.getFilterModel().filters).toEqual([]);

      table.clearAllFilters();
      expect(table.getFilterModel().filters).toEqual([]);
      expect(table.getFilterModel().quickFilter).toBeUndefined();
      expect(table.getFilterModel().logic).toBe('and');
    });

    it(`filter-change carries the model on every filter mutation (${pipeline})`, async () => {
      await mk(pipeline as PipelineName);
      const seen: any[] = [];
      table.addEventListener('filter-change', (e: any) => seen.push(e.detail));

      table.setColumnFilter('dept', 'equals', 'eng');
      table.setQuickFilter('acme');
      table.setFilterModel({ filters: [], logic: 'and', quickFilter: 'ops' });
      table.removeColumnFilter('dept');
      table.clearAllFilters();

      expect(seen).toHaveLength(5);
      expect(seen[0].filters).toEqual({
        filters: [{ column: 'dept', operator: 'equals', value: 'eng' }], logic: 'and',
      });
      expect(seen[1].filters.quickFilter).toBe('acme');
      expect(seen[2].filters).toEqual({ filters: [], logic: 'and', quickFilter: 'ops' });
      expect(seen[4].filters).toEqual({ filters: [], logic: 'and', quickFilter: undefined });
    });
  }
});

// ── Zero-row states ────────────────────────────────────────────────────────
// docs/components/table.md:1244 — the slotted `empty-state` is CLONED into the
// body on each zero-row render; :1419 — it appears "only ... when there is no
// data at all", so a filter that empties a populated table is NOT a zero-row
// render in that sense. Both halves are asserted so neither can drift.
describe('filtering matrix — empty-state and a filter that matches nothing', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = null;
  });

  const withSlot = async (pipeline: PipelineName, rows: any[]) => {
    table = await makeTable({ columns: columnsFor(pipeline), data: rows });
    const slotted = document.createElement('div');
    slotted.setAttribute('slot', 'empty-state');
    slotted.textContent = 'No employees match this view.';
    table.appendChild(slotted);
    table.renderBody();
    await wait(30);
    return table;
  };

  const emptyRowText = () => {
    const cell = table.shadowRoot.querySelector('tbody td.no-data') as HTMLElement | null;
    return cell ? (cell.textContent ?? '').trim() : null;
  };

  for (const pipeline of PIPELINES) {
    it(`an empty delivery clones the empty-state slot (${pipeline})`, async () => {
      await withSlot(pipeline as PipelineName, []);
      expect(emptyRowText()).toBe('No employees match this view.');
      // Cloned, not moved: the light-DOM original is still the template.
      expect(table.querySelector('[slot="empty-state"]')).toBeTruthy();
      expect(table.shadowRoot.querySelectorAll('tbody tr[data-index]')).toHaveLength(0);
    });

    it(`a filter that matches nothing empties the body but keeps the data (${pipeline})`, async () => {
      const rows = people();
      await withSlot(pipeline as PipelineName, rows);
      expect(emptyRowText()).toBeNull();

      table.setQuickFilter('nothing-matches-this');
      await wait(30);
      expect(table.shadowRoot.querySelectorAll('tbody tr[data-index]')).toHaveLength(0);
      // `data` is untouched, so this is not the documented no-data state.
      expect(table.data).toHaveLength(6);
      expect(emptyRowText()).toBeNull();

      table.clearAllFilters();
      await wait(30);
      oracleFor('value-attribute')(table, rows, columnsFor(pipeline as PipelineName));
    });
  }
});
