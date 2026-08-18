/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-booking matrix — the three steps and the four events
 * ════════════════════════════════════════════════════════════════════════════
 *
 * docs/ai/components/booking.md:
 *
 *   date-select     -> { date }
 *   slot-select     -> { slot }
 *   booking-confirm -> { booking }
 *   booking-cancel  -> void
 *   reset()         "Reset to step 1, clear selections"
 *   getBooking()    "Returns BookingData | null"
 *
 * The cross walks a real booking to its end for every combination of slot
 * supply and form shape, in both variants, checking at every step: which
 * region is on screen, whether Next is allowed to be pressed, what the events
 * carried, and what `getBooking()` says.
 *
 * ── The two findings this file pins ─────────────────────────────────────────
 *
 *   MATRIX-booking-1  The docs describe the inline variant as "all steps
 *                     visible". The calendar and the slots are both rendered,
 *                     but `part="form"` — the third step, the one that asks
 *                     the visitor for their name — appears only after a slot
 *                     has been selected.
 *   MATRIX-booking-2 (fixed)  With any `required` field — the doc's own
 *                     example form has two — the Confirm button used to stay
 *                     disabled forever: typing wrote to an internal map without
 *                     re-evaluating the action row. The button now syncs on
 *                     every input, so the documented `booking-confirm` event
 *                     and the confirmation screen are reachable.
 *
 * Both keep the documented assertion and are declared `it.fails`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, captureEvents, click, removeComponent, wait }
  from '../matrix-kit';
import {
  futureDaysThisMonth, monthGrid, ymd, dayCells, slotButtons, actionButtons, stepChips,
  formInputs, regions, slotsFor, slotLabel, isFormValid,
} from './booking-support';
import type { BookingField, BookingSlot } from
  '../../../packages/components/src/booking/snice-booking.types';

const TAG = 'snice-booking';
await import('../../../packages/components/src/booking/snice-booking');

afterEach(() => { document.body.innerHTML = ''; });

const FUTURE = futureDaysThisMonth(3);

const FIELD_SETS: Record<string, BookingField[]> = {
  none: [],
  required: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
  optional: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
};

function slotsOn(date: string): BookingSlot[] {
  return [
    { date, time: '09:00', duration: 30 },
    { date, time: '10:00', duration: 30 },
    { date, time: '14:30', duration: 60 },
  ];
}

/** Click the day cell for `date`, whatever position it holds in the grid. */
function clickDay(el: HTMLElement, date: string): boolean {
  const grid = monthGrid();
  const index = grid.findIndex(cell => ymd(cell) === date);
  const button = dayCells(el)[index];
  if (!button || button.disabled) return false;
  click(button);
  return true;
}

/** The stepper's Next/Confirm button. */
function nextButton(el: HTMLElement): HTMLButtonElement | undefined {
  return actionButtons(el).find(b => b.classList.contains('booking__btn--primary'));
}

/** The stepper's Back/Cancel button. */
function backButton(el: HTMLElement): HTMLButtonElement | undefined {
  return actionButtons(el).find(b => !b.classList.contains('booking__btn--primary'));
}

describe('booking matrix: a booking, end to end', () => {
  const combos = cross({
    fields: ['none', 'required', 'optional'] as const,
    slots: ['some', 'none'] as const,
    variant: ['stepper', 'inline'] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      if (!FUTURE.length) return;
      const day = FUTURE[0];
      const slots = combo.slots === 'some' ? slotsOn(day) : [];
      const fields = FIELD_SETS[combo.fields];
      const el = await mount<any>(TAG, { variant: combo.variant }, {
        availableDates: [day], availableSlots: slots, fields,
      });

      const dates = captureEvents<any>(el, 'date-select');
      const picked = captureEvents<any>(el, 'slot-select');
      const confirmed = captureEvents<any>(el, 'booking-confirm');
      const problems = new Problems();

      // ── Step one ────────────────────────────────────────────────────────
      problems.check(regions(el).calendar, 'step one shows no calendar');
      problems.equal(el.getBooking(), null, 'getBooking() before anything is picked');
      if (combo.variant === 'stepper') {
        problems.check(!!nextButton(el)?.disabled, 'Next is enabled with no date picked');
        problems.equal(stepChips(el).length, 3, 'stepper chips');
      }

      problems.check(clickDay(el, day), `the listed day ${day} was not selectable`);
      await wait(30);
      problems.equal(dates.map(d => d.date), [day], 'date-select');

      // ── Step two ────────────────────────────────────────────────────────
      if (combo.variant === 'stepper') {
        problems.check(!nextButton(el)?.disabled, 'Next is still disabled after a date');
        click(nextButton(el));
        await wait(30);
      }
      problems.check(regions(el).slots, 'step two shows no slots region');

      const offered = slotButtons(el);
      problems.equal(offered.length, slotsFor(slots, day).length, 'slots offered');
      problems.equal(offered.map(b => b.querySelector('.booking__slot-time')!.textContent!.trim()),
        slotsFor(slots, day).map(slot => slotLabel(slot.time)), 'slot labels');

      if (combo.slots === 'none') {
        // Nothing to pick: the widget says so and cannot go on.
        if (combo.variant === 'stepper') {
          problems.check(!!nextButton(el)?.disabled, 'Next is enabled with no slot to pick');
        }
        problems.equal(el.getBooking(), null, 'getBooking() with no slot');
        expectClean(problems, combo.id);
        removeComponent(el);
        return;
      }

      click(offered[1]);
      await wait(30);
      problems.equal(picked.map(p => p.slot.time), ['10:00'], 'slot-select');
      problems.equal(el.getBooking()?.slot?.time, '10:00', 'getBooking().slot');
      problems.equal(el.getBooking()?.date, day, 'getBooking().date');

      // ── Step three ──────────────────────────────────────────────────────
      if (combo.variant === 'stepper') {
        click(nextButton(el));
        await wait(30);
      }
      problems.check(regions(el).form, 'the confirmation form never appeared');
      problems.equal(formInputs(el).length, fields.length, 'form inputs');

      // Confirm is gated on the required fields.
      if (combo.variant === 'stepper') {
        const gated = !isFormValid(fields, {});
        problems.equal(!!nextButton(el)?.disabled, gated,
          `Confirm ${gated ? 'enabled' : 'disabled'} with an empty form`);
      }

      // Filling the form and confirming is crossed on its own below, because
      // whether Confirm can ever be pressed depends on the field set
      // (MATRIX-booking-2).
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

// ── Completing the booking ──────────────────────────────────────────────────
//
// MATRIX-booking-2 (fixed): the Confirm button's `disabled` flag used to be
// computed once while the action row was built, and typing into a field only
// wrote to an internal map — no re-evaluation followed — so for any field set
// with a `required` field, Confirm was disabled when step three was drawn and
// stayed disabled forever. The button state now syncs on every input, and the
// documented flow runs on every field set.

describe('booking matrix: confirming', () => {
  for (const name of ['none', 'required', 'optional'] as const) {
    const fields = FIELD_SETS[name];
    const gated = fields.some(field => field.required);
    const title = `fields=${name}: a completed form confirms the booking`
      + (gated ? ' [MATRIX-booking-2 (fixed)]' : '');

    const run = async () => {
      if (!FUTURE.length) return;
      const day = FUTURE[0];
      const el = await mount<any>(TAG, {}, {
        availableDates: [day], availableSlots: slotsOn(day), fields,
      });
      const confirmed = captureEvents<any>(el, 'booking-confirm');

      clickDay(el, day);
      await wait(30);
      click(nextButton(el));
      await wait(30);
      click(slotButtons(el)[1]);
      await wait(30);
      click(nextButton(el));
      await wait(30);

      const values: Record<string, string> = {};
      formInputs(el).forEach((input, i) => {
        input.value = fields[i].type === 'email' ? 'a@b.co' : 'Alice';
        values[fields[i].name] = input.value;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      });
      await wait(30);

      const problems = new Problems();
      problems.check(isFormValid(fields, values), 'the oracle considers the form incomplete');
      problems.check(!nextButton(el)?.disabled,
        'Confirm is still disabled after every required field was filled');
      click(nextButton(el));
      await wait(30);

      problems.equal(confirmed.length, 1, 'booking-confirm count');
      const booking = confirmed[0]?.booking;
      problems.equal(booking?.date, day, 'booking.date');
      problems.equal(booking?.slot?.time, '10:00', 'booking.slot.time');
      problems.equal(booking?.slot?.duration, 30, 'booking.slot.duration');
      problems.equal(booking?.fields, values, 'booking.fields');
      problems.check(regions(el).confirmation, 'no confirmation screen was shown');
      expectClean(problems, `fields=${name}`);
      removeComponent(el);
    };

    it(title, run);
  }

  it('an empty required form cannot be confirmed', async () => {
    // The gate itself is documented behaviour and works: this is the half of
    // MATRIX-booking-2 that is CORRECT, kept so a fix cannot remove it.
    if (!FUTURE.length) return;
    const day = FUTURE[0];
    const el = await mount<any>(TAG, {}, {
      availableDates: [day], availableSlots: slotsOn(day), fields: FIELD_SETS.required,
    });
    clickDay(el, day);
    await wait(30);
    click(nextButton(el));
    await wait(30);
    click(slotButtons(el)[0]);
    await wait(30);
    click(nextButton(el));
    await wait(30);

    expect(regions(el).form, 'step three').toBe(true);
    expect(nextButton(el)?.disabled, 'Confirm with an empty required form').toBe(true);
  });
});

describe('booking matrix: the stepper header tracks the step', () => {
  for (const step of [1, 2, 3] as const) {
    it(`step ${step}`, async () => {
      if (!FUTURE.length) return;
      const day = FUTURE[0];
      const el = await mount<any>(TAG, {}, {
        availableDates: [day], availableSlots: slotsOn(day),
        fields: [{ name: 'name', label: 'Full Name', type: 'text', required: true }],
      });

      if (step >= 2) { clickDay(el, day); await wait(30); click(nextButton(el)); await wait(30); }
      if (step >= 3) { click(slotButtons(el)[0]); await wait(30); click(nextButton(el)); await wait(30); }

      const chips = stepChips(el);
      const problems = new Problems();
      problems.equal(chips.length, 3, 'stepper chips');
      chips.forEach((chip, i) => {
        const number = i + 1;
        const classes = chip.getAttribute('class') ?? '';
        problems.check(classes.includes('booking__step--active') === (number === step),
          `chip ${number}: active for step ${step}`);
        problems.check(classes.includes('booking__step--completed') === (number < step),
          `chip ${number}: completed for step ${step}`);
        // A completed step is ticked rather than numbered.
        problems.equal(chip.querySelector('.booking__step-number')!.textContent,
          number < step ? '✓' : String(number), `chip ${number} marker`);
      });
      expectClean(problems, `step ${step}`);
      removeComponent(el);
    });
  }
});

describe('booking matrix: cancel and reset', () => {
  it('Cancel on step one emits booking-cancel', async () => {
    const el = await mount<any>(TAG, {});
    const cancelled = captureEvents<any>(el, 'booking-cancel');
    click(backButton(el));
    await wait(30);
    expect(cancelled.length, 'booking-cancel').toBe(1);
  });

  it('Back walks the stepper backwards without cancelling', async () => {
    if (!FUTURE.length) return;
    const day = FUTURE[0];
    const el = await mount<any>(TAG, {}, {
      availableDates: [day], availableSlots: slotsOn(day),
    });
    const cancelled = captureEvents<any>(el, 'booking-cancel');
    clickDay(el, day);
    await wait(30);
    click(nextButton(el));
    await wait(30);
    expect(regions(el).slots, 'step two').toBe(true);

    click(backButton(el));
    await wait(30);
    expect(regions(el).calendar, 'Back returned to the calendar').toBe(true);
    expect(cancelled.length, 'Back must not cancel the booking').toBe(0);
  });

  it('reset() returns to step one and clears the selections', async () => {
    if (!FUTURE.length) return;
    const day = FUTURE[0];
    const el = await mount<any>(TAG, {}, {
      availableDates: [day], availableSlots: slotsOn(day),
    });
    clickDay(el, day);
    await wait(30);
    click(nextButton(el));
    await wait(30);
    click(slotButtons(el)[0]);
    await wait(30);
    expect(el.getBooking(), 'a booking in progress').not.toBeNull();

    el.reset();
    await wait(30);
    expect(el.getBooking(), 'getBooking() after reset()').toBeNull();
    expect(regions(el).calendar, 'reset() returns to step one').toBe(true);
    expect(dayCells(el).some(cell => cell.classList.contains('booking__day--selected')),
      'a day is still marked selected after reset()').toBe(false);
  });

  it('picking a new date clears the slot chosen under the old one', async () => {
    if (FUTURE.length < 2) return;
    const [first, second] = FUTURE;
    const el = await mount<any>(TAG, { variant: 'inline' }, {
      availableDates: [first, second],
      availableSlots: [...slotsOn(first), ...slotsOn(second)],
    });
    clickDay(el, first);
    await wait(30);
    click(slotButtons(el)[0]);
    await wait(30);
    expect(el.getBooking()?.date, 'the first booking').toBe(first);

    clickDay(el, second);
    await wait(30);
    expect(el.getBooking(), 'the slot must not survive a date change').toBeNull();
  });
});

describe('booking matrix: the inline variant', () => {
  it('renders the calendar and the slots at once', async () => {
    if (!FUTURE.length) return;
    const el = await mount<HTMLElement>(TAG, { variant: 'inline' }, {
      availableDates: [FUTURE[0]], availableSlots: slotsOn(FUTURE[0]),
    });
    const shown = regions(el);
    expect(shown.calendar, 'calendar').toBe(true);
    expect(shown.slots, 'slots').toBe(true);
    expect(shown.stepper, 'the inline variant renders no step header').toBe(false);
  });

  it.fails('shows all three steps at once [MATRIX-booking-1]', async () => {
    if (!FUTURE.length) return;
    const el = await mount<HTMLElement>(TAG, { variant: 'inline' }, {
      availableDates: [FUTURE[0]],
      availableSlots: slotsOn(FUTURE[0]),
      fields: [{ name: 'name', label: 'Full Name', type: 'text', required: true }],
    });
    expect(regions(el).form,
      'the inline variant hides the confirmation form until a slot is picked').toBe(true);
  });
});
