/**
 * Smoke slice of the snice-stepper matrix — the everyday-loop tier.
 *
 * One combo per feature family, so a family that breaks cannot hide:
 *
 *   · render     — the ladder, its parts, and the orientation class;
 *   · status     — the documented derivation and the checkmark;
 *   · pinning    — an explicit status wins over the derived one;
 *   · clickable  — a click navigates and a read-only stepper does not;
 *   · cancel     — `preventDefault()` on `step-change` holds the stepper still;
 *   · panels     — the active panel follows `currentStep`.
 *
 * Structure routes through the matrix oracle (`expectStepperMatches`).
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SAMPLE, SETTLE,
  classesOf, clickStep, combo, expect, expectStepperMatches, ladder, makeStepper,
  panelsOf, recordChanges, stepsOf, teardown, textOf, wait,
} from './stepper-support';

describe('stepper matrix smoke', () => {
  afterEach(teardown);

  it('render: the ladder, its parts and the orientation class', async () => {
    const c = combo({ steps: SAMPLE, currentStep: 1, orientation: 'vertical' });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el).length).toBe(3);
  });

  it('status: the documented derivation and the completed checkmark', async () => {
    const c = combo({ steps: ladder(4), currentStep: 2 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el).map(row => textOf(row.querySelector('[part="step-indicator"]'))))
      .toEqual(['✓', '✓', '3', '4']);
  });

  it('pinning: an explicit status wins over the derived one', async () => {
    const c = combo({
      steps: [
        { label: 'Upload', status: 'completed' },
        { label: 'Validate', status: 'error' },
        { label: 'Process', status: 'pending' },
      ],
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(classesOf(stepsOf(el)[1])).toContain('step--error');
  });

  it('clickable: a click navigates, a read-only stepper does not', async () => {
    const el = await makeStepper(combo({ steps: SAMPLE, clickable: true }));
    const changes = recordChanges(el);
    clickStep(el, 2);
    await wait(SETTLE);
    expect(el.currentStep).toBe(2);
    expect(changes).toEqual([{ previousStep: 0, currentStep: 2, step: SAMPLE[2] }]);
    teardown();

    const readOnly = await makeStepper(combo({ steps: SAMPLE }));
    const none = recordChanges(readOnly);
    clickStep(readOnly, 2);
    await wait(SETTLE);
    expect(readOnly.currentStep).toBe(0);
    expect(none).toEqual([]);
  });

  it('cancel: preventDefault on step-change holds the stepper still', async () => {
    const el = await makeStepper(combo({ steps: SAMPLE, clickable: true, currentStep: 1 }));
    el.addEventListener('step-change', (event: Event) => event.preventDefault());
    clickStep(el, 0);
    await wait(SETTLE);
    expect(el.currentStep).toBe(1);
  });

  it('panels: the active panel follows currentStep', async () => {
    const c = combo({ steps: SAMPLE, panels: 3, currentStep: 0 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    el.currentStep = 2;
    await wait(SETTLE);
    expect(panelsOf(el).map(panel => panel.hasAttribute('active')))
      .toEqual([false, false, true]);
  });
});
