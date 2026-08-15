// MATRIX / editing slice — edits crossed with DELIVERY phase:
// initial delivery → edit → re-delivery (same row identities, so the render
// path's reconciler recycles the existing <tr>) and mutated / fresh / reordered
// re-delivery, over { local, remote } x the five display pipelines.
//
// Documented contract (docs/ai/components/table.md):
//   • Remote `table/data` response `{data,totalItems?}` replaces the rendered
//     rows; `table.data =` rerenders in local mode.
//   • A committed edit is persisted into the dataset, so it survives a
//     re-delivery of the SAME (mutated) row objects and is replaced by whatever
//     a later delivery says.
//   • After `commitEdit()` / `cancelEdit()` no edit state remains, so every
//     rendered cell must show the display text of the CURRENTLY delivered rows.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  MODES, PIPES, spec, makeRows, build, redeliver, wait,
  editorFor, typeInto,
  expectCellsMatchExcept, expectNoEditor, typeAndCommit,
} from './editing-common';

describe('matrix/editing — edit x delivery phase', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); table = null; });

  for (const mode of MODES) {
    for (const pipe of PIPES) {
      const label = `${mode} + ${pipe}`;
      const backing = pipe.startsWith('valueGetter') ? 'companyName' : 'name';

      // ── commit, then the server echoes the SAME row objects ─────────────
      // Identity is unchanged, so the reconciler recycles the <tr> built at
      // commit time. The committed value must still be on screen.
      const echoBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        await redeliver(table, mode, [...rows]);

        const expected = [{ ...before[0], [s.targetKey]: 'Zed' }, before[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`commit → re-deliver same identities: ${label}`, echoBody);

      // ── commit, then the server re-delivers the ORIGINAL values ─────────
      // The server did not persist the edit. The delivered data wins; no stale
      // edited DOM may survive.
      const revertBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        const fresh = makeRows();
        await redeliver(table, mode, fresh);

        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, fresh.map(r => ({ ...r })), s.columns);
      };
      it(`commit → server re-delivers originals: ${label}`, revertBody);

      // ── commit, then a MUTATED re-delivery ──────────────────────────────
      const mutatedBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        const mutated = makeRows().map((r, i) =>
          i === 0 ? { ...r, [backing]: 'Server', dept: 'Finance' } : r);
        await redeliver(table, mode, mutated);

        expectCellsMatchExcept(table, mutated.map(r => ({ ...r })), s.columns);
      };
      it(`commit → mutated re-delivery: ${label}`, mutatedBody);

      // ── commit, then a re-delivery that APPENDS a row ───────────────────
      // Rows 0/1 keep their identities (recycled), row 2 is new.
      const appendBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        const extra = { id: 3, name: 'Cid', companyName: 'Initech', dept: 'Legal' };
        await redeliver(table, mode, [...rows, extra]);

        const expected = [{ ...before[0], [s.targetKey]: 'Zed' }, before[1], extra];
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`commit → re-delivery appends a row: ${label}`, appendBody);

      // ── commit, then a REORDERED re-delivery ────────────────────────────
      // Same identities in a new order; recycled rows must be re-placed with
      // their own values, not their old positions'.
      const reorderBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        await typeAndCommit(table, 0, s.targetKey, 'Zed');

        await redeliver(table, mode, [rows[1], rows[0]]);

        const expected = [before[1], { ...before[0], [s.targetKey]: 'Zed' }];
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`commit → reordered re-delivery: ${label}`, reorderBody);

      // ── cancel, then a re-delivery of the same identities ───────────────
      const cancelEchoBody = async () => {
        const rows = makeRows();
        const before = rows.map(r => ({ ...r }));
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Discarded');
        table.cancelEdit();
        await wait(20);

        await redeliver(table, mode, [...rows]);

        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, before, s.columns);
      };
      it(`cancel → re-deliver same identities: ${label}`, cancelEchoBody);

      // ── re-delivery lands WHILE an editor is open, then cancel ──────────
      // Cancelling leaves no edit state, so every cell must show the newly
      // delivered rows.
      const redeliverThenCancelBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);
        typeInto(editorFor(table, 0, s.targetKey)!, 'Discarded');

        const fresh = makeRows().map(r => ({ ...r, [backing]: `${r[backing]}-v2` }));
        const snapshot = fresh.map(r => ({ ...r }));
        await redeliver(table, mode, fresh);

        table.cancelEdit();
        await wait(20);

        expectNoEditor(table, 0, s.targetKey);
        expectNoEditor(table, 1, s.targetKey);
        expectCellsMatchExcept(table, snapshot, s.columns);
      };
      it(`re-delivery during edit → cancel: ${label}`, redeliverThenCancelBody);

      // ── re-delivery lands WHILE an editor is open, then commit ──────────
      // `cell-edit-commit` is documented as `{rowIndex,columnKey,...}` and the
      // table persists it into the dataset, so the typed value lands on the
      // row now occupying that index and every other cell shows delivered data.
      const redeliverThenCommitBody = async () => {
        const rows = makeRows();
        const s = spec(pipe);
        table = await build(mode, s, rows);

        table.startEdit(0, s.targetKey);
        await wait(20);

        const fresh = makeRows().map(r => ({ ...r, [backing]: `${r[backing]}-v2` }));
        const snapshot = fresh.map(r => ({ ...r }));
        await redeliver(table, mode, fresh);

        await typeAndCommit(table, 0, s.targetKey, 'Typed');

        const expected = [{ ...snapshot[0], [s.targetKey]: 'Typed' }, snapshot[1]];
        expectNoEditor(table, 0, s.targetKey);
        expectCellsMatchExcept(table, expected, s.columns);
      };
      it(`re-delivery during edit → commit: ${label}`, redeliverThenCommitBody);
    }
  }
});
