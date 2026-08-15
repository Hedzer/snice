/**
 * Smoke slice of the snice-link matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * link matrix (100 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · accepted URL — the anchor keeps the authored destination;
 *   · rejected URL — no href, no navigate, click default prevented;
 *   · hash routing — the `#` prefix and the authored href in the event;
 *   · cancellation — a cancelled `navigate` prevents the click default;
 *   · external — `_blank`, the rel pair, and the arrow icon;
 *   · disabled — activation prevented while the destination stays rendered.
 *
 * Every assertion routes through the matrix's own oracles (`expectedAnchor`,
 * `expectedClick`, `expectedHooks`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, expectShape } from '../matrix-utils';
import {
  URL_CASES, expectedAnchor, readAnchor, expectedClick, readClick, clickLink,
  expectedHooks, readHooks,
} from './link-support';

afterEach(unmountAll);

const accepted = URL_CASES.find(c => c.id === 'root')!;
const rejected = URL_CASES.find(c => c.id === 'javascript')!;

describe('snice-link matrix smoke', () => {
  it('accepted: the anchor renders the authored destination', async () => {
    const el = await mount('snice-link', { href: accepted.href }, 'About');
    expectShape(readAnchor(el), expectedAnchor(accepted, {}), 'accepted');
    expectShape(readHooks(el), expectedHooks({}), 'accepted');
  });

  it('rejected: no href, no navigation, and the click default is prevented', async () => {
    (globalThis as any).__sniceLinkInjected = 0;
    const el = await mount('snice-link', { href: rejected.href }, 'Bad');

    expectShape(readAnchor(el), expectedAnchor(rejected, {}), 'rejected');
    const outcome = clickLink(el);
    expectShape(readClick(outcome), expectedClick(rejected, {}), 'rejected click');
    expect((globalThis as any).__sniceLinkInjected, 'the href executed').toBe(0);
  });

  it('hash: the anchor is prefixed and navigate carries the authored href', async () => {
    const el = await mount('snice-link', { href: 'profile', hash: true }, 'Profile');
    expect(readAnchor(el).href).toBe('#profile');

    const outcome = clickLink(el);
    expect(outcome.navigate).toEqual([{ href: 'profile' }]);
    expect(outcome.defaultPrevented, 'an uncancelled navigate must not block the link').toBe(false);
  });

  it('hash: cancelling navigate prevents the click default', async () => {
    const el = await mount('snice-link', { href: 'profile', hash: true }, 'Profile');
    const outcome = clickLink(el, { cancelNavigate: true });
    expect(outcome.defaultPrevented).toBe(true);
  });

  it('external: _blank, the rel pair, and the arrow icon', async () => {
    const external = { ...accepted, href: 'https://example.com/docs' };
    const el = await mount('snice-link', { href: external.href, external: true }, 'Docs');
    expectShape(readAnchor(el), expectedAnchor(external, { external: true }), 'external');
  });

  it('disabled: the click default is prevented, the destination still renders', async () => {
    const el = await mount('snice-link', { href: accepted.href, disabled: true }, 'About');
    expectShape(readAnchor(el), expectedAnchor(accepted, { disabled: true }), 'disabled');
    const outcome = clickLink(el);
    expectShape(readClick(outcome), expectedClick(accepted, { disabled: true }), 'disabled click');
  });
});
