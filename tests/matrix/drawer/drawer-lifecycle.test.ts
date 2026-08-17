/**
 * snice-drawer matrix — LIFECYCLE: the open/close state machine, its events,
 * and the three modes that change what opening MEANS.
 *
 * The doc promises `show()`, `hide()`, `toggle()`, the `open` property, and
 * that `drawer-open` / `drawer-close` accompany the transitions with a
 * `{ drawer }` detail. It also promises `aria-hidden` reflects visibility. The
 * cross here is ENTRY POINT x MODE: four ways in (`show()`, `hide()`,
 * `toggle()`, assigning `open`) against overlay / contained / inline, because
 * the modes are documented as changing the overlay behaviours and NOT the
 * state or the events.
 *
 * ── FINDING: MATRIX-drawer-1 ───────────────────────────────────────────────
 *
 * That last clause is where the component and its documentation part company.
 * `inline` is documented as "Sit in document flow (no overlay/backdrop/
 * focus-trap)" and, in the Inline Mode section, "no overlay, backdrop, focus
 * trap, or escape handler" — an exhaustive list of what inline mode drops.
 * `drawer-open` / `drawer-close` are documented unconditionally. An inline
 * drawer nevertheless emits NEITHER, so a persistent sidebar built the
 * documented way is silent: no page can observe it opening. The assertion
 * below stays correct and is pinned with `it.fails`.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEBOUNCE, SETTLE,
  combo, expect, expectDrawerMatches, makeDrawer, part, recordEvents, teardown, wait,
} from './drawer-support';

/** The three documented modes, and what each is documented to change. */
const MODES = [
  { name: 'overlay', combo: {} as any },
  { name: 'contained', combo: { contained: true } as any },
  { name: 'inline', combo: { inline: true } as any },
] as const;

describe('snice-drawer matrix — lifecycle', () => {
  afterEach(teardown);

  // ── entry point x mode: STATE ────────────────────────────────────────────
  for (const mode of MODES) {
    it(`${mode.name}: show()/hide()/toggle() drive open`, async () => {
      const el = await makeDrawer(combo(mode.combo));
      expect(el.open, 'starts closed').toBe(false);

      el.show();
      await wait(SETTLE);
      expect(el.open, 'after show()').toBe(true);

      el.hide();
      await wait(SETTLE);
      expect(el.open, 'after hide()').toBe(false);

      el.toggle();
      await wait(SETTLE);
      expect(el.open, 'after toggle() from closed').toBe(true);

      el.toggle();
      await wait(SETTLE);
      expect(el.open, 'after toggle() from open').toBe(false);
    });

    it(`${mode.name}: aria-hidden reflects visibility`, async () => {
      const el = await makeDrawer(combo(mode.combo));
      expect(el.getAttribute('aria-hidden'), 'closed').toBe('true');

      el.show();
      await wait(SETTLE);
      expect(el.getAttribute('aria-hidden'), 'open').toBe('false');

      el.hide();
      await wait(SETTLE);
      expect(el.getAttribute('aria-hidden'), 'closed again').toBe('true');
    });

    it(`${mode.name}: assigning open is equivalent to the methods`, async () => {
      const el = await makeDrawer(combo(mode.combo));
      el.open = true;
      await wait(SETTLE);
      expect(el.getAttribute('aria-hidden')).toBe('false');

      el.open = false;
      await wait(SETTLE);
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });
  }

  // ── entry point x mode: EVENTS ───────────────────────────────────────────
  for (const mode of MODES.filter(m => m.name !== 'inline')) {
    it(`${mode.name}: emits drawer-open then drawer-close with { drawer }`, async () => {
      const el = await makeDrawer(combo(mode.combo));
      const events = recordEvents(el);

      el.show();
      await wait(DEBOUNCE);
      el.hide();
      await wait(DEBOUNCE);

      expect(events.log).toEqual(['drawer-open', 'drawer-close']);
      expect(events.details.map((detail: any) => detail.drawer)).toEqual([el, el]);
    });

    it(`${mode.name}: the events bubble and are composed`, async () => {
      const el = await makeDrawer(combo(mode.combo));
      const seen: string[] = [];
      const listener = (event: Event) => seen.push(event.type);
      document.addEventListener('drawer-open', listener);
      document.addEventListener('drawer-close', listener);

      el.show();
      await wait(DEBOUNCE);
      el.hide();
      await wait(DEBOUNCE);

      document.removeEventListener('drawer-open', listener);
      document.removeEventListener('drawer-close', listener);
      expect(seen).toEqual(['drawer-open', 'drawer-close']);
    });
  }

  /**
   * MATRIX-drawer-1.
   *
   * Documented: `drawer-open → { drawer } - Drawer opened` and
   * `drawer-close → { drawer } - Drawer closed`, with no mode qualifier; the
   * Inline Mode section's exclusion list is "no overlay, backdrop, focus trap,
   * or escape handler" and does not mention events.
   *
   * Actual: an inline drawer emits neither event, in either direction — the
   * component returns from its `open` watcher before the dispatch whenever
   * inline mode is active. The documented sidebar pattern therefore cannot be
   * observed opening or closing.
   *
   * Combo: `inline` + `show()` + `hide()`.
   * Expected: `['drawer-open', 'drawer-close']`.
   * Actual:   `[]`.
   */
  it.fails(
    'MATRIX-drawer-1: an inline drawer emits drawer-open and drawer-close',
    async () => {
      const el = await makeDrawer(combo({ inline: true }));
      const events = recordEvents(el);

      el.show();
      await wait(DEBOUNCE);
      el.hide();
      await wait(DEBOUNCE);

      expect(events.log).toEqual(['drawer-open', 'drawer-close']);
    },
  );

  // ── opening from markup ──────────────────────────────────────────────────
  it('a drawer authored open is open at first paint', async () => {
    const c = combo({ open: true });
    const el = await makeDrawer(c);
    expectDrawerMatches(el, c);
    expect(el.getAttribute('aria-hidden')).toBe('false');
  });

  it('an authored-open drawer announces itself once ready', async () => {
    const el = await makeDrawer(combo({ open: true }));
    // The doc's event contract covers the initial open too: a page that mounts
    // an already-open drawer must be able to react to it.
    const events = recordEvents(el);
    el.hide();
    await wait(DEBOUNCE);
    expect(events.log).toEqual(['drawer-close']);
  });

  it('repeated show() on an open drawer does not re-announce it', async () => {
    const el = await makeDrawer(combo());
    el.show();
    await wait(DEBOUNCE);

    const events = recordEvents(el);
    el.show();
    el.show();
    await wait(DEBOUNCE);
    expect(events.log, 'no state change, no event').toEqual([]);
  });

  it('repeated hide() on a closed drawer does not announce a close', async () => {
    const el = await makeDrawer(combo());
    const events = recordEvents(el);
    el.hide();
    el.hide();
    await wait(DEBOUNCE);
    expect(events.log).toEqual([]);
  });

  // ── breakpoint mode ──────────────────────────────────────────────────────
  it('breakpoint above the viewport width puts the drawer inline', async () => {
    // "Responsive: inline above breakpoint, overlay below. Uses
    // window.matchMedia" — the drawer must consult matchMedia at setup and
    // apply the resulting mode immediately, not on the first resize.
    const el = await makeDrawer(combo({ breakpoint: 1 }));
    await wait(SETTLE);
    expect(el.hasAttribute('inline'), 'above the breakpoint → inline').toBe(true);
  });

  it('breakpoint 0 is the documented default and leaves the mode alone', async () => {
    const el = await makeDrawer(combo());
    expect(el.breakpoint).toBe(0);
    expect(el.hasAttribute('inline'), 'no breakpoint, no inline').toBe(false);
  });

  /**
   * MATRIX-drawer-2.
   *
   * Documented: `inline: boolean = false` is one of the drawer's own
   * properties — the author's switch for "Sit in document flow" — and
   * `breakpoint: number = 0` is a SEPARATE property whose documented job is
   * "Viewport px width: above → inline, below → overlay". Two properties, two
   * owners: nothing in the docs gives `breakpoint` permission to write
   * `inline`, and `breakpoint = 0` is documented as the no-breakpoint default.
   *
   * Actual: crossing the breakpoint sets the `inline` ATTRIBUTE, which feeds
   * straight back into the documented `inline` property. A drawer the author
   * never made inline reports `inline === true`, and clearing `breakpoint`
   * afterwards cannot restore overlay mode — the component now believes the
   * author asked for inline and preserves it. The responsive drawer is
   * one-way: once it has ever been above its breakpoint, removing the
   * breakpoint leaves it stuck in document flow.
   *
   * Combo: `breakpoint=1` (above the viewport width) then `breakpoint = 0`.
   * Expected: `inline === false`, `[inline]` absent.
   * Actual:   `inline === true`, `[inline]` present.
   */
  it.fails(
    'MATRIX-drawer-2: breakpoint mode does not write the author\'s inline property',
    async () => {
      const el = await makeDrawer(combo({ breakpoint: 1 }));
      await wait(SETTLE);
      expect(el.hasAttribute('inline'), 'above the breakpoint → inline').toBe(true);
      expect(el.inline, 'but the author never set the inline property').toBe(false);

      el.breakpoint = 0;
      await wait(SETTLE);
      expect(el.hasAttribute('inline'), 'breakpoint-imposed inline is released').toBe(false);
    },
  );

  it('an explicit inline property survives a breakpoint being cleared', async () => {
    const el = await makeDrawer(combo({ inline: true, breakpoint: 1 }));
    await wait(SETTLE);
    el.breakpoint = 0;
    await wait(SETTLE);
    expect(el.inline, 'the author asked for inline').toBe(true);
  });

  // ── teardown ─────────────────────────────────────────────────────────────
  it('removing an open drawer tears its document handlers down', async () => {
    const el = await makeDrawer(combo());
    el.show();
    await wait(DEBOUNCE);

    el.remove();
    await wait(SETTLE);

    const events = recordEvents(el);
    // The Escape handler lives on `document`; a removed drawer that kept it
    // would keep responding to keys aimed at whatever replaced it.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(SETTLE);
    expect(events.log, 'a detached drawer must be inert').toEqual([]);
  });

  it('the base panel is focusable so focus can be moved into the dialog', async () => {
    const el = await makeDrawer(combo());
    expect(part(el, 'base')!.getAttribute('tabindex'), 'programmatically focusable').toBe('-1');
  });
});
