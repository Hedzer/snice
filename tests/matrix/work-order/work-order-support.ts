/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-work-order matrix — the documented oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/work-order.md` and
 * `snice-work-order.types.ts`. A work order is a job sheet that ends in a
 * bill, so the doc's four accessor methods ARE the specification:
 *
 *   getTotalPartsCost()  "Sum of part quantities * unit costs"
 *   getTotalLaborHours() "Sum of task hours"
 *   getTotalLaborCost()  "Hours * labor rate"
 *   getTotalCost()       "Parts + labor totals"
 *
 * Every number rendered in the costs block has to agree with those four, and
 * with `toJSON()`, or the sheet the technician signs is not the sheet the
 * customer is charged from.
 *
 * ── Findings pinned by this suite ───────────────────────────────────────────
 *
 *   MATRIX-work-order-1  The doc declares `laborRate: number` with
 *                        "attr: labor-rate", and its HTML example writes
 *                        `labor-rate="75"`. The attribute lands as the STRING
 *                        "75": the property is declared with a bare
 *                        `@property({ type: Number })`, so the observed
 *                        attribute is `laborrate` and the documented kebab
 *                        name reaches the property through a fallback that
 *                        skips the Number converter. `toJSON().laborRate` is
 *                        then a string, and `getTotalLaborCost()` — documented
 *                        as "Hours * labor rate" — returns a number only
 *                        because `*` coerces.
 *
 * The finding keeps the documented assertion and is declared `it.fails`.
 */
import { Problems, text, all } from '../matrix-kit';
import { exactPart as part, exactParts as parts, partTokens } from '../part-exact';
import type {
  WorkOrderTask, WorkOrderPart, WorkOrderAsset, WorkOrderCustomer,
  WorkOrderPriority, WorkOrderStatus, WorkOrderVariant,
} from '../../../packages/components/src/work-order/snice-work-order.types';

export const PRIORITIES: readonly WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent'];
export const STATUSES: readonly WorkOrderStatus[] =
  ['open', 'in-progress', 'completed', 'cancelled'];
export const VARIANTS: readonly WorkOrderVariant[] = [
  'standard', 'compact', 'field-service', 'maintenance', 'detailed',
  'paper', 'ink', 'ledger', 'ticket',
];
export const QR_POSITIONS = ['top-right', 'header', 'footer'] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

export const TASK_SETS: Record<string, WorkOrderTask[]> = {
  none: [],
  /** Two tasks, one done, both with hours — the doc's own example. */
  mixed: [
    { description: 'Remove old unit', assignee: 'John', completed: true, hours: 2 },
    { description: 'Install new unit', assignee: 'Jane', completed: false, hours: 4 },
  ],
  /** Hours omitted: "Sum of task hours" has to treat the gap as zero. */
  hourless: [
    { description: 'Inspect site', assignee: 'Sam' },
    { description: 'File report', completed: true },
  ],
};

export const PART_SETS: Record<string, WorkOrderPart[]> = {
  none: [],
  two: [
    { name: 'Air Filter', partNumber: 'AF-100', quantity: 2, unitCost: 25.5 },
    { name: 'Compressor', partNumber: 'CP-200', quantity: 1, unitCost: 450 },
  ],
  /** A part with no number: the docs make `partNumber` optional. */
  unnumbered: [
    { name: 'Sealant', quantity: 3, unitCost: 12.75 },
  ],
};

export const CUSTOMER: WorkOrderCustomer = {
  name: 'Acme Corp', address: '123 Main St', phone: '555-1234', email: 'ops@acme.com',
};

export const ASSET: WorkOrderAsset = {
  id: 'HVAC-301', name: 'Rooftop Unit', location: '3rd Floor',
  serial: 'SN-2019-4521', lastService: '2025-11-02',
};

// ── The documented totals ───────────────────────────────────────────────────

export function expectedPartsCost(parts_: WorkOrderPart[]): number {
  return parts_.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
}

export function expectedLaborHours(tasks: WorkOrderTask[]): number {
  return tasks.reduce((sum, t) => sum + (t.hours ?? 0), 0);
}

export function expectedLaborCost(tasks: WorkOrderTask[], laborRate: number): number {
  return expectedLaborHours(tasks) * laborRate;
}

export function expectedTotalCost(
  parts_: WorkOrderPart[], tasks: WorkOrderTask[], laborRate: number,
): number {
  return expectedPartsCost(parts_) + expectedLaborCost(tasks, laborRate);
}

/** The component's own money format: USD through `toLocaleString`. */
export function money(amount: number): string {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function readTasks(el: HTMLElement): Array<{ description: string; assignee: string }> {
  return parts(el, 'task').map(task => ({
    description: text(task.querySelector('[part~="task-description"]')),
    assignee: text(task.querySelector('[part~="task-assignee"]')),
  }));
}

export function readPartRows(el: HTMLElement): string[][] {
  return parts(el, 'parts-row').map(row =>
    [...row.querySelectorAll('td')].map(cell => text(cell)));
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface CostCombo {
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  laborRate: number;
}

/** Every documented cost claim about one rendered work order, at once. */
export function checkCosts(el: any, combo: CostCombo, problems: Problems): void {
  const { tasks, parts: parts_, laborRate } = combo;

  problems.equal(el.getTotalPartsCost(), expectedPartsCost(parts_), 'getTotalPartsCost()');
  problems.equal(el.getTotalLaborHours(), expectedLaborHours(tasks), 'getTotalLaborHours()');
  problems.equal(el.getTotalLaborCost(), expectedLaborCost(tasks, laborRate),
    'getTotalLaborCost()');
  problems.equal(el.getTotalCost(), expectedTotalCost(parts_, tasks, laborRate),
    'getTotalCost()');

  const json = el.toJSON();
  problems.equal(json.totalPartsCost, expectedPartsCost(parts_), 'toJSON.totalPartsCost');
  problems.equal(json.totalLaborHours, expectedLaborHours(tasks), 'toJSON.totalLaborHours');
  problems.equal(json.totalLaborCost, expectedLaborCost(tasks, laborRate),
    'toJSON.totalLaborCost');
  problems.equal(json.totalCost, expectedTotalCost(parts_, tasks, laborRate), 'toJSON.totalCost');

  // The costs block is the rendered face of those four numbers. It exists once
  // there is something to charge for.
  const hasParts = parts_.length > 0;
  const hasLabor = expectedLaborHours(tasks) > 0 && laborRate > 0;
  const grand = part(el, 'grand-total');
  problems.check(!!grand === (hasParts || hasLabor),
    `part="grand-total" ${grand ? 'present' : 'absent'} for`
      + ` parts=${parts_.length} hours=${expectedLaborHours(tasks)} rate=${laborRate}`);
  if (grand) {
    problems.equal(text(grand), money(expectedTotalCost(parts_, tasks, laborRate)),
      'the grand total as rendered');
  }
}

/** The parts table's own total line, when the docs say it exists. */
export function checkPartsTotal(el: HTMLElement, parts_: WorkOrderPart[], problems: Problems): void {
  const totals = parts(el, 'parts-total');
  if (parts_.length === 0) {
    problems.equal(totals.length, 0, 'parts totals with no parts');
    return;
  }
  problems.check(totals.length > 0, 'part="parts-total" is missing');
  const rendered = text(totals[0]);
  problems.check(rendered.includes(money(expectedPartsCost(parts_))),
    `the parts total reads "${rendered}", not ${money(expectedPartsCost(parts_))}`);
}

const DOCUMENTED_PARTS = new Set([
  'base', 'header', 'title', 'wo-number', 'date', 'due-date', 'priority', 'status',
  'customer', 'customer-name', 'customer-address', 'customer-contact',
  'asset', 'asset-id', 'asset-name',
  'description', 'description-label', 'description-content',
  'tasks', 'task', 'task-checkbox', 'task-description', 'task-assignee',
  'parts', 'parts-table', 'parts-row', 'part-name', 'part-number', 'part-qty', 'part-cost',
  'parts-total', 'labor', 'labor-hours', 'labor-rate', 'labor-total',
  'costs', 'grand-total', 'notes', 'notes-label', 'notes-content',
  'signature', 'signature-line', 'signature-date', 'sign-button',
  'qr-container', 'footer',
]);

export function checkNoUndocumentedParts(el: HTMLElement, problems: Problems): void {
  for (const node of all(el, '[part]')) {
    for (const name of partTokens(node)) {
      problems.check(DOCUMENTED_PARTS.has(name), `undocumented part="${name}"`);
    }
  }
}
