/**
 * snice-breadcrumbs matrix — collapse state and click events.
 *
 * SIZING. Two small crosses, one per documented feature:
 *   · COLLAPSE — max-items x trail length (4 x 3 = 12), which covers both sides
 *     of "0 = show all" and the over/under-cap boundary, plus the expand
 *     transition and the documented reset of `collapsed`.
 *   · EVENTS — clicked index x source (3 x 2 = 6), the whole of the
 *     `breadcrumb-click` payload.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, product, comboId, expectShape, wait } from '../matrix-utils';
import {
  SOURCES, trail, mountTrail, readTrail, expectedTrail, expectCollapsed,
  clickCrumb, clickEllipsis, recordClicks, expectedClickDetail, readClickDetail,
} from './breadcrumbs-support';

afterEach(unmountAll);

describe('breadcrumbs matrix: max-items x length', () => {
  for (const combo of product({ maxItems: [0, 2, 3, 4], count: [2, 3, 6] })) {
    const label = comboId(combo);
    it(label, async () => {
      const items = trail(combo.count);
      const el = await mountTrail(items, { maxItems: combo.maxItems });

      const collapses = combo.maxItems > 0 && combo.count > combo.maxItems;
      if (collapses) {
        expectCollapsed(el, items, combo.maxItems, label);
      } else {
        // DOCUMENTED: "`maxItems: number = 0` // 0 = show all" — and a trail
        // within its cap is not collapsed either, so no ellipsis appears.
        expectShape(readTrail(el), expectedTrail(items), label);
      }
    });
  }
});

describe('breadcrumbs matrix: expanding the ellipsis', () => {
  for (const maxItems of [2, 3]) {
    it(`max-items=${maxItems}: the ellipsis reveals the whole trail`, async () => {
      // DOCUMENTED ("Properties"): `collapsed` is the "ellipsis state; ellipsis
      // click sets false".
      const items = trail(6);
      const el = await mountTrail(items, { maxItems });
      expectCollapsed(el, items, maxItems, `max-items=${maxItems}`);

      clickEllipsis(el);
      await el.rendered;
      await wait(10);

      expect(el.collapsed, 'the ellipsis click did not clear `collapsed`').toBe(false);
      expectShape(readTrail(el), expectedTrail(items), `expanded max-items=${maxItems}`);
    });
  }

  for (const change of ['items', 'separator', 'maxItems'] as const) {
    it(`a ${change} change resets the collapsed state`, async () => {
      // DOCUMENTED: `collapsed` "resets on items/separator/maxItems change".
      const items = trail(6);
      const el = await mountTrail(items, { maxItems: 3 });
      clickEllipsis(el);
      await el.rendered;
      expect(el.collapsed).toBe(false);

      if (change === 'items') el.items = trail(6);
      if (change === 'separator') el.separator = '>';
      if (change === 'maxItems') el.maxItems = 4;
      await el.rendered;
      await wait(10);

      expect(el.collapsed, `a ${change} change left the trail expanded`).toBe(true);
    });
  }
});

describe('breadcrumbs matrix: breadcrumb-click', () => {
  for (const combo of product({ source: SOURCES, index: [0, 1] })) {
    const label = comboId(combo);
    it(label, async () => {
      // DOCUMENTED ("Events"): `breadcrumb-click -> { item, index, href, label }`.
      // Only link crumbs are clickable, so a 3-crumb trail offers indices 0 and
      // 1 — the last one is the current page and renders as text.
      const items = trail(3);
      const el = await mountTrail(items, { source: combo.source });
      const details = recordClicks(el);

      clickCrumb(el, combo.index);
      await wait(10);

      expect(details.length, `${label}: one event per click`).toBe(1);
      expectShape(readClickDetail(details[0]), expectedClickDetail(items, combo.index), label);
      expect(details[0].item?.label, `${label}: the item itself is carried`)
        .toBe(items[combo.index].label);
    });
  }

  it('the current page is not a link and emits nothing', async () => {
    const items = trail(3);
    const el = await mountTrail(items);
    const details = recordClicks(el);

    // There are only two links in a 3-crumb trail; clicking past them is a
    // no-op, which is the assertable half of "aria-current is not a link".
    clickCrumb(el, 2);
    await wait(10);

    expect(details).toEqual([]);
  });

  it('the ellipsis click is not a breadcrumb-click', async () => {
    const el = await mountTrail(trail(6), { maxItems: 3 });
    const details = recordClicks(el);

    clickEllipsis(el);
    await el.rendered;

    expect(details, 'expanding the trail reported a navigation').toEqual([]);
  });
});
