/**
 * snice-popover matrix — structure and the accessibility contract.
 *
 * Crosses all twelve documented placements against `open`, and the dismiss
 * switches against each other. The oracle (`checkPopover`) asserts the parts
 * (`trigger`, `panel`, `content`), the documented ARIA on both halves, that the
 * placement reaches the rendered panel (and only that placement), and that both
 * slots project what was authored into them.
 *
 * 24 + 8 + 5 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  PLACEMENTS,
  checkPopover, combo, comboName, expectNoProblems, makePopover, panel, trigger, wait,
} from './popover-support';

describe('popover matrix — placement x open', () => {
  afterEach(() => unmountAll());

  for (const placement of PLACEMENTS) {
    for (const open of [false, true]) {
      const c = combo({ placement, open });
      it(comboName(c), async () => {
        const el = await makePopover(c);
        expectNoProblems(checkPopover(el, c), comboName(c));
      });
    }
  }
});

describe('popover matrix — dismiss switches', () => {
  afterEach(() => unmountAll());

  for (const noOutsideDismiss of [false, true]) {
    for (const noEscapeDismiss of [false, true]) {
      for (const open of [false, true]) {
        const c = combo({ noOutsideDismiss, noEscapeDismiss, open });
        it(comboName(c), async () => {
          const el = await makePopover(c);
          expectNoProblems(checkPopover(el, c), comboName(c));
        });
      }
    }
  }
});

describe('popover matrix — distance and later changes', () => {
  afterEach(() => unmountAll());

  for (const distance of [0, 6, 24]) {
    it(`distance=${distance} crosses the attribute channel`, async () => {
      const c = combo({ distance });
      const el = await makePopover(c);
      expectNoProblems(checkPopover(el, c), comboName(c));
    });
  }

  it('a later placement change repaints the panel', async () => {
    const el = await makePopover(combo({ placement: 'bottom-end', open: true }));
    (el as any).placement = 'top-start';
    await wait(30);
    expectNoProblems(
      checkPopover(el, combo({ placement: 'top-start', open: true })),
      'placement changed to top-start',
    );
  });

  it('aria-expanded tracks the open state both ways', async () => {
    const el = await makePopover(combo());
    expect(trigger(el)!.getAttribute('aria-expanded')).toBe('false');
    (el as any).show();
    await wait(30);
    expect(trigger(el)!.getAttribute('aria-expanded')).toBe('true');
    (el as any).hide();
    await wait(30);
    expect(trigger(el)!.getAttribute('aria-expanded')).toBe('false');
  });

  it('the panel is marked open in the rendered tree', async () => {
    const el = await makePopover(combo());
    expect(panel(el)!.getAttribute('class')).not.toContain('popover__panel--open');
    (el as any).show();
    await wait(30);
    expect(panel(el)!.getAttribute('class'), 'an open panel is not marked open')
      .toContain('popover__panel--open');
  });
});
