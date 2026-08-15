/**
 * Matrix slice ORDER-TRACKER / STEPS — one step's documented fields and its
 * indicator, crossed with every status and both variants.
 *
 * Dimensions: status (3) x extras (4: bare / timestamp / description / both)
 * x icon (2) = 24 combos, plus the status marking across the variants (6).
 * 30 cases.
 *
 * Contract asserted (docs/ai/components/order-tracker.md):
 *   · A step renders its `label`; `timestamp` and `description` render exactly
 *     when they are declared.
 *   · "Completed steps show check icons" — and every other step's indicator
 *     carries its 1-based position instead.
 *   · An authored `icon` is the more specific instruction and replaces both.
 *   · The step's status is marked on the step itself, so a stylesheet (and a
 *     reader) can tell pending from active from completed.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, text, Problems, expectClean } from './matrix-utils';
import {
  VARIANTS, STATUSES, EXTRA_SHAPES, stepWith, journey, mountTracker, indicatorFor,
  stepPart, stepParts,
} from './order-tracker-support';

describe('order-tracker matrix: steps', () => {
  afterEach(() => cleanup());

  for (const combo of cross({
    status: STATUSES, extras: EXTRA_SHAPES, icon: [false, true],
  })) {
    it(`${combo.id}: the step renders its documented fields`, async () => {
      const step = stepWith(combo.status, combo.extras, combo.icon ? '🚚' : undefined);
      const el = await mountTracker({ steps: [step] });
      const p = new Problems();

      const node = stepParts(el, 'step')[0];
      if (!node) {
        p.say('the step rendered nothing');
        expectClean(p, combo.id);
        return;
      }

      p.eq('label', text(node.querySelector('.tracker__step-label')), step.label);

      const timestamp = node.querySelector('.tracker__step-timestamp');
      if (step.timestamp) {
        p.eq('timestamp', text(timestamp), step.timestamp);
      } else {
        p.ok(timestamp === null, `a step with no timestamp rendered "${text(timestamp)}"`);
      }

      const description = node.querySelector('.tracker__step-description');
      if (step.description) {
        p.eq('description', text(description), step.description);
      } else {
        p.ok(description === null, `a step with no description rendered "${text(description)}"`);
      }

      // The indicator: an authored icon, a check for completed, else the
      // 1-based position.
      const indicator = stepPart(el, 'step-indicator');
      p.ok(indicator !== null, 'no part="step-indicator"');
      const expected = indicatorFor(step, 0);
      const svg = indicator?.querySelector('svg');
      if (expected === 'icon') {
        p.ok(text(indicator).includes('🚚'),
          `an authored icon rendered "${text(indicator)}"`);
        p.ok(svg === null, 'an authored icon still drew the built-in check');
      } else if (expected === 'check') {
        p.ok(svg !== null, 'a completed step rendered no check icon');
        p.eq('completed indicator text', text(indicator), '');
      } else {
        p.eq('position indicator', text(indicator), expected);
        p.ok(svg === null, `a ${combo.status} step drew a check icon`);
      }

      expectClean(p, combo.id);
    });
  }

  // ── The status is legible on the step, in both variants ───────────────────

  for (const combo of cross({ variant: VARIANTS, status: STATUSES })) {
    it(`${combo.id}: the step is marked with its status`, async () => {
      const steps = journey().map(step => ({ ...step, status: combo.status }));
      const el = await mountTracker({ steps, variant: combo.variant });
      const p = new Problems();

      for (const [i, node] of stepParts(el, 'step').entries()) {
        p.ok(node.className.includes(combo.status),
          `step ${i} class "${node.className}" does not carry status "${combo.status}"`);
        // …and never claims a status it does not have.
        for (const other of STATUSES.filter(s => s !== combo.status)) {
          p.ok(!node.className.includes(`--${other}`),
            `step ${i} is marked "${other}" as well as "${combo.status}"`);
        }
      }

      // The indicator of every step agrees with that status.
      const indicators = stepParts(el, 'step-indicator');
      p.eq('indicators', indicators.length, steps.length);
      for (const [i, indicator] of indicators.entries()) {
        const expected = indicatorFor(steps[i], i);
        if (expected === 'check') {
          p.ok(indicator.querySelector('svg') !== null, `step ${i} shows no check icon`);
        } else {
          p.eq(`step ${i} indicator`, text(indicator), expected);
        }
      }

      expectClean(p, combo.id);
    });
  }
});
