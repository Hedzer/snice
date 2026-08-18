/**
 * Matrix slice TEXTAREA / VALIDATION — the documented constraint contract.
 *
 * Dimensions: constraint kind (required / minlength / maxlength / custom) x the
 * value states around each constraint's boundary x the ROUTE the value arrived
 * by (customer editing vs programmatic assignment) — ~34 combos. The route axis
 * is not decoration: the docs single it out, and it is the only axis that
 * separates "the customer typed too much" from "the app assigned too much".
 *
 * Documented contract under test (docs/ai/components/textarea.md
 * "Form and validation contract"):
 *   · "`required` maps to `valueMissing`."
 *   · "`minlength`/`maxlength` map to `tooShort`/`tooLong` ONLY AFTER CUSTOMER
 *     EDITING, matching native textarea behavior; programmatic assignment does
 *     not manufacture length errors."
 *   · "Dynamic values and constraints clear or replace validity immediately."
 *   · "`setCustomValidity(message)` controls `customError`; pass `''` to clear
 *     it."
 *   · "Calculated errors drive styling, `aria-invalid`, form reporting, and
 *     submission blocking."
 *
 * ── Which observable carries which claim ────────────────────────────────────
 *
 * happy-dom has no `attachInternals()`, so `element.validity` falls through to
 * the NATIVE textarea, which computes `tooLong`/`tooShort` from the DOM state
 * alone and knows nothing about the customer-editing gate. Reading it would be
 * reading the environment. The gate is a decision the COMPONENT makes, and it
 * makes it visible through `aria-invalid` (documented: "aria-invalid reflects
 * authored or calculated invalid state"), so that is what the length combos
 * assert. The ElementInternals surface itself is asserted in a real browser by
 * tests/live/matrix/textarea.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, makeTextarea, readFacts, typeInto, nativeTextarea,
  removeComponent, wait,
} from './textarea-support';

describe('textarea matrix: required maps to valueMissing', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  const CASES: Array<[string, string, boolean]> = [
    ['empty', '', false],
    ['whitespace only', '   ', true],
    ['filled', 'something', true],
    ['multi-line', 'a\nb', true],
  ];

  for (const [name, value, valid] of CASES) {
    it(`required + ${name}: ${valid ? 'satisfies' : 'fails'} the constraint`, async () => {
      el = await makeTextarea(combo({ required: true }));
      if (value) typeInto(el, value);
      await wait(30);

      expect(el.checkValidity()).toBe(valid);
      expect(readFacts(el).ariaInvalid).toBe(String(!valid));
    });
  }

  it('clearing a required control re-raises the error immediately', async () => {
    el = await makeTextarea(combo({ required: true }));
    typeInto(el, 'filled');
    await wait(30);
    expect(el.checkValidity()).toBe(true);

    typeInto(el, '');
    await wait(30);
    expect(el.checkValidity(), 'dynamic values clear or replace validity immediately')
      .toBe(false);
    expect(readFacts(el).ariaInvalid).toBe('true');
  });

  it('turning required on and off replaces validity immediately', async () => {
    el = await makeTextarea(combo());
    expect(el.checkValidity()).toBe(true);

    el.required = true;
    await wait(30);
    expect(el.checkValidity(), 'a new constraint applies at once').toBe(false);

    el.required = false;
    await wait(30);
    expect(el.checkValidity(), 'a removed constraint clears at once').toBe(true);
    expect(readFacts(el).ariaInvalid).toBe('false');
  });
});

describe('textarea matrix: length constraints need customer editing', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  const MAX = 5;
  const MAX_CASES: Array<[string, string, boolean]> = [
    ['under', 'abc', false],
    ['exactly at the limit', 'abcde', false],
    ['over', 'abcdefgh', true],
  ];

  for (const [name, value, overLimit] of MAX_CASES) {
    it(`maxlength=${MAX} / customer typed ${name}: ${overLimit ? 'errors' : 'clean'}`, async () => {
      el = await makeTextarea(combo({ maxlength: MAX }));
      typeInto(el, value);
      await wait(30);

      expect(readFacts(el).ariaInvalid,
        'customer editing past maxlength maps to tooLong').toBe(String(overLimit));
    });

    it(`maxlength=${MAX} / programmatically assigned ${name}: never errors`, async () => {
      el = await makeTextarea(combo({ maxlength: MAX }));
      el.value = value;
      await wait(30);

      expect(readFacts(el).ariaInvalid,
        'programmatic assignment does not manufacture length errors').toBe('false');
    });
  }

  const MIN = 4;
  const MIN_CASES: Array<[string, string, boolean]> = [
    // The docs match native behaviour, and a native control does not report
    // tooShort for an EMPTY value — that is `valueMissing`'s job.
    ['empty', '', false],
    ['under', 'ab', true],
    ['exactly at the limit', 'abcd', false],
    ['over', 'abcdef', false],
  ];

  for (const [name, value, underLimit] of MIN_CASES) {
    it(`minlength=${MIN} / customer typed ${name}: ${underLimit ? 'errors' : 'clean'}`, async () => {
      el = await makeTextarea(combo(), { minlength: String(MIN) });
      typeInto(el, value);
      await wait(30);

      expect(readFacts(el).ariaInvalid,
        'customer editing below minlength maps to tooShort').toBe(String(underLimit));
    });

    it(`minlength=${MIN} / programmatically assigned ${name}: never errors`, async () => {
      el = await makeTextarea(combo(), { minlength: String(MIN) });
      el.value = value;
      await wait(30);

      expect(readFacts(el).ariaInvalid,
        'programmatic assignment does not manufacture length errors').toBe('false');
    });
  }

  it('a positive maxlength reaches the native control and shows the character count', async () => {
    el = await makeTextarea(combo({ maxlength: MAX }));
    expect(readFacts(el).maxlength).toBe(MAX);
    expect(readFacts(el).charCount).toBe(`0 / ${MAX}`);

    typeInto(el, 'abc');
    await wait(30);
    expect(readFacts(el).charCount).toBe(`3 / ${MAX}`);
  });

  it('the default maxlength of -1 sets no limit and no counter', async () => {
    el = await makeTextarea(combo());
    expect(readFacts(el).maxlength, 'no maxlength attribute on the native control').toBe(null);
    expect(readFacts(el).charCount, 'and no character count').toBe(null);
  });

  it('removing maxlength clears the constraint immediately', async () => {
    el = await makeTextarea(combo({ maxlength: MAX }));
    typeInto(el, 'abcdefgh');
    await wait(30);
    expect(readFacts(el).ariaInvalid).toBe('true');

    el.maxlength = -1;
    await wait(30);
    expect(readFacts(el).ariaInvalid, 'a removed constraint clears at once').toBe('false');
  });

  /**
   * MATRIX-textarea-1 (fixed) — the render binding used to commit
   * `maxlength=${this.maxlength > 0 ? this.maxlength : null}` and null wrote
   * `maxlength=""`. It now binds the framework's `nothing` sentinel, which
   * removes the attribute, so returning to -1 reaches the same documented
   * "no limit" state a fresh mount shows.
   */
  it(
    'MATRIX-textarea-1 (fixed): returning maxlength to -1 removes maxlength from the native control',
    async () => {
      el = await makeTextarea(combo({ maxlength: MAX }));
      el.maxlength = -1;
      await wait(30);

      const native = nativeTextarea(el);
      expect(native.hasAttribute('maxlength'),
        'no limit means no maxlength attribute').toBe(false);
      expect(native.maxLength,
        'and the platform default for "no limit", not NaN').toBe(-1);
    },
  );
});

describe('textarea matrix: setCustomValidity controls customError', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const message of ['Not allowed', 'Something else entirely']) {
    it(`setCustomValidity(${JSON.stringify(message)}) invalidates and reports the message`, async () => {
      el = await makeTextarea(combo());
      el.setCustomValidity(message);
      await wait(30);

      expect(el.checkValidity()).toBe(false);
      expect(el.validationMessage).toBe(message);
      expect(readFacts(el).ariaInvalid).toBe('true');
    });
  }

  it('setCustomValidity("") clears it', async () => {
    el = await makeTextarea(combo());
    el.setCustomValidity('Not allowed');
    await wait(30);
    el.setCustomValidity('');
    await wait(30);

    expect(el.checkValidity()).toBe(true);
    expect(el.validationMessage).toBe('');
    expect(readFacts(el).ariaInvalid).toBe('false');
  });

  it('a custom error stacks with required rather than replacing it', async () => {
    el = await makeTextarea(combo({ required: true }));
    el.setCustomValidity('Custom problem');
    await wait(30);
    expect(el.checkValidity()).toBe(false);

    typeInto(el, 'filled');
    await wait(30);
    expect(el.checkValidity(), 'the custom error outlives the satisfied required rule')
      .toBe(false);

    el.setCustomValidity('');
    await wait(30);
    expect(el.checkValidity(), 'and clearing it leaves a valid control').toBe(true);
  });

  it('reportValidity agrees with checkValidity', async () => {
    el = await makeTextarea(combo({ required: true }));
    expect(el.reportValidity()).toBe(false);

    typeInto(el, 'filled');
    await wait(30);
    expect(el.reportValidity()).toBe(true);
  });
});

describe('textarea matrix: barred states suppress calculated errors', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const flag of ['disabled', 'readonly', 'loading'] as const) {
    it(`${flag} + required: no calculated error`, async () => {
      el = await makeTextarea(combo({ [flag]: true, required: true } as any));
      expect(el.checkValidity()).toBe(true);
      expect(readFacts(el).ariaInvalid).toBe('false');
    });

    it(`${flag} + a custom error: still barred`, async () => {
      el = await makeTextarea(combo({ [flag]: true } as any));
      el.setCustomValidity('Custom problem');
      await wait(30);

      expect(el.checkValidity(),
        `docs: a ${flag} control is barred from constraint validation`).toBe(true);
    });

    it(`${flag} cleared: the suppressed error appears`, async () => {
      el = await makeTextarea(combo({ [flag]: true, required: true } as any));
      expect(el.checkValidity()).toBe(true);

      el[flag] = false;
      await wait(30);

      expect(el.checkValidity(), 'un-barring re-applies the constraint at once').toBe(false);
      expect(readFacts(el).ariaInvalid).toBe('true');
    });
  }
});
