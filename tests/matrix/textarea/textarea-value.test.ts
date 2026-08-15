/**
 * Matrix slice TEXTAREA / VALUE LIFECYCLE — the documented dirty-value contract.
 *
 * Dimensions: 4 authored defaults x 3 ways of dirtying the control = 12 combos
 * for the core rule, plus the reset / reconnect / move scenarios the docs call
 * out by name. The cross is over the DIRTYING ROUTE because that is the axis the
 * docs enumerate — "Input, browser restore, or any `value` assignment (even
 * unchanged) dirties it" — and a single-route test would let two of the three
 * regress unnoticed.
 *
 * Documented contract under test (docs/ai/components/textarea.md
 * "Value and form lifecycle"):
 *   · "`value` is live and `defaultValue`/the `value` attribute is authored
 *     reset state."
 *   · "Pristine live state follows default mutations. Input, browser restore,
 *     or any `value` assignment (even unchanged) dirties it."
 *   · "Reset restores the latest default silently and clears dirtiness.
 *     Repeated reset, reconnect, form moves, and disabled fieldsets preserve
 *     the native-style contract."
 *
 * happy-dom implements no form-associated custom elements, so a real
 * `form.reset()` never reaches the control here; the reset CONTRACT is driven
 * through `formResetCallback`, which is the exact entry point the platform
 * calls. That substitutes for the ENGINE, not for the component's logic — the
 * end-to-end `form.reset()` path is asserted in the real browser by
 * tests/live/matrix/textarea.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, makeTextarea, typeInto, commit, nativeTextarea,
  removeComponent, wait,
} from './textarea-support';

const DEFAULTS = ['', 'authored', 'multi\nline', '  spaced  '];

/** The three documented routes to a dirty control. */
const DIRTY_ROUTES = {
  input: (el: any) => typeInto(el, 'typed by a customer'),
  restore: (el: any) => el.formStateRestoreCallback('restored by the browser'),
  // "any `value` assignment (EVEN UNCHANGED)" — the assignment itself dirties.
  assignment: (el: any) => { el.value = el.value; },
} as const;

describe('textarea matrix: authored default is the reset state', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const authored of DEFAULTS) {
    it(`value="${JSON.stringify(authored)}": seeds the live value and the default`, async () => {
      el = await makeTextarea(combo(), { value: authored });

      expect(el.value, 'the authored attribute seeds the live value').toBe(authored);
      expect(el.defaultValue, 'and IS the reset default').toBe(authored);
      expect(nativeTextarea(el).value, 'and reaches the native control').toBe(authored);
    });
  }
});

describe('textarea matrix: pristine follows the default, dirty does not', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const authored of DEFAULTS) {
    for (const [route, dirty] of Object.entries(DIRTY_ROUTES)) {
      it(`default=${JSON.stringify(authored)} / dirtied by ${route}`, async () => {
        el = await makeTextarea(combo(), { value: authored });

        // Pristine: a default mutation flows straight through to the live value.
        el.defaultValue = 'second default';
        await wait(30);
        expect(el.value, 'pristine live state follows default mutations')
          .toBe('second default');

        dirty(el);
        await wait(30);
        const afterDirty = el.value;

        // Dirty: the same mutation must NOT overwrite what the customer has.
        el.defaultValue = 'third default';
        await wait(30);
        expect(el.value, `${route} dirtied the control, so the default no longer wins`)
          .toBe(afterDirty);
        expect(el.defaultValue, 'the default itself still updates').toBe('third default');
      });
    }
  }
});

describe('textarea matrix: reset', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const [route, dirty] of Object.entries(DIRTY_ROUTES)) {
    it(`reset after ${route} restores the LATEST default and clears dirtiness`, async () => {
      el = await makeTextarea(combo(), { value: 'first' });
      dirty(el);
      await wait(30);

      el.defaultValue = 'latest';
      await wait(30);
      el.formResetCallback();
      await wait(30);

      expect(el.value, 'reset restores the latest default, not the authored one')
        .toBe('latest');

      // Dirtiness cleared: the control follows defaults again.
      el.defaultValue = 'after reset';
      await wait(30);
      expect(el.value, 'reset cleared dirtiness').toBe('after reset');
    });
  }

  it('reset is silent — it emits none of the documented events', async () => {
    el = await makeTextarea(combo(), { value: 'first' });
    typeInto(el, 'edited');
    await wait(30);

    const seen: string[] = [];
    for (const type of ['textarea-input', 'textarea-change']) {
      el.addEventListener(type, () => seen.push(type));
    }
    el.formResetCallback();
    await wait(30);

    expect(el.value).toBe('first');
    expect(seen, 'a reset is not a customer edit').toEqual([]);
  });

  it('repeated reset is idempotent', async () => {
    el = await makeTextarea(combo(), { value: 'first' });
    typeInto(el, 'edited');
    await wait(30);

    el.formResetCallback();
    el.formResetCallback();
    el.formResetCallback();
    await wait(30);

    expect(el.value).toBe('first');
    expect(nativeTextarea(el).value).toBe('first');
  });
});

describe('textarea matrix: the live value survives DOM churn', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('reconnecting preserves the dirty value', async () => {
    el = await makeTextarea(combo(), { value: 'first' });
    typeInto(el, 'customer text');
    await wait(30);

    const parent = el.parentElement!;
    parent.removeChild(el);
    await wait(20);
    parent.appendChild(el);
    await wait(30);

    expect(el.value, 'a reconnect is not a reset').toBe('customer text');
    expect(nativeTextarea(el).value).toBe('customer text');

    // And dirtiness survives with it.
    el.defaultValue = 'new default';
    await wait(30);
    expect(el.value).toBe('customer text');
  });

  it('moving between forms preserves the dirty value', async () => {
    el = await makeTextarea(combo(), { value: 'first', name: 'comment' });
    typeInto(el, 'customer text');
    await wait(30);

    const formA = document.createElement('form');
    const formB = document.createElement('form');
    document.body.append(formA, formB);
    formA.appendChild(el);
    await wait(20);
    formB.appendChild(el);
    await wait(30);

    expect(el.value, 'a form move is not a reset').toBe('customer text');
  });

  it('a value assignment reaches the native control immediately', async () => {
    el = await makeTextarea(combo());
    el.value = 'assigned';
    await wait(30);

    expect(nativeTextarea(el).value).toBe('assigned');
    expect(el.value).toBe('assigned');
  });

  it('a committed change keeps the live value in step', async () => {
    el = await makeTextarea(combo(), { value: 'first' });
    commit(el, 'committed');
    await wait(30);

    expect(el.value).toBe('committed');
  });
});
