// Slice: tree-detail — renderCell precedence, generated gap nodes, tree
// expansion state across delivery, and tree + master-detail composition, each
// crossed with { local, remote } and (where meaningful) initial vs re-delivery.
//
// Documented contract exercised here:
//   - "renderCell() bypasses the built-in renderer; string results are assigned
//     through textContent" — so renderCell outranks formatter/valueFormatter,
//     and receives the valueGetter-derived value.
//   - "Each row's path identifies its place in the hierarchy; missing ancestors
//     become generated gap nodes."
//   - "defaultExpansionDepth: 0 starts collapsed; 1 expands root nodes;
//     Infinity expands all levels. Tree node keys are slash-joined paths."
//   - expandTreeNode/collapseTreeNode/toggleTreeNode/expandAllTreeNodes/
//     collapseAllTreeNodes drive expansion; `tree-toggle` is emitted.
//   - setDetailPanel + expandRow render a detail panel below the row.
import { describe, afterEach, it, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { makeTable, cellText, dataRows, expectedCellText, wait, type MatrixColumn } from './matrix-utils';
import {
  MODES, PHASES, expectRenderedCellsMatch, push, renderedText, runPhases,
  type Mode, type Phase,
} from './tree-detail-helpers';

const FLAT = () => ([
  { name: 'Eng', title: 'Eng*', role: 'Dept', path: ['Eng'] },
  { name: 'Alice', title: 'Alice*', role: 'Dev', path: ['Eng', 'Alice'] },
  { name: 'Bob', title: 'Bob*', role: 'QA', path: ['Eng', 'Bob'] },
]);

// Fresh objects at the same positions with new display values; `path` is
// untouched, so the hierarchy — and the expected row order — is unchanged.
const mutate = (row: any) => ({
  ...row,
  name: `${row.name}2`,
  title: `${row.title}2`,
  role: `${row.role}2`,
});

/** The group-column text of every rendered data row, in render order. */
function groupTexts(table: any, key = 'name'): string[] {
  return dataRows(table).map(tr => cellText(tr.querySelector(`td[data-key="${key}"]`)!));
}

async function makeTree(mode: Mode, columns: MatrixColumn[], groupColumn: string, depth: number) {
  const table = await makeTable({ columns, remote: mode === 'remote', data: [] });
  table.setTreeData({ getPath: (row: any) => row.path, groupColumn, defaultExpansionDepth: depth });
  return table;
}

describe('matrix: tree/detail composition', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  // ── renderCell precedence ────────────────────────────────────────────────
  // renderCell bypasses the built-in renderer, so it wins over formatter and
  // valueFormatter, and it receives the valueGetter-derived value.
  const precedenceColumn = (key: string, source: string): MatrixColumn => ({
    key,
    label: 'Name',
    type: 'text',
    valueGetter: (_v: any, row: any) => row[source],
    valueFormatter: (v: any) => `[${v}]`,
    formatter: (v: any) => `F(${v})`,
    renderCell: (v: any) => `RC(${v})`,
  });

  for (const mode of MODES) {
    // Every other pipeline in this slice is crossed with all three delivery
    // phases; renderCell gets the same treatment, so a stale recycled <tr>
    // cannot hide behind a renderCell column.
    for (const phase of PHASES) {
      // MATRIX-tree-detail-2 (fixed): the tree group cell runs the same display
      // pipeline as any other cell, so renderCell owns it.
      it(`${mode} + tree + renderCell over formatter/valueFormatter on group column + ${phase} [MATRIX-tree-detail-2]`, async () => {
        const col = precedenceColumn('label', 'title');
        const columns = [col, { key: 'role', label: 'Role', type: 'text' } as MatrixColumn];
        table = await makeTree(mode, columns, 'label', 1);
        const rows = await runPhases(table, mode, phase as Phase, FLAT(), mutate);

        // The oracle cannot express renderCell (it resolves formatter-first), so
        // the group column's precedence is asserted explicitly above and the
        // untouched column goes through the oracle — exactly like the non-group
        // and master-detail siblings below.
        expect(groupTexts(table, 'label')).toEqual(rows.map(r => `RC(${r.title})`));
        expectRenderedCellsMatch(table, rows, [columns[1]]);
      });

      it(`${mode} + tree + renderCell over formatter/valueFormatter on non-group column + ${phase}`, async () => {
        const col = precedenceColumn('job', 'role');
        const columns = [{ key: 'name', label: 'Name', type: 'text' } as MatrixColumn, col];
        table = await makeTree(mode, columns, 'name', 1);
        const rows = await runPhases(table, mode, phase as Phase, FLAT(), mutate);

        // The oracle resolves renderCell-free; assert the documented precedence
        // explicitly, then confirm the untouched column against the oracle.
        expect(dataRows(table).map(tr => renderedText(tr.querySelector('td[data-key="job"]')!)))
          .toEqual(rows.map(r => `RC(${r.role})`));
        expectRenderedCellsMatch(table, rows, [columns[0]]);
      });

      it(`${mode} + master-detail + renderCell over formatter/valueFormatter + ${phase}`, async () => {
        const col = precedenceColumn('company', 'title');
        const columns = [col, { key: 'role', label: 'Role', type: 'text' } as MatrixColumn];
        table = await makeTable({ columns, remote: mode === 'remote', data: [] });
        table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
        const rows = await runPhases(table, mode, phase as Phase, FLAT(), mutate);
        table.expandRow(0);
        await wait(30);

        expect(dataRows(table).map(tr => renderedText(tr.querySelector('td[data-key="company"]')!)))
          .toEqual(rows.map(r => `RC(${r.title})`));
        expect(table.shadowRoot.querySelector('tr.detail-row[data-detail-for="0"]')?.textContent?.trim())
          .toBe(`detail:${rows[0].name}`);
        expectRenderedCellsMatch(table, rows, [columns[1]]);
      });
    }
  }

  // ── Generated gap nodes ──────────────────────────────────────────────────
  const treeCols: MatrixColumn[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
  ];

  for (const mode of MODES) {
    it(`${mode} + tree renders a generated gap node for one missing ancestor`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      const rows = [
        { name: 'Alice', role: 'Dev', path: ['Eng', 'Alice'] },
        { name: 'Bob', role: 'QA', path: ['Eng', 'Bob'] },
      ];
      await push(table, mode, rows);

      expect(groupTexts(table)).toEqual(['Eng', 'Alice', 'Bob']);
      // The generated node is not a data row: it has no data index...
      const trs = dataRows(table);
      expect(trs.map(tr => tr.getAttribute('data-index'))).toEqual(['-1', '0', '1']);
      // ...and it carries only the group-column label the path implies.
      expect(cellText(trs[0].querySelector('td[data-key="role"]')!)).toBe('');
      // The real rows still render their own values through the oracle.
      for (const [i, row] of rows.entries()) {
        for (const col of treeCols) {
          expect(renderedText(trs[i + 1].querySelector(`td[data-key="${col.key}"]`)!))
            .toBe(expectedCellText(col, row));
        }
      }
    });

    // MATRIX-tree-detail-4 (fixed): a generated gap node registers itself as a
    // child of its own parent, so a subtree under two missing ancestor levels
    // — real data rows included — still flattens into the render.
    it(`${mode} + tree renders generated gap nodes for two missing ancestors [MATRIX-tree-detail-4]`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      const rows = [{ name: 'Alice', role: 'Dev', path: ['Eng', 'Team', 'Alice'] }];
      await push(table, mode, rows);

      expect(groupTexts(table)).toEqual(['Eng', 'Team', 'Alice']);
      const trs = dataRows(table);
      // Both ancestors are generated (index -1); only Alice is a data row.
      expect(trs.map(tr => tr.getAttribute('data-index'))).toEqual(['-1', '-1', '0']);
      // Generated nodes carry only the label their path implies.
      expect(trs.slice(0, 2).map(tr => cellText(tr.querySelector('td[data-key="role"]')!)))
        .toEqual(['', '']);
      // The real descendant still renders its own values through the oracle.
      for (const col of treeCols) {
        expect(renderedText(trs[2].querySelector(`td[data-key="${col.key}"]`)!))
          .toBe(expectedCellText(col, rows[0]));
      }
      // Each generated level indents one step further.
      expect(trs.map(tr =>
        (tr.querySelector('td[data-key="name"] .tree-indent') as HTMLElement).style.paddingLeft))
        .toEqual(['0rem', '1.5rem', '3rem']);
    });

    // MATRIX-tree-detail-4 (fixed, real root): the root exists as a real row,
    // only the middle ancestor is generated.
    it(`${mode} + tree renders a generated middle ancestor under a real root [MATRIX-tree-detail-4]`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      const rows = [
        { name: 'Eng', role: 'Dept', path: ['Eng'] },
        { name: 'Alice', role: 'Dev', path: ['Eng', 'Team', 'Alice'] },
      ];
      await push(table, mode, rows);

      expect(groupTexts(table)).toEqual(['Eng', 'Team', 'Alice']);
      const trs = dataRows(table);
      // Only the middle level is generated; the real root keeps its data index.
      expect(trs.map(tr => tr.getAttribute('data-index'))).toEqual(['0', '-1', '1']);
      expect(cellText(trs[1].querySelector('td[data-key="role"]')!)).toBe('');
      // Both real rows render their own values through the oracle.
      for (const [tr, row] of [[trs[0], rows[0]], [trs[2], rows[1]]] as const) {
        for (const col of treeCols) {
          expect(renderedText((tr as HTMLElement).querySelector(`td[data-key="${col.key}"]`)!))
            .toBe(expectedCellText(col, row));
        }
      }
    });

    // Coverage added by audit: the gap node generated for a descendant is
    // UPGRADED in place when the real ancestor row arrives later in the same
    // payload. Replacing it instead would drop the children it already
    // collected — the same missing-row symptom as MATRIX-tree-detail-4.
    it(`${mode} + tree keeps the subtree when a real ancestor is delivered after its child [MATRIX-tree-detail-4]`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      const rows = [
        { name: 'Alice', role: 'Dev', path: ['Eng', 'Alice'] },
        { name: 'Eng', role: 'Dept', path: ['Eng'] },
      ];
      await push(table, mode, rows);

      expect(groupTexts(table)).toEqual(['Eng', 'Alice']);
      const trs = dataRows(table);
      // Both are real rows: the late ancestor keeps its own data index, and the
      // child it adopted is still rendered beneath it.
      expect(trs.map(tr => tr.getAttribute('data-index'))).toEqual(['1', '0']);
      for (const [tr, row] of [[trs[0], rows[1]], [trs[1], rows[0]]] as const) {
        for (const col of treeCols) {
          expect(renderedText((tr as HTMLElement).querySelector(`td[data-key="${col.key}"]`)!))
            .toBe(expectedCellText(col, row));
        }
      }
    });

    // Docs: "Generated gap nodes carry no data row, so they show only the label
    // their path implies and have no detail panel."
    it(`${mode} + tree gap nodes get no detail affordance or panel`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      const rows = [{ name: 'Alice', role: 'Dev', path: ['Eng', 'Team', 'Alice'] }];
      await push(table, mode, rows);

      const trs = dataRows(table);
      expect(trs.map(tr => tr.getAttribute('data-index'))).toEqual(['-1', '-1', '0']);

      // A gap node has no data row to describe, so toggling it opens nothing.
      (trs[0].querySelector('button.detail-toggle') as HTMLElement).click();
      await wait(40);
      expect(table.shadowRoot.querySelectorAll('tr.detail-row')).toHaveLength(0);

      // Expanding the real row still opens its panel, below that row.
      table.expandRow(0);
      await wait(30);
      const panel = table.shadowRoot.querySelector('tr.detail-row[data-detail-for="0"]');
      expect(panel?.textContent?.trim()).toBe('detail:Alice');
      expect(panel?.previousElementSibling?.getAttribute('data-index')).toBe('0');
      expect(table.shadowRoot.querySelectorAll('tr.detail-row')).toHaveLength(1);
    });

    it(`${mode} + tree renders a complete three-level hierarchy`, async () => {
      table = await makeTree(mode, treeCols, 'name', Infinity);
      const rows = [
        { name: 'Eng', role: 'Dept', path: ['Eng'] },
        { name: 'Team', role: 'Squad', path: ['Eng', 'Team'] },
        { name: 'Alice', role: 'Dev', path: ['Eng', 'Team', 'Alice'] },
      ];
      await push(table, mode, rows);
      expectRenderedCellsMatch(table, rows, treeCols);
      expect(dataRows(table).map(tr =>
        (tr.querySelector('td[data-key="name"] .tree-indent') as HTMLElement).style.paddingLeft))
        .toEqual(['0rem', '1.5rem', '3rem']);
    });
  }

  // ── Expansion state ──────────────────────────────────────────────────────
  const TWO_ROOTS = () => ([
    { name: 'Eng', role: 'Dept', path: ['Eng'] },
    { name: 'Alice', role: 'Dev', path: ['Eng', 'Alice'] },
    { name: 'Sales', role: 'Dept', path: ['Sales'] },
    { name: 'Eve', role: 'Rep', path: ['Sales', 'Eve'] },
  ]);

  for (const mode of MODES) {
    it(`${mode} + tree defaultExpansionDepth 0 starts collapsed and expands on demand`, async () => {
      table = await makeTree(mode, treeCols, 'name', 0);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);

      table.expandTreeNode('Eng');
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Alice', 'Sales']);
      expectRenderedCellsMatch(table, [rows[0], rows[1], rows[2]], treeCols);

      table.collapseTreeNode('Eng');
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);
    });

    it(`${mode} + tree expansion survives re-delivery of the same rows`, async () => {
      table = await makeTree(mode, treeCols, 'name', 0);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);
      table.expandTreeNode('Sales');
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales', 'Eve']);

      await push(table, mode, mode === 'remote' ? rows : [...rows]);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales', 'Eve']);
      expectRenderedCellsMatch(table, [rows[0], rows[2], rows[3]], treeCols);
    });

    it(`${mode} + tree collapsing one of two expanded roots hides only that subtree`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);
      expect(groupTexts(table)).toEqual(['Eng', 'Alice', 'Sales', 'Eve']);

      table.collapseTreeNode('Eng');
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales', 'Eve']);
      expectRenderedCellsMatch(table, [rows[0], rows[2], rows[3]], treeCols);
    });

    // MATRIX-tree-detail-3 (fixed): defaultExpansionDepth seeds the STARTING
    // expansion once, so collapsing the last expanded node — which empties the
    // expanded-key set — is no longer undone by the next render.
    it(`${mode} + tree collapsing every root stays collapsed [MATRIX-tree-detail-3]`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);

      table.collapseTreeNode('Eng');
      await wait(30);
      table.collapseTreeNode('Sales');
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);
      expectRenderedCellsMatch(table, [rows[0], rows[2]], treeCols);
      expect([...table.shadowRoot.querySelectorAll('button.tree-toggle')]
        .map((b: any) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);

      // The default depth is a starting state, not a floor: a further render
      // must not spring the roots back open.
      await push(table, mode, mode === 'remote' ? rows : [...rows]);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);
    });

    it(`${mode} + tree collapseAllTreeNodes collapses to the roots [MATRIX-tree-detail-3]`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);

      table.collapseAllTreeNodes();
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);
      expectRenderedCellsMatch(table, [rows[0], rows[2]], treeCols);
      expect([...table.shadowRoot.querySelectorAll('button.tree-toggle')]
        .map((b: any) => b.getAttribute('aria-expanded'))).toEqual(['false', 'false']);

      await push(table, mode, mode === 'remote' ? rows : [...rows]);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales']);
    });

    it(`${mode} + tree expandAllTreeNodes shows every descendant`, async () => {
      table = await makeTree(mode, treeCols, 'name', 0);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);
      table.expandAllTreeNodes();
      await wait(30);
      expect(groupTexts(table)).toEqual(['Eng', 'Alice', 'Sales', 'Eve']);
      expectRenderedCellsMatch(table, rows, treeCols);
    });

    it(`${mode} + tree toggle button collapses its subtree and emits tree-toggle`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      const rows = TWO_ROOTS();
      await push(table, mode, rows);
      const events: any[] = [];
      table.addEventListener('tree-toggle', (e: any) => events.push(e.detail));

      // Collapse the FIRST root only, so the expanded-key set stays non-empty.
      (table.shadowRoot.querySelectorAll('button.tree-toggle')[0] as HTMLElement).click();
      await wait(40);
      expect(events).toEqual([{ key: 'Eng', expanded: false }]);
      expect(groupTexts(table)).toEqual(['Eng', 'Sales', 'Eve']);
      expectRenderedCellsMatch(table, [rows[0], rows[2], rows[3]], treeCols);
    });
  }

  // ── Tree + master-detail together ────────────────────────────────────────
  for (const mode of MODES) {
    // MATRIX-tree-detail-5 (fixed): the tree render path emits the detail panel
    // row like the flat and grouping paths, so the toggle rendered on every
    // tree row actually opens a panel.
    it(`${mode} + tree + master-detail renders the detail panel of an expanded row [MATRIX-tree-detail-5]`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      const rows = FLAT();
      await push(table, mode, rows);

      // The affordance is rendered for every tree row...
      expect(table.shadowRoot.querySelectorAll('tbody tr[data-index] button.detail-toggle'))
        .toHaveLength(3);
      table.expandRow(0);
      await wait(30);
      expect(table.masterDetail.isExpanded(0)).toBe(true);
      // ...so the panel must appear below its row.
      expect(table.shadowRoot.querySelector('tr.detail-row[data-detail-for="0"]')?.textContent?.trim())
        .toBe('detail:Eng');
    });

    it(`${mode} + tree + master-detail still renders every tree row's cells`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      const rows = FLAT();
      await push(table, mode, rows);
      expectRenderedCellsMatch(table, rows, treeCols);
      table.expandRow(0);
      await wait(30);
      expectRenderedCellsMatch(table, rows, treeCols);
    });
  }

  // ── Re-delivery of the SAME row objects with mutated fields ──────────────
  // The oracle is delivery-shaped: after any delivery, each rendered cell must
  // equal the display value derived from the row it claims to show.
  for (const mode of MODES) {
    // MATRIX-tree-detail-6 (fixed): a row re-delivered by identity with mutated
    // fields repaints its cells AND rebuilds its cached detail content.
    it(`${mode} + master-detail + in-place mutated re-delivery updates cells and panel`, async () => {
      const columns: MatrixColumn[] = [{ key: 'name', label: 'Name', type: 'text' }];
      table = await makeTable({ columns, remote: mode === 'remote', data: [] });
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      const rows = [{ name: 'Acme' }, { name: 'Globex' }];
      await push(table, mode, rows);
      table.expandRow(0);
      await wait(30);
      expect(table.shadowRoot.querySelector('tr.detail-row')?.textContent?.trim()).toBe('detail:Acme');

      rows[0].name = 'Acme Corp';
      await push(table, mode, [...rows]);
      expectRenderedCellsMatch(table, rows, columns);
      expect(table.shadowRoot.querySelector('tr.detail-row')?.textContent?.trim())
        .toBe('detail:Acme Corp');
    });

    it(`${mode} + tree + in-place mutated re-delivery updates the group cell`, async () => {
      table = await makeTree(mode, treeCols, 'name', 1);
      const rows = FLAT();
      await push(table, mode, rows);
      expect(groupTexts(table)).toEqual(['Eng', 'Alice', 'Bob']);

      rows[1].role = 'Principal';
      await push(table, mode, [...rows]);
      expectRenderedCellsMatch(table, rows, treeCols);
    });

    // Coverage added by audit: renderCell may return an HTMLElement, which is
    // appended as-is (the string form is covered above). It must still outrank
    // formatter/valueFormatter, on a tree table and a master-detail table.
    it(`${mode} + renderCell returning an HTMLElement outranks formatter on tree and master-detail`, async () => {
      const col: MatrixColumn = {
        key: 'job', label: 'Job', type: 'text',
        valueGetter: (_v: any, row: any) => row.role,
        valueFormatter: (v: any) => `[${v}]`,
        formatter: (v: any) => `F(${v})`,
        renderCell: (v: any) => {
          const el = document.createElement('em');
          el.className = 'rc';
          el.textContent = `E(${v})`;
          return el;
        },
      };
      const columns: MatrixColumn[] = [{ key: 'name', label: 'Name', type: 'text' }, col];
      const rows = FLAT();

      table = await makeTree(mode, columns, 'name', 1);
      await push(table, mode, rows);
      expect(dataRows(table).map(tr => tr.querySelector('td[data-key="job"] em.rc')?.textContent))
        .toEqual(['E(Dept)', 'E(Dev)', 'E(QA)']);
      expectRenderedCellsMatch(table, rows, [columns[0]]);
      removeComponent(table);

      table = await makeTable({ columns, remote: mode === 'remote', data: [] });
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      await push(table, mode, rows);
      table.expandRow(0);
      await wait(30);
      expect(dataRows(table).map(tr => tr.querySelector('td[data-key="job"] em.rc')?.textContent))
        .toEqual(['E(Dept)', 'E(Dev)', 'E(QA)']);
      expect(table.shadowRoot.querySelector('tr.detail-row[data-detail-for="0"]')?.textContent?.trim())
        .toBe('detail:Eng');
    });

    it(`${mode} + master-detail + re-delivery with fresh objects updates cells and panel`, async () => {
      const columns: MatrixColumn[] = [{ key: 'name', label: 'Name', type: 'text' }];
      table = await makeTable({ columns, remote: mode === 'remote', data: [] });
      table.setDetailPanel({ getDetailContent: (row: any) => `detail:${row.name}` });
      const rows = [{ name: 'Acme' }, { name: 'Globex' }];
      await push(table, mode, rows);
      table.expandRow(0);
      await wait(30);

      const next = [{ name: 'Acme Corp' }, { name: 'Globex' }];
      await push(table, mode, next);
      expectRenderedCellsMatch(table, next, columns);
      expect(table.shadowRoot.querySelector('tr.detail-row')?.textContent?.trim())
        .toBe('detail:Acme Corp');
    });
  }
});
