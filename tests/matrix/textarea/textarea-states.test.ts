/**
 * Matrix slice TEXTAREA / STATES — all 2^5 vectors of the documented state
 * switches: `disabled`, `readonly`, `loading`, `required`, `invalid`.
 *
 * Dimensions: 32 combos. The full power set is the right size here (rather than
 * a rotation) because these five switches INTERACT — `loading` and `disabled`
 * both bar interaction by different routes, `readonly` bars validation while
 * staying successful, and `invalid` is presentation-only and must not be
 * cancelled by any of the others. A rotation would leave exactly those
 * interactions untested.
 *
 * Documented contract under test (docs/ai/components/textarea.md):
 *   · "Enabled + non-empty `name` contributes the exact live value. Disabled
 *     controls are omitted. `readonly` remains successful but is barred.
 *     `loading` is inert and barred while preserving the successful value."
 *   · "`required` maps to `valueMissing`."
 *   · "Calculated errors drive styling, `aria-invalid`, form reporting, and
 *     submission blocking. `invalid`/`errorText` are presentation only."
 *   · CSS part `spinner` — "Loading spinner".
 *
 * ── What this tier CANNOT judge ─────────────────────────────────────────────
 *
 * happy-dom implements no `attachInternals()` at all, and does not bar a
 * disabled/readonly control's `validity.valueMissing` the way the platform
 * does. So `willValidate` and the raw `validity` flags read the environment
 * rather than the component here, and asserting them would be asserting
 * happy-dom. `checkValidity()` IS barred correctly, so the barring rule is
 * asserted through it; the ElementInternals surface itself is asserted in the
 * real browser by tests/live/matrix/textarea.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  STATE_FLAGS, calculatedInvalid,
  combo, comboId, makeTextarea, expectTextareaMatches, readFacts,
  nativeTextarea, typeInto, removeComponent, wait,
} from './textarea-support';

/** All 2^5 vectors over the documented state switches. */
function stateVectors(): Array<Record<typeof STATE_FLAGS[number], boolean>> {
  const out: Array<Record<string, boolean>> = [];
  for (let bits = 0; bits < (1 << STATE_FLAGS.length); bits++) {
    const vector: Record<string, boolean> = {};
    STATE_FLAGS.forEach((flag, i) => { vector[flag] = !!(bits & (1 << i)); });
    out.push(vector);
  }
  return out as Array<Record<typeof STATE_FLAGS[number], boolean>>;
}

describe('textarea matrix: state switch vectors', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const vector of stateVectors()) {
    const c = combo({ ...vector, labelled: true, support: 'helper' });

    it(`${comboId(c)}: renders the documented state`, async () => {
      el = await makeTextarea(c);
      expectTextareaMatches(el, c);
    });

    it(`${comboId(c)}: participates in validation only when not barred`, async () => {
      el = await makeTextarea(c);
      // "`required` maps to `valueMissing`", and "Disabled controls are
      // omitted / `readonly` remains successful but is barred / `loading` is
      // inert and barred" — so an empty required control fails ONLY when none
      // of the three barring states applies.
      expect(el.checkValidity(), 'checkValidity follows required + the barred rule')
        .toBe(!calculatedInvalid(c, ''));
      // The documented styling consequence of that same rule.
      expect(readFacts(el).ariaInvalid, 'aria-invalid reflects authored OR calculated invalid')
        .toBe(String(c.invalid || calculatedInvalid(c, '')));
    });
  }
});

describe('textarea matrix: barred states are inert', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const flag of ['disabled', 'loading'] as const) {
    it(`${flag} bars editing at the native control`, async () => {
      el = await makeTextarea(combo({ [flag]: true } as any));
      expect(nativeTextarea(el).disabled,
        `docs: ${flag === 'loading' ? '"loading is inert and barred"' : 'disabled controls are omitted'}`)
        .toBe(true);
    });
  }

  it('readonly stays enabled — it is successful, only barred from editing', async () => {
    el = await makeTextarea(combo({ readonly: true, required: true }));
    const native = nativeTextarea(el);

    expect(native.readOnly, 'the control is read-only').toBe(true);
    expect(native.disabled, 'a readonly control is still a successful control').toBe(false);
    // "readonly remains successful but is BARRED": an empty required readonly
    // control does not block anything.
    expect(el.checkValidity(), 'barred from constraint validation').toBe(true);
  });

  it('loading renders the documented spinner part, and only then', async () => {
    el = await makeTextarea(combo({ loading: true }));
    expect(readFacts(el).hasSpinner).toBe(true);

    el.loading = false;
    await wait(30);
    expect(readFacts(el).hasSpinner).toBe(false);
    expect(nativeTextarea(el).disabled, 'clearing loading re-enables the control').toBe(false);
  });
});

describe('textarea matrix: invalid is presentation, calculated invalid is truth', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('authored invalid styles the control without making it fail validation', async () => {
    el = await makeTextarea(combo({ invalid: true }));

    expect(readFacts(el).ariaInvalid, 'aria-invalid reflects the AUTHORED state').toBe('true');
    expect(readFacts(el).classes).toContain('textarea--invalid');
    expect(el.checkValidity(), 'presentation-only: the control is still valid').toBe(true);
  });

  it('a calculated error drives aria-invalid without `invalid` being set', async () => {
    el = await makeTextarea(combo({ required: true }));

    expect(el.checkValidity(), 'an empty required control fails').toBe(false);
    expect(readFacts(el).ariaInvalid).toBe('true');

    typeInto(el, 'now filled');
    await wait(30);

    expect(el.checkValidity(), 'filling it clears the error immediately').toBe(true);
    expect(readFacts(el).ariaInvalid).toBe('false');
    expect(readFacts(el).classes).not.toContain('textarea--invalid');
  });

  it('authored invalid survives a cleared calculated error', async () => {
    el = await makeTextarea(combo({ required: true, invalid: true }));
    typeInto(el, 'filled');
    await wait(30);

    expect(el.checkValidity(), 'the constraint is satisfied').toBe(true);
    expect(readFacts(el).ariaInvalid, 'the authored presentation state remains').toBe('true');
  });
});
