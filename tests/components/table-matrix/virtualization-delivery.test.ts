// Matrix slice: VIRTUALIZATION × delivery.
//
// { local, remote } × { no pipeline, valueGetter (key not a row field),
// valueFormatter, valueGetter+valueFormatter, formatter } × { initial delivery,
// re-delivery with the same row identities (reconciler recycles the <tr>s),
// mutated re-delivery (part of the window rebuilt, part recycled) }.
//
// Every combination asserts the rendered virtual window twice: once structurally
// (contiguous window, spacer integrity, no blank control cell) and once through
// the shared matrix oracle on the pipeline column.
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../test-utils';
import { makeTable } from './matrix-utils';
import {
  CONTROL_COLUMN,
  PIPELINES,
  columnsFor,
  deliverRows,
  expectControlCells,
  expectVirtualWindow,
  expectWindowCells,
  makeRows,
  pipelineColumn,
  type PipelineName,
} from './virtualization-support';

const TOTAL = 30; // comfortably more rows than any window this harness renders

type Phase = 'initial' | 're-delivery (same identities)' | 're-delivery (mutated rows)';
const PHASES: Phase[] = ['initial', 're-delivery (same identities)', 're-delivery (mutated rows)'];

describe('virtualization × delivery', () => {
  let table: any;
  afterEach(() => { if (table) removeComponent(table); });

  /** Drive a table to the requested delivery phase and return the live rows. */
  async function driveTo(pipeline: PipelineName, remote: boolean, phase: Phase) {
    const columns = columnsFor(pipeline);
    const first = makeRows(TOTAL);
    table = await makeTable({
      columns,
      data: remote ? undefined : [],
      remote,
      attrs: { virtualize: true },
    });

    await deliverRows(table, first, remote);
    if (phase === 'initial') return { columns, rows: first };

    if (phase === 're-delivery (same identities)') {
      await deliverRows(table, [...first], remote);
      return { columns, rows: first };
    }

    // Mutated: the first three rows arrive as fresh objects with new values
    // (rebuild path), the rest keep their identity (recycle path).
    const mutated = first.map((row, i) => (i < 3
      ? { ...row, plain: `plain-${i}*`, companyName: `Co-${i}*`, label: `L${i}*` }
      : row));
    await deliverRows(table, mutated, remote);
    return { columns, rows: mutated };
  }

  for (const remote of [false, true]) {
    const mode = remote ? 'remote' : 'local';
    for (const pipeline of PIPELINES) {
      for (const phase of PHASES) {
        const combo = `${mode} / ${pipeline} / ${phase}`;

        it(`${combo}: window + spacers + control cells`, async () => {
          const { columns, rows } = await driveTo(pipeline, remote, phase);
          expectVirtualWindow(table, rows, columns.length);
          expectControlCells(table, rows);
          expectWindowCells(table, rows, [CONTROL_COLUMN]);
        });

        it(`${combo}: pipeline cell text`, async () => {
          const { rows } = await driveTo(pipeline, remote, phase);
          expectWindowCells(table, rows, [pipelineColumn(pipeline)]);
        });
      }
    }
  }
});
