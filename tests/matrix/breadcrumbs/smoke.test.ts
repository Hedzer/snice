/**
 * Smoke slice of the snice-breadcrumbs matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * breadcrumbs matrix (65 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · imperative trail — links, current page, separators, nav/ol structure;
 *   · declarative trail — the same trail from `<snice-crumb>` children;
 *   · separator — the authored character reaches every separator;
 *   · collapse — an over-cap trail shows the ellipsis and both ends;
 *   · expand — clicking the ellipsis reveals the whole trail;
 *   · events — `breadcrumb-click` carries the documented payload.
 *
 * Every assertion routes through the matrix's own oracles (`expectedTrail`,
 * `expectCollapsed`, `expectedClickDetail`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, expectShape, wait } from '../matrix-utils';
import {
  trail, mountTrail, readTrail, expectedTrail, expectCollapsed,
  clickCrumb, clickEllipsis, recordClicks, expectedClickDetail, readClickDetail,
} from './breadcrumbs-support';

afterEach(unmountAll);

describe('snice-breadcrumbs matrix smoke', () => {
  it('imperative: the items array renders the documented trail', async () => {
    const items = trail(3, 'mixed');
    const el = await mountTrail(items);
    expectShape(readTrail(el), expectedTrail(items), 'imperative');
  });

  it('declarative: <snice-crumb> children render the same trail', async () => {
    const items = trail(3, 'mixed');
    const el = await mountTrail(items, { source: 'crumbs' });
    expectShape(readTrail(el), expectedTrail(items), 'declarative');
  });

  it('separator: the authored character is used between every pair', async () => {
    const items = trail(4);
    const el = await mountTrail(items, { separator: '>' });
    expectShape(readTrail(el), expectedTrail(items, '>'), 'separator');
  });

  it('collapse: an over-cap trail keeps both ends and offers the ellipsis', async () => {
    const items = trail(6);
    const el = await mountTrail(items, { maxItems: 3 });
    expectCollapsed(el, items, 3, 'collapsed');
  });

  it('expand: clicking the ellipsis reveals the whole trail', async () => {
    const items = trail(6);
    const el = await mountTrail(items, { maxItems: 3 });
    clickEllipsis(el);
    await el.rendered;
    await wait(10);

    expect(el.collapsed).toBe(false);
    expectShape(readTrail(el), expectedTrail(items), 'expanded');
  });

  it('events: breadcrumb-click carries item, index, href and label', async () => {
    const items = trail(3);
    const el = await mountTrail(items);
    const details = recordClicks(el);

    clickCrumb(el, 1);
    await wait(10);

    expect(details.length).toBe(1);
    expectShape(readClickDetail(details[0]), expectedClickDetail(items, 1), 'click');
  });
});
