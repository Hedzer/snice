/**
 * Matrix slice ORDER-TRACKER / INTERACTION — `step-click` from every documented
 * activation path.
 *
 * Dimensions: variant (2) x activation (3: pointer / Enter / Space), clicking
 * EVERY step of a three-step order = 6 combos x 3 steps, plus the
 * single-step and empty edges (3). 9 cases.
 *
 * Contract asserted (docs/ai/components/order-tracker.md):
 *   · `step-click` → `{ step: OrderStep, index: number }` — the step object as
 *     it was given, and its index in `steps`.
 *   · "Steps are keyboard-focusable with Enter/Space activation", and the
 *     activation consumes the key (a Space that also scrolls the page is a
 *     defect a keyboard user feels immediately).
 *   · A tracker with no steps has nothing to activate.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, click, key, record, Problems, expectClean } from './matrix-utils';
import { VARIANTS, journey, mountTracker, stepParts } from './order-tracker-support';

type Activation = 'pointer' | 'Enter' | ' ';
const ACTIVATIONS: Activation[] = ['pointer', 'Enter', ' '];
const nameOf = (activation: Activation) =>
  activation === 'pointer' ? 'pointer' : activation === ' ' ? 'Space' : 'Enter';

describe('order-tracker matrix: interaction', () => {
  afterEach(() => cleanup());

  for (const combo of cross({ variant: VARIANTS, activation: ACTIVATIONS })) {
    it(`variant=${combo.variant} via ${nameOf(combo.activation)}: step-click reports the step and its index`, async () => {
      const steps = journey();
      const el = await mountTracker({ steps, variant: combo.variant });
      const p = new Problems();

      for (const [index, node] of stepParts(el, 'step').entries()) {
        const seen = record(el, ['step-click']);
        let defaultAllowed = true;
        if (combo.activation === 'pointer') {
          click(node);
        } else {
          defaultAllowed = key(node, combo.activation);
        }
        seen.stop();

        p.eq(`step ${index} events`, seen.events.length, 1);
        p.eq(`step ${index} detail`, seen.events[0]?.detail, { step: steps[index], index });
        if (combo.activation !== 'pointer') {
          p.ok(defaultAllowed === false,
            `${nameOf(combo.activation)} on step ${index} did not preventDefault`);
        }
      }

      expectClean(p, `${combo.variant}/${nameOf(combo.activation)}`);
    });
  }

  it('a key that is not Enter or Space does not activate a step', async () => {
    const el = await mountTracker({ steps: journey() });
    const p = new Problems();

    const seen = record(el, ['step-click']);
    for (const pressed of ['a', 'Tab', 'ArrowRight']) key(stepParts(el, 'step')[0], pressed);
    seen.stop();

    p.eq('events', seen.events.length, 0);
    expectClean(p, 'inert-keys');
  });

  it('a single-step tracker reports index 0', async () => {
    const steps = journey().slice(0, 1);
    const el = await mountTracker({ steps });
    const p = new Problems();

    const seen = record(el, ['step-click']);
    click(stepParts(el, 'step')[0]);
    seen.stop();

    p.eq('detail', seen.events[0]?.detail, { step: steps[0], index: 0 });
    expectClean(p, 'single-step');
  });

  it('a tracker with no steps has nothing to activate', async () => {
    const el = await mountTracker({ steps: [] });
    const p = new Problems();
    p.eq('steps rendered', stepParts(el, 'step').length, 0);
    expectClean(p, 'empty');
  });
});
