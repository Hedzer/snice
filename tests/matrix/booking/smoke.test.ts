/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-booking matrix — smoke slice
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one file of this directory the DEFAULT vitest loop collects. One combo
 * per feature family, plus the marquee regressions:
 *
 *   · `availableDates` disables every other day, and the past is never open;
 *   · picking a date offers that date's slots and emits `date-select`;
 *   · a slot fills `getBooking()` and emits `slot-select`;
 *   · MATRIX-booking-2 — a completed required form still cannot be confirmed;
 *   · MATRIX-booking-1 — the inline variant does not show all three steps.
 *
 * The full cross lives in the sibling files and runs via
 * `npx vitest run --config vitest.matrix.config.ts tests/matrix/booking`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, Problems, expectClean, captureEvents, click, wait } from '../matrix-kit';
import {
  futureDaysThisMonth, monthGrid, ymd, dayCells, slotButtons, actionButtons, formInputs,
  regions, checkCalendar, slotLabel,
} from './booking-support';

const TAG = 'snice-booking';
await import('../../../packages/components/src/booking/snice-booking');

afterEach(() => { document.body.innerHTML = ''; });

const FUTURE = futureDaysThisMonth(2);

function clickDay(el: HTMLElement, date: string): void {
  const index = monthGrid().findIndex(cell => ymd(cell) === date);
  click(dayCells(el)[index]);
}

function nextButton(el: HTMLElement): HTMLButtonElement | undefined {
  return actionButtons(el).find(b => b.classList.contains('booking__btn--primary'));
}

describe('booking smoke', () => {
  it('availableDates disables every other day', async () => {
    if (!FUTURE.length) return;
    const el = await mount<HTMLElement>(TAG, {}, { availableDates: [FUTURE[0]] });
    const problems = new Problems();
    checkCalendar(el, { availableDates: [FUTURE[0]] }, problems);
    expectClean(problems, 'listed dates');
  });

  it('a date offers its own slots and emits date-select', async () => {
    if (!FUTURE.length) return;
    const day = FUTURE[0];
    const other = FUTURE[1] ?? day;
    const el = await mount<any>(TAG, { variant: 'inline' }, {
      availableDates: [day, other],
      availableSlots: [
        { date: day, time: '09:00', duration: 30 },
        { date: other, time: '15:00', duration: 45 },
      ],
    });
    const dates = captureEvents<any>(el, 'date-select');
    const slots = captureEvents<any>(el, 'slot-select');

    clickDay(el, day);
    await wait(30);
    expect(dates.map(d => d.date), 'date-select').toEqual([day]);
    expect(slotButtons(el).map(b => b.querySelector('.booking__slot-time')!.textContent!.trim()),
      'only that date\'s slots').toEqual([slotLabel('09:00')]);

    click(slotButtons(el)[0]);
    await wait(30);
    expect(slots.map(s => s.slot.time), 'slot-select').toEqual(['09:00']);
    expect(el.getBooking(), 'getBooking()').toMatchObject({ date: day, slot: { time: '09:00' } });
  });

  it.fails('a completed required form can be confirmed [MATRIX-booking-2]', async () => {
    if (!FUTURE.length) return;
    const day = FUTURE[0];
    const el = await mount<any>(TAG, {}, {
      availableDates: [day],
      availableSlots: [{ date: day, time: '09:00', duration: 30 }],
      fields: [{ name: 'name', label: 'Full Name', type: 'text', required: true }],
    });
    clickDay(el, day);
    await wait(30);
    click(nextButton(el));
    await wait(30);
    click(slotButtons(el)[0]);
    await wait(30);
    click(nextButton(el));
    await wait(30);

    const input = formInputs(el)[0];
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await wait(30);
    expect(nextButton(el)?.disabled, 'Confirm after filling every required field').toBe(false);
  });

  it.fails('the inline variant shows all three steps [MATRIX-booking-1]', async () => {
    if (!FUTURE.length) return;
    const el = await mount<HTMLElement>(TAG, { variant: 'inline' }, {
      availableDates: [FUTURE[0]],
      availableSlots: [{ date: FUTURE[0], time: '09:00', duration: 30 }],
      fields: [{ name: 'name', label: 'Full Name', type: 'text', required: true }],
    });
    expect(regions(el).form, 'the confirmation form is hidden until a slot is picked')
      .toBe(true);
  });
});
