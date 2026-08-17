/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-stepper / snice-stepper-panel matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/stepper.md`, `snice-stepper.types.ts`
 * and `snice-stepper-panel.types.ts`:
 *
 *   steps        Step[] = []       { label, description?, status? }
 *   currentStep  number = 0        (documented attribute: `current-step`)
 *   orientation  horizontal|vertical = horizontal
 *   clickable    boolean = false
 *   event        step-change → { previousStep, currentStep, step }
 *                "Cancelable via preventDefault()"
 *   slot         (default) — <snice-stepper-panel> elements,
 *                "auto show/hide based on currentStep"
 *   parts        panel, container, step, step-indicator, step-content,
 *                step-label, step-description, step-connector, panels
 *   a11y         "Clickable steps are keyboard accessible (Enter/Space)";
 *                "Completed steps show checkmark".
 *
 * ── The status oracle ──────────────────────────────────────────────────────
 *
 * The one derivation this component performs is documented in a single line —
 * `status?: 'pending'|'active'|'completed'|'error';  // auto-computed if not
 * set` — plus the surrounding prose ("Step indicator … with pending/active/
 * completed/error states", "Completed steps show checkmark"). That gives:
 *
 *   an explicit `status` always wins;
 *   otherwise index <  currentStep → completed
 *             index === currentStep → active
 *             index >  currentStep → pending
 *
 * `expectedStatus()` below is that rule and nothing else — it is not a copy of
 * the component's `getStepStatus`, and the two are allowed to disagree
 * (`.ai/fuzzing.md`: the doc is the authority).
 *
 * ── Why part lookups go through `part-exact` ───────────────────────────────
 *
 * Five of the nine documented parts are hyphen-prefixed neighbours of `step`
 * (`step-indicator`, `step-content`, `step-label`, `step-description`,
 * `step-connector`), and happy-dom's `[part~="step"]` matches all of them. A
 * three-step stepper answers that selector with sixteen elements. Every lookup
 * here therefore reads the attribute and splits it, which is what a real
 * browser's `~=` does.
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';
import { exactPart, exactPartIn, exactParts, exactPartsIn } from '../part-exact';

import '../../../packages/components/src/stepper/snice-stepper';
import '../../../packages/components/src/stepper/snice-stepper-panel';

export { expect, exactPart, exactPartIn, exactParts, exactPartsIn, mount, unmountAll, wait };

/** The stepper syncs its panels through a queued task; two frames plus slack. */
export const SETTLE = 40;

// ── Documented dimensions ───────────────────────────────────────────────────

export const STATUSES = ['pending', 'active', 'completed', 'error'] as const;
export type StepStatus = typeof STATUSES[number];

export const ORIENTATIONS = ['horizontal', 'vertical'] as const;
export type Orientation = typeof ORIENTATIONS[number];

/** Every part the stepper documents, in doc order. */
export const PARTS = [
  'panel', 'container', 'step', 'step-indicator', 'step-content',
  'step-label', 'step-description', 'step-connector', 'panels',
] as const;

/** The parts that belong to one step. */
export const STEP_PARTS = [
  'step-indicator', 'step-content', 'step-label', 'step-connector',
] as const;

export const DEFAULTS = {
  currentStep: 0,
  orientation: 'horizontal' as Orientation,
  clickable: false,
};

export interface Step {
  label: string;
  description?: string;
  status?: StepStatus;
}

/** The doc's own three-step example. */
export const SAMPLE: Step[] = [
  { label: 'Account' },
  { label: 'Profile', description: 'Tell us about you' },
  { label: 'Complete' },
];

export function ladder(count: number): Step[] {
  return Array.from({ length: count }, (_, i) => ({ label: `Step ${i + 1}` }));
}

// ── The status rule, straight from the doc ──────────────────────────────────

export function expectedStatus(step: Step, index: number, currentStep: number): StepStatus {
  if (step.status) return step.status;
  if (index < currentStep) return 'completed';
  if (index === currentStep) return 'active';
  return 'pending';
}

/** "Completed steps show checkmark" — every other step shows its 1-based number. */
export function expectedIndicator(status: StepStatus, index: number): string {
  return status === 'completed' ? '✓' : String(index + 1);
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface StepperCombo {
  id: string;
  steps: Step[];
  currentStep: number;
  orientation: Orientation;
  clickable: boolean;
  /** How many `<snice-stepper-panel>` children to author. */
  panels: number;
}

export function combo(overrides: Partial<StepperCombo> = {}): StepperCombo {
  const base: StepperCombo = {
    id: '',
    steps: SAMPLE,
    currentStep: 0,
    orientation: 'horizontal',
    clickable: false,
    panels: 0,
    ...overrides,
  };
  base.id = base.id || `${base.steps.length} steps@${base.currentStep}`
    + `/${base.orientation}${base.clickable ? '/clickable' : ''}`
    + `${base.panels ? `/${base.panels} panels` : ''}`;
  return base;
}

/**
 * Mount a combo the way the doc's example does: `orientation` and `clickable`
 * as attributes, `steps` and `currentStep` through the property channel.
 *
 * `steps` is an array, which has no attribute form at all. `currentStep` is
 * assigned as a property here because the attribute the doc names does not
 * reach it — see MATRIX-stepper-1 in `stepper-navigation.test.ts`, which is
 * the finding that pins exactly that. Using the property keeps every other
 * combo measuring the stepper rather than re-reporting one known defect.
 */
export async function makeStepper(c: StepperCombo): Promise<any> {
  const attrs: Record<string, any> = { orientation: c.orientation };
  if (c.clickable) attrs.clickable = true;

  const html = Array.from({ length: c.panels }, (_, i) =>
    `<snice-stepper-panel>Panel ${i + 1}</snice-stepper-panel>`).join('');

  const el = await mount<any>('snice-stepper', attrs, html, {
    steps: c.steps,
    currentStep: c.currentStep,
  });
  await wait(SETTLE);
  return el;
}

// ── Reading ─────────────────────────────────────────────────────────────────

export const stepsOf = (el: HTMLElement): HTMLElement[] => exactParts<HTMLElement>(el, 'step');

export const panelsOf = (el: HTMLElement): any[] => [...el.querySelectorAll('snice-stepper-panel')];

export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort();
}

export function textOf(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ── The oracle ──────────────────────────────────────────────────────────────

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

export function stepperProblems(el: any, c: StepperCombo): Problems {
  const problems = new Problems();

  problems.equal(el.currentStep, c.currentStep, 'currentStep');
  problems.equal(el.orientation, c.orientation, 'orientation');
  problems.equal(el.clickable, c.clickable, 'clickable');
  problems.equal(el.steps.length, c.steps.length, 'steps length');

  // The container carries the orientation, which is the only observable
  // `orientation` has without layout.
  const container = exactPart<HTMLElement>(el, 'container');
  if (!problems.check(!!container, 'no part="container"')) return problems;
  problems.equal(classesOf(container), ['stepper', `stepper--${c.orientation}`].sort(),
    'container classes');

  // The panels wrapper and the default slot are always present, even with no
  // panels authored — `::part(panels)` must stay addressable.
  problems.equal(exactParts(el, 'panels').length, 1, 'part="panels" count');
  problems.check(!!exactPart<HTMLElement>(el, 'panels')!.querySelector('slot:not([name])'),
    'the default slot is not inside part="panels"');

  // ── one row per step, in order ───────────────────────────────────────────
  const rows = stepsOf(el);
  problems.equal(rows.length, c.steps.length, 'rendered step count');
  if (rows.length !== c.steps.length) return problems;

  rows.forEach((row, index) => {
    const step = c.steps[index];
    const status = expectedStatus(step, index, c.currentStep);

    // class = step + step--<status> (+ step--clickable)
    const wanted = ['step', `step--${status}`];
    if (c.clickable) wanted.push('step--clickable');
    problems.equal(classesOf(row), wanted.sort(), `step ${index} classes`);

    problems.equal(row.dataset.stepIndex, String(index), `step ${index} data-step-index`);

    // "Clickable steps are keyboard accessible (Enter/Space)" — which needs a
    // role and a tab stop; a non-clickable step must be neither.
    if (c.clickable) {
      problems.equal(row.getAttribute('role'), 'button', `step ${index} role`);
      problems.equal(row.getAttribute('tabindex'), '0', `step ${index} tabindex`);
    } else {
      problems.check(row.getAttribute('role') !== 'button',
        `step ${index} is exposed as a button while clickable is off`);
      problems.check(row.getAttribute('tabindex') !== '0',
        `step ${index} is a tab stop while clickable is off`);
    }

    // Only the active step is the current one.
    problems.equal(row.getAttribute('aria-current') || null, status === 'active' ? 'step' : null,
      `step ${index} aria-current`);

    // "Completed steps show checkmark"; the rest show their number.
    const indicator = exactPartIn<HTMLElement>(row, 'step-indicator');
    problems.check(!!indicator, `step ${index} has no indicator`);
    if (indicator) {
      problems.equal(textOf(indicator), expectedIndicator(status, index),
        `step ${index} indicator`);
    }

    // Label always; description only when the Step carries one.
    problems.equal(textOf(exactPartIn<HTMLElement>(row, 'step-label')), step.label,
      `step ${index} label`);
    const descriptions = exactPartsIn<HTMLElement>(row, 'step-description');
    problems.equal(descriptions.length, step.description ? 1 : 0,
      `step ${index} description count`);
    if (step.description) {
      problems.equal(textOf(descriptions[0]), step.description, `step ${index} description`);
    }

    // The remaining per-step parts exist exactly once each.
    for (const name of STEP_PARTS) {
      if (name === 'step-description') continue;
      problems.equal(exactPartsIn(row, name).length, 1, `step ${index} part="${name}"`);
    }
  });

  // ── panels: "auto show/hide based on currentStep" ────────────────────────
  const panels = panelsOf(el);
  problems.equal(panels.length, c.panels, 'panel count');
  panels.forEach((panel, index) => {
    problems.equal(panel.hasAttribute('active'), index === c.currentStep,
      `panel ${index} active`);
  });

  return problems;
}

export function expectStepperMatches(el: any, c: StepperCombo): void {
  expect(stepperProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function recordChanges(el: HTMLElement): any[] {
  const seen: any[] = [];
  el.addEventListener('step-change', (event: Event) => seen.push((event as CustomEvent).detail));
  return seen;
}

export function clickStep(el: HTMLElement, index: number): boolean {
  const row = stepsOf(el)[index];
  if (!row) return false;
  row.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

export function pressStep(el: HTMLElement, index: number, key: string): boolean {
  const row = stepsOf(el)[index];
  if (!row) return false;
  row.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  return true;
}

export function teardown(): void {
  unmountAll();
}
