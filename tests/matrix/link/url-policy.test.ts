/**
 * snice-link matrix — URL policy slice.
 *
 * SIZING. The link is a small component with one big rule, so the matrix is
 * shaped like the rule: every documented URL CATEGORY (17) crossed with `hash`
 * (2), because "`hash` validates first, then prefixes `#`" makes the two
 * interact — a rejected value must stay rejected rather than become an
 * "accepted" fragment. That is 34 combos plus the empty-string special case,
 * against 16 for appearance and 8 for target/rel.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, expectShape } from '../matrix-utils';
import {
  URL_CASES, EMPTY_CASE, expectedAnchor, readAnchor, expectedHref,
  expectedClick, readClick, clickLink,
} from './link-support';

afterEach(unmountAll);

describe('link matrix: url category x hash', () => {
  for (const combo of product({ useCase: URL_CASES, hash: [false, true] })) {
    const label = `${combo.useCase.id}${combo.hash ? '/hash' : ''}`;
    it(`${label} (${combo.useCase.why})`, async () => {
      const el = await mount('snice-link', {
        href: combo.useCase.href,
        ...(combo.hash ? { hash: true } : {}),
      }, 'Go');

      expectShape(readAnchor(el), expectedAnchor(combo.useCase, { hash: combo.hash }), label);
    });
  }

  it('the exact empty string keeps the legacy # fallback', async () => {
    const el = await mount('snice-link', {}, 'Go');
    expect(readAnchor(el).href).toBe(expectedHref(EMPTY_CASE, false));
  });

  it('a non-string runtime href fails closed', async () => {
    // DOCUMENTED ("URL Safety"): "Rejects … non-string runtime values."
    const el = await mount('snice-link', { href: '/safe' }, 'Go') as any;
    el.href = 42;
    await el.rendered;
    expect(readAnchor(el).href, 'a numeric href produced a destination').toBe(null);
  });
});

describe('link matrix: clicking (url category x hash)', () => {
  for (const combo of product({ useCase: URL_CASES, hash: [false, true] })) {
    const label = `${combo.useCase.id}${combo.hash ? '/hash' : ''}`;
    it(label, async () => {
      const el = await mount('snice-link', {
        href: combo.useCase.href,
        ...(combo.hash ? { hash: true } : {}),
      }, 'Go');

      const outcome = clickLink(el);
      expectShape(readClick(outcome), expectedClick(combo.useCase, { hash: combo.hash }), label);
    });
  }
});

describe('link matrix: disabled and the navigate event', () => {
  for (const combo of product({ disabled: [false, true], hash: [false, true] })) {
    const label = `${combo.hash ? 'hash' : 'plain'}${combo.disabled ? '/disabled' : ''}`;
    it(label, async () => {
      // DOCUMENTED ("Events"): the click default is "prevented when disabled or
      // `href` is rejected", and `navigate` fires for "accepted hash links only".
      const useCase = { id: 'root', href: '/about', accepted: true, why: 'root reference' };
      const el = await mount('snice-link', {
        href: useCase.href,
        ...(combo.hash ? { hash: true } : {}),
        ...(combo.disabled ? { disabled: true } : {}),
      }, 'Go');

      const outcome = clickLink(el);
      expectShape(readClick(outcome), expectedClick(useCase, combo), label);
    });
  }

  it('cancelling the navigate event prevents the click default', async () => {
    // DOCUMENTED: the `navigate` event is "cancelable" — a router that handles
    // the route itself cancels the browser's navigation.
    const useCase = { id: 'relative', href: 'profile', accepted: true, why: 'relative reference' };
    const el = await mount('snice-link', { href: useCase.href, hash: true }, 'Profile');

    const outcome = clickLink(el, { cancelNavigate: true });
    expectShape(
      readClick(outcome),
      expectedClick(useCase, { hash: true, cancelNavigate: true }),
      'cancelled navigate',
    );
  });

  it('the navigate detail carries the AUTHORED href, not the prefixed one', async () => {
    // DOCUMENTED ("Basic Usage"): `<snice-link href="profile" hash
    // @navigate="${e => router.go(e.detail.href)}">` — a router is handed the
    // route it authored, while the anchor shows `#profile`.
    const el = await mount('snice-link', { href: 'profile', hash: true }, 'Profile');
    const outcome = clickLink(el);
    expect(outcome.navigate).toEqual([{ href: 'profile' }]);
    expect(readAnchor(el).href).toBe('#profile');
  });
});
