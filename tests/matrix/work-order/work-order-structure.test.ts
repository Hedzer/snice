/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order matrix — the sheet's regions
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A work order is a form with optional halves: a customer, an asset, a scope
 * of work, tasks, parts, notes, a QR code. The docs give each one a CSS part,
 * so which parts exist for a property vector is the contract this file crosses
 * — variant against data, priority against status, and the QR positions.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, text, removeComponent } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  VARIANTS, PRIORITIES, STATUSES, QR_POSITIONS, TASK_SETS, PART_SETS,
  CUSTOMER, ASSET, readTasks, checkNoUndocumentedParts,
} from './work-order-support';

const TAG = 'snice-work-order';
await import('../../../packages/components/src/work-order/snice-work-order');

afterEach(() => { document.body.innerHTML = ''; });

describe('work-order matrix: variant keeps every documented region', () => {
  const combos = cross({ variant: VARIANTS, data: ['full', 'bare'] as const });

  for (const combo of combos) {
    it(combo.id, async () => {
      const full = combo.data === 'full';
      const el = await mount<HTMLElement>(TAG, {
        variant: combo.variant,
        'wo-number': 'WO-2024-001',
        date: '2024-03-15',
        'due-date': '2024-03-20',
        description: full ? 'Replace HVAC system on 3rd floor' : '',
        notes: full ? 'Access via the service lift.' : '',
      }, {
        customer: full ? CUSTOMER : null,
        asset: full ? ASSET : null,
        tasks: full ? TASK_SETS.mixed : [],
        parts: full ? PART_SETS.two : [],
        laborRate: full ? 75 : 0,
      });
      const problems = new Problems();

      // Always: the header identity and the sign-off block.
      for (const name of ['base', 'header', 'title', 'wo-number', 'priority', 'status',
        'signature', 'signature-line', 'signature-date', 'sign-button', 'footer']) {
        problems.check(!!part(el, name), `part="${name}" is missing`);
      }
      problems.equal(text(part(el, 'wo-number')), 'WO-2024-001', 'wo-number');
      problems.equal(text(part(el, 'date')), '2024-03-15', 'date');
      problems.equal(text(part(el, 'due-date')), '2024-03-20', 'due-date');

      // Conditional: each region follows its data.
      const conditional: Array<[string, boolean]> = [
        ['customer', full], ['asset', full], ['description', full],
        ['tasks', full], ['parts', full], ['notes', full], ['costs', full],
      ];
      for (const [name, expected] of conditional) {
        problems.check(!!part(el, name) === expected,
          `part="${name}" ${part(el, name) ? 'present' : 'absent'} for data=${combo.data}`);
      }

      if (full) {
        problems.equal(text(part(el, 'customer-name')), CUSTOMER.name, 'customer name');
        problems.equal(text(part(el, 'customer-address')), CUSTOMER.address!, 'customer address');
        problems.equal(text(part(el, 'customer-contact')), CUSTOMER.phone!, 'customer contact');
        problems.equal(text(part(el, 'asset-id')), ASSET.id, 'asset id');
        problems.equal(text(part(el, 'asset-name')), ASSET.name, 'asset name');
        problems.equal(text(part(el, 'description-content')),
          'Replace HVAC system on 3rd floor', 'scope of work');
        problems.equal(text(part(el, 'notes-content')), 'Access via the service lift.', 'notes');
      }
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: priority and status badges', () => {
  const combos = cross({ priority: PRIORITIES, status: STATUSES });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, {
        priority: combo.priority, status: combo.status,
      });
      const problems = new Problems();

      const priority = part(el, 'priority');
      const status = part(el, 'status');
      problems.equal(text(priority), combo.priority, 'priority badge');
      // `in-progress` is a machine token; the badge shows it as words.
      problems.equal(text(status), combo.status.replace('-', ' '), 'status badge');
      problems.check(
        (priority?.getAttribute('class') ?? '').includes(`wo__priority--${combo.priority}`),
        `no per-priority class (${priority?.getAttribute('class')})`);
      problems.check(
        (status?.getAttribute('class') ?? '').includes(`wo__status--${combo.status}`),
        `no per-status class (${status?.getAttribute('class')})`);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: the task list', () => {
  for (const name of ['none', 'mixed', 'hourless'] as const) {
    it(`tasks=${name}`, async () => {
      const tasks = TASK_SETS[name];
      const el = await mount<HTMLElement>(TAG, {}, { tasks });
      const problems = new Problems();

      problems.equal(parts(el, 'task').length, tasks.length, 'task rows');
      problems.equal(parts(el, 'task-checkbox').length, tasks.length, 'task checkboxes');
      const rendered = readTasks(el);
      tasks.forEach((task, i) => {
        problems.equal(rendered[i]?.description, task.description, `task ${i} description`);
        // "assignee?" is optional — an unassigned task shows no assignee.
        problems.equal(rendered[i]?.assignee, task.assignee ?? '', `task ${i} assignee`);
      });
      expectClean(problems, `tasks=${name}`);
      removeComponent(el);
    });
  }

  it('a completed task is marked completed', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { tasks: TASK_SETS.mixed });
    const rows = parts(el, 'task');
    expect(rows[0].getAttribute('class'), 'the completed task')
      .toContain('wo__task--completed');
    expect(rows[1].getAttribute('class'), 'the incomplete task')
      .not.toContain('wo__task--completed');
  });
});

describe('work-order matrix: the QR block', () => {
  const combos = cross({ showQr: [false, true], position: QR_POSITIONS });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<HTMLElement>(TAG, {
        'qr-position': combo.position,
        'qr-data': 'https://example.com/wo/1',
      }, { showQr: combo.showQr });
      const problems = new Problems();

      const container = part(el, 'qr-container');
      problems.check(!!container === combo.showQr,
        `part="qr-container" ${container ? 'present' : 'absent'} for showQr=${combo.showQr}`);
      if (combo.showQr) {
        problems.check(
          (container?.getAttribute('class') ?? '').includes(`wo__qr--${combo.position}`),
          `no position class for qr-position=${combo.position}`
            + ` (${container?.getAttribute('class')})`);
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('work-order matrix: print()', () => {
  it('print() calls window.print()', async () => {
    const el = await mount<any>(TAG, {});
    const original = window.print;
    let called = 0;
    (window as any).print = () => { called++; };
    try {
      el.print();
    } finally {
      (window as any).print = original;
    }
    expect(called, 'window.print() was not called').toBe(1);
  });
});
