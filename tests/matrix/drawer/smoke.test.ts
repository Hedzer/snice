/**
 * Smoke slice of the snice-drawer matrix — the everyday-loop tier.
 *
 * The one file of this matrix the default `vitest run` still collects. One
 * combo per feature family, chosen so a family that breaks cannot hide:
 *
 *   · structure  — position/size reflection and all seven documented parts;
 *   · chrome     — `no-header` / `no-footer` / `persistent` and the parts they
 *                  remove;
 *   · lifecycle  — show/hide/toggle, `aria-hidden`, and the documented events;
 *   · dismissal  — backdrop, Escape and the close button, plus one veto;
 *   · inline     — the documented "no escape handler" mode;
 *   · push       — a `<snice-drawer-target>` acquires and releases its push.
 *
 * Structure routes through the matrix oracle (`expectDrawerMatches`) so this
 * file cannot assert something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEBOUNCE, SETTLE,
  clickBackdrop, clickClose, combo, expect, expectDrawerMatches, makeDrawer,
  part, pressEscape, recordEvents, teardown, wait,
} from './drawer-support';
import '../../../packages/components/src/drawer/snice-drawer-target';

describe('drawer matrix smoke', () => {
  afterEach(teardown);

  it('structure: position and size reach the host, every part renders', async () => {
    const c = combo({ position: 'right', size: 'xl' });
    const el = await makeDrawer(c);
    expectDrawerMatches(el, c);
    expect(el.getAttribute('position')).toBe('right');
    expect(el.getAttribute('size')).toBe('xl');
    expect(part(el, 'base')!.getAttribute('role')).toBe('dialog');
  });

  it('chrome: no-header, no-footer and persistent remove what they document', async () => {
    const c = combo({ noHeader: true, noFooter: true });
    const el = await makeDrawer(c);
    expectDrawerMatches(el, c);
    expect(part(el, 'header')).toBeNull();
    expect(part(el, 'footer')).toBeNull();

    const persistent = await makeDrawer(combo({ persistent: true }));
    expect(part(persistent, 'header'), 'persistent keeps the header').not.toBeNull();
    expect(part(persistent, 'close'), 'persistent hides the close button').toBeNull();
  });

  it('lifecycle: show/hide/toggle, aria-hidden, and the documented events', async () => {
    const el = await makeDrawer(combo());
    const events = recordEvents(el);

    el.show();
    await wait(DEBOUNCE);
    expect(el.open).toBe(true);
    expect(el.getAttribute('aria-hidden')).toBe('false');

    el.toggle();
    await wait(DEBOUNCE);
    expect(el.open).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');

    expect(events.log).toEqual(['drawer-open', 'drawer-close']);
    expect(events.details[0].drawer).toBe(el);
  });

  it('dismissal: backdrop, Escape and the close button each close a drawer', async () => {
    for (const dismiss of [
      (el: any) => clickBackdrop(el),
      () => pressEscape(),
      (el: any) => clickClose(el),
    ]) {
      const el = await makeDrawer(combo());
      el.show();
      await wait(DEBOUNCE);
      dismiss(el);
      await wait(SETTLE);
      expect(el.open, 'dismissed').toBe(false);
      teardown();
    }
  });

  it('dismissal vetoes: no-escape-dismiss blocks Escape but not the backdrop', async () => {
    const el = await makeDrawer(combo({ noEscapeDismiss: true }));
    el.show();
    await wait(DEBOUNCE);

    pressEscape();
    await wait(SETTLE);
    expect(el.open, 'Escape is vetoed').toBe(true);

    clickBackdrop(el);
    await wait(SETTLE);
    expect(el.open, 'the backdrop still works').toBe(false);
  });

  it('inline: the documented mode installs no escape handler', async () => {
    const el = await makeDrawer(combo({ inline: true }));
    el.show();
    await wait(DEBOUNCE);
    pressEscape();
    await wait(SETTLE);
    expect(el.open).toBe(true);
  });

  it('push: a bound target acquires a push on open and releases it on close', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <snice-drawer id="nav" position="left" size="small" contained push-content></snice-drawer>
      <snice-drawer-target for="nav"><main>C</main></snice-drawer-target>`;
    document.body.appendChild(host);
    const drawer = host.querySelector('snice-drawer') as any;
    const target = host.querySelector('snice-drawer-target') as any;
    await drawer.ready; await target.ready;
    await wait(SETTLE);

    expect(target.push).toBe('');
    drawer.show();
    await wait(SETTLE);
    expect(target.push).not.toBe('');

    drawer.hide();
    await wait(SETTLE);
    expect(target.push).toBe('');
  });
});
