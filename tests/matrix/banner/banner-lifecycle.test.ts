/**
 * snice-banner matrix — the OPEN/CLOSE lifecycle, the events, and auto-dismiss.
 *
 * The generated cross builds each combo once and reads the tree. This file
 * crosses the documented state machine — `show()` / `hide()` / `toggle()`, the
 * close button, `duration` auto-dismiss and its documented hover pause —
 * against the variants and positions, asserting both the events
 * (`banner-open`, `banner-close`, `banner-action`, each carrying `{ banner }`)
 * and the reflected `open` attribute that IS the show/hide rule in
 * snice-banner.css.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, VARIANTS, POSITIONS, makeBanner, bannerProblems, partsNamed, wait,
  type BannerCombo,
} from './banner-matrix-utils';

let el: any;
afterEach(() => {
  if (el) { removeComponent(el); el = null; }
  vi.useRealTimers();
});

const combo = (over: Partial<BannerCombo> = {}): BannerCombo => ({
  id: 'lifecycle',
  variant: DEFAULTS.variant,
  position: DEFAULTS.position,
  dismissible: DEFAULTS.dismissible,
  actionText: '',
  iconMode: 'default',
  message: 'A message',
  label: '',
  open: false,
  ...over,
} as BannerCombo);

function record(el: HTMLElement): Array<{ type: string; banner: unknown }> {
  const events: Array<{ type: string; banner: unknown }> = [];
  for (const type of ['banner-open', 'banner-close', 'banner-action']) {
    el.addEventListener(type, (event: Event) => {
      events.push({ type, banner: (event as CustomEvent).detail?.banner });
    });
  }
  return events;
}

const click = (node: Element | undefined) => node?.dispatchEvent(
  new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

describe('banner matrix: the documented methods', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: show() opens, hide() closes, and each fires once`, async () => {
      const c = combo({ variant });
      el = await makeBanner(c);
      const events = record(el);

      el.show();
      await wait(20);
      expect(el.open).toBe(true);
      // `:host([open])` is the only rule that brings the banner on screen.
      expect(el.hasAttribute('open'), 'open did not reflect').toBe(true);
      expect(bannerProblems(el, combo({ variant, open: true }),
        { fresh: false, allow: ['role'] })).toEqual([]);

      el.hide();
      await wait(20);
      expect(el.open).toBe(false);
      expect(el.hasAttribute('open'), 'open stayed reflected after hide()').toBe(false);

      expect(events.map(e => e.type)).toEqual(['banner-open', 'banner-close']);
      expect(events.every(e => e.banner === el), 'every detail carries { banner }').toBe(true);
    });
  }

  it('toggle() alternates, and fires the matching event each time', async () => {
    el = await makeBanner(combo());
    const events = record(el);
    el.toggle(); await wait(20);
    el.toggle(); await wait(20);
    el.toggle(); await wait(20);
    expect(el.open).toBe(true);
    expect(events.map(e => e.type))
      .toEqual(['banner-open', 'banner-close', 'banner-open']);
  });

  it('show() on an already-open banner does not fire banner-open again', async () => {
    // The documented event is a STATE CHANGE notification; a second `show()`
    // changes nothing, so a second event would make any listener that counts
    // (analytics, a toast queue) wrong.
    el = await makeBanner(combo({ open: true }));
    const events = record(el);
    el.show();
    await wait(20);
    expect(events).toEqual([]);
  });

  it('hide() on an already-closed banner does not fire banner-close', async () => {
    el = await makeBanner(combo());
    const events = record(el);
    el.hide();
    await wait(20);
    expect(events).toEqual([]);
  });
});

describe('banner matrix: the close and action buttons', () => {
  for (const position of POSITIONS) {
    it(`${position}: the close button hides the banner and fires banner-close`, async () => {
      const c = combo({ position, open: true });
      el = await makeBanner(c);
      const events = record(el);
      click(partsNamed(el, 'close')[0]);
      await wait(20);
      expect(el.open).toBe(false);
      expect(events.map(e => e.type)).toEqual(['banner-close']);
    });
  }

  it('a non-dismissible banner has no close button to press', async () => {
    el = await makeBanner(combo({ dismissible: false, open: true }));
    expect(partsNamed(el, 'close').length).toBe(0);
    expect(el.open).toBe(true);
  });

  it('the action button fires banner-action and does NOT close the banner', async () => {
    // Nothing in the docs ties `banner-action` to dismissal — "Update available
    // / Update Now" is an action the page handles, and a banner that vanished
    // on its own would take its own progress feedback with it.
    el = await makeBanner(combo({ actionText: 'Update Now', open: true }));
    const events = record(el);
    click(partsNamed(el, 'action')[0]);
    await wait(20);
    expect(events.map(e => e.type)).toEqual(['banner-action']);
    expect(events[0].banner).toBe(el);
    expect(el.open, 'the action button closed the banner').toBe(true);
  });

  it('the events bubble and cross the shadow boundary', async () => {
    el = await makeBanner(combo({ actionText: 'Retry', open: true }));
    const seen: string[] = [];
    const handler = (event: Event) => seen.push(event.type);
    document.addEventListener('banner-action', handler);
    document.addEventListener('banner-close', handler);
    click(partsNamed(el, 'action')[0]);
    click(partsNamed(el, 'close')[0]);
    await wait(20);
    document.removeEventListener('banner-action', handler);
    document.removeEventListener('banner-close', handler);
    expect(seen).toEqual(['banner-action', 'banner-close']);
  });
});

describe('banner matrix: duration auto-dismiss', () => {
  // Fake timers are installed AFTER the element is mounted: `makeBanner` awaits
  // real timeouts for the first render, and a fake clock installed before that
  // would freeze the mount itself rather than the countdown under test.
  it('duration=0 (the default) never auto-dismisses', async () => {
    el = await makeBanner(combo({ open: true }));
    vi.useFakeTimers();
    vi.advanceTimersByTime(60_000);
    expect(el.open).toBe(true);
  });

  it('a banner opened with a duration closes itself when it elapses', async () => {
    el = await makeBanner({ ...combo(), duration: 3000 });
    const events = record(el);
    vi.useFakeTimers();
    el.show();
    vi.advanceTimersByTime(2999);
    expect(el.open, 'closed early').toBe(true);
    vi.advanceTimersByTime(2);
    expect(el.open, 'did not close when the duration elapsed').toBe(false);
    expect(events.map(e => e.type)).toEqual(['banner-open', 'banner-close']);
  });

  it('the countdown pauses on hover and resumes on leave', async () => {
    // "0 = off; pauses on hover" — the whole point is that a banner the user is
    // reading does not disappear from under them.
    el = await makeBanner({ ...combo(), duration: 1000 });
    vi.useFakeTimers();
    el.show();
    vi.advanceTimersByTime(400);
    el.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(10_000);
    expect(el.open, 'the countdown kept running while hovered').toBe(true);
    el.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(599);
    expect(el.open, 'the resumed countdown was shorter than the time remaining').toBe(true);
    vi.advanceTimersByTime(2);
    expect(el.open).toBe(false);
  });

  it('closing a banner by hand cancels a pending auto-dismiss', async () => {
    el = await makeBanner({ ...combo(), duration: 1000 });
    const events = record(el);
    vi.useFakeTimers();
    el.show();
    el.hide();
    vi.advanceTimersByTime(5000);
    // One open and one close, not two closes: the timer must not fire into a
    // banner that is already closed.
    expect(events.map(e => e.type)).toEqual(['banner-open', 'banner-close']);
  });

  it('a duration assigned while open restarts the countdown', async () => {
    el = await makeBanner(combo({ open: true }));
    vi.useFakeTimers();
    el.duration = 500;
    vi.advanceTimersByTime(499);
    expect(el.open).toBe(true);
    vi.advanceTimersByTime(2);
    expect(el.open).toBe(false);
  });
});

describe('banner matrix: transitions', () => {
  it('variant changes re-label the region through its documented fallback', async () => {
    el = await makeBanner(combo({ open: true }));
    for (const variant of VARIANTS) {
      el.variant = variant;
      await wait(20);
      expect(bannerProblems(el, combo({ variant, open: true }),
        { fresh: false, allow: ['role'] }), variant).toEqual([]);
    }
  });

  it('a label set later wins over the variant fallback, and clearing it restores it', async () => {
    el = await makeBanner(combo({ variant: 'error', open: true }));
    el.label = 'Deployment status';
    await wait(20);
    expect(bannerProblems(el, combo({ variant: 'error', open: true, label: 'Deployment status' }),
      { fresh: false, allow: ['role'] })).toEqual([]);
    el.label = '';
    await wait(20);
    expect(bannerProblems(el, combo({ variant: 'error', open: true }),
      { fresh: false, allow: ['role'] })).toEqual([]);
  });

  it('dismissible toggling adds and removes the close button', async () => {
    el = await makeBanner(combo({ open: true }));
    el.dismissible = false;
    await wait(20);
    expect(partsNamed(el, 'close').length).toBe(0);
    el.dismissible = true;
    await wait(20);
    expect(partsNamed(el, 'close').length).toBe(1);
    expect(bannerProblems(el, combo({ open: true }),
      { fresh: false, allow: ['role'] })).toEqual([]);
  });

  it('position reflects both ways — it is the whole placement rule', async () => {
    el = await makeBanner(combo({ open: true }));
    el.position = 'bottom';
    await wait(20);
    expect(el.getAttribute('position')).toBe('bottom');
    el.position = 'top';
    await wait(20);
    expect(el.getAttribute('position')).toBe('top');
    expect(bannerProblems(el, combo({ open: true, position: 'top' }),
      { fresh: false, allow: ['role'] })).toEqual([]);
  });
});
