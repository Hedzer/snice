/**
 * Smoke slice of the snice-alert matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * alert matrix runs only via `npm run test:matrix`. This file deliberately
 * lives at `smoke.test.ts` so it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · appearance — the loudest axis combination still renders a whole alert;
 *   · icon       — the slot beats the `icon` property (the precedence edge),
 *                  and `icon="none"` removes the container;
 *   · dismissal  — `alert-dismiss` carries `{ variant, title }`;
 *   · lifecycle  — `alert-hidden` waits for the animation;
 *   · countdown  — `duration` auto-dismisses, and hover pauses it;
 *   · a11y       — `role="alert"` / `aria-live="polite"`, and `title` never
 *                  leaks onto the host as a native tooltip.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`expectAlertMatches` in matrix/alert/alert-support.ts) so this file cannot
 * drift into asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  TITLE, SLOT_ICON,
  combo, makeAlert, expectAlertMatches, readFacts, collectEvents,
  clickDismiss, finishHideAnimation, baseClassList, hover, wait, removeComponent,
} from './alert-support';

describe('alert matrix smoke', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  it('appearance: the loudest axis combination still renders a whole alert', async () => {
    const c = combo({ variant: 'error', size: 'large', appearance: 'accent', titled: true, dismissible: true });
    alert = await makeAlert(c);
    expectAlertMatches(alert, c);
  });

  it('icon: the slot overrides the icon property, and "none" removes the container', async () => {
    const withSlot = combo({ iconSource: 'slot+prop' });
    alert = await makeAlert(withSlot);
    expectAlertMatches(alert, withSlot);
    expect(readFacts(alert).iconText).toBe(SLOT_ICON);
    removeComponent(alert);

    const suppressed = combo({ iconSource: 'none' });
    alert = await makeAlert(suppressed);
    expectAlertMatches(alert, suppressed);
    expect(readFacts(alert).hasIconPart).toBe(false);
  });

  it('dismissal: alert-dismiss carries { variant, title }', async () => {
    const c = combo({ variant: 'success', titled: true, dismissible: true });
    alert = await makeAlert(c);
    const seen = collectEvents(alert);

    expect(clickDismiss(alert)).toBe(true);
    await wait(20);

    expect(seen).toEqual([{ type: 'alert-dismiss', detail: { variant: 'success', title: TITLE } }]);
    expect(baseClassList(alert)).toContain('alert--hiding');
  });

  it('lifecycle: alert-hidden waits for the hide animation', async () => {
    alert = await makeAlert(combo());
    const seen = collectEvents(alert);

    alert.hide();
    await wait(20);
    expect(seen).toEqual([]);

    finishHideAnimation(alert);
    await wait(20);
    expect(seen.map(e => e.type)).toEqual(['alert-hidden']);
  });

  it('countdown: duration auto-dismisses, and hover pauses it', async () => {
    alert = await makeAlert(combo());
    alert.duration = 40;
    hover(alert, 'mouseenter');
    await wait(90);
    expect(baseClassList(alert), 'paused while hovered').not.toContain('alert--hiding');

    hover(alert, 'mouseleave');
    await wait(90);
    expect(baseClassList(alert), 'resumed once the pointer left').toContain('alert--hiding');
  });

  it('a11y: polite live region, and title never becomes a native tooltip', async () => {
    const c = combo({ titled: true, dismissible: true });
    alert = await makeAlert(c);
    const facts = readFacts(alert);

    expect(facts.role).toBe('alert');
    expect(facts.ariaLive).toBe('polite');
    expect(alert.getAttribute('title')).toBe(null);
    expect(facts.titleText).toBe(TITLE);
  });
});
