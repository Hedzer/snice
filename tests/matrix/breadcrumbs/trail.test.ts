/**
 * snice-breadcrumbs matrix — trail rendering slice.
 *
 * SIZING. The cross that matters is source x length x href-pattern
 * (2 x 3 x 3 = 18): the two authoring APIs must produce the SAME trail, the
 * length decides which crumb is the current page, and the href pattern decides
 * which crumbs are links. `separator` and `size` are style axes with no
 * interaction, so they get their own small cross (5 x 3 = 15) instead of
 * multiplying this one by fifteen.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, product, comboId, expectShape } from '../matrix-utils';
import {
  SEPARATORS, SIZES, SOURCES, trail, mountTrail, readTrail, expectedTrail,
} from './breadcrumbs-support';

afterEach(unmountAll);

describe('breadcrumbs matrix: source x length x hrefs', () => {
  for (const combo of product({
    source: SOURCES, count: [1, 3, 5], hrefs: ['all', 'none', 'mixed'] as const,
  })) {
    const label = comboId(combo);
    it(label, async () => {
      const items = trail(combo.count, combo.hrefs);
      const el = await mountTrail(items, { source: combo.source });

      expectShape(readTrail(el), expectedTrail(items), label);
    });
  }
});

describe('breadcrumbs matrix: separator x size', () => {
  for (const combo of product({ separator: SEPARATORS, size: SIZES })) {
    const label = comboId(combo);
    it(label, async () => {
      const items = trail(3);
      const el = await mountTrail(items, { separator: combo.separator, size: combo.size });

      // DOCUMENTED ("CSS Parts"): "`separator` - Separator characters between
      // items" — one between each pair, showing the authored character.
      expectShape(readTrail(el), expectedTrail(items, combo.separator), label);
      // The size is a style axis whose only DOM-visible half is the attribute
      // the stylesheet selects on.
      expect(el.getAttribute('size'), `${label}: size attribute`).toBe(combo.size);
    });
  }
});

describe('breadcrumbs matrix: the current page', () => {
  for (const combo of product({ source: SOURCES, activeIndex: [-1, 0, 1] })) {
    const label = comboId(combo);
    it(label, async () => {
      // DOCUMENTED ("Accessibility"): `aria-current="page"` on the ACTIVE or
      // LAST item — an explicitly active middle crumb is current too, and an
      // active crumb is not a link even when it has an href.
      const items = trail(3).map((item, i) =>
        (i === combo.activeIndex ? { ...item, active: true } : item));
      const el = await mountTrail(items, { source: combo.source });

      expectShape(readTrail(el), expectedTrail(items), label);
    });
  }
});

describe('breadcrumbs matrix: setItems replaces the trail', () => {
  // SCOPE. Only the imperative source is asserted here. The docs present the
  // two APIs as alternatives — "imperative `items` array OR declarative
  // `<snice-crumb>` children" — and say nothing about what happens when a page
  // uses both at once, so an expectation for `setItems()` against a slotted
  // trail would be invented rather than documented.
  for (const count of [1, 2, 4]) {
    it(`setItems() renders a ${count}-crumb trail`, async () => {
      // DOCUMENTED ("Methods"): "`setItems(items)` - Update breadcrumb items".
      const el = await mountTrail(trail(3), { source: 'items' });
      const next = trail(count);
      el.setItems(next);
      await el.rendered;

      expectShape(readTrail(el), expectedTrail(next), `setItems(${count})`);
    });
  }
});
