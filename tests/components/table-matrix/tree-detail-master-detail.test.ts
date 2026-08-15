// Slice: tree-detail — master-detail (row expansion) crossed with
// { local, remote } x { no pipeline, valueGetter, valueFormatter,
//   valueGetter+valueFormatter, formatter } x { initial delivery, re-delivery,
//   mutated re-delivery }, plus detail-expansion survival across re-delivery.
//
// Documented contract exercised here:
//   - `setDetailPanel({getDetailContent, detailHeight?, lazy?, expandIcon?,
//     collapseIcon?})` enables master-detail rows; `expandRow(i)`,
//     `collapseRow(i)`, `toggleRowExpansion(i)`, `expandAllRows()`,
//     `collapseAllRows()` drive expansion; `row-expand`/`row-collapse` and
//     `detail-toggle` are emitted.
//   - String detail content is parsed as HTML; an HTMLElement is used as-is.
//   - The pipeline (valueGetter → formatter/valueFormatter) still governs the
//     ordinary data cells of a master-detail row.
import { describe, afterEach, it, expect } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, expectCellsMatch, wait, type MatrixColumn } from './matrix-utils';
import {
  MODES, PHASES, PIPELINES, expectRenderedCellsMatch, pipelineColumn, push, runPhases,
  type Mode, type Phase, type Pipeline,
} from './tree-detail-helpers';

const ROWS = () => ([
  { name: 'Acme', title: 'Acme*', city: 'Rome', region: 'Rome*' },
  { name: 'Globex', title: 'Globex*', city: 'Oslo', region: 'Oslo*' },
  { name: 'Initech', title: 'Initech*', city: 'Lima', region: 'Lima*' },
]);

const mutate = (row: any) => ({
  ...row,
  name: `${row.name}2`,
  title: `${row.title}2`,
  city: `${row.city}2`,
  region: `${row.region}2`,
});

function detailRows(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody tr.detail-row')] as HTMLElement[];
}
function detailFor(table: any, index: number): HTMLElement | null {
  return table.shadowRoot.querySelector(`tbody tr.detail-row[data-detail-for="${index}"]`);
}
function toggleButtons(table: any): HTMLElement[] {
  return [...table.shadowRoot.querySelectorAll('tbody tr[data-index] button.detail-toggle')] as HTMLElement[];
}

async function makeDetailTable(mode: Mode, columns: MatrixColumn[], options: any = {}) {
  const table = await makeTable({ columns, remote: mode === 'remote', data: [] });
  table.setDetailPanel({
    getDetailContent: (row: any) => `detail:${row.name}/${row.city}`,
    ...options,
  });
  return table;
}

describe('matrix: master-detail x pipelines x modes x delivery', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  // ── Data cells of a master-detail table follow the documented pipeline ────
  for (const mode of MODES) {
    for (const pipeline of PIPELINES) {
      for (const phase of PHASES) {
        it(`${mode} + master-detail + ${pipeline} + ${phase}`, async () => {
          const nameCol = pipelineColumn(pipeline, {
            plainKey: 'name', getterKey: 'company', source: 'title', label: 'Name',
          });
          const cityCol = pipelineColumn(pipeline, {
            plainKey: 'city', getterKey: 'location', source: 'region', label: 'City',
          });
          const columns = [nameCol, cityCol];
          table = await makeDetailTable(mode, columns);

          const rows = await runPhases(table, mode, phase as Phase, ROWS(), mutate);
          expectRenderedCellsMatch(table, rows, columns);
          // Every data row carries its expand control, none of them expanded.
          expect(toggleButtons(table)).toHaveLength(rows.length);
          expect(toggleButtons(table).map(b => b.getAttribute('aria-expanded')))
            .toEqual(rows.map(() => 'false'));
          expect(detailRows(table)).toHaveLength(0);
        });
      }
    }
  }

  // ── Same, with a row expanded before the assertion ────────────────────────
  for (const mode of MODES) {
    for (const pipeline of PIPELINES) {
      for (const phase of PHASES) {
        it(`${mode} + master-detail expanded + ${pipeline} + ${phase}`, async () => {
          const nameCol = pipelineColumn(pipeline, {
            plainKey: 'name', getterKey: 'company', source: 'title', label: 'Name',
          });
          const columns = [nameCol, { key: 'city', label: 'City', type: 'text' } as MatrixColumn];
          table = await makeDetailTable(mode, columns);

          await push(table, mode, ROWS());
          table.expandRow(1);
          await wait(30);

          // Re-run the delivery sequence from scratch on the SAME table so the
          // expansion has to survive it.
          const rows = await runPhases(table, mode, phase as Phase, ROWS(), mutate);

          expectRenderedCellsMatch(table, rows, columns);
          // Expansion is index-keyed and must persist across re-delivery.
          expect(table.masterDetail.isExpanded(1)).toBe(true);
          const panel = detailFor(table, 1);
          expect(panel).toBeTruthy();
          expect(panel!.textContent?.trim()).toBe(`detail:${rows[1].name}/${rows[1].city}`);
          expect(detailRows(table)).toHaveLength(1);
          expect(toggleButtons(table).map(b => b.getAttribute('aria-expanded')))
            .toEqual(['false', 'true', 'false']);
          // The panel spans the whole grid: data columns + the toggle column.
          expect((panel!.querySelector('td') as HTMLTableCellElement).colSpan)
            .toBe(columns.length + 1);
          // The panel is placed directly after its master row.
          expect(panel!.previousElementSibling?.getAttribute('data-index')).toBe('1');
        });
      }
    }
  }

  // ── The working-value view for the non-formatting pipelines ───────────────
  for (const mode of MODES) {
    for (const pipeline of ['no pipeline', 'valueGetter'] as Pipeline[]) {
      for (const phase of PHASES) {
        it(`${mode} + master-detail + ${pipeline} + ${phase} (working values)`, async () => {
          const nameCol = pipelineColumn(pipeline, {
            plainKey: 'name', getterKey: 'company', source: 'title', label: 'Name',
          });
          const cityCol = pipelineColumn(pipeline, {
            plainKey: 'city', getterKey: 'location', source: 'region', label: 'City',
          });
          const columns = [nameCol, cityCol];
          table = await makeDetailTable(mode, columns);
          table.expandRow(0);

          const rows = await runPhases(table, mode, phase as Phase, ROWS(), mutate);
          expectCellsMatch(table, rows, columns);
          expect(detailFor(table, 0)?.textContent?.trim())
            .toBe(`detail:${rows[0].name}/${rows[0].city}`);
        });
      }
    }
  }

  // ── Expansion lifecycle across delivery ───────────────────────────────────
  for (const mode of MODES) {
    const columns: MatrixColumn[] = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
    ];

    it(`${mode} + expandAllRows survives re-delivery`, async () => {
      table = await makeDetailTable(mode, columns);
      const rows = ROWS();
      await push(table, mode, rows);
      table.expandAllRows();
      await wait(30);
      expect(detailRows(table).map(r => r.getAttribute('data-detail-for'))).toEqual(['0', '1', '2']);

      await push(table, mode, mode === 'remote' ? rows : [...rows]);
      expect(detailRows(table).map(r => r.getAttribute('data-detail-for'))).toEqual(['0', '1', '2']);
      expect(detailRows(table).map(r => r.textContent?.trim()))
        .toEqual(rows.map(r => `detail:${r.name}/${r.city}`));
      expectRenderedCellsMatch(table, rows, columns);
    });

    it(`${mode} + collapseRow/collapseAllRows remove only their panels`, async () => {
      table = await makeDetailTable(mode, columns);
      const rows = ROWS();
      await push(table, mode, rows);
      table.expandAllRows();
      await wait(30);

      table.collapseRow(1);
      await wait(30);
      expect(detailRows(table).map(r => r.getAttribute('data-detail-for'))).toEqual(['0', '2']);
      expect(table.masterDetail.isExpanded(1)).toBe(false);

      table.collapseAllRows();
      await wait(30);
      expect(detailRows(table)).toHaveLength(0);
      expectRenderedCellsMatch(table, rows, columns);
    });

    it(`${mode} + toggleRowExpansion emits row-expand/row-collapse`, async () => {
      table = await makeDetailTable(mode, columns);
      await push(table, mode, ROWS());
      const events: string[] = [];
      table.addEventListener('row-expand', (e: any) => events.push(`expand:${e.detail.rowIndex}`));
      table.addEventListener('row-collapse', (e: any) => events.push(`collapse:${e.detail.rowIndex}`));

      table.toggleRowExpansion(2);
      await wait(30);
      expect(detailFor(table, 2)).toBeTruthy();
      table.toggleRowExpansion(2);
      await wait(30);
      expect(detailFor(table, 2)).toBeNull();
      expect(events).toEqual(['expand:2', 'collapse:2']);
    });

    it(`${mode} + detail toggle button expands and emits detail-toggle`, async () => {
      table = await makeDetailTable(mode, columns);
      const rows = ROWS();
      await push(table, mode, rows);
      const events: any[] = [];
      table.addEventListener('detail-toggle', (e: any) => events.push(e.detail));

      toggleButtons(table)[1].click();
      await wait(40);
      expect(events).toEqual([{ rowIndex: 1, expanded: true }]);
      expect(detailFor(table, 1)?.textContent?.trim()).toBe(`detail:${rows[1].name}/${rows[1].city}`);
      expectRenderedCellsMatch(table, rows, columns);
    });

    it(`${mode} + HTMLElement detail content is used as-is`, async () => {
      table = await makeDetailTable(mode, columns, {
        getDetailContent: (row: any) => {
          const el = document.createElement('section');
          el.className = 'panel';
          el.textContent = `panel:${row.name}`;
          return el;
        },
      });
      const rows = ROWS();
      await push(table, mode, rows);
      table.expandRow(0);
      await wait(30);
      const panel = detailFor(table, 0)!;
      expect(panel.querySelector('section.panel')?.textContent).toBe('panel:Acme');

      await push(table, mode, mode === 'remote' ? rows : [...rows]);
      expect(detailFor(table, 0)?.querySelector('section.panel')?.textContent).toBe('panel:Acme');
    });

    it(`${mode} + eager (lazy:false) panels render after re-delivery`, async () => {
      const built: string[] = [];
      table = await makeDetailTable(mode, columns, {
        lazy: false,
        getDetailContent: (row: any) => { built.push(row.name); return `detail:${row.name}/${row.city}`; },
      });
      const rows = ROWS();
      await push(table, mode, rows);
      expect(built).toEqual(['Acme', 'Globex', 'Initech']);

      table.expandRow(2);
      await wait(30);
      expect(detailFor(table, 2)?.textContent?.trim()).toBe('detail:Initech/Lima');

      const mutated = rows.map(mutate);
      await push(table, mode, mutated);
      expect(detailFor(table, 2)?.textContent?.trim()).toBe('detail:Initech2/Lima2');
      expectRenderedCellsMatch(table, mutated, columns);
    });

    // The eager case above covers lazy:false. This is the documented default
    // (per-expansion content lifecycle): content must be built on demand and
    // re-built — not served from the cache — after the row it describes is
    // mutated in place while its panel is closed.
    it(`${mode} + lazy panel content is rebuilt after collapse, mutation and re-expand`, async () => {
      const built: string[] = [];
      table = await makeDetailTable(mode, columns, {
        lazy: true,
        getDetailContent: (row: any) => { built.push(row.name); return `detail:${row.name}/${row.city}`; },
      });
      const rows = ROWS();
      await push(table, mode, rows);
      // Lazy: nothing is built until a row is actually expanded.
      expect(built).toEqual([]);

      table.expandRow(1);
      await wait(30);
      expect(built).toEqual(['Globex']);
      expect(detailFor(table, 1)?.textContent?.trim()).toBe('detail:Globex/Oslo');

      table.collapseRow(1);
      await wait(30);
      expect(detailFor(table, 1)).toBeNull();

      // Same row objects, fields mutated in place, delivered again.
      rows[1].name = 'Globex Inc';
      rows[1].city = 'Bergen';
      await push(table, mode, [...rows]);
      expectRenderedCellsMatch(table, rows, columns);

      table.expandRow(1);
      await wait(30);
      expect(detailFor(table, 1)?.textContent?.trim()).toBe('detail:Globex Inc/Bergen');
      expect(built).toEqual(['Globex', 'Globex Inc']);
      expect(detailRows(table)).toHaveLength(1);
    });

    it(`${mode} + fixed detailHeight is applied to the panel`, async () => {
      table = await makeDetailTable(mode, columns, { detailHeight: 120 });
      await push(table, mode, ROWS());
      table.expandRow(0);
      await wait(40);
      const inner = detailFor(table, 0)!.querySelector('.detail-content-inner') as HTMLElement;
      expect(inner.style.height).toBe('120px');
    });

    it(`${mode} + custom expand/collapse icons follow expansion state`, async () => {
      table = await makeDetailTable(mode, columns, { expandIcon: '+', collapseIcon: '-' });
      await push(table, mode, ROWS());
      expect(toggleButtons(table).map(b => b.textContent)).toEqual(['+', '+', '+']);
      table.expandRow(1);
      await wait(30);
      expect(toggleButtons(table).map(b => b.textContent)).toEqual(['+', '-', '+']);
    });

    it(`${mode} + a shrunk payload drops the panels of removed rows`, async () => {
      table = await makeDetailTable(mode, columns);
      const rows = ROWS();
      await push(table, mode, rows);
      table.expandAllRows();
      await wait(30);
      expect(detailRows(table)).toHaveLength(3);

      const shrunk = rows.slice(0, 2);
      await push(table, mode, shrunk);
      expectRenderedCellsMatch(table, shrunk, columns);
      expect(detailRows(table).map(r => r.getAttribute('data-detail-for'))).toEqual(['0', '1']);
      expect(detailRows(table).map(r => r.textContent?.trim()))
        .toEqual(shrunk.map(r => `detail:${r.name}/${r.city}`));
    });
  }
});
