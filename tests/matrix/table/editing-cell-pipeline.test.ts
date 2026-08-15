// MATRIX / editing slice — the commit-side value pipeline (valueParser /
// valueSetter) crossed with { local, remote } x the five display pipelines.
//
// Documented contract (docs/ai/components/table.md):
//   • `valueParser?:(value:string,row:any)=>any` — "Parse edited input back to
//     data type".
//   • `valueSetter?:(value:any,row:any)=>any` — "Write value back to row
//     object"; `startEdit`/`commitEdit` notes add "Parsers/setters receive the
//     real row; setters may return a value or row".
//   • After the commit the cell must render the DISPLAY text derived from the
//     updated row through the ordinary display pipeline
//     (valueGetter → formatter/valueFormatter).
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  MODES, PIPES, spec, makeRows, build, wait,
  expectCellsMatchExcept, expectNoEditor, typeAndCommit,
} from './editing-common';

describe('matrix/editing — commit pipeline (valueParser / valueSetter)', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;
      const backing = pipe.startsWith('valueGetter') ? 'companyName' : 'name';

      // ── valueParser only ────────────────────────────────────────────────
      // The parser normalises the raw editor string; with no valueSetter the
      // parsed value is written to `row[key]`.
      const parserBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, { valueParser: (v: string) => v.trim().toUpperCase() });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, '  zed  ');

        const expected = [{ ...before[0], [s.targetKey]: 'ZED' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        // Read the DATA the parser produced. For the valueGetter pipelines the
        // parsed value lands on a key the column does not display, so without
        // this the case would pass with `valueParser` ignored entirely.
        expect(table.data[0][s.targetKey]).toBe('ZED');
        expect(table.data[0]).toEqual(expected[0]);
      };
      it(`valueParser: ${label}`, parserBody);

      // ── valueSetter, value convention ───────────────────────────────────
      // The setter writes the DISPLAY-backing field of the real row and returns
      // the field's new value.
      const setterValueBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {
          valueSetter: (v: any, row: any) => {
            row[backing] = String(v).toUpperCase();
            return row[backing];
          },
        });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'zed');

        const expected = [{ ...before[0], [backing]: 'ZED' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        // The setter owns the write: the DISPLAY-backing field of the real row
        // carries the transformed value, and no other documented field moved.
        // (For the valueGetter pipelines the edited key is not a row field;
        // whether the table also records it there is outside the documented
        // contract, so it is deliberately not asserted.)
        expect(table.data[0][backing]).toBe('ZED');
        expect(table.data[0].dept).toBe(before[0].dept);
        expect(table.data[0].id).toBe(before[0].id);
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`valueSetter (returns value): ${label}`, setterValueBody);

      // ── valueSetter, row convention ─────────────────────────────────────
      // MUI-style setter returning a partial row; the table merges it into the
      // real row, so the display picks the merged field up.
      const setterRowBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {
          valueSetter: (v: any) => ({ [backing]: String(v).toUpperCase() }),
        });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'zed');

        const expected = [{ ...before[0], [backing]: 'ZED' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[0][backing]).toBe('ZED');
        expect(table.data[0]).toEqual(expected[0]);
      };
      it(`valueSetter (returns row): ${label}`, setterRowBody);

      // ── valueParser + valueSetter ───────────────────────────────────────
      // The setter must receive the PARSED value, not the raw editor string.
      const bothBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {
          valueParser: (v: string) => v.trim().toUpperCase(),
          valueSetter: (v: any, row: any) => {
            row[backing] = `X-${v}`;
            return row[backing];
          },
        });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, '  zed  ');

        const expected = [{ ...before[0], [backing]: 'X-ZED' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        // 'X-ZED' (not 'X-  zed  ') proves the setter saw the PARSED value.
        expect(table.data[0][backing]).toBe('X-ZED');
        expect(table.data[0].dept).toBe(before[0].dept);
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`valueParser + valueSetter: ${label}`, bothBody);

      // ── setter touching a SECOND field ──────────────────────────────────
      // "setters may return a value or row" — a returned row may change more
      // than the edited field, and every changed field must be re-rendered.
      const multiFieldBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe, {
          valueSetter: (v: any) => ({ [backing]: String(v), dept: 'Legal' }),
        });
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        const expected = [{ ...before[0], [backing]: 'Zed', dept: 'Legal' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
        expect(table.data[0]).toEqual(expected[0]);
        expect(table.data[1]).toEqual(before[1]);
      };
      it(`valueSetter rewrites a second field: ${label}`, multiFieldBody);
    }
  }
});
