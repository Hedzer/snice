/**
 * Matrix slice INPUT / VALUE — the documented dirty-value lifecycle.
 *
 * Dimensions (docs/ai/components/input.md "Value and form lifecycle"):
 *   pristine default mutation x 3 dirtying routes        9
 *   reset / restore                                      5
 *   clear()                                              4
 *                                                      ────
 *                                                       18 combos
 *
 * Documented contract under test, quoted:
 *   · "`value` is live; `defaultValue` reflects the `value` attribute."
 *   · "A default mutation updates live state only while pristine. Typing,
 *     clear, browser restore, or any `value` assignment (including the same
 *     value) dirties it."
 *   · "`form.reset()` silently restores the current default. Restore/reset emit
 *     no native or component value events."
 *   · "Reconnect/form moves retain both states."
 *
 * ── Environment boundary ────────────────────────────────────────────────────
 *
 * happy-dom implements no `attachInternals()`, so a form-associated custom
 * element never joins `form.elements` and `form.reset()` never reaches the
 * control here. The reset CONTRACT is therefore driven through
 * `formResetCallback` — the exact entry point the platform itself calls — and
 * the end-to-end `form.reset()` path is asserted in a real browser by
 * tests/live/matrix/input. Same for `formStateRestoreCallback`.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  collectEvents, combo, makeForm, makeInput, nativeInput, pressPart, typeInto, wait,
} from './input-support';

afterEach(() => { document.body.innerHTML = ''; });

/** The three documented ways a value becomes dirty. */
const DIRTY_ROUTES = ['typing', 'assignment', 'clear'] as const;
type DirtyRoute = typeof DIRTY_ROUTES[number];

async function dirty(el: any, route: DirtyRoute): Promise<void> {
  if (route === 'typing') typeInto(el, 'typed');
  else if (route === 'assignment') el.value = 'assigned';
  else { el.clearable = true; await wait(30); el.clear(); }
  await wait(30);
}

describe('input matrix: the authored default', () => {
  it('the value attribute is the default, and the live value starts there', async () => {
    const el = await makeInput(combo(), { value: 'authored' });
    expect(el.defaultValue, 'defaultValue does not reflect the value attribute').toBe('authored');
    expect(el.value, 'the live value did not start at the default').toBe('authored');
    expect(nativeInput(el).value, 'the native input does not carry the value').toBe('authored');
  });

  it('a control with no value attribute starts empty', async () => {
    const el = await makeInput(combo());
    expect(el.defaultValue).toBe('');
    expect(el.value).toBe('');
  });

  for (const route of DIRTY_ROUTES) {
    it(`a pristine default mutation lands; after ${route} it does not`, async () => {
      const el = await makeInput(combo(), { value: 'first' });

      // PRISTINE: moving the default moves the live value with it.
      el.defaultValue = 'second';
      await wait(30);
      expect(el.value, `a pristine default mutation did not reach the live value`).toBe('second');

      await dirty(el, route);
      const live = el.value;

      // DIRTY: the default may move, the live value may not follow.
      el.defaultValue = 'third';
      await wait(30);
      expect(el.defaultValue, 'the default did not move').toBe('third');
      expect(el.value, `${route} did not dirty the value — the default overwrote it`).toBe(live);
    });
  }

  it('assigning the SAME value still dirties the control', async () => {
    const el = await makeInput(combo(), { value: 'same' });

    // Documented: "any `value` assignment (INCLUDING THE SAME VALUE) dirties it".
    el.value = 'same';
    await wait(30);

    el.defaultValue = 'moved';
    await wait(30);
    expect(el.value, 'a same-value assignment left the control pristine').toBe('same');
  });
});

describe('input matrix: reset and restore', () => {
  it('a reset restores the current default', async () => {
    const el = await makeInput(combo(), { value: 'authored', name: 'field' });
    makeForm(el);
    await wait(30);

    typeInto(el, 'typed');
    await wait(30);
    expect(el.value).toBe('typed');

    el.formResetCallback();
    await wait(30);
    expect(el.value, 'reset did not restore the default').toBe('authored');
  });

  it('a reset restores the CURRENT default, not the authored one', async () => {
    const el = await makeInput(combo(), { value: 'authored', name: 'field' });
    makeForm(el);
    await wait(30);

    typeInto(el, 'typed');
    el.defaultValue = 'newer';
    await wait(30);

    el.formResetCallback();
    await wait(30);
    expect(el.value, 'reset restored a stale default').toBe('newer');
  });

  it('a reset makes the control pristine again', async () => {
    const el = await makeInput(combo(), { value: 'authored', name: 'field' });
    makeForm(el);
    await wait(30);
    typeInto(el, 'typed');
    await wait(30);

    el.formResetCallback();
    await wait(30);

    // A reset clears the dirty flag, so a later default mutation lands again.
    el.defaultValue = 'moved';
    await wait(30);
    expect(el.value, 'the control was still dirty after a reset').toBe('moved');
  });

  it('reset emits no value events', async () => {
    const el = await makeInput(combo(), { value: 'authored', name: 'field' });
    makeForm(el);
    await wait(30);
    typeInto(el, 'typed');
    await wait(30);

    const seen = collectEvents(el);
    const native: string[] = [];
    for (const type of ['input', 'change']) {
      el.addEventListener(type, () => native.push(type));
    }

    el.formResetCallback();
    await wait(30);

    // Documented: "Restore/reset emit no native or component value events."
    expect(seen.map(s => s.type), 'reset announced a value change').toEqual([]);
    expect(native, 'reset fired a native value event').toEqual([]);
  });

  it('a browser restore dirties the control and emits nothing', async () => {
    const el = await makeInput(combo(), { value: 'authored', name: 'field' });
    makeForm(el);
    await wait(30);

    const seen = collectEvents(el);
    el.formStateRestoreCallback('restored');
    await wait(30);

    expect(el.value, 'the restored state did not reach the live value').toBe('restored');
    expect(seen.map(s => s.type), 'restore announced a value change').toEqual([]);

    // …and the restore dirtied it, so a default mutation no longer follows.
    el.defaultValue = 'moved';
    await wait(30);
    expect(el.value, 'a restore left the control pristine').toBe('restored');
  });

  it('a reconnect retains both the live value and the default', async () => {
    const el = await makeInput(combo(), { value: 'authored' });
    typeInto(el, 'typed');
    await wait(30);

    const parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.appendChild(el);
    await wait(30);

    expect(el.value, 'the live value did not survive the move').toBe('typed');
    expect(el.defaultValue, 'the default did not survive the move').toBe('authored');
  });
});

describe('input matrix: clear()', () => {
  it('clear() empties the value and announces it', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'authored' });
    const seen = collectEvents(el);

    el.clear();
    await wait(30);

    expect(el.value, 'clear() left a value behind').toBe('');
    expect(nativeInput(el).value, 'clear() left the native input populated').toBe('');
    // Documented: `input-clear` → `{ input }` — cleared.
    expect(seen.filter(s => s.type === 'input-clear').length, 'clear() emitted no input-clear')
      .toBe(1);
    expect(seen.find(s => s.type === 'input-clear')?.detail?.input,
      'input-clear does not carry the input').toBe(el);
  });

  it('the clear control clears the value', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'authored' });
    const seen = collectEvents(el);

    pressPart(el, 'clear');
    await wait(30);

    expect(el.value, 'the clear control left a value behind').toBe('');
    expect(seen.filter(s => s.type === 'input-clear').length).toBe(1);
  });

  it('clear() dirties the control', async () => {
    const el = await makeInput(combo({ clearable: true }), { value: 'authored' });
    el.clear();
    await wait(30);

    el.defaultValue = 'moved';
    await wait(30);
    expect(el.value, 'clear() left the control pristine').toBe('');
  });

  it('a cleared required control reports valueMissing again', async () => {
    const el = await makeInput(combo({ clearable: true, required: true }), { value: 'authored' });
    expect(el.validity.valueMissing, 'a populated required control reports valueMissing').toBe(false);

    el.clear();
    await wait(30);
    expect(el.validity.valueMissing, 'clearing did not restore the required constraint').toBe(true);
  });
});
