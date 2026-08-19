/**
 * Smoke slice of the snice-select matrix — the everyday-loop tier.
 *
 * `tests/matrix/**` is excluded from the default Vitest include except each
 * directory's `smoke.test.ts` (vitest.config.ts), so this file is the one
 * select matrix file the everyday `vitest run` still collects. The full
 * matrix runs only via `npm run test:matrix` (and once in the full gate).
 *
 * One combo per feature family, chosen so a family that breaks cannot hide:
 *   · structure — the doc's own Basic Usage select, and the children source;
 *   · state     — a disabled valued select;
 *   · value     — single label and multiple chips in the trigger;
 *   · clear     — the clear button's display contract;
 *   · marquee   — options assigned after ready still paint the authored
 *                 selection (the trigger re-sync the DOM tier cannot see
 *                 any other way — every array-source combo takes that path).
 *
 * Every assertion routes through the matrix's own oracle (select-support.ts),
 * so this file cannot drift into asserting something weaker than the suite
 * it stands in for.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, one, text } from '../matrix-utils';
import {
  combo, makeSelect, checkSelect, clearButton, partOf, expectNoProblems,
} from './select-support';

describe('select matrix smoke', () => {
  afterEach(() => unmountAll());

  it('structure: the documented Basic Usage select passes the full oracle', async () => {
    const c = combo({ label: 'Fruit', value: 'apple' });
    const el = await makeSelect(c);
    expectNoProblems(checkSelect(el, c), 'basic usage');
  });

  it('structure: the children source passes the full oracle', async () => {
    const c = combo({ source: 'children', label: 'Fruit', value: 'banana' });
    const el = await makeSelect(c);
    expectNoProblems(checkSelect(el, c), 'children source');
  });

  it('state: a disabled valued select passes the full oracle', async () => {
    const c = combo({ disabled: true, value: 'apple' });
    const el = await makeSelect(c);
    expectNoProblems(checkSelect(el, c), 'disabled valued');
  });

  it('value: a single selection paints its label in the trigger', async () => {
    const el = await makeSelect(combo({ value: 'cherry' }));
    const value = partOf(el, 'value');
    expect(value, 'no part="value"').not.toBeNull();
    expect(text(value!)).toContain('Cherry');
  });

  it('value: a multiple selection paints one chip per value', async () => {
    const el = await makeSelect(combo({ multiple: true, value: 'apple,cherry' }));
    const chips = el.shadowRoot!.querySelectorAll('.select-tag');
    expect(chips.length).toBe(2);
  });

  it('clear: clearable + a selection shows the clear button', async () => {
    const el = await makeSelect(combo({ clearable: true, value: 'apple' }));
    const btn = clearButton(el);
    expect(btn, 'no clear button').not.toBeNull();
    expect(btn!.style.display).not.toBe('none');
  });

  it('marquee: options assigned after ready still paint the authored selection', async () => {
    // makeSelect's array source assigns `options` AFTER `el.ready` — the
    // doc's own JS-only path. The trigger must re-sync and show the label,
    // and the clear button must come out of display:none with it.
    const el = await makeSelect(combo({ clearable: true, value: 'apple' }));
    const value = partOf(el, 'value');
    expect(text(value!), 'the trigger never re-synced after options landed').toContain('Apple');
    const clear = clearButton(el);
    expect(clear, 'no clear button').not.toBeNull();
    expect(clear!.style.display, 'the clear button never re-synced either').not.toBe('none');
  });
});
