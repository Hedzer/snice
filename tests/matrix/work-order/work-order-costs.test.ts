/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order matrix — parts, labor and what the job costs
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The doc's four accessors are the oracle:
 *
 *   getTotalPartsCost()  = sum of quantity * unitCost
 *   getTotalLaborHours() = sum of task hours
 *   getTotalLaborCost()  = hours * laborRate
 *   getTotalCost()       = parts + labor
 *
 * The cross is 3 task sets x 3 part sets x 2 labor rates = 18 combos, and each
 * one checks all four accessors, all four `toJSON()` totals, the rendered
 * grand total, and the parts table's own total line. The task sets include one
 * with no `hours` at all, because "sum of task hours" over a set that has none
 * is exactly where a NaN gets into a customer's bill.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, text, removeComponent } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  TASK_SETS, PART_SETS, checkCosts, checkPartsTotal, readPartRows,
  expectedPartsCost, expectedLaborHours, money, type CostCombo,
} from './work-order-support';

const TAG = 'snice-work-order';
await import('../../../packages/components/src/work-order/snice-work-order');

afterEach(() => { document.body.innerHTML = ''; });

const combos = cross({
  tasks: ['none', 'mixed', 'hourless'] as const,
  parts: ['none', 'two', 'unnumbered'] as const,
  laborRate: [0, 75] as const,
});

describe('work-order matrix: the documented cost pipeline', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      const tasks = TASK_SETS[combo.tasks];
      const parts_ = PART_SETS[combo.parts];
      const el = await mount<any>(TAG, { 'wo-number': 'WO-2024-001' }, {
        tasks, parts: parts_, laborRate: combo.laborRate,
      });

      const cost: CostCombo = { tasks, parts: parts_, laborRate: combo.laborRate };
      const problems = new Problems();
      checkCosts(el, cost, problems);
      checkPartsTotal(el, parts_, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: the parts table', () => {
  for (const name of ['none', 'two', 'unnumbered'] as const) {
    it(`parts=${name}`, async () => {
      const parts_ = PART_SETS[name];
      const el = await mount<HTMLElement>(TAG, {}, { parts: parts_ });
      const problems = new Problems();

      problems.check(!!part(el, 'parts') === (parts_.length > 0),
        `part="parts" for ${parts_.length} parts`);
      const rows = readPartRows(el);
      problems.equal(rows.length, parts_.length, 'parts rows');

      parts_.forEach((entry, i) => {
        const cells = rows[i] ?? [];
        problems.equal(cells[0], entry.name, `part ${i} name`);
        // "partNumber?" is optional; the sheet still needs a column entry.
        problems.equal(cells[1], entry.partNumber ?? '---', `part ${i} number`);
        problems.equal(cells[2], String(entry.quantity), `part ${i} quantity`);
        problems.equal(cells[3], money(entry.unitCost), `part ${i} unit cost`);
        problems.equal(cells[4], money(entry.quantity * entry.unitCost), `part ${i} line total`);
      });
      expectClean(problems, `parts=${name}`);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: the labor block', () => {
  const laborCombos = cross({
    tasks: ['none', 'mixed', 'hourless'] as const,
    laborRate: [0, 75] as const,
  });

  for (const combo of laborCombos) {
    it(combo.id, async () => {
      const tasks = TASK_SETS[combo.tasks];
      const el = await mount<any>(TAG, {}, { tasks, laborRate: combo.laborRate });
      const problems = new Problems();

      const hours = expectedLaborHours(tasks);
      const block = part(el, 'labor');
      // A labor block is worth rendering once there are hours or a rate.
      problems.check(!!block === (hours > 0 || combo.laborRate > 0),
        `part="labor" ${block ? 'present' : 'absent'} for hours=${hours}`
          + ` rate=${combo.laborRate}`);
      if (block) {
        problems.equal(text(part(el, 'labor-hours')), `${hours}h`, 'labor hours');
        if (combo.laborRate > 0) {
          problems.equal(text(part(el, 'labor-rate')), `${money(combo.laborRate)}/hr`,
            'labor rate');
          problems.equal(text(part(el, 'labor-total')), money(hours * combo.laborRate),
            'labor total');
        }
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: an empty sheet costs nothing', () => {
  it('no tasks, no parts, no rate', async () => {
    const el = await mount<any>(TAG, {});
    const problems = new Problems();
    checkCosts(el, { tasks: [], parts: [], laborRate: 0 }, problems);
    problems.check(!part(el, 'costs'), 'an empty work order still rendered a costs block');
    expectClean(problems, 'empty');
    expect(expectedPartsCost([])).toBe(0);
  });
});
