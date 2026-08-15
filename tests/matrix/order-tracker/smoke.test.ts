/**
 * Smoke slice of the snice-order-tracker matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full order-tracker matrix (63 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected by the everyday loop.
 *
 * One marquee combo per feature family:
 *   · structure — `role="list"` / `role="listitem"`, the documented parts;
 *   · steps     — label, timestamp, description;
 *   · status    — the completed check icon, the numbered pending step, and
 *                 `aria-current` on the active one;
 *   · info      — carrier and tracking number;
 *   · events    — `step-click` from a pointer and from Enter.
 *
 * Every assertion routes through the matrix's own oracle module
 * (matrix/order-tracker/order-tracker-support.ts), including its exact-part
 * lookup — happy-dom's `[part~=…]` also matches hyphen-prefixed values, so
 * `part="step"` and `part="step-indicator"` cannot be told apart by selector.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, text, click, key, record } from './matrix-utils';
import {
  journey, mountTracker, stepPart, stepParts, CARRIER, TRACKING,
} from './order-tracker-support';

describe('order-tracker matrix smoke', () => {
  afterEach(() => cleanup());

  it('structure: a list of list items with the documented parts', async () => {
    const steps = journey();
    const el = await mountTracker({ steps, variant: 'horizontal' });

    expect(stepPart(el, 'base')).not.toBeNull();
    expect(stepPart(el, 'steps')?.getAttribute('role')).toBe('list');
    const nodes = stepParts(el, 'step');
    expect(nodes).toHaveLength(steps.length);
    expect(nodes.map(n => n.getAttribute('role'))).toEqual(steps.map(() => 'listitem'));
    expect(stepParts(el, 'step-indicator')).toHaveLength(steps.length);
    expect(stepParts(el, 'step-content')).toHaveLength(steps.length);
  });

  it('steps: label, timestamp and description all render', async () => {
    const steps = journey();
    const el = await mountTracker({ steps });
    const shipped = stepParts(el, 'step')[1];

    expect(text(shipped.querySelector('.tracker__step-label'))).toBe('Shipped');
    expect(text(shipped.querySelector('.tracker__step-timestamp'))).toBe('Feb 22, 2026');
    expect(text(shipped.querySelector('.tracker__step-description')))
      .toBe('Package left warehouse');
  });

  it('status: completed shows a check, pending shows its position, active is current', async () => {
    const steps = journey();
    const el = await mountTracker({ steps });
    const indicators = stepParts(el, 'step-indicator');

    expect(indicators[0].querySelector('svg'), 'completed step has no check icon').not.toBeNull();
    expect(text(indicators[2])).toBe('3');
    expect(stepParts(el, 'step').map(n => n.getAttribute('aria-current')))
      .toEqual(['false', 'step', 'false']);
  });

  it('info: the carrier and tracking number render when given', async () => {
    const el = await mountTracker({
      steps: journey(), carrier: CARRIER, trackingNumber: TRACKING,
    });
    const info = stepPart(el, 'info');
    expect(info).not.toBeNull();
    expect(text(info)).toContain(CARRIER);
    expect(text(info)).toContain(TRACKING);

    cleanup();
    const bare = await mountTracker({ steps: journey() });
    expect(stepPart(bare, 'info'), 'no tracking info, no info section').toBeNull();
  });

  it('events: step-click reports the step and its index, by pointer and by Enter', async () => {
    const steps = journey();
    const el = await mountTracker({ steps });

    const pointer = record(el, ['step-click']);
    click(stepParts(el, 'step')[1]);
    pointer.stop();
    expect(pointer.events).toEqual([{ type: 'step-click', detail: { step: steps[1], index: 1 } }]);

    const keyboard = record(el, ['step-click']);
    const defaultAllowed = key(stepParts(el, 'step')[2], 'Enter');
    keyboard.stop();
    expect(keyboard.events).toEqual([{ type: 'step-click', detail: { step: steps[2], index: 2 } }]);
    expect(defaultAllowed, 'Enter activation must consume the key').toBe(false);
  });
});
