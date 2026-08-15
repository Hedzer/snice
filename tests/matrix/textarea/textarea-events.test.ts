/**
 * Matrix slice TEXTAREA / EVENTS — the four documented events, their payloads,
 * and their order.
 *
 * Dimensions: 4 events x the state vectors that may not suppress them
 * (plain / readonly / required / invalid) plus the ordering and auto-grow
 * paths — 20 combos. Order is part of the contract a consumer writes against
 * (`input` before `change`), so the recorder keeps ONE ordered list rather than
 * per-type counters.
 *
 * Documented contract under test (docs/ai/components/textarea.md "Events"):
 *   · `textarea-input`  -> `{ value, textarea }` — On input
 *   · `textarea-change` -> `{ value, textarea }` — On change
 *   · `textarea-focus`  -> `{ textarea }`        — On focus
 *   · `textarea-blur`   -> `{ textarea }`        — On blur
 * plus `autoGrow` ("auto-grow"), which the docs describe as a rendering
 * behaviour of the same input path.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, makeTextarea, collectEvents, typeInto, commit,
  focusNative, blurNative, nativeTextarea, removeComponent, wait,
} from './textarea-support';

/** The state vectors that must NOT suppress an event from the inner control. */
const LIVE_STATES = [
  ['plain', {}],
  ['readonly', { readonly: true }],
  ['required', { required: true }],
  ['invalid', { invalid: true }],
] as const;

describe('textarea matrix: input and change', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const [name, patch] of LIVE_STATES) {
    it(`${name}: textarea-input carries { value, textarea }`, async () => {
      el = await makeTextarea(combo(patch as any));
      const seen = collectEvents(el);

      typeInto(el, 'hello');
      await wait(20);

      expect(seen.map(e => e.type)).toEqual(['textarea-input']);
      expect(seen[0].detail.value, 'the payload carries the NEW value').toBe('hello');
      expect(seen[0].detail.textarea, 'and the element itself').toBe(el);
    });

    it(`${name}: textarea-change carries { value, textarea }`, async () => {
      el = await makeTextarea(combo(patch as any));
      const seen = collectEvents(el);

      commit(el, 'committed');
      await wait(20);

      expect(seen.map(e => e.type)).toEqual(['textarea-change']);
      expect(seen[0].detail.value).toBe('committed');
      expect(seen[0].detail.textarea).toBe(el);
    });
  }

  it('input fires before change for a single edit-then-commit', async () => {
    el = await makeTextarea(combo());
    const seen = collectEvents(el);

    typeInto(el, 'draft');
    commit(el);
    await wait(20);

    expect(seen.map(e => e.type)).toEqual(['textarea-input', 'textarea-change']);
    expect(seen.map(e => e.detail.value)).toEqual(['draft', 'draft']);
  });

  it('every keystroke emits its own input event with the value at that moment', async () => {
    el = await makeTextarea(combo());
    const seen = collectEvents(el, ['textarea-input']);

    for (const value of ['a', 'ab', 'abc']) typeInto(el, value);
    await wait(20);

    expect(seen.map(e => e.detail.value)).toEqual(['a', 'ab', 'abc']);
  });

  it('a programmatic value assignment is NOT an input event', async () => {
    el = await makeTextarea(combo());
    const seen = collectEvents(el);

    el.value = 'assigned';
    await wait(30);

    expect(seen, 'only customer editing reports input/change').toEqual([]);
    expect(el.value).toBe('assigned');
  });
});

describe('textarea matrix: focus and blur', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const [name, patch] of LIVE_STATES) {
    it(`${name}: focus and blur report the element`, async () => {
      el = await makeTextarea(combo(patch as any));
      const seen = collectEvents(el);

      focusNative(el);
      blurNative(el);
      await wait(20);

      expect(seen.map(e => e.type)).toEqual(['textarea-focus', 'textarea-blur']);
      expect(seen[0].detail).toEqual({ textarea: el });
      expect(seen[1].detail).toEqual({ textarea: el });
    });
  }

  it('the public focus()/blur()/select() methods reach the inner control', async () => {
    el = await makeTextarea(combo(), { value: 'selectable' });
    const native = nativeTextarea(el);

    expect(() => { el.focus(); el.select(); el.blur(); },
      'the documented methods never throw on a mounted control').not.toThrow();
    expect(native.value).toBe('selectable');
  });
});

describe('textarea matrix: auto-grow', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('auto-grow sizes the control from its content on input', async () => {
    el = await makeTextarea(combo(), { 'auto-grow': '' });
    expect(el.autoGrow, 'the documented attribute name is auto-grow').toBe(true);

    typeInto(el, 'one\ntwo\nthree\nfour\nfive');
    await wait(30);

    // happy-dom reports no scrollHeight, so the OBSERVABLE claim here is that
    // the growth path ran and wrote an explicit height — the painted size is
    // the visual tier's job (tests/live/matrix/textarea).
    expect(nativeTextarea(el).style.height, 'auto-grow sets an explicit height')
      .not.toBe('');
  });

  it('without auto-grow the control keeps its authored rows and no inline height', async () => {
    el = await makeTextarea(combo({ rows: 6 }));
    typeInto(el, 'one\ntwo\nthree\nfour\nfive');
    await wait(30);

    expect(nativeTextarea(el).getAttribute('rows')).toBe('6');
    expect(nativeTextarea(el).style.height, 'nothing overrides the rows sizing').toBe('');
  });

  it('turning auto-grow on later still sizes the control', async () => {
    el = await makeTextarea(combo());
    typeInto(el, 'one\ntwo\nthree');
    await wait(30);
    expect(nativeTextarea(el).style.height).toBe('');

    el.autoGrow = true;
    await wait(30);
    expect(nativeTextarea(el).style.height).not.toBe('');
  });
});
