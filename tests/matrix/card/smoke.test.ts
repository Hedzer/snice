/**
 * Smoke slice of the snice-card matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/card/, 65 combos) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the fully-slotted card, the clickable/plain role split, the
 * click and keyboard toggles, and the disabled lock.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, expectClean, press, removeComponent, wait,
} from '../matrix-kit';
import {
  basePart, checkCard, footerPart, headerPart, makeCard, shown, spec,
} from './card-support';
import '../../../packages/components/src/card/snice-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('card matrix smoke', () => {
  it('a fully-slotted card renders every documented region', async () => {
    const s = spec({ variant: 'bordered', size: 'large', slots: 'all', image: true });
    el = await makeCard(s);
    const problems = new Problems();

    checkCard(el, s, problems);

    expectClean(problems, 'smoke/full');
  });

  it('a card with nothing in its header or footer shows neither band', async () => {
    const s = spec({ slots: 'body' });
    el = await makeCard(s);
    const problems = new Problems();

    checkCard(el, s, problems);
    problems.check(!shown(headerPart(el)), 'an empty header band is showing');
    problems.check(!shown(footerPart(el)), 'an empty footer band is showing');

    expectClean(problems, 'smoke/empty-bands');
  });

  it('clickable promotes the card to a keyboard-reachable button', async () => {
    const s = spec({ clickable: true });
    el = await makeCard(s);
    const problems = new Problems();

    checkCard(el, s, problems);
    problems.equal(basePart(el)?.getAttribute('role'), 'button', 'role');
    problems.equal(basePart(el)?.getAttribute('tabindex'), '0', 'tabindex');

    expectClean(problems, 'smoke/clickable');
  });

  it('clicking and pressing Enter both toggle and announce', async () => {
    el = await makeCard(spec({ clickable: true }));
    const problems = new Problems();
    const seen = captureEvents<{ selected: boolean }>(el, 'card-click');

    click(basePart(el));
    await wait(30);
    problems.equal(seen, [{ selected: true }], 'card-click after a click');

    press(basePart(el), 'Enter');
    await wait(30);
    problems.equal(seen.length, 2, 'card-click count after Enter');
    problems.equal(seen[1], { selected: false }, 'card-click detail after Enter');
    problems.equal(basePart(el)?.getAttribute('aria-pressed'), 'false', 'aria-pressed');

    expectClean(problems, 'smoke/activation');
  });

  it('a disabled card is inert and out of the tab order', async () => {
    el = await makeCard(spec({ clickable: true, disabled: true }));
    const problems = new Problems();
    const seen = captureEvents(el, 'card-click');

    click(basePart(el));
    press(basePart(el), ' ');
    await wait(30);

    problems.equal(seen.length, 0, 'card-click events from a disabled card');
    problems.equal((el as any).selected, false, 'a disabled card changed its selection');
    problems.equal(basePart(el)?.getAttribute('tabindex'), '-1', 'tabindex');
    problems.equal(basePart(el)?.getAttribute('aria-disabled'), 'true', 'aria-disabled');

    expectClean(problems, 'smoke/disabled');
  });
});
