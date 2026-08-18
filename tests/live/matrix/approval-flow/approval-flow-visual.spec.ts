/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-approval-flow TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/approval-flow) owns the shape of each step and
 * the two events. Everything that makes this component READ as a chain is
 * invisible to it:
 *
 *   · the connector is `position: absolute` and drawn between avatars — it has
 *     no size at all in happy-dom, and the LAST step's connector is removed by
 *     a `:last-child` rule, which is a cascade fact and not a markup one;
 *   · `orientation` is entirely a layout: horizontal lays the steps left to
 *     right, vertical stacks them, and the DOM is identical either way;
 *   · the four statuses differ only by painted colour.
 *
 * ── Layer 1 (every combo) ──────────────────────────────────────────────────
 *   · every step has a real box, and the steps advance along the axis the
 *     orientation names without overlapping;
 *   · exactly n-1 connectors are painted, each reaching from its own step
 *     toward the next one;
 *   · the avatar is a circle with a real diameter, and the content sits clear
 *     of it;
 *   · the current step's Approve/Reject buttons are hit-testable.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the four documented statuses must paint four distinguishable avatars.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/approval-flow/matrix.html';

interface Step {
  id: string; approver: string; role?: string; avatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string; timestamp?: string;
}

function chain(statuses: Step['status'][]): Step[] {
  const names = ['Alice Smith', 'Bob Jones', 'Carol White', 'Dan Brown'];
  const roles = ['Manager', 'Director', 'VP', 'CFO'];
  return statuses.map((status, i) => ({
    id: String(i + 1), approver: names[i], role: roles[i], status,
    ...(status === 'approved' ? { comment: 'Looks good', timestamp: 'Jan 15' } : {}),
  }));
}

interface Combo {
  id: string;
  orientation: 'horizontal' | 'vertical';
  currentStep: string;
  steps: Step[];
}

/**
 * orientation (2) x chain shape (4) x current position (2) = 16 combos. The
 * chain shapes are: a single step (no connector at all), a fresh chain, a
 * chain part-way through, and a chain with a rejection in the middle.
 */
function generateCombos(): Combo[] {
  const shapes: Array<[string, Step['status'][]]> = [
    ['single', ['pending']],
    ['fresh', ['pending', 'pending', 'pending']],
    ['partway', ['approved', 'pending', 'pending']],
    ['rejected', ['approved', 'rejected', 'pending', 'pending']],
  ];
  const combos: Combo[] = [];
  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (const [name, statuses] of shapes) {
      for (const position of ['first', 'last'] as const) {
        const steps = chain(statuses);
        const current = position === 'first' ? steps[0] : steps[steps.length - 1];
        combos.push({
          id: `${orientation}/${name}/current-${position}`,
          orientation, currentStep: current.id, steps,
        });
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }
    const rect = (el: Element) => el.getBoundingClientRect();
    const painted = (el: Element) => el.getClientRects().length > 0;

    const steps = [...sr.querySelectorAll('.step')] as HTMLElement[];
    if (steps.length !== combo.steps.length) {
      say(`${steps.length} steps painted for ${combo.steps.length} in the chain`);
    }

    // ── The chain advances along its orientation ────────────────────────────
    for (const [i, step] of steps.entries()) {
      const box = rect(step);
      if (box.width <= 0 || box.height <= 0) say(`step ${i} renders at ${box.width}x${box.height}`);
      if (i === 0) continue;
      const previous = rect(steps[i - 1]);
      if (combo.orientation === 'horizontal') {
        if (box.left < previous.right - EPS) {
          say(`step ${i} (left ${box.left.toFixed(1)}) overlaps step ${i - 1}`
            + ` (right ${previous.right.toFixed(1)}) in a horizontal flow`);
        }
      } else if (box.top < previous.bottom - EPS) {
        say(`step ${i} (top ${box.top.toFixed(1)}) overlaps step ${i - 1}`
          + ` (bottom ${previous.bottom.toFixed(1)}) in a vertical flow`);
      }
    }

    // ── Connectors: one BETWEEN each pair, and none after the last ──────────
    const connectors = [...sr.querySelectorAll('.step__connector')] as HTMLElement[];
    const paintedConnectors = connectors.filter(painted);
    if (paintedConnectors.length !== Math.max(0, steps.length - 1)) {
      say(`${paintedConnectors.length} connectors painted for ${steps.length} steps`);
    }
    for (const [i, step] of steps.entries()) {
      const connector = step.querySelector('.step__connector') as HTMLElement | null;
      if (!connector) { say(`step ${i} has no connector node`); continue; }
      const last = i === steps.length - 1;
      if (painted(connector) === last) {
        say(`step ${i}: connector ${last ? 'painted after the last step' : 'not painted'}`);
      }
      if (last || !painted(connector)) continue;
      const box = rect(connector);
      const next = rect(steps[i + 1]);
      const mine = rect(step);
      if (combo.orientation === 'horizontal') {
        if (box.width <= 0) say(`step ${i}: the connector has no length`);
        if (box.left < mine.left - EPS || box.right > next.right + EPS) {
          say(`step ${i}: the connector does not run between its own step and the next`);
        }
      } else {
        if (box.height <= 0) say(`step ${i}: the connector has no length`);
        if (box.top < mine.top - EPS) {
          say(`step ${i}: the vertical connector starts above its own step`);
        }
      }
    }

    // ── Avatar and content ─────────────────────────────────────────────────
    for (const [i, step] of steps.entries()) {
      const avatar = step.querySelector('.step__avatar') as HTMLElement | null;
      const content = step.querySelector('.step__content') as HTMLElement | null;
      if (!avatar || !content) { say(`step ${i} is missing its avatar or content`); continue; }
      const box = rect(avatar);
      if (box.width < 16 || box.height < 16) {
        say(`step ${i}: the avatar is ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
      }
      if (Math.abs(box.width - box.height) > 2) {
        say(`step ${i}: the avatar is not a circle (${box.width.toFixed(1)}x${box.height.toFixed(1)})`);
      }
      const contentBox = rect(content);
      const overlaps = contentBox.left < box.right - EPS && contentBox.right > box.left + EPS
        && contentBox.top < box.bottom - EPS && contentBox.bottom > box.top + EPS;
      if (overlaps) say(`step ${i}: the content runs under the avatar`);
    }

    // ── The current step's buttons are real and hit-testable ───────────────
    const current = steps.find(step => step.classList.contains('step--current'));
    const currentData = combo.steps.find(step => step.id === combo.currentStep);
    if (!current) {
      say('no step carries step--current');
    } else if (currentData?.status === 'pending') {
      const buttons = [...current.querySelectorAll('.step__btn')] as HTMLElement[];
      if (buttons.length !== 2) say(`${buttons.length} action buttons on the current step`);
      for (const [i, button] of buttons.entries()) {
        const box = rect(button);
        if (box.width <= 0 || box.height <= 0) say(`action ${i} is ${box.width}x${box.height}`);
        const hit = (sr as any).elementFromPoint(
          box.left + box.width / 2, box.top + box.height / 2) as Element | null;
        if (hit !== button && !button.contains(hit as Node)) {
          say(`action ${i} is not the element under its own centre`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('approval-flow visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.steps, 'painted steps').toBe(combo.steps.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The documented markup ───────────────────────────────────────────────────
//
// The doc's property table says `currentStep: string = ''; // attr:
// current-step`, and the doc's own example markup is
//
//     <snice-approval-flow current-step="2" orientation="vertical">
//
// MATRIX-approval-flow-2 (fixed): `currentStep` used to be declared with a
// bare `@property()`, so the element observed `currentstep` and the documented
// `current-step` attribute was never seen in a browser — no current step, no
// Approve/Reject. The property now declares `attribute: 'current-step'`, and
// the authored markup below works exactly as documented.

test.describe('approval-flow visual matrix: the documented markup', () => {
  test('current-step="2" makes step 2 the current one [MATRIX-approval-flow-2 fixed]', async () => {
    const result = await page.evaluate(() => (window as any).matrix.mountAuthored({
      orientation: 'vertical',
      currentStep: '2',
      steps: [
        { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved' },
        { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
        { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' },
      ],
    }));
    expect(result.currentStep, 'current-step reached the property').toBe('2');
    expect(result.currentNodes, 'steps marked current').toBe(1);
    expect(result.actions, 'Approve/Reject rows painted').toBe(1);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('approval-flow visual matrix: marquee pixels', () => {
  test('the four statuses paint four different avatars', async () => {
    const painted: Record<string, [number, number, number]> = {};
    for (const status of ['pending', 'approved', 'rejected', 'skipped'] as const) {
      await page.evaluate(s => (window as any).matrix.mount({
        orientation: 'horizontal', currentStep: 'none',
        steps: [{ id: '1', approver: 'Alice Smith', role: 'Manager', status: s }],
      }), status);
      const [avatar] = await capture(
        page, '#subject', `approval-flow-${status}`,
        `(host) => {
          const node = host.shadowRoot.querySelector('.step__avatar');
          const box = node.getBoundingClientRect();
          return [{ x: box.x + box.width / 2, y: box.y + 3 }];
        }`,
      );
      painted[status] = avatar;
    }

    const statuses = Object.keys(painted);
    const collisions: string[] = [];
    for (let i = 0; i < statuses.length; i++) {
      for (let j = i + 1; j < statuses.length; j++) {
        if (sameColor(painted[statuses[i]], painted[statuses[j]])) {
          collisions.push(`${statuses[i]} and ${statuses[j]} both paint`
            + ` ${painted[statuses[i]].join(',')}`);
        }
      }
    }
    expect(collisions, 'each documented status has its own avatar colour').toEqual([]);
  });
});
