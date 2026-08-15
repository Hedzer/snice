/**
 * snice-badge matrix — appearance and API slice.
 *
 * SIZING. `variant`, `size` and `position` do not interact: the stylesheet
 * selects on each independently (`:host([variant="…"]) .badge`,
 * `:host([size="…"])`, `:host([position="…"])`), so the full 6 x 3 x 4 product
 * would be 72 restatements of one fact. Variant x size is crossed (18) with
 * position ROTATED across it, which touches every position without paying for
 * the cross. The flags that DO combine on one element — `inline`, `pulse`,
 * `dot` — get their own full 2^3.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, unmountAll, product, comboId, expectShape, settle } from '../matrix-utils';
import {
  VARIANTS, SIZES, POSITIONS, CONTENT_TEXT, expectedShape, expectedHooks, readShape, readHooks,
  type BadgeCombo,
} from './badge-support';

afterEach(unmountAll);

describe('badge matrix: variant x size (position rotated)', () => {
  const combos = product({ variant: VARIANTS, size: SIZES });
  combos.forEach((combo, index) => {
    const position = POSITIONS[index % POSITIONS.length];
    const label = `${comboId(combo)}@${position}`;
    it(label, async () => {
      // Authored through the PROPERTY channel on purpose: the stylesheet keys
      // off host ATTRIBUTES, so a property-authored badge only paints because
      // of the reflection contract in docs/ai/properties.md. Asserting the
      // attribute is asserting the paint's only DOM-visible precondition.
      const badge = await mount('snice-badge', {}, '', {
        content: CONTENT_TEXT, variant: combo.variant, size: combo.size, position,
      });

      expectShape(readHooks(badge), expectedHooks({
        variant: combo.variant, size: combo.size, position,
      }), label);

      // …and the indicator itself is still the documented one.
      expectShape(readShape(badge), expectedShape({
        source: 'content', showZero: false, max: 99,
      } as BadgeCombo), label);
    });
  });
});

describe('badge matrix: inline x pulse x dot', () => {
  for (const combo of product({ inline: [false, true], pulse: [false, true], dot: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      const badge = await mount('snice-badge', {}, '', {
        content: combo.dot ? '' : 'New',
        inline: combo.inline,
        pulse: combo.pulse,
        dot: combo.dot,
      });

      expectShape(readHooks(badge), expectedHooks({
        inline: combo.inline, dot: combo.dot, pulse: combo.pulse,
      }), label);
      // DOCUMENTED (badge.md "Properties"): a dot renders no text.
      expectShape(readShape(badge), {
        hasBadge: true,
        badgeText: combo.dot ? '' : 'New',
      }, label);
    });
  }
});

describe('badge matrix: offset reaches the paint as a length', () => {
  for (const offset of [0, 5, 12]) {
    it(`offset=${offset}`, async () => {
      // DOCUMENTED (badge.md "Basic Usage"): `<snice-badge count="5" offset="5">`
      // is the documented way to nudge the indicator; the component's only
      // channel for that is the custom property the stylesheet consumes.
      const badge = await mount('snice-badge', {}, '', { count: 5, offset });
      await settle(badge);
      expect(badge.style.getPropertyValue('--badge-offset'), `offset=${offset}`)
        .toBe(`${offset}px`);
    });
  }
});

describe('badge matrix: the documented methods', () => {
  /** Each starting state, so a method is asserted to CLEAR the others too. */
  const STARTS = [
    { name: 'content', props: { content: 'Old' } },
    { name: 'count', props: { count: 4 } },
    { name: 'dot', props: { dot: true } },
  ];

  const METHODS = [
    {
      name: 'setBadgeContent',
      apply: (el: any) => el.setBadgeContent('Fresh'),
      expected: { hasBadge: true, badgeText: 'Fresh' },
    },
    {
      name: 'setBadgeCount',
      apply: (el: any) => el.setBadgeCount(7),
      expected: { hasBadge: true, badgeText: '7' },
    },
    {
      name: 'showDot',
      apply: (el: any) => el.showDot(),
      expected: { hasBadge: true, badgeText: '' },
    },
    {
      name: 'hide',
      apply: (el: any) => el.hide(),
      expected: { hasBadge: false, badgeText: '' },
    },
  ];

  for (const start of STARTS) {
    for (const method of METHODS) {
      const label = `${start.name} -> ${method.name}()`;
      it(label, async () => {
        // DOCUMENTED (badge.md "Methods"): each method sets ONE content shape —
        // `hide()` "Clear[s] all content", which per the visibility rule means
        // the indicator goes away entirely.
        const badge = await mount('snice-badge', {}, '', start.props);
        method.apply(badge);
        await settle(badge, 10);
        expectShape(readShape(badge), method.expected, label);
      });
    }
  }
});
