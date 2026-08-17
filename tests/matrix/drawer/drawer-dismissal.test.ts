/**
 * snice-drawer matrix — DISMISSAL.
 *
 * The doc gives three ways to dismiss an open drawer and three switches that
 * veto them:
 *
 *   backdrop click   blocked by `no-backdrop-dismiss`, and by `persistent`
 *   Escape           blocked by `no-escape-dismiss`, and by `persistent`
 *                    ("Escape closes drawer (unless no-escape-dismiss/persistent)")
 *   close button     `persistent` "Hide[s] close button" — no button, no path
 *
 * So the cross is {persistent, noBackdropDismiss, noEscapeDismiss} (2^3) x
 * the three stimuli = 24 combos, and it is the RIGHT cross rather than a
 * generous one: each switch is documented against ONE path, and the only way
 * to prove a switch has not accidentally become a global veto (or that
 * `persistent` really is one) is to fire every stimulus under every vector.
 *
 * `no-backdrop` is deliberately in the vector too. The doc separates "no
 * backdrop" (paint) from "no backdrop dismiss" (behaviour); a component that
 * conflated them would still dismiss correctly here and fail only in the
 * visual tier — which is exactly the split those two tiers exist for.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEBOUNCE, SETTLE,
  backdropDismisses, clickBackdrop, clickClose, closeButtonDismisses, combo,
  escapeDismisses, expect, makeDrawer, pressEscape, recordEvents, teardown, wait,
} from './drawer-support';

const flags = [false, true];

describe('snice-drawer matrix — dismissal', () => {
  afterEach(teardown);

  for (const persistent of flags) {
    for (const noBackdropDismiss of flags) {
      for (const noEscapeDismiss of flags) {
        const vector = { persistent, noBackdropDismiss, noEscapeDismiss };
        const name = Object.entries(vector).filter(([, on]) => on)
          .map(([key]) => key).join('+') || 'plain';

        it(`backdrop click: ${name}`, async () => {
          const c = combo(vector);
          const el = await makeDrawer(c);
          el.show();
          await wait(DEBOUNCE);

          const events = recordEvents(el);
          clickBackdrop(el);
          await wait(SETTLE);

          const shouldClose = backdropDismisses(c);
          expect(el.open, 'open after backdrop click').toBe(!shouldClose);
          expect(events.log, 'events').toEqual(shouldClose ? ['drawer-close'] : []);
        });

        it(`Escape: ${name}`, async () => {
          const c = combo(vector);
          const el = await makeDrawer(c);
          el.show();
          await wait(DEBOUNCE);

          const events = recordEvents(el);
          pressEscape();
          await wait(SETTLE);

          const shouldClose = escapeDismisses(c);
          expect(el.open, 'open after Escape').toBe(!shouldClose);
          expect(events.log, 'events').toEqual(shouldClose ? ['drawer-close'] : []);
        });

        it(`close button: ${name}`, async () => {
          const c = combo(vector);
          const el = await makeDrawer(c);
          el.show();
          await wait(DEBOUNCE);

          const events = recordEvents(el);
          const clicked = clickClose(el);
          await wait(SETTLE);

          const shouldClose = closeButtonDismisses(c);
          // `persistent` removes the button, so there is nothing to click.
          expect(clicked, 'close button rendered').toBe(shouldClose);
          expect(el.open, 'open after close click').toBe(!shouldClose);
          expect(events.log, 'events').toEqual(shouldClose ? ['drawer-close'] : []);
        });
      }
    }
  }

  // ── the switches are independent of each other ───────────────────────────
  it('no-backdrop-dismiss leaves Escape working', async () => {
    const c = combo({ noBackdropDismiss: true });
    const el = await makeDrawer(c);
    el.show();
    await wait(DEBOUNCE);

    clickBackdrop(el);
    await wait(SETTLE);
    expect(el.open, 'backdrop is vetoed').toBe(true);

    pressEscape();
    await wait(SETTLE);
    expect(el.open, 'Escape still dismisses').toBe(false);
  });

  it('no-escape-dismiss leaves the backdrop working', async () => {
    const c = combo({ noEscapeDismiss: true });
    const el = await makeDrawer(c);
    el.show();
    await wait(DEBOUNCE);

    pressEscape();
    await wait(SETTLE);
    expect(el.open, 'Escape is vetoed').toBe(true);

    clickBackdrop(el);
    await wait(SETTLE);
    expect(el.open, 'the backdrop still dismisses').toBe(false);
  });

  it('persistent prevents ALL dismiss, as the doc words it', async () => {
    const el = await makeDrawer(combo({ persistent: true }));
    el.show();
    await wait(DEBOUNCE);

    clickBackdrop(el);
    pressEscape();
    expect(clickClose(el), 'no close button to click').toBe(false);
    await wait(SETTLE);

    expect(el.open, 'a persistent drawer survives every dismissal path').toBe(true);
    // …and the imperative API is still the documented escape hatch.
    el.hide();
    await wait(SETTLE);
    expect(el.open, 'hide() still closes a persistent drawer').toBe(false);
  });

  it('an inline drawer installs no escape handler at all', async () => {
    // "Renders in document flow — no overlay, backdrop, focus trap, or escape
    // handler."
    const el = await makeDrawer(combo({ inline: true }));
    el.show();
    await wait(DEBOUNCE);

    pressEscape();
    await wait(SETTLE);
    expect(el.open, 'inline mode ignores Escape').toBe(true);
  });

  it('a closed drawer ignores every dismissal stimulus', async () => {
    const el = await makeDrawer(combo());
    const events = recordEvents(el);

    clickBackdrop(el);
    pressEscape();
    clickClose(el);
    await wait(SETTLE);

    expect(el.open).toBe(false);
    expect(events.log, 'a closed drawer must not emit drawer-close').toEqual([]);
  });

  it('Escape stops listening once the drawer has closed', async () => {
    const el = await makeDrawer(combo());
    el.show();
    await wait(DEBOUNCE);
    pressEscape();
    await wait(DEBOUNCE);
    expect(el.open).toBe(false);

    const events = recordEvents(el);
    pressEscape();
    await wait(SETTLE);
    expect(events.log, 'the handler must be torn down with the drawer').toEqual([]);
  });
});
