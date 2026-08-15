/**
 * Matrix slice ORDER-TRACKER / STRUCTURE — the documented parts, the tracking
 * info section and the list semantics, crossed with both variants.
 *
 * Dimensions: variant (2) x info shape (4) x step count (3: 0/1/3) = 24 combos.
 *
 * Contract asserted (docs/ai/components/order-tracker.md):
 *   · Parts `base`, `info`, `steps`, `step`, `step-indicator`, `step-content`.
 *   · The `info` section exists exactly when a `carrier` or a `trackingNumber`
 *     was given, and shows the values it was given.
 *   · a11y: the steps container is `role="list"`, each step `role="listitem"`,
 *     and every step is keyboard-focusable.
 *   · `aria-current="step"` marks the active step, and only it.
 *   · `variant` is an attribute and reaches the steps container, which is the
 *     documented horizontal/vertical switch.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, text, Problems, expectClean } from './matrix-utils';
import {
  VARIANTS, INFO_SHAPES, COUNTS, infoFor, journeyOf, mountTracker, CARRIER, TRACKING,
  stepPart, stepParts,
} from './order-tracker-support';

describe('order-tracker matrix: structure', () => {
  afterEach(() => cleanup());

  for (const combo of cross({ variant: VARIANTS, info: INFO_SHAPES, count: COUNTS })) {
    it(`${combo.id}: the documented parts, info section and list semantics`, async () => {
      const steps = journeyOf(combo.count);
      const info = infoFor(combo.info);
      const el = await mountTracker({ steps, variant: combo.variant, ...info });
      const p = new Problems();

      p.ok(stepPart(el, 'base') !== null, 'no part="base"');

      // The steps container is always present, and is a list.
      const container = stepPart(el, 'steps');
      p.ok(container !== null, 'no part="steps"');
      p.eq('steps role', container?.getAttribute('role'), 'list');
      p.ok((container?.className ?? '').includes(combo.variant),
        `steps container "${container?.className}" does not carry the ${combo.variant} variant`);
      p.eq('variant attribute', el.getAttribute('variant'), combo.variant);

      // One step per declared step, each a focusable list item.
      const stepNodes = stepParts(el, 'step');
      p.eq('step count', stepNodes.length, steps.length);
      p.eq('step roles', stepNodes.map(node => node.getAttribute('role')),
        steps.map(() => 'listitem'));
      p.eq('step tabindex', stepNodes.map(node => node.getAttribute('tabindex')),
        steps.map(() => '0'));

      // aria-current marks the active step, and only it.
      p.eq('aria-current', stepNodes.map(node => node.getAttribute('aria-current')),
        steps.map(step => step.status === 'active' ? 'step' : 'false'));

      // Every step owns an indicator and a content column.
      for (const [i, node] of stepNodes.entries()) {
        p.ok(node.querySelector('[part~="step-indicator"]') !== null,
          `step ${i} has no part="step-indicator"`);
        p.ok(node.querySelector('[part~="step-content"]') !== null,
          `step ${i} has no part="step-content"`);
      }

      // The tracking info section, exactly when there is something to show.
      const infoPart = stepPart(el, 'info');
      const wantsInfo = combo.info !== 'none';
      p.ok((infoPart !== null) === wantsInfo,
        `part="info" ${infoPart ? 'present' : 'absent'} for info shape "${combo.info}"`);
      if (infoPart) {
        const shown = text(infoPart);
        p.eq('carrier shown', shown.includes(CARRIER), !!info.carrier);
        p.eq('tracking number shown', shown.includes(TRACKING), !!info.trackingNumber);
      }

      // The step labels, in the order they were given.
      p.eq('step labels',
        stepNodes.map(node => text(node.querySelector('.tracker__step-label'))),
        steps.map(step => step.label));

      expectClean(p, combo.id);
    });
  }
});
