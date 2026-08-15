/**
 * Matrix slice DATE-TIME-PICKER / LIVE vs DEFAULT — the two values a
 * form-associated control keeps at once.
 *
 * Dimensions: authored default (2: present / absent) x mutation path
 * (4: none / live assignment / clear / restore) x later default change
 * (2: yes / no) = 16 combos.
 *
 * Documented contract ("Live/default semantics"):
 *
 *     picker.value: string;        // live value; does not reflect
 *     picker.defaultValue: string; // value attribute / reset default
 *
 *   · "`form.reset()` restores `defaultValue` without customer events."
 *   · "Attribute/default changes update live state only while pristine."
 *   · "Pre-upgrade `value` property assignment is adopted."
 *
 * The pristine/dirty rule is the one worth a matrix: every path that touches
 * the live value has to make the control dirty, and every one of them has to
 * survive a later default change. A control that forgot to mark itself dirty on
 * (say) `clear()` would silently resurrect a cleared appointment the next time
 * the server re-rendered the `value` attribute.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, wait, SETTLE, Problems, expectClean,
  type SniceDateTimePickerElement,
} from './date-time-picker-support';

const AUTHORED = '2026-03-10T14:05';
const LATER_DEFAULT = '2026-05-05T05:05';

/** Every documented way the live value can move away from its default. */
const MUTATIONS: Array<{
  name: string;
  apply: (el: SniceDateTimePickerElement) => void | Promise<void>;
  /** The live value the mutation leaves behind. */
  result: string;
  /** Whether the mutation makes the control dirty. */
  dirties: boolean;
}> = [
  { name: 'pristine', apply: () => {}, result: '', dirties: false },
  {
    name: 'live-assignment',
    apply: el => { el.value = '2026-04-01T08:00'; },
    result: '2026-04-01T08:00',
    dirties: true,
  },
  {
    name: 'clear',
    apply: el => el.clear(),
    result: '',
    dirties: true,
  },
  {
    name: 'restore',
    apply: el => (el as any).formStateRestoreCallback('2026-06-06T06:06', 'restore'),
    result: '2026-06-06T06:06',
    dirties: true,
  },
];

describe('date-time-picker matrix: live and default values', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const authored of [true, false]) {
    for (const mutation of MUTATIONS) {
      for (const changeDefaultLater of [false, true]) {
        const id = `${authored ? 'authored' : 'blank'}/${mutation.name}`
          + `${changeDefaultLater ? '/default-changed' : ''}`;

        it(`${id}: the live value and the reset default stay separate`, async () => {
          const el = await mountPicker(authored ? { attrs: { value: AUTHORED } } : {});
          const problems = new Problems();

          // An authored `value` attribute IS the default, and seeds the live
          // value while the control is still pristine.
          problems.eq('initial live value', el.value, authored ? AUTHORED : '');
          problems.eq('initial default', el.defaultValue, authored ? AUTHORED : '');

          await mutation.apply(el);
          await wait(SETTLE);

          const expectedLive = mutation.dirties
            ? mutation.result
            : (authored ? AUTHORED : '');
          problems.eq('live value after the mutation', el.value, expectedLive);
          problems.eq(
            'the default is untouched by a live mutation',
            el.defaultValue,
            authored ? AUTHORED : '',
          );
          // "does not reflect" — the content attribute still holds what was
          // authored, whatever the live value became.
          problems.eq(
            'the value content attribute does not follow the live value',
            el.getAttribute('value'),
            authored ? AUTHORED : null,
          );

          if (changeDefaultLater) {
            el.setAttribute('value', LATER_DEFAULT);
            await wait(SETTLE);

            problems.eq('the new default took', el.defaultValue, LATER_DEFAULT);
            // "Attribute/default changes update live state only while pristine."
            problems.eq(
              mutation.dirties
                ? 'a dirty control keeps its live value'
                : 'a pristine control follows the new default',
              el.value,
              mutation.dirties ? expectedLive : LATER_DEFAULT,
            );
          }

          // `form.reset()` always restores whatever the current default is.
          (el as any).formResetCallback();
          await wait(SETTLE);
          problems.eq(
            'reset restores the current default',
            el.value,
            changeDefaultLater ? LATER_DEFAULT : (authored ? AUTHORED : ''),
          );

          expectClean(problems, id);
        });
      }
    }
  }

  // ── Pre-upgrade assignment ────────────────────────────────────────────────

  it('a value assigned before upgrade is adopted', async () => {
    const el = document.createElement('snice-date-time-picker') as SniceDateTimePickerElement;
    // Assigned while the element is still an unupgraded HTMLElement: the
    // property lands as an own property that the class accessor must reclaim.
    (el as any).value = AUTHORED;
    document.body.appendChild(el);
    await (el as any).ready;
    await wait(SETTLE);

    expect(el.value).toBe(AUTHORED);
    expect(readFacts(el).formValue).toBe(AUTHORED);
    el.remove();
  });

  it('reset after a reset is still the default', async () => {
    const el = await mountPicker({ attrs: { value: AUTHORED } });
    el.value = '2026-04-01T08:00';
    await wait(SETTLE);

    (el as any).formResetCallback();
    await wait(SETTLE);
    (el as any).formResetCallback();
    await wait(SETTLE);

    expect(el.value).toBe(AUTHORED);
  });

  it('a reset control is pristine again and follows the next default', async () => {
    const el = await mountPicker({ attrs: { value: AUTHORED } });
    el.value = '2026-04-01T08:00';
    await wait(SETTLE);
    (el as any).formResetCallback();
    await wait(SETTLE);

    el.setAttribute('value', LATER_DEFAULT);
    await wait(SETTLE);

    expect(el.value, 'reset cleared the dirty flag, so the new default applies')
      .toBe(LATER_DEFAULT);
  });
});
