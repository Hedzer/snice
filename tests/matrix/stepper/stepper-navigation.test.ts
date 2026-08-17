/**
 * snice-stepper matrix — NAVIGATION: `clickable`, `step-change`, and the
 * panels the doc says follow `currentStep`.
 *
 * The cross is GESTURE x `clickable` x TARGET. There are three documented
 * gestures — a pointer click, Enter, and Space ("Clickable steps are keyboard
 * accessible (Enter/Space)") — and `clickable: boolean = false` is documented
 * to gate all of them. The inert half is the half worth crossing: a stepper
 * that navigates on click but not on Enter is a keyboard trap, and one that
 * navigates while `clickable` is off breaks the read-only indicator the
 * default is for.
 *
 * `step-change` is "Cancelable via preventDefault()", so every gesture is also
 * run with a listener that cancels, and the state must not move.
 *
 * ── FINDING: MATRIX-stepper-1 ──────────────────────────────────────────────
 *
 * The doc gives `currentStep` the attribute `current-step`. The element does
 * not observe it — see the pinned test at the end of this file.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SAMPLE, SETTLE,
  clickStep, combo, expect, expectStepperMatches, ladder, makeStepper, mount,
  panelsOf, pressStep, recordChanges, stepsOf, teardown, wait,
} from './stepper-support';

/** The three documented ways to activate a step. */
const GESTURES: Array<{ name: string; act: (el: any, index: number) => boolean }> = [
  { name: 'click', act: (el, i) => clickStep(el, i) },
  { name: 'Enter', act: (el, i) => pressStep(el, i, 'Enter') },
  { name: 'Space', act: (el, i) => pressStep(el, i, ' ') },
];

describe('snice-stepper matrix — navigation', () => {
  afterEach(teardown);

  // ── gesture x clickable ──────────────────────────────────────────────────
  for (const gesture of GESTURES) {
    for (const clickable of [false, true]) {
      it(`${gesture.name} ${clickable ? 'navigates' : 'is inert'} (clickable=${clickable})`, async () => {
        const el = await makeStepper(combo({ steps: SAMPLE, clickable, currentStep: 0 }));
        const changes = recordChanges(el);

        gesture.act(el, 2);
        await wait(SETTLE);

        expect(el.currentStep, 'currentStep').toBe(clickable ? 2 : 0);
        if (clickable) {
          expect(changes).toEqual([
            { previousStep: 0, currentStep: 2, step: SAMPLE[2] },
          ]);
        } else {
          expect(changes, 'a read-only stepper announces nothing').toEqual([]);
        }
      });

      it(`${gesture.name} respects preventDefault (clickable=${clickable})`, async () => {
        const el = await makeStepper(combo({ steps: SAMPLE, clickable, currentStep: 1 }));
        el.addEventListener('step-change', (event: Event) => event.preventDefault());

        gesture.act(el, 0);
        await wait(SETTLE);

        expect(el.currentStep, 'a cancelled change does not move the stepper').toBe(1);
      });
    }
  }

  // ── every step is reachable ──────────────────────────────────────────────
  for (const gesture of GESTURES) {
    it(`${gesture.name} reaches every step in the ladder`, async () => {
      const el = await makeStepper(combo({ steps: ladder(4), clickable: true }));
      const changes = recordChanges(el);

      for (const index of [3, 1, 2, 0]) {
        gesture.act(el, index);
        await wait(SETTLE);
        expect(el.currentStep, `after activating ${index}`).toBe(index);
      }

      expect(changes.map(change => change.currentStep)).toEqual([3, 1, 2, 0]);
      expect(changes.map(change => change.previousStep)).toEqual([0, 3, 1, 2]);
    });
  }

  it('a key that is neither Enter nor Space leaves the stepper alone', async () => {
    const el = await makeStepper(combo({ clickable: true }));
    const changes = recordChanges(el);
    for (const key of ['a', 'Tab', 'ArrowRight', 'Escape']) pressStep(el, 2, key);
    await wait(SETTLE);
    expect(el.currentStep).toBe(0);
    expect(changes).toEqual([]);
  });

  // ── the event detail ─────────────────────────────────────────────────────
  it('step-change carries { previousStep, currentStep, step }', async () => {
    const el = await makeStepper(combo({ steps: SAMPLE, clickable: true, currentStep: 1 }));
    const changes = recordChanges(el);

    clickStep(el, 2);
    await wait(SETTLE);

    expect(changes).toEqual([{ previousStep: 1, currentStep: 2, step: SAMPLE[2] }]);
  });

  it('step-change bubbles and is composed', async () => {
    const el = await makeStepper(combo({ clickable: true }));
    const seen: any[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent).detail.currentStep);
    document.addEventListener('step-change', listener);

    clickStep(el, 1);
    await wait(SETTLE);
    document.removeEventListener('step-change', listener);

    expect(seen).toEqual([1]);
  });

  it('activating the step already current still announces the gesture', async () => {
    // The doc's event is "step-change" with both endpoints in the detail; a
    // consumer decides whether a same-step activation is interesting.
    const el = await makeStepper(combo({ steps: SAMPLE, clickable: true, currentStep: 1 }));
    const changes = recordChanges(el);

    clickStep(el, 1);
    await wait(SETTLE);

    expect(changes).toEqual([{ previousStep: 1, currentStep: 1, step: SAMPLE[1] }]);
    expect(el.currentStep).toBe(1);
  });

  it('assigning currentStep directly does not fabricate a step-change', async () => {
    const el = await makeStepper(combo({ steps: SAMPLE }));
    const changes = recordChanges(el);

    el.currentStep = 2;
    await wait(SETTLE);

    expect(el.currentStep).toBe(2);
    expect(changes, 'the author already knows what they did').toEqual([]);
    expectStepperMatches(el, combo({ steps: SAMPLE, currentStep: 2 }));
  });

  // ── panels follow currentStep ────────────────────────────────────────────
  it('a click moves the active panel with the active step', async () => {
    const c = combo({ steps: SAMPLE, clickable: true, panels: 3 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    clickStep(el, 2);
    await wait(SETTLE);

    expect(panelsOf(el).map(panel => panel.hasAttribute('active')))
      .toEqual([false, false, true]);
    expectStepperMatches(el, combo({ ...c, currentStep: 2 }));
  });

  it('the panel wired to a cancelled change does not move either', async () => {
    const c = combo({ steps: SAMPLE, clickable: true, panels: 3, currentStep: 0 });
    const el = await makeStepper(c);
    el.addEventListener('step-change', (event: Event) => event.preventDefault());

    clickStep(el, 2);
    await wait(SETTLE);

    expect(panelsOf(el).map(panel => panel.hasAttribute('active')))
      .toEqual([true, false, false]);
  });

  /**
   * MATRIX-stepper-1.
   *
   * Documented: `currentStep: number = 0;  // attr: current-step`. That comment
   * is the doc's own notation for "this property is settable from markup under
   * this attribute name" — it is how the same doc set documents every other
   * kebab attribute in the library (`show-first`, `no-header`, `close-on-select`),
   * and it is the only way `<snice-stepper current-step="2">` can work.
   *
   * Actual: the element's observed attributes are
   * `controller, autofocus, currentstep, orientation, clickable`. There is no
   * `current-step`, so the documented markup is inert: the attribute is written
   * to the DOM, ignored, and the stepper stays on step 0. A page authored
   * exactly as the doc describes shows the wrong step with no error anywhere.
   *
   * Combo: `<snice-stepper current-step="2">` with three steps.
   * Expected: `currentStep === 2`, step 2 active.
   * Actual:   `currentStep === 0`, step 0 active.
   */
  it.fails('MATRIX-stepper-1: the documented current-step attribute sets currentStep', async () => {
    const el = await mount<any>('snice-stepper', { 'current-step': 2 }, '', { steps: SAMPLE });
    await wait(SETTLE);

    expect(el.currentStep, 'the documented attribute reaches the property').toBe(2);
    expect(stepsOf(el)[2].getAttribute('aria-current')).toBe('step');
  });

  it('assigning the currentStep PROPERTY is the working path', async () => {
    // The counterexample that keeps the finding honest: the property channel
    // the rest of this matrix uses does exactly what the doc promises.
    const c = combo({ steps: SAMPLE, currentStep: 2 });
    const el = await makeStepper(c);
    expect(el.currentStep).toBe(2);
    expectStepperMatches(el, c);
  });
});
