/**
 * snice-stepper matrix — PANELS.
 *
 * `<snice-stepper-panel>` children are documented as "auto show/hide based on
 * currentStep", and the panel itself carries `index: number` and
 * `active: boolean`. The cross is PANEL COUNT x `currentStep`, taken whole for
 * small counts, because the pairing is positional: panel N belongs to step N,
 * and exactly one panel may be active at a time.
 *
 * The mismatched cases are the ones worth having. A wizard whose panels and
 * steps disagree in number is an ordinary authoring mistake, and the documented
 * behaviour has to be "the panel that exists at the current index is shown, and
 * no panel is shown when there isn't one" rather than an exception or a
 * silently wrong panel.
 *
 * Visibility itself is a paint (`[active]` selects a display rule), so the DOM
 * tier asserts the marking and the visual tier asserts that exactly one panel
 * is on screen.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE,
  combo, exactPart, expect, expectStepperMatches, ladder, makeStepper, mount,
  panelsOf, teardown, wait,
} from './stepper-support';

describe('snice-stepper matrix — panels', () => {
  afterEach(teardown);

  // ── panel count x currentStep ────────────────────────────────────────────
  for (const panels of [1, 2, 3, 4]) {
    for (let currentStep = 0; currentStep < 4; currentStep++) {
      it(`${panels} panels at step ${currentStep}`, async () => {
        const c = combo({ steps: ladder(4), currentStep, panels });
        const el = await makeStepper(c);
        expectStepperMatches(el, c);

        const active = panelsOf(el).map(panel => panel.hasAttribute('active'));
        expect(active.filter(Boolean).length, 'at most one panel is shown')
          .toBeLessThanOrEqual(1);
        if (currentStep < panels) {
          expect(active.indexOf(true), 'the panel at the current index').toBe(currentStep);
        } else {
          expect(active.includes(true), 'no panel exists for this step').toBe(false);
        }
      });
    }
  }

  // ── the panel follows every move ─────────────────────────────────────────
  it('the active panel follows currentStep step by step', async () => {
    const el = await makeStepper(combo({ steps: ladder(3), panels: 3 }));
    for (const currentStep of [0, 1, 2, 1, 0]) {
      el.currentStep = currentStep;
      await wait(SETTLE);
      expect(panelsOf(el).map(panel => panel.hasAttribute('active')))
        .toEqual([0, 1, 2].map(index => index === currentStep));
    }
  });

  it('the panel property and attribute agree', async () => {
    const el = await makeStepper(combo({ steps: ladder(3), currentStep: 1, panels: 3 }));
    expect(panelsOf(el).map(panel => panel.active)).toEqual([false, true, false]);
    expect(panelsOf(el).map(panel => panel.hasAttribute('active')))
      .toEqual([false, true, false]);
  });

  it('a stepper with no panels is still valid', async () => {
    const c = combo({ steps: ladder(3), currentStep: 1, panels: 0 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(panelsOf(el)).toEqual([]);
    expect(exactPart(el, 'panels'), 'the wrapper is still there').not.toBeNull();
  });

  it('panels are projected into the panels wrapper, not the ladder', async () => {
    const el = await makeStepper(combo({ steps: ladder(2), panels: 2 }));
    const wrapper = exactPart<HTMLElement>(el, 'panels')!;
    const slot = wrapper.querySelector('slot:not([name])') as HTMLSlotElement;
    expect(slot, 'the default slot lives in the panels wrapper').not.toBeNull();
    expect(exactPart<HTMLElement>(el, 'container')!.querySelector('slot'),
      'and not in the step container').toBeNull();
  });

  // ── the panel element on its own ─────────────────────────────────────────
  it('a standalone panel carries its documented defaults', async () => {
    const panel = await mount<any>('snice-stepper-panel', {}, 'Body');
    expect({ index: panel.index, active: panel.active }).toEqual({ index: 0, active: false });
  });

  it('a panel renders part="panel" wrapping its default slot', async () => {
    const panel = await mount<any>('snice-stepper-panel', {}, 'Body');
    const part = panel.shadowRoot.querySelector('[part="panel"]');
    expect(part, 'part="panel"').not.toBeNull();
    expect(part.querySelector('slot:not([name])'), 'wrapping the default slot').not.toBeNull();
  });

  it('assigning active on a panel reflects to the attribute the styles read', async () => {
    const panel = await mount<any>('snice-stepper-panel', {}, 'Body');
    panel.active = true;
    await wait(SETTLE);
    expect(panel.hasAttribute('active'), 'the [active] selector can see it').toBe(true);

    panel.active = false;
    await wait(SETTLE);
    expect(panel.hasAttribute('active')).toBe(false);
  });

  it('panel content is projected, not replaced', async () => {
    const el = await makeStepper(combo({ steps: ladder(2), panels: 2 }));
    expect(panelsOf(el).map(panel => (panel.textContent ?? '').trim()))
      .toEqual(['Panel 1', 'Panel 2']);
  });

  it('panels authored after the steps still pair by position', async () => {
    const c = combo({ steps: ladder(3), currentStep: 2, panels: 3 });
    const el = await makeStepper(c);
    expect(panelsOf(el)[2].hasAttribute('active')).toBe(true);
    expect((panelsOf(el)[2].textContent ?? '').trim(), 'the third panel is the third one')
      .toBe('Panel 3');
  });
});
