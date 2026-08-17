/**
 * Smoke slice of the snice-time-picker matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/time-picker/`, excluded from the
 * default Vitest include. This file stays collected and buys the marquee only:
 *
 *   · one fully-dressed control per variant, where every documented part is
 *     rendered at once;
 *   · the two documented display strings, `14:05` and `2:05 PM`;
 *   · one canonical round trip with seconds, the documented submission
 *     precision switch;
 *   · malformed text — preserved, `badInput`, submits nothing;
 *   · one typed input, one selector pick, and one clear, the three documented
 *     user paths that emit;
 *   · the reset that has to undo them without an event.
 *
 * Structural assertions route through the matrix's own `pickerProblems`
 * oracle. BUDGET: well under 1s — the validity table, the parsing sweep and
 * the naming cross belong to the fuzz tier.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, captureEvents } from '../matrix-utils';
import {
  picker, comboId, mountPicker, pickerProblems, read, typeInto, clickOption,
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
  type TimeCombo,
} from './time-picker-support';

describe('time-picker matrix smoke', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  const marquee: TimeCombo[] = [
    picker({
      defaultValue: '14:05', step: 5, name: 'when', clearable: true,
      label: 'Appointment', helperText: 'Office hours only.',
    }),
    picker({
      variant: 'inline', format: '12h', showSeconds: true, defaultValue: '14:05:10',
      step: 5, name: 'when', label: 'Appointment',
    }),
    picker({
      defaultValue: 'lunchtime', step: 5, name: 'when',
      errorText: 'Pick a time.', label: 'Appointment',
    }),
    picker({
      defaultValue: '08:00', minTime: '09:00', maxTime: '17:00', required: true,
      step: 15, name: 'when', loading: true,
    }),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountPicker(c);
      expect(pickerProblems(el, c), comboId(c)).toEqual([]);
    });
  }

  it('24h shows 14:05, 12h shows 2:05 PM, and both submit 14:05', async () => {
    const asIs = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(asIs);
    expect(read(el).inputValue).toBe('14:05');
    expect(internalsFor(el).formValue).toBe('14:05');
    unmountAll();

    const twelve = picker({ defaultValue: '14:05', format: '12h', step: 5, name: 'when' });
    const el2 = await mountPicker(twelve);
    expect(read(el2).inputValue).toBe('2:05 PM');
    expect(internalsFor(el2).formValue).toBe('14:05');
  });

  it('malformed text is preserved, flagged badInput, and submits nothing', async () => {
    const c = picker({ step: 5, name: 'when' });
    const el = await mountPicker(c);
    await typeInto(el, '14:');

    expect(read(el).inputValue).toBe('14:');
    expect(activeFlags(el)).toEqual(['badInput']);
    expect(internalsFor(el).formValue).toBe('');
    expect(pickerProblems(el, c, { visible: '14:', canonical: '' })).toEqual([]);
  });

  it('typing, picking and clearing each emit their documented events', async () => {
    const c = picker({ defaultValue: '00:00', step: 15, clearable: true, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change', 'timepicker-clear']);

    await typeInto(el, '14:15');
    await clickOption(el, 'minutes', '45');
    el.clear();
    await (el as any).rendered;

    expect(events.types()).toEqual([
      'time-change', 'time-change', 'timepicker-clear', 'time-change',
    ]);
    expect(internalsFor(el).formValue).toBe('');
  });

  it('reset restores the default without announcing a user change', async () => {
    const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change', 'timepicker-clear']);

    await typeInto(el, '11:45');
    events.events.length = 0;
    el.formResetCallback();
    await (el as any).rendered;

    expect(el.value).toBe('09:00');
    expect(events.types()).toEqual([]);
    expect(pickerProblems(el, c)).toEqual([]);
  });
});
