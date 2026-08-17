/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order matrix — the three events and the documented attributes
 * ════════════════════════════════════════════════════════════════════════════
 *
 * docs/ai/components/work-order.md:
 *
 *   task-toggle   -> { index, task, completed }
 *   status-change -> { previousStatus, status }
 *   wo-sign       -> { woNumber, timestamp }
 *
 * A toggled task is not just an event: it changes `getTotalLaborHours()`'s
 * inputs' meaning for the technician and it re-renders the row, so each toggle
 * combo checks the event, the element's own `tasks` array, and the rendered
 * row together.
 *
 * ── MATRIX-work-order-1, and what THIS tier can see of it ───────────────────
 *
 * The doc's HTML example writes `labor-rate="75"`, and the property table says
 * `laborRate: number = 0; // attr: labor-rate`. `laborRate` is declared with a
 * bare `@property({ type: Number })`, so the element observes `laborrate` and
 * the documented name is never seen — in a REAL BROWSER the rate simply never
 * arrives, and that pinned case (with `show-qr`, MATRIX-work-order-2) lives in
 * tests/live/matrix/work-order/work-order-visual.spec.ts.
 *
 * happy-dom hands `attributeChangedCallback` every attribute change whether or
 * not the element observed it, so HERE the value arrives — as the STRING "75",
 * through a path that skips the Number converter.
 *
 * The totals survive, because `hours * "75"` coerces — but the RATE LINE does
 * not. The component formats money with `amount.toLocaleString(undefined,
 * { style: 'currency', currency: 'USD' })`, and `String.prototype.toLocaleString`
 * ignores those options, so the sheet prints "75/hr" where every other figure
 * on it reads "$450.00". A work order authored exactly as the docs show it
 * quotes its labour rate in no currency at all.
 *
 * Pinned with `it.fails` on the property type, the JSON type, and the rendered
 * rate. None of the three is weakened.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, captureEvents, click, removeComponent, wait }
  from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  TASK_SETS, PART_SETS, STATUSES, expectedLaborCost, expectedLaborHours, money,
} from './work-order-support';

const TAG = 'snice-work-order';
await import('../../../packages/components/src/work-order/snice-work-order');

afterEach(() => { document.body.innerHTML = ''; });

describe('work-order matrix: task-toggle', () => {
  const combos = cross({
    tasks: ['mixed', 'hourless'] as const,
    index: [0, 1] as const,
    laborRate: [0, 75] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const tasks = TASK_SETS[combo.tasks].map(task => ({ ...task }));
      const el = await mount<any>(TAG, {}, { tasks, laborRate: combo.laborRate });
      const seen = captureEvents<any>(el, 'task-toggle');

      const before = tasks[combo.index].completed === true;
      click(parts(el, 'task-checkbox')[combo.index]);
      await wait(30);

      const problems = new Problems();
      problems.equal(seen.length, 1, 'event count');
      problems.equal(seen[0]?.index, combo.index, 'detail.index');
      problems.equal(seen[0]?.completed, !before, 'detail.completed');
      problems.equal(seen[0]?.task?.description, tasks[combo.index].description,
        'detail.task.description');
      // The element's own array is updated, so a consumer reading `tasks`
      // after the event sees the same world the event described.
      problems.equal(el.tasks[combo.index].completed, !before, 'element tasks[i].completed');
      // Toggling completion never changes what the job costs.
      problems.equal(el.getTotalLaborHours(), expectedLaborHours(tasks), 'labor hours');
      problems.equal(el.getTotalLaborCost(), expectedLaborCost(tasks, combo.laborRate),
        'labor cost');
      // The row follows.
      const row = parts(el, 'task')[combo.index];
      problems.check(row.getAttribute('class')!.includes('wo__task--completed') === !before,
        `row ${combo.index} completed class after the toggle`);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: status-change', () => {
  const combos = cross({ from: STATUSES, to: STATUSES });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<any>(TAG, { status: combo.from });
      const seen = captureEvents<any>(el, 'status-change');
      el.status = combo.to;
      await wait(30);

      const problems = new Problems();
      if (combo.from === combo.to) {
        problems.equal(seen.length, 0, 'events for an unchanged status');
      } else {
        problems.equal(seen.length, 1, 'event count');
        problems.equal(seen[0]?.previousStatus, combo.from, 'detail.previousStatus');
        problems.equal(seen[0]?.status, combo.to, 'detail.status');
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: wo-sign', () => {
  for (const number of ['WO-2024-001', ''] as const) {
    it(`wo-number="${number}"`, async () => {
      const el = await mount<any>(TAG, number ? { 'wo-number': number } : {});
      const seen = captureEvents<any>(el, 'wo-sign');
      click(part(el, 'sign-button'));
      await wait(30);

      const problems = new Problems();
      problems.equal(seen.length, 1, 'event count');
      problems.equal(seen[0]?.woNumber, number, 'detail.woNumber');
      const timestamp = seen[0]?.timestamp;
      problems.check(typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp)),
        `detail.timestamp is not a parseable instant (${timestamp})`);
      expectClean(problems, `wo-number=${number}`);
      removeComponent(el);
    });
  }
});

// ── The documented attribute channel ────────────────────────────────────────

interface AttrCase {
  attribute: string; value: string; property: string; expected: unknown; works: boolean;
}

const ATTRIBUTES: AttrCase[] = [
  { attribute: 'wo-number', value: 'WO-1', property: 'woNumber', expected: 'WO-1', works: true },
  { attribute: 'date', value: '2024-03-15', property: 'date', expected: '2024-03-15', works: true },
  { attribute: 'due-date', value: '2024-03-20', property: 'dueDate', expected: '2024-03-20', works: true },
  { attribute: 'priority', value: 'urgent', property: 'priority', expected: 'urgent', works: true },
  { attribute: 'status', value: 'in-progress', property: 'status', expected: 'in-progress', works: true },
  { attribute: 'description', value: 'Replace unit', property: 'description', expected: 'Replace unit', works: true },
  { attribute: 'notes', value: 'Lift access', property: 'notes', expected: 'Lift access', works: true },
  { attribute: 'variant', value: 'field-service', property: 'variant', expected: 'field-service', works: true },
  { attribute: 'qr-data', value: 'https://e/1', property: 'qrData', expected: 'https://e/1', works: true },
  { attribute: 'qr-position', value: 'footer', property: 'qrPosition', expected: 'footer', works: true },
  // Documented `laborRate: number` with "attr: labor-rate".
  { attribute: 'labor-rate', value: '75', property: 'laborRate', expected: 75, works: false },
];

describe('work-order matrix: every documented attribute reaches its property', () => {
  for (const item of ATTRIBUTES) {
    const title = `${item.attribute}="${item.value}" -> ${item.property}`
      + (item.works ? '' : ' [MATRIX-work-order-1]');
    const run = async () => {
      const el = await mount<any>(TAG, { [item.attribute]: item.value });
      expect(el[item.property], `${item.attribute} -> ${item.property}`).toEqual(item.expected);
    };
    if (item.works) it(title, run); else it.fails(title, run);
  }

  it.fails('toJSON() reports the documented numeric laborRate [MATRIX-work-order-1]', async () => {
    const el = await mount<any>(TAG, { 'labor-rate': '75' }, { tasks: TASK_SETS.mixed });
    expect(typeof el.toJSON().laborRate, 'toJSON().laborRate type').toBe('number');
  });

  it.fails('the rate line is money, not a bare number [MATRIX-work-order-1]', async () => {
    const el = await mount<any>(TAG, { 'labor-rate': '75' }, { tasks: TASK_SETS.mixed });
    expect(part(el, 'labor-rate')?.textContent?.trim(), 'the rendered labor rate')
      .toBe(`${money(75)}/hr`);
  });

  it('the totals survive the string rate', async () => {
    // Scoping MATRIX-work-order-1: multiplication coerces, so the money the
    // customer is charged is still right. This case exists so a future fix
    // cannot change the totals unnoticed while closing the finding above.
    const el = await mount<any>(TAG, { 'labor-rate': '75' },
      { tasks: TASK_SETS.mixed, parts: PART_SETS.two });
    const problems = new Problems();
    problems.equal(el.getTotalLaborCost(), expectedLaborCost(TASK_SETS.mixed, 75),
      'getTotalLaborCost() with an attribute-set rate');
    problems.equal(el.getTotalCost(), 2 * 25.5 + 450 + 6 * 75, 'getTotalCost()');
    problems.check((part(el, 'labor-total')?.textContent ?? '').includes(money(6 * 75)),
      `the rendered labor total reads "${part(el, 'labor-total')?.textContent?.trim()}"`);
    expectClean(problems, 'labor-rate="75"');
  });
});

describe('work-order matrix: the properties the docs give no attribute', () => {
  for (const property of ['customer', 'tasks', 'parts', 'asset']) {
    it(`${property} is property-only`, async () => {
      const el = await mount<any>(TAG, {});
      expect(el.getAttribute(property), `${property} reflected to an attribute`).toBeNull();
    });
  }
});
