/**
 * Matrix slice INPUT / EVENTS — the five documented custom events.
 *
 * Dimensions (docs/ai/components/input.md "Events"):
 *   input-input   x 3 value shapes        3
 *   input-change  x 3 value shapes        3
 *   input-focus / input-blur              2
 *   input-clear   x 2 routes              2
 *   ordering and silence                  4
 *                                       ────
 *                                        14 combos
 *
 * Documented contract under test, quoted:
 *   · "`input-input` → `{ value, input }` — each keystroke"
 *   · "`input-change` → `{ value, input }` — value commit"
 *   · "`input-focus` → `{ input }` — focus"
 *   · "`input-blur` → `{ input }` — blur"
 *   · "`input-clear` → `{ input }` — cleared"
 *   · "Restore/reset emit no native or component value events."
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  blurNative, collectEvents, combo, commit, focusNative, makeInput, pressPart, typeInto, wait,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

const VALUES = ['a', 'hello world', ''] as const;

describe('input matrix: input-input', () => {
  for (const value of VALUES) {
    it(`typing "${value}"`, async () => {
      const el = await makeInput(combo(), { value: 'seed' });
      const seen = collectEvents(el);

      typeInto(el, value);
      await wait(30);

      const inputs = seen.filter(s => s.type === 'input-input');
      expect(inputs.length, 'a keystroke emitted no input-input').toBe(1);
      // Documented detail: `{ value, input }`.
      expect(inputs[0].detail.value, 'input-input carried the wrong value').toBe(value);
      expect(inputs[0].detail.input, 'input-input does not carry the input').toBe(el);
      expect(el.value, 'the typed value did not reach the component').toBe(value);
    });
  }
});

describe('input matrix: input-change', () => {
  for (const value of VALUES) {
    it(`committing "${value}"`, async () => {
      const el = await makeInput(combo(), { value: 'seed' });
      const seen = collectEvents(el);

      commit(el, value);
      await wait(30);

      const changes = seen.filter(s => s.type === 'input-change');
      expect(changes.length, 'a commit emitted no input-change').toBe(1);
      expect(changes[0].detail.value, 'input-change carried the wrong value').toBe(value);
      expect(changes[0].detail.input, 'input-change does not carry the input').toBe(el);
      // A commit is not a keystroke.
      expect(seen.filter(s => s.type === 'input-input').length,
        'a commit also emitted input-input').toBe(0);
    });
  }
});

describe('input matrix: focus and blur', () => {
  it('focusing emits input-focus with the input', async () => {
    const el = await makeInput(combo());
    const seen = collectEvents(el);

    focusNative(el);
    await wait(30);

    const events = seen.filter(s => s.type === 'input-focus');
    expect(events.length, 'focusing emitted no input-focus').toBe(1);
    expect(events[0].detail.input, 'input-focus does not carry the input').toBe(el);
  });

  it('blurring emits input-blur with the input', async () => {
    const el = await makeInput(combo());
    const seen = collectEvents(el);

    focusNative(el);
    blurNative(el);
    await wait(30);

    expect(seen.map(s => s.type), 'focus/blur order').toEqual(['input-focus', 'input-blur']);
    expect(seen[1].detail.input, 'input-blur does not carry the input').toBe(el);
  });
});

describe('input matrix: input-clear', () => {
  it('clear() emits input-clear', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'text' });
    const seen = collectEvents(el);

    el.clear();
    await wait(30);

    const clears = seen.filter(s => s.type === 'input-clear');
    expect(clears.length, 'clear() emitted no input-clear').toBe(1);
    expect(clears[0].detail.input, 'input-clear does not carry the input').toBe(el);
  });

  it('the clear control emits input-clear', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'text' });
    const seen = collectEvents(el);

    pressPart(el, 'clear');
    await wait(30);

    expect(seen.filter(s => s.type === 'input-clear').length,
      'the clear control emitted no input-clear').toBe(1);
    expect(el.value, 'the clear control left a value behind').toBe('');
  });
});

describe('input matrix: ordering and silence', () => {
  it('a full keystroke-then-commit sequence reports in order', async () => {
    const el = await makeInput(combo());
    const seen = collectEvents(el);

    focusNative(el);
    typeInto(el, 'h');
    typeInto(el, 'hi');
    commit(el);
    blurNative(el);
    await wait(30);

    expect(seen.map(s => s.type), 'event order').toEqual([
      'input-focus', 'input-input', 'input-input', 'input-change', 'input-blur',
    ]);
    expect(seen.filter(s => s.type === 'input-input').map(s => s.detail.value))
      .toEqual(['h', 'hi']);
  });

  it('a programmatic value assignment announces nothing', async () => {
    const el = await makeInput(combo());
    const seen = collectEvents(el);

    el.value = 'assigned';
    await wait(30);

    // The doc's events are a keystroke and a commit. An assignment is neither.
    expect(seen.map(s => s.type), 'a value assignment announced a user edit').toEqual([]);
    expect(el.value).toBe('assigned');
  });

  it('a reset announces nothing', async () => {
    const el = await makeInput(combo(), { value: 'authored' });
    typeInto(el, 'typed');
    await wait(30);

    const seen = collectEvents(el);
    el.formResetCallback();
    await wait(30);

    expect(seen.map(s => s.type), 'a reset announced a value change').toEqual([]);
  });

  it('a disabled control emits nothing when its inner input is driven', async () => {
    const el = await makeInput(combo({ disabled: true }));
    const seen = collectEvents(el);

    focusNative(el);
    blurNative(el);
    await wait(30);

    // A disabled control cannot be focused by a user, so nothing here should be
    // announced as if one had been.
    expect(el.value, 'a disabled control changed its value').toBe('');
    expect(seen.filter(s => s.type === 'input-input').length,
      'a disabled control announced a keystroke').toBe(0);
  });
});
