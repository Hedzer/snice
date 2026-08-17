/**
 * snice-stepper matrix — STATUS.
 *
 * `status?: 'pending'|'active'|'completed'|'error'  // auto-computed if not set`
 * is the whole of the component's logic, and it is a PRECEDENCE rule: an
 * explicit status must win over the position-derived one, in either direction.
 *
 * So the cross is the four documented statuses x the three positions relative
 * to `currentStep` (before / at / after) = 12, plus the four un-set cases at
 * each position. Taking it whole is what proves the rule is precedence and not
 * a merge: a component that only honoured `error` (the case the doc's example
 * shows) would pass any spot check written from that example, and would
 * silently overwrite a `pending` a caller pinned deliberately.
 *
 * The second half is the mixed ladder from the doc's own error-state snippet,
 * where explicit and derived statuses sit side by side and must not leak into
 * each other.
 */
import { describe, it, afterEach } from 'vitest';
import {
  STATUSES,
  classesOf, combo, expect, expectStepperMatches, expectedIndicator, expectedStatus,
  ladder, makeStepper, stepsOf, teardown, textOf, wait,
} from './stepper-support';

/** The three positions a step can occupy relative to `currentStep`. */
const POSITIONS = [
  { name: 'before current', index: 0, currentStep: 2, derived: 'completed' },
  { name: 'at current', index: 2, currentStep: 2, derived: 'active' },
  { name: 'after current', index: 4, currentStep: 2, derived: 'pending' },
] as const;

describe('snice-stepper matrix — status', () => {
  afterEach(teardown);

  // ── explicit status x position ───────────────────────────────────────────
  for (const status of STATUSES) {
    for (const position of POSITIONS) {
      it(`explicit "${status}" wins ${position.name}`, async () => {
        const steps = ladder(5).map((step, i) =>
          (i === position.index ? { ...step, status } : step));
        const c = combo({ steps, currentStep: position.currentStep });
        const el = await makeStepper(c);
        expectStepperMatches(el, c);

        const row = stepsOf(el)[position.index];
        expect(classesOf(row), 'the explicit status is the rendered one')
          .toContain(`step--${status}`);
        expect(textOf(row.querySelector('[part="step-indicator"]')), 'and drives the indicator')
          .toBe(expectedIndicator(status, position.index));
      });
    }
  }

  // ── no explicit status: the documented derivation ────────────────────────
  for (const position of POSITIONS) {
    it(`a status-less step ${position.name} is "${position.derived}"`, async () => {
      const c = combo({ steps: ladder(5), currentStep: position.currentStep });
      const el = await makeStepper(c);
      expectStepperMatches(el, c);

      const row = stepsOf(el)[position.index];
      expect(classesOf(row)).toContain(`step--${position.derived}`);
      expect(expectedStatus(c.steps[position.index], position.index, c.currentStep))
        .toBe(position.derived);
    });
  }

  // ── the doc's own error example ──────────────────────────────────────────
  it('the documented error ladder renders exactly the three pinned statuses', async () => {
    const c = combo({
      steps: [
        { label: 'Upload', status: 'completed' },
        { label: 'Validate', status: 'error' },
        { label: 'Process', status: 'pending' },
      ],
      currentStep: 0,
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    expect(stepsOf(el).map(row => classesOf(row).find(name => name.startsWith('step--'))))
      .toEqual(['step--completed', 'step--error', 'step--pending']);
    // `currentStep` is 0, which would derive "active" for step 0 — the pin wins.
    expect(stepsOf(el)[0].getAttribute('aria-current') || null,
      'a pinned completed step is not the current one').toBeNull();
  });

  it('pinned and derived statuses coexist without leaking', async () => {
    const c = combo({
      steps: [
        { label: 'A' },
        { label: 'B', status: 'error' },
        { label: 'C' },
        { label: 'D' },
      ],
      currentStep: 2,
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    expect(stepsOf(el).map(row => classesOf(row).find(name => name.startsWith('step--'))))
      .toEqual(['step--completed', 'step--error', 'step--active', 'step--pending']);
  });

  // ── the checkmark ────────────────────────────────────────────────────────
  it('completed steps show a checkmark and every other step its number', async () => {
    const c = combo({ steps: ladder(4), currentStep: 2 });
    const el = await makeStepper(c);
    expect(stepsOf(el).map(row => textOf(row.querySelector('[part="step-indicator"]'))))
      .toEqual(['✓', '✓', '3', '4']);
  });

  it('a pinned completed step shows a checkmark even at index 0 of a fresh stepper', async () => {
    const c = combo({ steps: [{ label: 'Done', status: 'completed' }], currentStep: 0 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(textOf(stepsOf(el)[0].querySelector('[part="step-indicator"]'))).toBe('✓');
  });

  it('a pinned error step keeps its number rather than a checkmark', async () => {
    const c = combo({
      steps: [{ label: 'A' }, { label: 'B', status: 'error' }],
      currentStep: 1,
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(textOf(stepsOf(el)[1].querySelector('[part="step-indicator"]'))).toBe('2');
  });

  // ── aria-current follows the ACTIVE status, not the index ────────────────
  it('exactly one step is aria-current when one is active', async () => {
    const c = combo({ steps: ladder(4), currentStep: 2 });
    const el = await makeStepper(c);
    const current = stepsOf(el).filter(row => row.getAttribute('aria-current') === 'step');
    expect(current.length).toBe(1);
    expect(current[0].dataset.stepIndex).toBe('2');
  });

  it('a ladder whose current index is pinned to another status has no current step', async () => {
    const c = combo({
      steps: [{ label: 'A' }, { label: 'B', status: 'error' }, { label: 'C' }],
      currentStep: 1,
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el).filter(row => row.getAttribute('aria-current') === 'step').length,
      'the pinned status is not "active", so nothing claims to be current').toBe(0);
  });

  // ── currentStep outside the ladder ───────────────────────────────────────
  it('a currentStep past the last step marks everything completed', async () => {
    // The wizard-finished state: `currentStep = steps.length`.
    const c = combo({ steps: ladder(3), currentStep: 3 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el).map(row => textOf(row.querySelector('[part="step-indicator"]'))))
      .toEqual(['✓', '✓', '✓']);
  });

  it('a negative currentStep leaves every step pending', async () => {
    const c = combo({ steps: ladder(3), currentStep: -1 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el).filter(row => row.getAttribute('aria-current') === 'step').length)
      .toBe(0);
  });

  it('changing a step\'s pinned status re-renders that step alone', async () => {
    const el = await makeStepper(combo({ steps: ladder(3), currentStep: 1 }));
    el.steps = [{ label: 'Step 1' }, { label: 'Step 2', status: 'error' }, { label: 'Step 3' }];
    await wait(30);
    expectStepperMatches(el, combo({
      steps: [{ label: 'Step 1' }, { label: 'Step 2', status: 'error' }, { label: 'Step 3' }],
      currentStep: 1,
    }));
  });
});
