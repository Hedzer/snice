/**
 * Smoke slice of the snice-menu matrix — the everyday-loop tier.
 *
 * `vitest.config.ts` excludes `tests/matrix/**\/!(smoke).test.ts`, so this is
 * the one file of the menu matrix the default `vitest run` still collects. It
 * takes ONE combo per feature family, so a family that breaks cannot hide:
 *
 *   · structure     — the documented parts, slots and panel placement class;
 *   · trigger modes — click toggles, hover is inert under `trigger="click"`;
 *   · methods       — openMenu/closeMenu/toggleMenu and their events;
 *   · items         — `menu-item-select` detail and the disabled suppression;
 *   · closeOnSelect — the documented auto-close, and its opt-out;
 *   · dismissal     — an outside click closes an open menu.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`expectMenuMatches`), so this file cannot drift into something weaker than
 * the suite it stands in for.
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  classesOf, combo, expect, expectItemMatches, expectMenuMatches, fire, itemsOf,
  makeMenu, part, recordEvents, teardown, triggerOf, wait,
} from './menu-support';

const SETTLE = 20;

describe('menu matrix smoke', () => {
  afterEach(teardown);

  it('structure: the documented parts, slots and placement class render', async () => {
    const c = combo({ placement: 'top-end', images: 'both', divider: true });
    const el = await makeMenu(c);
    expectMenuMatches(el, c);
    expect(classesOf(part(el, 'panel'))).toContain('menu__panel--top-end');
  });

  it('triggers: a click menu toggles on click and ignores hover', async () => {
    const el = await makeMenu(combo({ trigger: 'click' }));

    fire(triggerOf(el), 'mouseenter');
    await wait(SETTLE);
    expect(el.open, 'hover must be inert for trigger="click"').toBe(false);

    fire(triggerOf(el), 'click');
    await wait(SETTLE);
    expect(el.open).toBe(true);

    fire(triggerOf(el), 'click');
    await wait(SETTLE);
    expect(el.open).toBe(false);
  });

  it('methods: openMenu/closeMenu/toggleMenu emit the documented events', async () => {
    const el = await makeMenu(combo({ trigger: 'manual' }));
    const events = recordEvents(el);

    el.openMenu();
    await wait(SETTLE);
    el.toggleMenu();
    await wait(SETTLE);

    expect(events.log).toEqual(['menu-open', 'menu-close']);
    expect(events.details[0].menu).toBe(el);
  });

  it('items: select carries { item, value } and a disabled item stays silent', async () => {
    const el = await makeMenu(combo({
      items: [{ value: 'go', label: 'Go' }, { value: 'no', label: 'No', disabled: true }],
      closeOnSelect: false,
    }));
    expectItemMatches(itemsOf(el)[1], { value: 'no', label: 'No', disabled: true });

    el.openMenu();
    await wait(SETTLE);
    const events = recordEvents(el);

    fire(itemsOf(el)[1], 'click');
    await wait(SETTLE);
    expect(events.log, 'disabled item must not select').toEqual([]);

    fire(itemsOf(el)[0], 'click');
    await wait(SETTLE);
    expect(events.log).toEqual(['menu-item-select']);
    expect(events.details[0].value).toBe('go');
  });

  it('closeOnSelect: true closes on selection, false keeps the panel open', async () => {
    for (const closeOnSelect of [true, false]) {
      const el = await makeMenu(combo({ closeOnSelect, items: [{ value: 'a', label: 'A' }] }));
      el.openMenu();
      await wait(SETTLE);
      fire(itemsOf(el)[0], 'click');
      await wait(SETTLE);
      expect(el.open, `close-on-select=${closeOnSelect}`).toBe(!closeOnSelect);
      teardown();
    }
  });

  it('dismissal: a click outside an open menu closes it', async () => {
    const el = await makeMenu(combo());
    el.openMenu();
    await wait(SETTLE);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.open).toBe(false);
  });
});
