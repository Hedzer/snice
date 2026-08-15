/**
 * Smoke slice of the snice-textarea matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * textarea matrix runs only via `npm run test:matrix`. This file deliberately
 * lives at `smoke.test.ts` so it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · presentation — the loudest axis combination still renders a whole control
 *                    with a bound label and a resolving description;
 *   · states       — `loading` bars interaction and shows the spinner;
 *   · value        — pristine follows the default, a customer edit dirties it,
 *                    and reset restores the latest default;
 *   · validation   — `required` fails empty and clears when filled, and a
 *                    programmatic over-length assignment manufactures no error;
 *   · events       — `input` then `change`, with the documented payloads;
 *   · form         — explicit `form="id"` ownership and label association.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`expectTextareaMatches` in matrix/textarea/textarea-support.ts) so this file
 * cannot drift into asserting something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  LABEL,
  combo, makeTextarea, expectTextareaMatches, readFacts, nativeTextarea,
  collectEvents, typeInto, commit, removeComponent, wait,
} from './textarea-support';

describe('textarea matrix smoke', () => {
  let el: any;
  afterEach(() => { document.body.innerHTML = ''; el = null; });

  it('presentation: the loudest axis combination renders a whole control', async () => {
    const c = combo({
      variant: 'underlined', size: 'large', resize: 'both',
      labelled: true, placeholder: true, support: 'error',
    });
    el = await makeTextarea(c);
    expectTextareaMatches(el, c);

    const facts = readFacts(el);
    expect(facts.labelBound, 'the label points at the real textarea').toBe(true);
    expect(facts.describedByResolves, 'the description id resolves').toBe(true);
  });

  it('states: loading bars interaction and shows the spinner', async () => {
    const c = combo({ loading: true });
    el = await makeTextarea(c);
    expectTextareaMatches(el, c);

    expect(readFacts(el).hasSpinner).toBe(true);
    expect(nativeTextarea(el).disabled, 'loading is inert and barred').toBe(true);
  });

  it('value: pristine follows the default, a customer edit dirties it, reset restores', async () => {
    el = await makeTextarea(combo(), { value: 'authored' });
    expect(el.value).toBe('authored');

    el.defaultValue = 'second';
    await wait(30);
    expect(el.value, 'pristine follows default mutations').toBe('second');

    typeInto(el, 'customer text');
    await wait(30);
    el.defaultValue = 'third';
    await wait(30);
    expect(el.value, 'a dirty control ignores the default').toBe('customer text');

    el.formResetCallback();
    await wait(30);
    expect(el.value, 'reset restores the LATEST default').toBe('third');
  });

  it('validation: required fails empty, and assignment manufactures no length error', async () => {
    el = await makeTextarea(combo({ required: true }));
    expect(el.checkValidity()).toBe(false);
    expect(readFacts(el).ariaInvalid).toBe('true');

    typeInto(el, 'filled');
    await wait(30);
    expect(el.checkValidity()).toBe(true);
    removeComponent(el);

    el = await makeTextarea(combo({ maxlength: 3 }));
    el.value = 'far too long';
    await wait(30);
    expect(readFacts(el).ariaInvalid,
      'programmatic assignment does not manufacture length errors').toBe('false');

    typeInto(el, 'also far too long');
    await wait(30);
    expect(readFacts(el).ariaInvalid, 'customer editing does').toBe('true');
  });

  it('events: input then change, with the documented payloads', async () => {
    el = await makeTextarea(combo());
    const seen = collectEvents(el);

    typeInto(el, 'draft');
    commit(el);
    await wait(20);

    expect(seen.map(e => e.type)).toEqual(['textarea-input', 'textarea-change']);
    expect(seen[0].detail).toEqual({ value: 'draft', textarea: el });
  });

  it('form: explicit form="id" ownership and label association', async () => {
    const owner = document.createElement('form');
    owner.id = 'owner';
    document.body.appendChild(owner);

    el = await makeTextarea(combo({ labelled: true }), { name: 'comment', form: 'owner' });
    await wait(30);

    expect(el.form).toBe(owner);
    expect(nativeTextarea(el).getAttribute('aria-label')).toBe(LABEL);
  });
});
