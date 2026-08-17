/**
 * snice-menu matrix — TRIGGER BEHAVIOUR and the open/close lifecycle.
 *
 * The doc gives three trigger modes and three imperative methods, and states
 * that `menu-open`/`menu-close` accompany the transitions. The cross that
 * matters is therefore `trigger` x STIMULUS: for each of `click|hover|manual`,
 * what does a pointer click on the trigger do, what does a hover do, and what
 * does each documented method do?
 *
 *   trigger="click"   click toggles;  hover is INERT
 *   trigger="hover"   mouseenter opens, mouseleave closes; click is INERT
 *   trigger="manual"  neither pointer path acts — only the methods
 *
 * The "inert" half is the half worth crossing. A mode switch is easy to
 * implement as "also do the new thing" and the failure is invisible unless
 * something asserts that the OTHER modes stay quiet.
 *
 * Every transition also asserts the documented event: `menu-open`/`menu-close`
 * with a `{ menu }` detail pointing at the host, and no event at all when the
 * state did not actually change.
 */
import { describe, it, afterEach } from 'vitest';
import {
  TRIGGERS,
  classesOf, combo, expect, fire, makeMenu, part, recordEvents, teardown, triggerOf, wait,
} from './menu-support';

const SETTLE = 20;

describe('snice-menu matrix — triggers', () => {
  afterEach(teardown);

  // ── pointer stimuli x trigger mode ───────────────────────────────────────
  for (const trigger of TRIGGERS) {
    const opensOnClick = trigger === 'click';
    const opensOnHover = trigger === 'hover';

    it(`trigger="${trigger}": a click on the trigger ${opensOnClick ? 'toggles' : 'is inert'}`, async () => {
      const el = await makeMenu(combo({ trigger }));
      const events = recordEvents(el);

      fire(triggerOf(el), 'click');
      await wait(SETTLE);
      expect(el.open, 'after first click').toBe(opensOnClick);

      fire(triggerOf(el), 'click');
      await wait(SETTLE);
      expect(el.open, 'after second click').toBe(false);

      expect(events.log, 'events').toEqual(opensOnClick ? ['menu-open', 'menu-close'] : []);
    });

    it(`trigger="${trigger}": mouseenter ${opensOnHover ? 'opens' : 'is inert'}`, async () => {
      const el = await makeMenu(combo({ trigger }));
      const events = recordEvents(el);

      fire(triggerOf(el), 'mouseenter');
      await wait(SETTLE);
      expect(el.open, 'after mouseenter').toBe(opensOnHover);
      expect(events.log, 'events').toEqual(opensOnHover ? ['menu-open'] : []);
    });

    it(`trigger="${trigger}": mouseleave ${opensOnHover ? 'closes an open menu' : 'is inert'}`, async () => {
      const el = await makeMenu(combo({ trigger }));
      el.openMenu();
      await wait(SETTLE);
      expect(el.open, 'precondition: open').toBe(true);

      const events = recordEvents(el);
      fire(el, 'mouseleave');
      await wait(SETTLE);
      expect(el.open, 'after mouseleave').toBe(!opensOnHover);
      expect(events.log, 'events').toEqual(opensOnHover ? ['menu-close'] : []);
    });

    // ── the three documented methods work in EVERY mode ──────────────────────
    it(`trigger="${trigger}": openMenu/closeMenu/toggleMenu drive the menu`, async () => {
      const el = await makeMenu(combo({ trigger }));
      const events = recordEvents(el);

      el.openMenu();
      await wait(SETTLE);
      expect(el.open, 'after openMenu()').toBe(true);

      el.closeMenu();
      await wait(SETTLE);
      expect(el.open, 'after closeMenu()').toBe(false);

      el.toggleMenu();
      await wait(SETTLE);
      expect(el.open, 'after toggleMenu() from closed').toBe(true);

      el.toggleMenu();
      await wait(SETTLE);
      expect(el.open, 'after toggleMenu() from open').toBe(false);

      expect(events.log, 'events').toEqual([
        'menu-open', 'menu-close', 'menu-open', 'menu-close',
      ]);
    });

    // ── the property channel is the documented `open: boolean` ──────────────
    it(`trigger="${trigger}": assigning open drives it both ways`, async () => {
      const el = await makeMenu(combo({ trigger }));
      const events = recordEvents(el);

      el.open = true;
      await wait(SETTLE);
      expect(part(el, 'trigger')!.getAttribute('aria-expanded'), 'aria-expanded open').toBe('true');

      el.open = false;
      await wait(SETTLE);
      expect(part(el, 'trigger')!.getAttribute('aria-expanded'), 'aria-expanded closed').toBe('false');

      expect(events.log).toEqual(['menu-open', 'menu-close']);
    });
  }

  // ── event details ────────────────────────────────────────────────────────
  it('menu-open and menu-close carry { menu } pointing at the host', async () => {
    const el = await makeMenu(combo());
    const events = recordEvents(el);

    el.openMenu();
    await wait(SETTLE);
    el.closeMenu();
    await wait(SETTLE);

    expect(events.log).toEqual(['menu-open', 'menu-close']);
    expect(events.details.map((detail: any) => detail.menu)).toEqual([el, el]);
  });

  it('a menu opened by attribute is already open at first paint', async () => {
    const el = await makeMenu(combo({ open: true }));
    expect(el.open).toBe(true);
    expect(part(el, 'trigger')!.getAttribute('aria-expanded')).toBe('true');
    expect(classesOf(part(el, 'panel'))).toContain('menu__panel--open');
  });

  it('a click outside an open menu closes it', async () => {
    const el = await makeMenu(combo());
    el.openMenu();
    await wait(SETTLE);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const events = recordEvents(el);
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);

    expect(el.open, 'outside click closes').toBe(false);
    expect(events.log).toEqual(['menu-close']);
  });

  it('a click INSIDE an open menu does not close it by itself', async () => {
    const el = await makeMenu(combo({ closeOnSelect: false }));
    el.openMenu();
    await wait(SETTLE);

    part(el, 'content')!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.open, 'panel click keeps the menu open').toBe(true);
  });
});
