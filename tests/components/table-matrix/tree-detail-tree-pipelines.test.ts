// Slice: tree-detail — tree data crossed with { local, remote } x
// { no pipeline, valueGetter, valueFormatter, valueGetter+valueFormatter,
//   formatter } x { initial delivery, re-delivery, mutated re-delivery },
// applied once to the TREE GROUP COLUMN (the column that carries the indent +
// expand/collapse control) and once to an ordinary non-group column.
//
// Documented contract exercised here (docs/ai/components/table.md,
// docs/components/table.md):
//   - `valueGetter` derives the working value for cell display.
//   - `formatter` is the row-aware display override for EVERY built-in cell.
//   - `valueFormatter` is the fallback display formatter.
//   - `setTreeData({getPath, groupColumn, defaultExpansionDepth})` builds the
//     hierarchy; `defaultExpansionDepth: 1` expands root nodes; node keys are
//     slash-joined paths.
// Every cell is asserted against matrix-utils' oracle (expectedCellText).
import { describe, afterEach, it, expect } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable, expectCellsMatch, type MatrixColumn } from './matrix-utils';
import {
  MODES, PHASES, PIPELINES, expectRenderedCellsMatch, pipelineColumn, push, runPhases,
  type Mode, type Phase, type Pipeline,
} from './tree-detail-helpers';

// name/title feed the group column (plain vs valueGetter source),
// role/duty feed the non-group column, path is the hierarchy.
const TREE_ROWS = () => ([
  { name: 'Eng', title: 'Eng*', role: 'Dept', duty: 'Dept*', path: ['Eng'] },
  { name: 'Alice', title: 'Alice*', role: 'Dev', duty: 'Dev*', path: ['Eng', 'Alice'] },
  { name: 'Bob', title: 'Bob*', role: 'QA', duty: 'QA*', path: ['Eng', 'Bob'] },
  { name: 'Sales', title: 'Sales*', role: 'Dept', duty: 'Dept*', path: ['Sales'] },
  { name: 'Eve', title: 'Eve*', role: 'Rep', duty: 'Rep*', path: ['Sales', 'Eve'] },
]);

// Roots sort alphabetically, children sort by full path key, so with the root
// nodes expanded the flattened order is exactly the array order above.
const EXPECTED_ORDER = (rows: any[]) => rows;

// Fresh objects at the same positions with new display values. Paths are
// untouched, so the hierarchy — and therefore the expected row order — is
// unchanged; only the text each row must show differs.
const mutate = (row: any) => ({
  ...row,
  name: `${row.name}2`,
  title: `${row.title}2`,
  role: `${row.role}2`,
  duty: `${row.duty}2`,
});

async function makeTree(mode: Mode, columns: MatrixColumn[], groupColumn: string) {
  const table = await makeTable({ columns, remote: mode === 'remote', data: [] });
  table.setTreeData({ getPath: (row: any) => row.path, groupColumn, defaultExpansionDepth: 1 });
  return table;
}

describe('matrix: tree data x pipelines x modes x delivery', () => {
  let table: any;
  afterEach(() => { if (table) { removeComponent(table); table = null; } });

  // ── Pipeline on the TREE GROUP COLUMN ────────────────────────────────────
  //
  // The group column is the one that renders the indent + chevron. Its display
  // text must still be the documented pipeline result.
  //
  // MATRIX-1 (fixed): valueFormatter is applied to the group cell.
  // MATRIX-tree-detail-1 (fixed): so is formatter, the documented display
  //   override for every cell.
  for (const mode of MODES) {
    for (const pipeline of PIPELINES) {
      for (const phase of PHASES) {
        it(`${mode} + tree + ${pipeline} on group column + ${phase}`, async () => {
          const groupCol = pipelineColumn(pipeline, {
            plainKey: 'name', getterKey: 'label', source: 'title', label: 'Name',
          });
          const columns: MatrixColumn[] = [groupCol, { key: 'role', label: 'Role', type: 'text' }];
          table = await makeTree(mode, columns, groupCol.key);

          const rows = await runPhases(table, mode, phase as Phase, TREE_ROWS(), mutate);
          expectRenderedCellsMatch(table, EXPECTED_ORDER(rows), columns);
        });
      }
    }
  }

  // ── Pipeline on a NON-group column of a tree table ────────────────────────
  for (const mode of MODES) {
    for (const pipeline of PIPELINES) {
      for (const phase of PHASES) {
        it(`${mode} + tree + ${pipeline} on non-group column + ${phase}`, async () => {
          const valueCol = pipelineColumn(pipeline, {
            plainKey: 'role', getterKey: 'job', source: 'duty', label: 'Role',
          });
          const columns: MatrixColumn[] = [{ key: 'name', label: 'Name', type: 'text' }, valueCol];
          table = await makeTree(mode, columns, 'name');

          const rows = await runPhases(table, mode, phase as Phase, TREE_ROWS(), mutate);
          expectRenderedCellsMatch(table, EXPECTED_ORDER(rows), columns);
        });
      }
    }
  }

  // ── The value-attribute view of the same combos ───────────────────────────
  // matrix-utils' cellText reads the working value off the cell element, so it
  // is a faithful view only for the non-formatting pipelines. Assert it there
  // too: it is the same oracle from a second angle, and it catches a cell that
  // renders text while carrying a stale/blank underlying value.
  for (const mode of MODES) {
    for (const pipeline of ['no pipeline', 'valueGetter'] as Pipeline[]) {
      for (const phase of PHASES) {
        it(`${mode} + tree + ${pipeline} + ${phase} (working values)`, async () => {
          const groupCol = pipelineColumn(pipeline, {
            plainKey: 'name', getterKey: 'label', source: 'title', label: 'Name',
          });
          const valueCol = pipelineColumn(pipeline, {
            plainKey: 'role', getterKey: 'job', source: 'duty', label: 'Role',
          });
          const columns: MatrixColumn[] = [groupCol, valueCol];
          table = await makeTree(mode, columns, groupCol.key);

          const rows = await runPhases(table, mode, phase as Phase, TREE_ROWS(), mutate);
          expectCellsMatch(table, EXPECTED_ORDER(rows), columns);
        });
      }
    }
  }

  // ── Tree structure invariants across delivery ─────────────────────────────
  for (const mode of MODES) {
    it(`${mode} + tree keeps indent/toggle affordances across re-delivery`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role', type: 'text' },
      ];
      table = await makeTree(mode, columns, 'name');
      const rows = TREE_ROWS();
      await runPhases(table, mode, 're-delivery', rows, mutate);

      const trs = [...table.shadowRoot.querySelectorAll('tbody tr[data-index]')] as HTMLElement[];
      // Every rendered tree row carries an indent container in the group cell.
      const indents = trs.map(tr => tr.querySelector('td[data-key="name"] .tree-indent'));
      expect(indents.map(el => !!el)).toEqual([true, true, true, true, true]);
      // Depth is encoded as padding: roots 0rem, children 1.5rem.
      expect(indents.map(el => (el as HTMLElement).style.paddingLeft)).toEqual([
        '0rem', '1.5rem', '1.5rem', '0rem', '1.5rem',
      ]);
      // Only nodes with children get a toggle; leaves get a spacer.
      expect(trs.map(tr => !!tr.querySelector('button.tree-toggle'))).toEqual([
        true, false, false, true, false,
      ]);
      expect(trs.map(tr => tr.querySelector('button.tree-toggle')?.getAttribute('aria-expanded') ?? null))
        .toEqual(['true', null, null, 'true', null]);
    });

    it(`${mode} + tree renders a grown payload without dropping rows`, async () => {
      const columns: MatrixColumn[] = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role', type: 'text' },
      ];
      table = await makeTree(mode, columns, 'name');
      const rows = TREE_ROWS();
      await runPhases(table, mode, 'initial delivery', rows, mutate);

      const grown = [...rows, { name: 'Carol', title: 'Carol*', role: 'PM', duty: 'PM*', path: ['Eng', 'Carol'] }];
      await push(table, mode, grown);

      // Children sort by path key: Alice, Bob, Carol.
      const expected = [grown[0], grown[1], grown[2], grown[5], grown[3], grown[4]];
      expectRenderedCellsMatch(table, expected, columns);
    });
  }
});
