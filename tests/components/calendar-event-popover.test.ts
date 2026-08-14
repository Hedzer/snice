// Click-to-open event popovers in <snice-calendar>: per-event opt-in via
// `event.popover`, content from inline value, the element `eventPopover`
// provider, or the `calendar/event-popover` @request channel. Interactive,
// focus-managed, Escape/outside dismissable — distinct from the hover tooltip.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import { controller, respond } from 'snice';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

describe('snice-calendar event popovers', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  async function makeCalendar(events: CalendarEvent[]) {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15)); // June 2026
    calendar.events = events;
    await wait(20);
    return calendar as any;
  }

  function bar(cal: any, eventId: string | number) {
    return [...cal.shadowRoot.querySelectorAll('.calendar__event-bar')]
      .find((b: HTMLElement) => b.getAttribute('data-event-id') === String(eventId)) as HTMLElement;
  }

  function popoverEl(cal: any): HTMLElement {
    return cal.shadowRoot.querySelector('.calendar__popover');
  }

  function click(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  }

  it('a click on an event without popover opens nothing and fires no request', async () => {
    const requests = vi.fn();
    document.addEventListener('calendar/event-popover', requests);
    const cal = await makeCalendar([
      { id: 'plain', title: 'Plain', start: new Date(2026, 5, 2) },
    ]);

    click(bar(cal, 'plain'));
    await wait(80);

    expect(popoverEl(cal).hidden).toBe(true);
    expect(requests).not.toHaveBeenCalled();
    document.removeEventListener('calendar/event-popover', requests);
  });

  it('still dispatches calendar-event-click when a popover opens', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'details' },
    ]);
    const clicks: any[] = [];
    (calendar as HTMLElement).addEventListener('calendar-event-click', (e: any) => clicks.push(e.detail.event.id));

    click(bar(cal, 'a'));
    await wait(20);
    expect(clicks).toEqual(['a']);
    expect(popoverEl(cal).hidden).toBe(false);
  });

  it('inline string popover opens on click with the text', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'Room 4, 10:00' },
    ]);

    click(bar(cal, 'a'));
    await wait(20);

    const pop = popoverEl(cal);
    expect(pop.hidden).toBe(false);
    expect(pop.textContent).toContain('Room 4, 10:00');
    expect(pop.getAttribute('part')).toBe('event-popover');
    expect(pop.getAttribute('role')).toBe('dialog');
  });

  it('inline node factory renders rich content', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: () => {
        const n = document.createElement('div');
        n.innerHTML = '<strong>Standup</strong><button class="join">Join</button>';
        return n;
      } },
    ]);

    click(bar(cal, 'a'));
    await wait(20);

    const pop = popoverEl(cal);
    expect(pop.querySelector('strong')?.textContent).toBe('Standup');
    expect(pop.querySelector('button.join')).toBeTruthy();
  });

  it('popover: true resolves via the eventPopover provider with a loading state', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: true },
    ]);
    (calendar as any).eventPopover = async (event: CalendarEvent) => {
      await wait(30);
      return `Loaded ${event.id}`;
    };
    await wait(20);

    click(bar(cal, 'a'));
    await wait(5);
    const pop = popoverEl(cal);
    expect(pop.hidden).toBe(false);
    expect(pop.querySelector('.calendar__popover-loading')).toBeTruthy();

    await wait(50);
    expect(pop.textContent).toContain('Loaded a');
    expect(pop.querySelector('.calendar__popover-loading')).toBeNull();
  });

  it('discards provider results that resolve after the popover closed', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: true },
    ]);
    (calendar as any).eventPopover = async () => { await wait(40); return 'late'; };
    await wait(20);

    click(bar(cal, 'a'));
    await wait(5);
    calendar.closeEventPopover();
    await wait(60);

    expect(popoverEl(cal).hidden).toBe(true);
    expect(popoverEl(cal).textContent).not.toContain('late');
  });

  it('popover: true falls back to the calendar/event-popover request channel', async () => {
    const seen: any[] = [];
    const tag = 'cal-popover-responder';
    if (!(window as any).__calPopoverCtrlDefined) {
      (window as any).__calPopoverCtrlDefined = true;
      @controller(tag)
      class PopoverController {
        element!: HTMLElement;
        async attach() {}
        async detach() {}

        @respond('calendar/event-popover')
        async details(payload: { event: CalendarEvent }) {
          seen.push(payload.event.id);
          const n = document.createElement('div');
          n.className = 'from-request';
          n.textContent = `Details for ${payload.event.title}`;
          return n;
        }
      }
    }

    const host = document.createElement('div');
    host.setAttribute('controller', tag);
    document.body.appendChild(host);

    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    host.appendChild(calendar as HTMLElement);
    await wait(20);
    calendar.goToDate(new Date(2026, 5, 15));
    calendar.events = [
      { id: 'req', title: 'Req', start: new Date(2026, 5, 2), popover: true },
    ];
    await wait(20);

    click(bar(calendar as any, 'req'));
    await wait(120);

    const pop = popoverEl(calendar as any);
    expect(seen).toEqual(['req']);
    expect(pop.hidden).toBe(false);
    expect(pop.querySelector('.from-request')?.textContent).toBe('Details for Req');

    host.remove();
  });

  it('popover: true with no provider and no responder closes quietly with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: true },
    ]);

    click(bar(cal, 'a'));
    await wait(200); // past the 50ms discovery timeout

    expect(popoverEl(cal).hidden).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('popover'));
    warn.mockRestore();
  });

  it('Escape closes the popover and returns focus to the bar', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'details' },
    ]);

    const b = bar(cal, 'a');
    click(b);
    await wait(20);
    expect(popoverEl(cal).hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(20);
    expect(popoverEl(cal).hidden).toBe(true);
    expect(cal.shadowRoot.activeElement).toBe(b);
  });

  it('clicking outside closes the popover', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'details' },
    ]);

    click(bar(cal, 'a'));
    await wait(20);
    expect(popoverEl(cal).hidden).toBe(false);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wait(20);
    expect(popoverEl(cal).hidden).toBe(true);
  });

  it('clicking inside the popover does not close it', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: () => {
        const n = document.createElement('button');
        n.className = 'inner-btn';
        n.textContent = 'act';
        return n;
      } },
    ]);

    click(bar(cal, 'a'));
    await wait(20);
    const pop = popoverEl(cal);
    pop.querySelector('.inner-btn')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, composed: true }));
    await wait(20);
    expect(pop.hidden).toBe(false);
  });

  it('bars with a popover are keyboard-operable (Enter opens)', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'details' },
    ]);

    const b = bar(cal, 'a');
    expect(b.getAttribute('tabindex')).toBe('0');
    expect(b.getAttribute('role')).toBe('button');
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await wait(20);
    expect(popoverEl(cal).hidden).toBe(false);
  });

  it('hides the tooltip when the popover opens', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'pop', tooltip: 'tip' },
    ]);

    const b = bar(cal, 'a');
    b.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(20);
    expect(cal.shadowRoot.querySelector('.calendar__tooltip').hidden).toBe(false);

    click(b);
    await wait(20);
    expect(cal.shadowRoot.querySelector('.calendar__tooltip').hidden).toBe(true);
    expect(popoverEl(cal).hidden).toBe(false);
  });

  it('opening another event popover replaces the first', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), popover: 'first' },
      { id: 'b', title: 'B', start: new Date(2026, 5, 10), popover: 'second' },
    ]);

    click(bar(cal, 'a'));
    await wait(20);
    click(bar(cal, 'b'));
    await wait(20);

    const pop = popoverEl(cal);
    expect(pop.hidden).toBe(false);
    expect(pop.textContent).toContain('second');
    expect(pop.textContent).not.toContain('first');
  });
});
