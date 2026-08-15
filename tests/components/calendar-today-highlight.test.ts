import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement } from '../../packages/components/src/calendar/snice-calendar.types';

/**
 * `highlight-today` is only observable when nothing else is painting today.
 * A calendar the user has not chosen a day in must therefore start with no
 * selection at all — otherwise today is born `aria-selected` and the selected
 * background covers the today background, so `highlight-today="false"` looks
 * identical to the default.
 */
describe('snice-calendar today highlighting', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  const shadow = (el: SniceCalendarElement) => (el as any).shadowRoot as ShadowRoot;
  const cells = (el: SniceCalendarElement) =>
    [...shadow(el).querySelectorAll('.calendar__day')] as HTMLElement[];

  it('starts with no selected day', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    await wait(20);

    expect(calendar.value).toBeNull();
    expect(cells(calendar).filter(c => c.classList.contains('calendar__day--selected')).length).toBe(0);
    expect(cells(calendar).every(c => c.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('marks today — and only today — when highlight-today is on', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    await wait(20);

    const today = cells(calendar).filter(c => c.classList.contains('calendar__day--today'));
    expect(today.length).toBe(1);
    expect(today[0].textContent!.trim().startsWith(String(new Date().getDate()))).toBe(true);
  });

  it('highlight-today="false" leaves today unmarked and unselected', async () => {
    const el = document.createElement('snice-calendar') as any;
    el.setAttribute('highlight-today', 'false');
    document.body.appendChild(el);
    await el.ready;
    calendar = el as SniceCalendarElement;
    await wait(20);

    expect(calendar.highlightToday).toBe(false);
    expect(cells(calendar).some(c => c.classList.contains('calendar__day--today'))).toBe(false);
    // The regression this guards: today used to still paint, because the
    // default value selected it.
    expect(cells(calendar).some(c => c.classList.contains('calendar__day--selected'))).toBe(false);
    expect(cells(calendar).some(c => c.getAttribute('aria-current') === 'date')).toBe(false);
  });

  it('selecting a day still marks it, leaving today highlighted separately', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    await wait(20);

    const today = new Date();
    const other = new Date(today.getFullYear(), today.getMonth(), today.getDate() === 1 ? 2 : 1);
    calendar.value = other;
    await wait(20);

    const selected = cells(calendar).filter(c => c.classList.contains('calendar__day--selected'));
    expect(selected.length).toBe(1);
    expect(selected[0].classList.contains('calendar__day--today')).toBe(false);
    expect(cells(calendar).filter(c => c.classList.contains('calendar__day--today')).length).toBe(1);
  });

  it('ignores an unparseable value instead of throwing', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    await wait(20);

    (calendar as any).value = 'not-a-date';
    await wait(20);
    expect(cells(calendar).some(c => c.classList.contains('calendar__day--selected'))).toBe(false);
  });

  it('clicking a day selects it and reports the value', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15));
    await wait(20);
    (calendar as any).value = null;
    await wait(20);

    const changes: any[] = [];
    (calendar as HTMLElement).addEventListener('calendar-change', (e: any) => changes.push(e.detail));

    const cell = cells(calendar)[10];
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(20);

    expect(cell.classList.contains('calendar__day--selected')).toBe(true);
    expect(changes.length).toBe(1);
  });
});
