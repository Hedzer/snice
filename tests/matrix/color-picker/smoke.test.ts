/**
 * Smoke slice of the snice-color-picker matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/color-picker/, ~320 combos) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file
 * lives at `smoke.test.ts` so it stays collected, and it routes every assertion
 * through the matrix's own oracle so it cannot claim something the full suite
 * does not.
 *
 * The marquee combos: the documented default, the three accepted notations, the
 * three display formats, malformed text, a preset choice, and `required`.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkDescription, checkInvalidPresentation, checkLoading,
  checkPresets, checkStructure, checkValidity, checkValue, click, formatted, hslToHex,
  mountPicker, presetSwatches, rgbToHex, typeValue, wait, SETTLE, shownValue, type Vector,
} from './color-picker-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const PRESETS = ['#000000', '#ffffff', '#f87171', '#3b82f6'];

describe('color-picker matrix smoke', () => {
  it('<snice-color-picker> is a medium hex picker showing black', async () => {
    el = await mountPicker();
    const problems = new Problems();
    const vector = { ...DEFAULTS } as Vector;

    problems.equal((el as any).value, '#000000', 'default value');
    problems.equal((el as any).defaultValue, '#000000', 'default defaultValue');
    checkStructure(problems, el, vector);
    checkDescription(problems, el, vector);
    checkLoading(problems, el, vector);
    checkValue(problems, el, vector, { value: '#000000', canonical: '#000000' });
    checkValidity(problems, el, { valid: true });

    expectClean(problems, 'smoke/defaults');
  });

  it('all three documented notations canonicalize to six-digit hex', async () => {
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    const problems = new Problems();

    for (const [typed, canonical] of [
      ['#3b82f6', '#3b82f6'],
      ['rgb(59, 130, 246)', rgbToHex(59, 130, 246)!],
      ['hsl(217, 91%, 60%)', hslToHex(217, 91, 60)],
    ] as const) {
      el = await mountPicker(vector);
      await typeValue(el, typed);
      checkValue(problems, el, vector, { value: canonical, canonical });
      checkValidity(problems, el, { valid: true });
      el.remove();
      el = null;
    }

    expectClean(problems, 'smoke/notations');
  });

  it('format decides how the same colour is shown', async () => {
    const problems = new Problems();
    for (const format of ['hex', 'rgb', 'hsl'] as const) {
      el = await mountPicker({ format }, { value: '#3b82f6' });
      problems.equal(shownValue(el), formatted('#3b82f6', format),
        `the text shown for format="${format}"`);
      problems.equal((el as any).value, '#3b82f6', `the live value for format="${format}"`);
      el.remove();
      el = null;
    }
    expectClean(problems, 'smoke/format');
  });

  it('malformed text stays live and invalid, never silently black', async () => {
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    el = await mountPicker(vector);
    const problems = new Problems();

    await typeValue(el, 'not a colour');

    problems.equal((el as any).value, 'not a colour',
      'malformed text was replaced instead of kept live');
    checkValidity(problems, el, { valid: false });
    checkInvalidPresentation(problems, el, vector, true);

    await typeValue(el, '#3b82f6');
    checkValue(problems, el, vector, { value: '#3b82f6', canonical: '#3b82f6' });
    checkValidity(problems, el, { valid: true });
    checkInvalidPresentation(problems, el, vector, false);

    expectClean(problems, 'smoke/malformed');
  });

  it('clicking a preset chooses it and announces the change', async () => {
    const vector: Vector = { ...DEFAULTS, showPresets: true, name: 'colour' };
    el = await mountPicker(vector, { value: '#123456', presets: PRESETS });
    const changes = captureEvents<{ value: string; colorPicker: HTMLElement }>(
      el, 'color-picker-change');
    const problems = new Problems();

    click(presetSwatches(el)[2]);
    await wait(SETTLE);

    checkValue(problems, el, vector, { value: '#f87171', canonical: '#f87171' });
    checkPresets(problems, el, vector, PRESETS, '#f87171');
    if (problems.equal(changes.length, 1, 'color-picker-change events')) {
      problems.equal(changes[0].value, '#f87171', 'detail.value');
      problems.check(changes[0].colorPicker === el, 'detail.colorPicker');
    }

    expectClean(problems, 'smoke/preset');
  });

  it('an empty required value is missing; the default black is not', async () => {
    const vector: Vector = { ...DEFAULTS, required: true, name: 'colour' };
    const problems = new Problems();

    el = await mountPicker(vector);
    checkValidity(problems, el, { valid: true });
    el.remove();

    el = await mountPicker(vector, { value: '' });
    checkValidity(problems, el, { valid: false });
    checkInvalidPresentation(problems, el, vector, true);

    expectClean(problems, 'smoke/required');
  });

  it('a loading picker shows its spinner and refuses input', async () => {
    const vector: Vector = { ...DEFAULTS, loading: true, showPresets: true, name: 'colour' };
    el = await mountPicker(vector, { value: '#000000', presets: PRESETS });
    const changes = captureEvents(el, 'color-picker-change');
    const problems = new Problems();

    checkLoading(problems, el, vector);
    click(presetSwatches(el)[2]);
    await wait(SETTLE);

    problems.equal((el as any).value, '#000000', 'a loading picker accepted a preset');
    problems.equal(changes.length, 0, 'a loading picker emitted color-picker-change');
    problems.equal((el as any).willValidate, false, 'a loading picker still validates');

    expectClean(problems, 'smoke/loading');
  });

  it('setCustomValidity supplies an application error and clears on ""', async () => {
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    el = await mountPicker(vector, { value: '#3b82f6' });
    const problems = new Problems();

    (el as any).setCustomValidity('That colour fails contrast');
    await wait(SETTLE);
    checkValidity(problems, el, { valid: false, customError: true });
    checkInvalidPresentation(problems, el, vector, true);

    (el as any).setCustomValidity('');
    await wait(SETTLE);
    checkValidity(problems, el, { valid: true, customError: false });

    expectClean(problems, 'smoke/setCustomValidity');
  });
});
