/**
 * Smoke slice of the snice-tooltip matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * tooltip matrix runs only via `npm run test:matrix`. This file deliberately
 * lives at `smoke.test.ts` so it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · structure  — the documented parts render, and the popup carries its
 *                  position, text and role;
 *   · triggers   — hover opens and closes, and a click-triggered tooltip
 *                  ignores hover;
 *   · manual     — `tip.open = true` drives it, the documented escape hatch;
 *   · delays     — `delay` really postpones the show;
 *   · teardown   — the portal leaves with its host (the leak that a wrapper-free
 *                  portal makes easy);
 *   · attribute  — a bare `tooltip="…"` attribute works with no wrapper.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`expectTooltipMatches` in matrix/tooltip/tooltip-support.ts) so this file
 * cannot drift into asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  CONTENT,
  combo, makeTooltip, expectTooltipMatches, readPortal, isShowing,
  teardown, wait, hover, clickHost,
} from './tooltip-support';

describe('tooltip matrix smoke', () => {
  let el: any;
  afterEach(() => {
    teardown(el);
    el = null;
    for (const node of [...document.body.childNodes]) {
      try { node.parentNode?.removeChild(node); } catch { /* already detached */ }
    }
  });

  it('structure: the documented parts render and the popup carries its position', async () => {
    const c = combo({ position: 'bottom-end', trigger: 'manual', strictPositioning: true });
    el = await makeTooltip(c);
    expectTooltipMatches(el, c);

    el.show();
    await wait(20);

    const portal = readPortal();
    expect(portal.text).toBe(CONTENT);
    expect(portal.role).toBe('tooltip');
    expect(portal.positionClass).toBe('snice-tooltip--bottom-end');
  });

  it('triggers: hover opens and closes; a click tooltip ignores hover', async () => {
    el = await makeTooltip(combo({ trigger: 'hover' }));
    hover(el, 'mouseenter');
    await wait(30);
    expect(isShowing()).toBe(true);

    hover(el, 'mouseleave');
    await wait(30);
    expect(isShowing()).toBe(false);
    teardown(el);

    el = await makeTooltip(combo({ trigger: 'click' }));
    hover(el, 'mouseenter');
    await wait(30);
    expect(isShowing(), 'a click-triggered tooltip must ignore hover').toBe(false);

    clickHost(el);
    await wait(30);
    expect(isShowing()).toBe(true);
  });

  it('manual: assigning open drives the tooltip both ways', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));

    el.open = true;
    await wait(30);
    expect(isShowing()).toBe(true);

    el.open = false;
    await wait(30);
    expect(isShowing()).toBe(false);
  });

  it('delays: delay postpones the show', async () => {
    el = await makeTooltip(combo({ trigger: 'hover', delay: 60 }));
    hover(el, 'mouseenter');
    await wait(20);
    expect(isShowing()).toBe(false);

    await wait(90);
    expect(isShowing()).toBe(true);
  });

  it('teardown: the portal leaves with its host', async () => {
    el = await makeTooltip(combo({ trigger: 'manual' }));
    el.show();
    await wait(20);
    expect(readPortal().exists).toBe(true);

    el.remove();
    await wait(30);
    expect(document.body.querySelector('.snice-tooltip')).toBe(null);
    el = null;
  });

  it('attribute API: a bare tooltip attribute works with no wrapper', async () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Save';
    button.setAttribute('tooltip', 'Save changes');
    document.body.appendChild(button);
    await wait(40);

    button.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    expect(readPortal().text).toBe('Save changes');
    expect(button.parentElement, 'docs: "No wrapper element"').toBe(document.body);
  });
});
