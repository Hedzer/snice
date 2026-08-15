/**
 * Smoke slice of the snice-badge matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * badge matrix (77 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · visibility — the two edges of the documented rule (nothing shows nothing;
 *     `showZero` shows a zero that would otherwise hide);
 *   · content    — the `max` overflow form, the only computed text the badge has;
 *   · dot        — an indicator with no text;
 *   · slot       — the overlaid element survives;
 *   · hooks      — a non-default variant reaches the host attribute the
 *     stylesheet selects on;
 *   · methods    — `hide()` clears everything.
 *
 * Every assertion routes through the matrix's own oracle (`expectedShape` /
 * `readShape` in matrix/badge/badge-support.ts).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, expectShape, settle } from '../matrix-utils';
import {
  expectedShape, expectedHooks, readShape, readHooks, sourceProps, type BadgeCombo,
} from './badge-support';

afterEach(unmountAll);

/** Mount a combo the way the matrix does, then judge it by the same oracle. */
async function check(combo: BadgeCombo, extra: Record<string, any> = {}) {
  const badge = await mount('snice-badge', {}, '<button>Messages</button>', {
    ...sourceProps(combo.source, combo.max),
    max: combo.max,
    showZero: combo.showZero,
    ...extra,
  });
  expectShape(readShape(badge), expectedShape(combo), JSON.stringify(combo));
  return badge;
}

describe('snice-badge matrix smoke', () => {
  it('visibility: an empty badge renders no indicator', async () => {
    await check({ source: 'empty', showZero: false, max: 99 });
  });

  it('visibility: show-zero renders the zero the rule would otherwise hide', async () => {
    await check({ source: 'count-zero', showZero: true, max: 99 });
  });

  it('content: a count above max renders the documented overflow form', async () => {
    await check({ source: 'count-over-max', showZero: false, max: 99 });
  });

  it('dot: an indicator with no text', async () => {
    await check({ source: 'dot', showZero: false, max: 99 });
  });

  it('slot: the overlaid element stays slotted while the badge shows', async () => {
    const badge = await check({ source: 'count', showZero: false, max: 99 });
    const slot = badge.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
    expect([...slot.assignedElements()].map(el => el.tagName.toLowerCase())).toEqual(['button']);
  });

  it('hooks: a non-default variant reflects to the host attribute the CSS selects on', async () => {
    const badge = await mount('snice-badge', {}, '', { content: 'New', variant: 'error' });
    expectShape(readHooks(badge), expectedHooks({ variant: 'error' }), 'error');
  });

  it('methods: hide() clears every content channel at once', async () => {
    const badge = await mount('snice-badge', {}, '', { count: 4 });
    (badge as any).hide();
    await settle(badge, 10);
    expectShape(readShape(badge), expectedShape({
      source: 'empty', showZero: false, max: 99,
    }), 'hide()');
  });
});
