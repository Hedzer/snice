// Anchoring of the <snice-calendar> overlays (hover tooltip + click popover).
//
// `:host` declares `contain: layout style`. Layout containment makes the HOST —
// not the viewport — the containing block for `position: fixed` descendants, so
// writing `getBoundingClientRect()` viewport coordinates straight into
// `left`/`top` offsets the overlay by the host's own page position: on the
// showcase the popover landed ~250px below the calendar, on top of the next
// section (whose own contained host then painted over it, leaving a popover
// that is in the DOM, `visibility: visible`, and invisible).
//
// The overlays are therefore positioned inside `.calendar`, and every
// viewport-space coordinate is converted into that box. happy-dom has no
// layout, so the rects the component reads are stubbed here; the live paint is
// covered by tests/live/components/calendar/calendar-popover-anchor.spec.ts.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

/** Viewport box of the `.calendar` container the overlays are placed in. */
const CONTAINER = { left: 40, top: 300, right: 640, bottom: 900, width: 600, height: 600 };

function stubRect(el: Element, rect: Partial<DOMRect>) {
  (el as any).getBoundingClientRect = () => ({
    left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0,
    ...rect,
  });
}

function stubSize(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
}

describe('snice-calendar overlay anchoring', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  async function makeCalendar(events: CalendarEvent[]) {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15)); // June 2026
    calendar.events = events;
    await wait(20);

    const cal = calendar as any;
    stubRect(cal.shadowRoot.querySelector('.calendar'), CONTAINER);
    return cal;
  }

  function bar(cal: any, eventId: string | number): HTMLElement {
    return [...cal.shadowRoot.querySelectorAll('.calendar__event-bar')]
      .find((b: HTMLElement) => b.getAttribute('data-event-id') === String(eventId)) as HTMLElement;
  }

  const popoverEl = (cal: any): HTMLElement => cal.shadowRoot.querySelector('.calendar__popover');
  const tooltipEl = (cal: any): HTMLElement => cal.shadowRoot.querySelector('.calendar__tooltip');

  function click(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  }

  it('anchors the popover under its bar in containing-block coordinates', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4' },
    ]);
    const b = bar(cal, 'a');
    stubRect(b, { left: 200, top: 400, right: 260, bottom: 418, width: 60, height: 18 });
    stubSize(popoverEl(cal), 264, 102);

    click(b);
    await wait(20);

    // Viewport target is (200, 424); the container starts at (40, 300).
    expect(popoverEl(cal).style.left).toBe('160px');
    expect(popoverEl(cal).style.top).toBe('124px');
  });

  it('discounts a border on ::part(base), whose padding box is the containing block', async () => {
    // `::part(base)` is documented as styleable, so a consumer may border it.
    // Absolute children resolve against its PADDING box while
    // getBoundingClientRect() reports the border box — an undiscounted border
    // shifts both overlays off their bar by its width.
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4' },
    ]);
    const container = cal.shadowRoot.querySelector('.calendar');
    Object.defineProperty(container, 'clientLeft', { configurable: true, value: 4 });
    Object.defineProperty(container, 'clientTop', { configurable: true, value: 4 });

    const b = bar(cal, 'a');
    stubRect(b, { left: 200, top: 400, right: 260, bottom: 418, width: 60, height: 18 });
    stubSize(popoverEl(cal), 264, 102);

    click(b);
    await wait(20);

    // Same viewport target as the unbordered case, minus the 4px border.
    expect(popoverEl(cal).style.left).toBe('156px');
    expect(popoverEl(cal).style.top).toBe('120px');
  });

  it('keeps the loading shell anchored too, so lazy content never jumps in from off-screen', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: true },
    ]);
    (calendar as any).eventPopover = async () => { await wait(40); return 'Loaded'; };
    await wait(20);

    const b = bar(cal, 'a');
    stubRect(b, { left: 200, top: 400, right: 260, bottom: 418, width: 60, height: 18 });
    stubSize(popoverEl(cal), 264, 102);

    click(b);
    await wait(5);
    expect(popoverEl(cal).querySelector('.calendar__popover-loading')).toBeTruthy();
    expect(popoverEl(cal).style.left).toBe('160px');
    expect(popoverEl(cal).style.top).toBe('124px');

    await wait(60);
    expect(popoverEl(cal).textContent).toContain('Loaded');
    expect(popoverEl(cal).style.left).toBe('160px');
    expect(popoverEl(cal).style.top).toBe('124px');
  });

  it('flips the popover above the bar when it would overflow the viewport bottom', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4' },
    ]);
    const b = bar(cal, 'a');
    // window.innerHeight is 768 in the test environment: 740 + 6 + 102 overflows.
    stubRect(b, { left: 200, top: 722, right: 260, bottom: 740, width: 60, height: 18 });
    stubSize(popoverEl(cal), 264, 102);

    click(b);
    await wait(20);

    // Above the bar: 722 - 6 - 102 = 614 in viewport space, 314 in the container.
    expect(popoverEl(cal).style.top).toBe('314px');
  });

  it('clamps the popover to the right viewport edge', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4' },
    ]);
    const b = bar(cal, 'a');
    stubRect(b, { left: 900, top: 400, right: 960, bottom: 418, width: 60, height: 18 });
    stubSize(popoverEl(cal), 264, 102);

    click(b);
    await wait(20);

    // 1024 - 264 - 4 = 756 in viewport space, 716 in the container.
    expect(popoverEl(cal).style.left).toBe('716px');
  });

  it('anchors the tooltip above its bar in containing-block coordinates', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), tooltip: 'Team offsite' },
    ]);
    const b = bar(cal, 'a');
    stubRect(b, { left: 200, top: 400, right: 260, bottom: 418, width: 60, height: 18 });
    stubSize(tooltipEl(cal), 180, 32);

    b.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(20);

    // Viewport target is (200, 400 - 32 - 6 = 362); container-relative (160, 62).
    expect(tooltipEl(cal).hidden).toBe(false);
    expect(tooltipEl(cal).style.left).toBe('160px');
    expect(tooltipEl(cal).style.top).toBe('62px');
  });

  it('drops the tooltip below the bar when there is no room above', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), tooltip: 'Team offsite' },
    ]);
    const b = bar(cal, 'a');
    stubRect(b, { left: 200, top: 20, right: 260, bottom: 38, width: 60, height: 18 });
    stubSize(tooltipEl(cal), 180, 32);

    b.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(20);

    // 20 - 32 - 6 = -18 is off-screen, so it goes under the bar: 38 + 6 = 44.
    expect(tooltipEl(cal).style.top).toBe(`${44 - CONTAINER.top}px`);
  });

  it('lifts the host out of the following sections while an overlay is open', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4', tooltip: 'tip' },
    ]);
    const host = calendar as HTMLElement;
    expect(host.hasAttribute('overlay-open')).toBe(false);

    const b = bar(cal, 'a');
    b.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(20);
    expect(host.hasAttribute('overlay-open')).toBe(true);

    b.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(20);
    expect(host.hasAttribute('overlay-open')).toBe(false);

    click(b);
    await wait(20);
    expect(host.hasAttribute('overlay-open')).toBe(true);

    calendar.closeEventPopover();
    await wait(20);
    expect(host.hasAttribute('overlay-open')).toBe(false);
  });

  describe('stylesheet contract', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'packages/components/src/calendar/snice-calendar.css'),
      'utf8',
    );

    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');

    /** Declarations of the rule whose selector is exactly `selector`. */
    function rule(selector: string): string {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = bare.match(new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`));
      expect(match, `missing rule for ${selector}`).toBeTruthy();
      return match![1];
    }

    it('positions the overlays against a containing block the calendar owns', () => {
      // `position: fixed` is measured from `:host` (it declares `contain:
      // layout`), so it can never mean "viewport" here.
      expect(rule('.calendar__popover')).toContain('position: absolute');
      expect(rule('.calendar__tooltip')).toContain('position: absolute');
      expect(rule('.calendar')).toContain('position: relative');
    });

    it('raises the contained host while an overlay is open', () => {
      expect(rule(':host([overlay-open])')).toContain('z-index');
    });
  });
});
