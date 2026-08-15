/**
 * snice-link matrix — appearance, target and rel slice.
 *
 * SIZING. variant x underline x disabled (4 x 2 x 2 = 16) for the style hooks,
 * and external x target (2 x 4 = 8) for the destination attributes. They are
 * separate crosses because they touch different attributes of the same anchor
 * and do not interact: `external` overrides `target` regardless of variant.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, comboId, expectShape, slottedText } from '../matrix-utils';
import {
  VARIANTS, TARGETS, expectedHooks, readHooks, expectedAnchor, readAnchor,
} from './link-support';

afterEach(unmountAll);

const ACCEPTED = { id: 'root', href: '/about', accepted: true, why: 'root reference' };

describe('link matrix: variant x underline x disabled', () => {
  for (const combo of product({
    variant: VARIANTS, underline: [false, true], disabled: [false, true],
  })) {
    const label = comboId(combo);
    it(label, async () => {
      const el = await mount('snice-link', {
        href: ACCEPTED.href,
        variant: combo.variant,
        ...(combo.underline ? { underline: true } : {}),
        ...(combo.disabled ? { disabled: true } : {}),
      }, 'About');

      expectShape(readHooks(el), expectedHooks(combo), label);
      // The destination is unaffected by presentation: a disabled link still
      // renders its accepted href, and only its ACTIVATION is prevented.
      expectShape(readAnchor(el), expectedAnchor(ACCEPTED, combo), label);
      expect(slottedText(el, 'slot:not([name])'), `${label}: accessible name`).toBe('About');
    });
  }
});

describe('link matrix: external x target', () => {
  for (const combo of product({ external: [false, true], target: TARGETS })) {
    const label = comboId(combo);
    it(label, async () => {
      // DOCUMENTED ("Accessibility"): "`external` sets `target="_blank"` and
      // `rel="noopener noreferrer"`", and ("Properties") it adds the arrow icon.
      // An authored `target` is used verbatim when `external` is not set.
      const el = await mount('snice-link', {
        href: 'https://example.com/docs',
        target: combo.target,
        ...(combo.external ? { external: true } : {}),
      }, 'Docs');

      expectShape(
        readAnchor(el),
        expectedAnchor({ ...ACCEPTED, href: 'https://example.com/docs' }, combo),
        label,
      );
    });
  }
});
