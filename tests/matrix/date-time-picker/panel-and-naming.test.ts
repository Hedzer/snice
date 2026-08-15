/**
 * Matrix slice DATE-TIME-PICKER / PANEL + NAMING — the composite control's
 * anatomy and its accessible names.
 *
 * Dimensions: timeFormat (2) x showSeconds (2) x variant (2) x naming source
 * (3: none / `label` / external `<label for>`) = 24 combos.
 *
 * Documented contract:
 *   · "All seven date formats, 12/24-hour modes, seconds, sizes,
 *     dropdown/inline variants, year/month/Today navigation … remain
 *     supported" — the panel's time columns follow `timeFormat` and
 *     `showSeconds`: hours and minutes always, seconds when asked for, and a
 *     period column only on a 12-hour clock.
 *   · "The panel, calendar, hours, minutes, optional seconds, and period groups
 *     are named independently from the same accessible name."
 *   · "External `<label for>` … External labels take precedence; fallback is
 *     `label`, then `Date and time`."
 *
 * "Independently from the same accessible name" is two claims in one: every
 * group carries the control's name (so a screen-reader user knows which control
 * they are in), and no two groups carry the SAME name (so they can tell the
 * hours column from the minutes column). The oracle checks both.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TIME_FORMATS, VARIANTS,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  panelProblems, expectClean, readFacts, wait, SETTLE, shadow,
} from './date-time-picker-support';

/** The documented naming chain, weakest last. */
const NAMING = [
  { name: 'fallback', label: '', external: '', expected: 'Date and time' },
  { name: 'label-property', label: 'Appointment', external: '', expected: 'Appointment' },
  { name: 'external-label', label: 'Appointment', external: 'Arrival', expected: 'Arrival' },
];

describe('date-time-picker matrix: panel and naming', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  let id = 0;
  for (const timeFormat of TIME_FORMATS) {
    for (const showSeconds of [false, true]) {
      for (const variant of VARIANTS) {
        for (const naming of NAMING) {
          const comboId = `${variant}/${timeFormat}/${showSeconds ? 'seconds' : 'minutes'}/${naming.name}`;
          const hostId = `dtp-matrix-${id++}`;

          it(`${comboId}: the panel is built and named as documented`, async () => {
            const attrs: Record<string, any> = { variant, 'time-format': timeFormat, id: hostId };
            if (showSeconds) attrs['show-seconds'] = true;
            if (naming.label) attrs.label = naming.label;

            const el = naming.external
              ? await mountPicker({
                attrs,
                wrapper: picker => {
                  const holder = document.createElement('div');
                  const label = document.createElement('label');
                  label.setAttribute('for', hostId);
                  label.textContent = naming.external;
                  holder.appendChild(label);
                  holder.appendChild(picker);
                  return holder;
                },
              })
              : await mountPicker({ attrs });

            await wait(SETTLE);
            expectClean(panelProblems(el, timeFormat, showSeconds, naming.expected), comboId);
          });
        }
      }
    }
  }

  // ── The naming chain, stated on its own ───────────────────────────────────

  it('an external label takes precedence over the label property', async () => {
    const el = await mountPicker({
      attrs: { id: 'dtp-precedence', label: 'Inner' },
      wrapper: picker => {
        const holder = document.createElement('div');
        const label = document.createElement('label');
        label.setAttribute('for', 'dtp-precedence');
        label.textContent = 'Outer';
        holder.appendChild(label);
        holder.appendChild(picker);
        return holder;
      },
    });
    await wait(SETTLE);

    const facts = readFacts(el);
    expect(facts.inputName).toBe('Outer');
    expect(facts.groupNames.panel).toContain('Outer');
  });

  it('with no label at all, the documented fallback names the control', async () => {
    const el = await mountPicker({});
    expect(readFacts(el).inputName).toBe('Date and time');
  });

  // ── The calendar's documented navigation ──────────────────────────────────

  it('the calendar offers year, month and Today navigation', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });
    el.open();
    await wait(SETTLE);

    const root = shadow(el);
    expect(root.querySelector('.today-button'), 'no Today button').toBeTruthy();
    expect(root.querySelector('.year-button'), 'no year navigation').toBeTruthy();
    expect(
      [...root.querySelectorAll('.nav-button')].map(b => b.getAttribute('aria-label')),
      'no month navigation',
    ).toEqual(['Previous month', 'Next month']);
  });

  it('every calendar day is a labelled button', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });
    el.open();
    await wait(SETTLE);

    const days = [...shadow(el).querySelectorAll('.calendar-days .day')]
      .filter(day => !day.classList.contains('day--empty'));
    expect(days.length, 'March 2026 has 31 days').toBe(31);
    for (const day of days) {
      expect((day.getAttribute('aria-label') ?? '').trim(), 'an unnamed day button').not.toBe('');
    }
  });

  it('days outside min/max are disabled', async () => {
    const el = await mountPicker({
      attrs: { min: '2026-03-10', max: '2026-03-12' },
      liveValue: '2026-03-11T10:00',
    });
    el.open();
    await wait(SETTLE);

    const days = [...shadow(el).querySelectorAll('.calendar-days .day')]
      .filter(day => !day.classList.contains('day--empty')) as HTMLButtonElement[];
    const enabled = days
      .map((day, i) => (day.disabled ? null : i + 1))
      .filter((n): n is number => n !== null);
    expect(enabled, 'only the three in-range days may be selectable').toEqual([10, 11, 12]);
  });
});
