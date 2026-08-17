/**
 * snice-stepper matrix — RENDER.
 *
 * The cross that owns the rendered ladder: step COUNT x `currentStep` (every
 * valid position for that count) x `orientation` x `clickable`.
 *
 * `currentStep` is crossed exhaustively rather than sampled because it is the
 * pivot of the documented status rule — every index below it is `completed`,
 * the index itself is `active`, every index above is `pending` — and the two
 * boundaries move together. A stepper that renders the checkmark one step
 * early looks right at exactly one position, and it is usually the one a spot
 * check picks.
 *
 * `clickable` is in the cross because it changes the same `class` string the
 * status writes to, and it adds the `role`/`tabindex` pair that the doc's
 * "Clickable steps are keyboard accessible" depends on.
 *
 * Every combo is judged by the whole oracle: classes, indicator glyph, label,
 * description presence, `data-step-index`, `aria-current`, the container's
 * orientation class, the panels wrapper, and each per-step part exactly once.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, ORIENTATIONS, PARTS, SAMPLE,
  combo, exactPart, exactParts, exactPartsIn, expect, expectStepperMatches, ladder,
  makeStepper, stepsOf, teardown, textOf, wait,
} from './stepper-support';

describe('snice-stepper matrix — render', () => {
  afterEach(teardown);

  // ── count x currentStep x orientation x clickable ────────────────────────
  for (const count of [1, 3, 5]) {
    for (let currentStep = 0; currentStep < count; currentStep++) {
      for (const orientation of ORIENTATIONS) {
        for (const clickable of [false, true]) {
          const c = combo({ steps: ladder(count), currentStep, orientation, clickable });
          it(`renders the documented ladder: ${c.id}`, async () => {
            const el = await makeStepper(c);
            expectStepperMatches(el, c);
          });
        }
      }
    }
  }

  // ── the doc's own example ────────────────────────────────────────────────
  it('the documented three-step example renders label and description', async () => {
    const c = combo({ steps: SAMPLE, currentStep: 1 });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    const rows = stepsOf(el);
    expect(textOf(rows[0]), 'a completed step shows its checkmark and label')
      .toContain('Account');
    expect(exactPartsIn(rows[1], 'step-description').length,
      'the middle step is the only one the example gives a description').toBe(1);
    expect(exactPartsIn(rows[0], 'step-description').length, 'and the first has none').toBe(0);
  });

  it('only the steps that carry a description render one', async () => {
    const c = combo({
      steps: [
        { label: 'A' },
        { label: 'B', description: 'second' },
        { label: 'C', description: 'third' },
      ],
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    const present = stepsOf(el).map(row =>
      row.querySelectorAll('[part="step-description"]').length > 0);
    expect(present).toEqual([false, true, true]);
  });

  // ── defaults ─────────────────────────────────────────────────────────────
  it('an attribute-free stepper carries every documented default', async () => {
    const el = await makeStepper(combo({ steps: [], currentStep: 0, orientation: 'horizontal' }));
    expect({
      currentStep: el.currentStep, orientation: el.orientation, clickable: el.clickable,
    }).toEqual(DEFAULTS);
    expect(el.steps, 'steps defaults to an empty array').toEqual([]);
  });

  it('an empty steps array renders a container and no steps at all', async () => {
    const c = combo({ steps: [] });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);
    expect(stepsOf(el)).toEqual([]);
    expect(exactPart(el, 'container'), 'the container survives').not.toBeNull();
    expect(exactPart(el, 'panels'), 'so does the panels wrapper').not.toBeNull();
  });

  // ── re-rendering ─────────────────────────────────────────────────────────
  it('assigning steps re-renders the whole ladder', async () => {
    const el = await makeStepper(combo({ steps: ladder(2) }));
    expect(stepsOf(el).length).toBe(2);

    el.steps = ladder(4);
    await wait(30);
    expectStepperMatches(el, combo({ steps: ladder(4), currentStep: 0 }));
  });

  it('advancing currentStep moves the active step and the checkmarks', async () => {
    const el = await makeStepper(combo({ steps: ladder(4) }));
    for (const currentStep of [0, 1, 2, 3]) {
      el.currentStep = currentStep;
      await wait(30);
      expectStepperMatches(el, combo({ steps: ladder(4), currentStep }));
    }
  });

  it('switching orientation rewrites the container class', async () => {
    const el = await makeStepper(combo({ orientation: 'horizontal' }));
    el.orientation = 'vertical';
    await wait(30);
    expectStepperMatches(el, combo({ orientation: 'vertical' }));
  });

  it('turning clickable on gives every step its role and tab stop', async () => {
    const el = await makeStepper(combo({ clickable: false }));
    el.clickable = true;
    await wait(30);
    expectStepperMatches(el, combo({ clickable: true }));
  });

  // ── the part inventory ───────────────────────────────────────────────────
  it('every documented part is rendered by a stepper that uses all of them', async () => {
    const c = combo({
      steps: [{ label: 'A', description: 'first' }, { label: 'B' }],
      currentStep: 1,
      panels: 2,
    });
    const el = await makeStepper(c);
    expectStepperMatches(el, c);

    const missing = PARTS.filter((name) => {
      if (name === 'panel') {
        // `panel` is the PANEL element's own part, not the stepper's.
        return el.querySelector('snice-stepper-panel')
          ?.shadowRoot?.querySelector('[part="panel"]') == null;
      }
      return exactParts(el, name).length === 0;
    });
    expect(missing, 'documented parts with nothing rendered').toEqual([]);
  });

  it('each step owns its own connector', async () => {
    // The connector is documented as the "Line between steps"; one per step
    // keeps `::part(step-connector)` addressable from every row, and the
    // trailing one is hidden by the stylesheet rather than by the template.
    const el = await makeStepper(combo({ steps: ladder(4) }));
    for (const row of stepsOf(el)) {
      expect(row.querySelectorAll('[part="step-connector"]').length).toBe(1);
    }
  });
});
