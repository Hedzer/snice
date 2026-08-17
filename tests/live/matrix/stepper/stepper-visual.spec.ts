/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-stepper TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/stepper, `npm run test:matrix`) owns the
 * structural truth: the nine documented parts, the auto-computed status
 * ladder, the checkmark-vs-number rule, the step-change event. It cannot own
 * the component's actual subject, because a stepper IS a layout: "a line
 * BETWEEN steps" (the doc's own description of part="step-connector"), a
 * "circular indicator", a horizontal or vertical ladder. Those are
 * rectangles relative to other rectangles, and happy-dom has neither.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the indicators of a ladder sit on ONE axis — a shared horizontal
 *     centre line when horizontal, a shared vertical centre line when
 *     vertical — in ascending step order, without sharing boxes;
 *   · part="step-indicator" is documented as CIRCULAR: its box is square
 *     and its corners are rounded by at least half that square;
 *   · part="step-connector" is documented as a "Line between steps": its
 *     paint spans from one indicator's far edge to the next indicator's
 *     near edge along the ladder's axis, at the indicators' centre line —
 *     and the LAST step has none, because nothing follows it. The box may
 *     TUCK behind an indicator (they are opaque and stacked above the
 *     line), so the oracle demands the box bridge the whole gap without
 *     emerging past either indicator's far side;
 *   · the label (and a step's description) sit on the content side of its
 *     indicator — below it in a horizontal ladder, beside it in a vertical
 *     one — inside the step's own box;
 *   · "Error steps use semantic color coding": an error indicator paints
 *     the theme's danger token; and in a ladder carrying all four
 *     documented statuses, pending/active/completed paint three
 *     distinguishable indicators (a ladder whose steps all look alike
 *     communicates nothing);
 *   · `clickable` is a documented affordance: the step rows answer the
 *     pointer (cursor + hit-test), non-clickable ones do not;
 *   · panels "auto show/hide based on currentStep": exactly the current
 *     step's panel has a box.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A status can "have a background-color" and still be invisible as a
 *   chip, or unreadable under its own number. Three captures: the error
 *   chip's number is readable on it, the three passive statuses paint three
 *   visibly different chips, and the connector is really painted between
 *   two indicators.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/stepper/matrix.html';

type StepStatus = 'pending' | 'active' | 'completed' | 'error';
type Orientation = 'horizontal' | 'vertical';

interface Step {
  label: string;
  description?: string;
  status?: StepStatus;
}

/** The doc's own four-step ladder, one step carrying a description. */
const LADDER: Step[] = [
  { label: 'Account' },
  { label: 'Profile', description: 'Tell us about you' },
  { label: 'Billing' },
  { label: 'Complete' },
];

/** All four documented statuses, explicitly, in one ladder. */
const ALL_STATUSES: Step[] = [
  { label: 'Done', status: 'completed' },
  { label: 'Current', status: 'active' },
  { label: 'Failed', status: 'error' },
  { label: 'Later', status: 'pending' },
];

/**
 * The status derivation, transcribed from the doc's one-line rule —
 * "status?: … auto-computed if not set" — plus the ladder prose. The same
 * oracle the DOM matrix carries; kept here because the colour and geometry
 * expectations need to know which status each indicator SHOULD wear.
 */
function expectedStatus(step: Step, index: number, currentStep: number): StepStatus {
  if (step.status) return step.status;
  if (index < currentStep) return 'completed';
  if (index === currentStep) return 'active';
  return 'pending';
}

interface Combo {
  id: string;
  steps: Step[];
  currentStep: number;
  orientation: Orientation;
  clickable: boolean;
  /** Assert the per-status colour claims (the explicit-status ladders). */
  checkColors?: boolean;
}

const combo = (over: Partial<Combo> & { id: string }): Combo => ({
  steps: LADDER, currentStep: 0, orientation: 'horizontal', clickable: false, ...over,
});

/**
 * 22 combos, three crosses:
 *
 *   LADDER — orientation (2) x currentStep {first, middle, last} (3) = 6.
 *   Where "current" is changes which indicators are completed/active/pending
 *   and therefore which connectors run where; both orientations are needed
 *   because they are different layouts, not a rotation of one.
 *
 *   STATUS — orientation (2) x the all-four-statuses ladder = 2. The only
 *   combos that can make the "three distinguishable chips" and "error is the
 *   danger semantic" claims.
 *
 *   CLICKABLE — orientation (2) x clickable (2) = 4. The affordance claim.
 *
 *   COUNT — 1..5 steps x orientation (2) = 10. The connector is documented
 *   "between steps", so N steps own N−1 connectors, whatever N is.
 */
function ladderCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
    for (const currentStep of [0, 1, 3]) {
      combos.push(combo({
        id: `ladder/${orientation}@${currentStep}`, orientation, currentStep,
      }));
    }
  }
  return combos;
}

function statusCombos(): Combo[] {
  return (['horizontal', 'vertical'] as Orientation[]).map(orientation =>
    combo({
      id: `status/${orientation}`, orientation, steps: ALL_STATUSES, checkColors: true,
    }));
}

function clickableCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
    for (const clickable of [false, true]) {
      combos.push(combo({
        id: `clickable/${orientation}/${clickable ? 'on' : 'off'}`,
        orientation, clickable, currentStep: 1,
      }));
    }
  }
  return combos;
}

function countCombos(): Combo[] {
  const combos: Combo[] = [];
  for (let count = 1; count <= 5; count++) {
    const steps = Array.from({ length: count }, (_, i) => ({ label: `Step ${i + 1}` }));
    for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
      combos.push(combo({
        id: `count/${orientation}/${count}steps`, steps, orientation, currentStep: 0,
      }));
    }
  }
  return combos;
}

const ALL_COMBOS = [
  ...ladderCombos(),
  ...statusCombos(),
  ...clickableCombos(),
  ...countCombos(),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(c: Combo): Promise<string[]> {
  const statuses = c.steps.map((step, index) => expectedStatus(step, index, c.currentStep));

  return page.evaluate(({ combo, statuses }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 2.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partIs = (el: Element, name: string) =>
      (el.getAttribute('part') ?? '').split(' ').includes(name);
    const partIn = (scope: Element | ShadowRoot, name: string) =>
      [...scope.querySelectorAll('[part]')].find(node => partIs(node, name)) as HTMLElement | undefined;

    const container = partIn(sr, 'container');
    if (!container) { say('no part="container"'); return problems; }
    if (rect(container).width <= 0 || rect(container).height <= 0) {
      say(`container renders at ${rect(container).width}x${rect(container).height}`);
      return problems;
    }

    // ── one row per step ────────────────────────────────────────────────────
    const rows = [...sr.querySelectorAll('[part]')].filter(node => partIs(node, 'step'));
    if (rows.length !== combo.steps.length) {
      say(`${rows.length} step rows rendered, expected ${combo.steps.length}`);
      return problems;
    }

    const indicators = rows.map(row => partIn(row, 'step-indicator'));
    if (indicators.some(i => !i)) { say('a step rendered no indicator'); return problems; }
    const indBoxes = indicators.map(i => rect(i!));

    // ── the shared axis ─────────────────────────────────────────────────────
    if (combo.orientation === 'horizontal') {
      const centerY = indBoxes[0].top + indBoxes[0].height / 2;
      for (const [index, box] of indBoxes.entries()) {
        if (Math.abs(box.top + box.height / 2 - centerY) > EPS) {
          say(`indicator ${index} is ${round(box.top + box.height / 2 - centerY)}px off the ladder's centre line`);
        }
      }
      for (const [index] of indBoxes.entries()) {
        if (index > 0 && indBoxes[index].left < indBoxes[index - 1].right - EPS) {
          say(`indicator ${index} does not sit strictly right of indicator ${index - 1}`);
        }
      }
    } else {
      const centerX = indBoxes[0].left + indBoxes[0].width / 2;
      for (const [index, box] of indBoxes.entries()) {
        if (Math.abs(box.left + box.width / 2 - centerX) > EPS) {
          say(`indicator ${index} is ${round(box.left + box.width / 2 - centerX)}px off the ladder's centre line`);
        }
      }
      for (const [index] of indBoxes.entries()) {
        if (index > 0 && indBoxes[index].top < indBoxes[index - 1].bottom - EPS) {
          say(`indicator ${index} does not sit strictly below indicator ${index - 1}`);
        }
      }
    }

    // ── "Circular indicator" ────────────────────────────────────────────────
    for (const [index, box] of indBoxes.entries()) {
      if (box.width <= 0 || box.height <= 0) { say(`indicator ${index} renders at ${box.width}x${box.height}`); continue; }
      if (Math.abs(box.width - box.height) > 1) {
        say(`indicator ${index} is ${round(box.width)}x${round(box.height)} — a circle is square`);
      }
      const radius = parseFloat(getComputedStyle(indicators[index]!).borderTopLeftRadius);
      if (radius < Math.min(box.width, box.height) / 2 - 1) {
        say(`indicator ${index} radius ${radius}px does not round a ${round(box.height)}px circle`);
      }
    }

    // ── label and description on the content side, inside the step ──────────
    for (const [index, row] of rows.entries()) {
      const step = combo.steps[index];
      const ind = indBoxes[index];
      const label = partIn(row, 'step-label');
      if (!label) { say(`step ${index} rendered no label`); continue; }
      const l = rect(label);
      if (l.width <= 0 || l.height <= 0) say(`step ${index}'s label renders at ${l.width}x${l.height}`);
      const rowBox = rect(row);
      if (l.left < rowBox.left - EPS || l.right > rowBox.right + EPS
        || l.top < rowBox.top - EPS || l.bottom > rowBox.bottom + EPS) {
        say(`step ${index}'s label escapes its step`);
      }
      if (combo.orientation === 'horizontal') {
        if (l.top < ind.bottom - EPS) say(`step ${index}'s label is not below its indicator`);
      } else if (l.left < ind.right - EPS) {
        say(`step ${index}'s label is not beside (right of) its indicator`);
      }

      const descriptions = [...row.querySelectorAll('[part]')].filter(n => partIs(n, 'step-description'));
      if (step.description) {
        if (descriptions.length === 0 || rect(descriptions[0]).height <= 0) {
          say(`step ${index} has a description but paints no description box`);
        } else {
          const d = rect(descriptions[0]);
          if (d.top < l.bottom - EPS) say(`step ${index}'s description is not below its label`);
          if (d.left < rowBox.left - EPS || d.right > rowBox.right + EPS) {
            say(`step ${index}'s description escapes its step`);
          }
        }
      } else if (descriptions.some(d => rect(d).height > 0)) {
        say(`step ${index} paints a description it was not given`);
      }
    }

    // ── "step-connector — Line between steps" ───────────────────────────────
    const connectors = rows.map(row => partIn(row, 'step-connector'));
    for (const [index] of rows.entries()) {
      const connector = connectors[index];
      if (!connector) { say(`step ${index} rendered no connector part`); continue; }
      const c = rect(connector);
      if (index === rows.length - 1) {
        if (c.width > 0 || c.height > 0) {
          say('the last step paints a connector — there is no step after it');
        }
        continue;
      }
      if (c.width <= 0 || c.height <= 0) {
        say(`step ${index}'s connector renders at ${c.width}x${c.height}`);
        continue;
      }
      const here = indBoxes[index];
      const next = indBoxes[index + 1];
      // "step-connector — Line between steps" (docs/ai/components/stepper.md,
      // CSS Parts). The indicators are opaque and z-indexed above the line,
      // and the component's rules start the box under the indicator's own
      // border (content-box 32px + 2x2px border = 36px tall), so the box may
      // tuck behind either indicator. What the doc promises is the PAINTED
      // line: the box must bridge the whole gap between consecutive
      // indicators — no gap at either end, and no emerging past an
      // indicator's far side, where the line would show beyond the circle.
      if (combo.orientation === 'horizontal') {
        if (Math.abs(c.top + c.height / 2 - (here.top + here.height / 2)) > EPS) {
          say(`connector ${index} is not on the indicators' centre line`);
        }
        if (c.left > here.right + EPS) {
          say(`connector ${index} starts at ${round(c.left)}, leaving a gap after indicator ${index}'s edge ${round(here.right)}`);
        }
        if (c.left < here.left - EPS) {
          say(`connector ${index} starts at ${round(c.left)}, emerging left of indicator ${index}'s near edge ${round(here.left)}`);
        }
        if (c.right < next.left - EPS) {
          say(`connector ${index} ends at ${round(c.right)}, falling short of indicator ${index + 1}'s edge ${round(next.left)}`);
        }
        if (c.right > next.right + EPS) {
          say(`connector ${index} ends at ${round(c.right)}, emerging right of indicator ${index + 1}'s far edge ${round(next.right)}`);
        }
      } else {
        if (Math.abs(c.left + c.width / 2 - (here.left + here.width / 2)) > EPS) {
          say(`connector ${index} is not on the indicators' centre line`);
        }
        if (c.top > here.bottom + EPS) {
          say(`connector ${index} starts at ${round(c.top)}, leaving a gap below indicator ${index}'s edge ${round(here.bottom)}`);
        }
        if (c.top < here.top - EPS) {
          say(`connector ${index} starts at ${round(c.top)}, emerging above indicator ${index}'s near edge ${round(here.top)}`);
        }
        if (c.bottom < next.top - EPS) {
          say(`connector ${index} ends at ${round(c.bottom)}, falling short of indicator ${index + 1}'s edge ${round(next.top)}`);
        }
        if (c.bottom > next.bottom + EPS) {
          say(`connector ${index} ends at ${round(c.bottom)}, emerging below indicator ${index + 1}'s far edge ${round(next.bottom)}`);
        }
      }
    }

    // ── the status claims ───────────────────────────────────────────────────
    if (combo.checkColors) {
      for (const [index, status] of statuses.entries()) {
        const indicator = indicators[index]!;
        const bg = getComputedStyle(indicator).backgroundColor;
        if (status === 'error') {
          // "Error steps use semantic color coding" — and danger is the
          // theme's one error semantic.
          const danger = matrix.token('--snice-color-danger');
          if (bg !== danger) {
            say(`the error indicator paints "${bg}", expected the danger token "${danger}"`);
          }
        }
      }
      // A ladder whose steps all look the same communicates nothing: the
      // three non-error statuses must be pairwise distinguishable chips.
      const passive = [0, 1, 3].filter(i => statuses[i] !== 'error');
      const paints = passive.map(i => getComputedStyle(indicators[i]!).backgroundColor);
      for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
        if (paints[a] === paints[b]) {
          say(`${statuses[passive[a]]} and ${statuses[passive[b]]} paint the same chip "${paints[a]}"`);
        }
      }
    }

    // ── clickable is a pointer affordance ───────────────────────────────────
    for (const [index, row] of rows.entries()) {
      const cursor = getComputedStyle(row).cursor;
      if (combo.clickable && cursor !== 'pointer') {
        say(`a clickable step ${index} answers the pointer with cursor "${cursor}"`);
      }
      if (!combo.clickable && cursor === 'pointer') {
        say(`step ${index} advertises a pointer it ignores (clickable is off)`);
      }
    }

    // ── panels: "auto show/hide based on currentStep" ───────────────────────
    const panels = [...host.querySelectorAll('snice-stepper-panel')] as HTMLElement[];
    if (panels.length !== combo.steps.length) {
      say(`${panels.length} panels authored, expected one per step (${combo.steps.length})`);
    }
    for (const [index, panel] of panels.entries()) {
      const box = rect(panel);
      const visible = box.width > 0 && box.height > 0;
      if (index === combo.currentStep && !visible) {
        say(`the current step's panel (${index}) has no box — it did not show`);
      }
      if (index !== combo.currentStep && visible) {
        say(`panel ${index} has a box while step ${index} is not current — it did not hide`);
      }
    }

    // ── occlusion: the indicator a pointer aims at is the one it hits ───────
    const probe = indBoxes[0];
    const outer = document.elementFromPoint(
      probe.left + probe.width / 2, probe.top + probe.height / 2);
    if (outer !== host && !host.contains(outer as Node)) {
      say(`a hit-test on indicator 0 finds <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the stepper`);
    } else {
      const hit = (sr as any).elementFromPoint(
        probe.left + probe.width / 2, probe.top + probe.height / 2) as Element | null;
      const indicator = indicators[0]!;
      if (hit !== indicator && !indicator.contains(hit as Node)) {
        say(`indicator 0 is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, { combo: c, statuses } as any);
}

async function mount(c: Combo): Promise<void> {
  await page.evaluate(cb => (window as any).matrix.mount(cb), c as any);
}

test.describe('stepper visual matrix: layer 1', () => {
  for (const c of ALL_COMBOS) {
    test(c.id, async () => {
      await mount(c);
      expect(await visualProblems(c), `combo ${c.id}`).toEqual([]);
    });
  }
});

/**
 * The documented interaction, judged by the paint: clicking (or keying) a
 * CLICKABLE step moves "current" there, and the ladder's whole geometry
 * oracle must still hold around the new current step. A non-clickable
 * stepper ignores the click entirely.
 */
test.describe('stepper visual matrix: clicking moves the ladder', () => {
  test('a click on a clickable step moves current there, and the ladder re-holds', async () => {
    const c = combo({ id: 'interaction/clickable', clickable: true, currentStep: 0 });
    await mount(c);
    const result = await page.evaluate(() => (window as any).matrix.clickStep(3));
    expect(result.clicked).toBe(true);
    expect(result.currentStep, 'the click did not move currentStep').toBe(3);
    // The whole oracle re-runs against the NEW current step: connectors,
    // panel visibility and the axis must all still hold around it.
    expect(await visualProblems({ ...c, currentStep: 3 }), 'after the click').toEqual([]);
  });

  test('Enter and Space key a clickable step, per the documented a11y', async () => {
    await mount(combo({ id: 'interaction/enter', clickable: true, currentStep: 0 }));
    const enter = await page.evaluate(() => (window as any).matrix.pressStep(2, 'Enter'));
    expect(enter.currentStep, 'Enter did not activate the step').toBe(2);
    const space = await page.evaluate(() => (window as any).matrix.pressStep(1, ' '));
    expect(space.currentStep, 'Space did not activate the step').toBe(1);
  });

  test('a non-clickable stepper ignores clicks', async () => {
    await mount(combo({ id: 'interaction/inert', clickable: false, currentStep: 1 }));
    const result = await page.evaluate(() => (window as any).matrix.clickStep(3));
    expect(result.currentStep, 'a non-clickable step changed currentStep').toBe(1);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 measured the boxes; these exist because "the
// error chip has the danger background-color" and "its number can be READ on
// it" are different claims, and only pixels can tell them apart.

test.describe('stepper visual matrix: marquee pixels', () => {
  test('the error chip carries a number that is readable on it', async () => {
    await mount(combo({ id: 'marquee/error', steps: ALL_STATUSES }));
    const pixels = await capture(
      page, '#subject', 'stepper-error-chip',
      `(host) => {
        const sr = host.shadowRoot;
        const rows = [...sr.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(' ').includes('step'));
        const indicator = [...rows[2].querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('step-indicator'));
        const i = indicator.getBoundingClientRect();
        const points = [];
        for (let k = 1; k <= 10; k++) {
          points.push({ x: i.x + (i.width * k) / 12, y: i.y + i.height / 2 });
        }
        points.push({ x: i.x + 2, y: i.y + i.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed glyph pixel equals the chip ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    expect(best, `best glyph-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('pending, active and completed paint three visibly different chips', async () => {
    await mount(combo({ id: 'marquee/statuses', steps: ALL_STATUSES }));
    const [completed, active, pending] = await capture(
      page, '#subject', 'stepper-status-chips',
      `(host) => {
        const sr = host.shadowRoot;
        const rows = [...sr.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(' ').includes('step'));
        const edge = row => {
          const indicator = [...row.querySelectorAll('[part]')]
            .find(n => (n.getAttribute('part') || '').split(' ').includes('step-indicator'));
          const i = indicator.getBoundingClientRect();
          return { x: i.x + 2, y: i.y + i.height / 2 };
        };
        return [edge(rows[0]), edge(rows[1]), edge(rows[3])];
      }`,
    );
    expect(sameColor(completed, active),
      'completed and active paint the same chip').toBe(false);
    expect(sameColor(completed, pending),
      'completed and pending paint the same chip').toBe(false);
    expect(sameColor(active, pending),
      'active and pending paint the same chip').toBe(false);
  });

  test('the connector is really painted between two indicators', async () => {
    await mount(combo({ id: 'marquee/connector', orientation: 'vertical', currentStep: 1 }));
    const [onConnector, onGap] = await capture(
      page, '#subject', 'stepper-connector',
      `(host) => {
        const sr = host.shadowRoot;
        const rows = [...sr.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(' ').includes('step'));
        const connector = [...rows[0].querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('step-connector'));
        const indicator = [...rows[0].querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('step-indicator'));
        const c = connector.getBoundingClientRect();
        const i = indicator.getBoundingClientRect();
        return [
          { x: c.x + c.width / 2, y: c.y + c.height / 2 },
          { x: i.x + i.width + 6, y: c.y + c.height / 2 },
        ];
      }`,
    );
    expect(sameColor(onConnector, onGap),
      `the connector and the empty gap both painted ${onConnector.join(',')}`).toBe(false);
  });
});
