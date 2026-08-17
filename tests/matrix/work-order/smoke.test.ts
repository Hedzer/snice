/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order matrix — smoke slice
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one file of this directory the DEFAULT vitest loop collects. One combo
 * per feature family, plus the marquee regression:
 *
 *   · the four documented totals agree with each other and with `toJSON()`;
 *   · tasks, parts, labor and costs appear with their data and not before;
 *   · task-toggle, status-change and wo-sign all reach the page;
 *   · MATRIX-work-order-1 — `labor-rate="75"`, straight out of the doc's own
 *     example, prints "75/hr" instead of "$75.00/hr".
 *
 * The full cross lives in the sibling files and runs via
 * `npx vitest run --config vitest.matrix.config.ts tests/matrix/work-order`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, Problems, expectClean, captureEvents, click, wait } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  TASK_SETS, PART_SETS, CUSTOMER, ASSET, checkCosts, checkPartsTotal, money,
} from './work-order-support';

const TAG = 'snice-work-order';
await import('../../../packages/components/src/work-order/snice-work-order');

afterEach(() => { document.body.innerHTML = ''; });

describe('work-order smoke', () => {
  it('parts + labor add up to the grand total', async () => {
    const el = await mount<any>(TAG, { 'wo-number': 'WO-2024-001' }, {
      tasks: TASK_SETS.mixed, parts: PART_SETS.two, laborRate: 75,
    });
    const problems = new Problems();
    checkCosts(el, { tasks: TASK_SETS.mixed, parts: PART_SETS.two, laborRate: 75 }, problems);
    checkPartsTotal(el, PART_SETS.two, problems);
    expectClean(problems, 'full sheet');
    expect(el.getTotalCost()).toBe(2 * 25.5 + 450 + 6 * 75);
  });

  it('every region follows its data', async () => {
    const bare = await mount<HTMLElement>(TAG, {});
    for (const name of ['customer', 'asset', 'description', 'tasks', 'parts', 'notes', 'costs']) {
      expect(part(bare, name), `part="${name}" on an empty work order`).toBeNull();
    }
    expect(part(bare, 'signature'), 'the sign-off block is unconditional').not.toBeNull();
    document.body.innerHTML = '';

    const full = await mount<HTMLElement>(TAG, {
      description: 'Replace HVAC system', notes: 'Lift access',
    }, {
      customer: CUSTOMER, asset: ASSET, tasks: TASK_SETS.mixed,
      parts: PART_SETS.two, laborRate: 75,
    });
    for (const name of ['customer', 'asset', 'description', 'tasks', 'parts', 'notes', 'costs']) {
      expect(part(full, name), `part="${name}" on a full work order`).not.toBeNull();
    }
    expect(parts(full, 'task').length, 'task rows').toBe(TASK_SETS.mixed.length);
  });

  it('task-toggle, status-change and wo-sign all fire', async () => {
    const el = await mount<any>(TAG, { 'wo-number': 'WO-2024-001', status: 'open' }, {
      tasks: TASK_SETS.mixed.map(t => ({ ...t })),
    });
    const toggled = captureEvents<any>(el, 'task-toggle');
    const statuses = captureEvents<any>(el, 'status-change');
    const signed = captureEvents<any>(el, 'wo-sign');

    click(parts(el, 'task-checkbox')[1]);
    el.status = 'completed';
    click(part(el, 'sign-button'));
    await wait(30);

    expect(toggled.map(d => [d.index, d.completed]), 'task-toggle').toEqual([[1, true]]);
    expect(statuses.map(d => [d.previousStatus, d.status]), 'status-change')
      .toEqual([['open', 'completed']]);
    expect(signed.map(d => d.woNumber), 'wo-sign').toEqual(['WO-2024-001']);
  });

  it.fails('labor-rate="75" prints as money [MATRIX-work-order-1]', async () => {
    const el = await mount<any>(TAG, { 'labor-rate': '75' }, { tasks: TASK_SETS.mixed });
    expect(part(el, 'labor-rate')?.textContent?.trim(), 'the rendered labor rate')
      .toBe(`${money(75)}/hr`);
  });
});
