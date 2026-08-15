/**
 * Smoke slice of the snice-action-bar matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/action-bar) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file samples
 * one combo per feature family:
 *   · structure — part `base`, `role="toolbar"`, the label, the projected slot;
 *   · state     — `show()` opens, reflects `[open]`, reports `action-bar-open`;
 *   · roving    — arrows move focus and leave exactly one tab stop;
 *   · skipping  — a disabled action is out of the roving order;
 *   · escape    — Escape closes, and `no-escape-dismiss` withdraws that.
 *
 * Every assertion routes through the matrix oracle (`checkBar`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  activeId, checkBar, combo, expectNoProblems, focusChild, makeActionBar,
  press, record, rovingStops, tabindexOf, wait,
} from './action-bar-support';

describe('action-bar matrix smoke', () => {
  afterEach(() => unmountAll());

  it('structure: a pill bar renders the documented toolbar', async () => {
    const c = combo({ position: 'top-right', size: 'small', variant: 'pill', label: 'Row actions' });
    const el = await makeActionBar(c);
    expectNoProblems(checkBar(el, c), 'top-right/small/pill');
  });

  it('state: show() opens, reflects [open] and reports action-bar-open', async () => {
    const el = await makeActionBar(combo({ open: false }));
    const events = record(el);
    (el as any).show();
    await wait(20);
    expect((el as any).open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(events.map(event => event.type)).toEqual(['action-bar-open']);
    expect(events[0].detail.actionBar).toBe(el);
  });

  it('roving: an arrow moves focus and leaves one tab stop', async () => {
    const el = await makeActionBar(combo({ open: true }));
    focusChild(el, 'a');
    press(el, 'ArrowRight');
    await wait(10);
    expect(activeId()).toBe('b');
    expect(rovingStops(el)).toEqual(['b']);
  });

  it('roving: a disabled action is skipped entirely', async () => {
    const el = await makeActionBar(combo({ open: true, content: 'withDisabled' }));
    focusChild(el, 'a');
    press(el, 'ArrowRight');
    await wait(10);
    expect(activeId()).toBe('c');
    expect(tabindexOf(el, 'b')).toBeNull();
  });

  it('escape: closes, unless no-escape-dismiss', async () => {
    const dismissible = await makeActionBar(combo({ open: true }));
    press(dismissible, 'Escape');
    await wait(20);
    expect((dismissible as any).open).toBe(false);

    const pinned = await makeActionBar(combo({ open: true, noEscapeDismiss: true }));
    press(pinned, 'Escape');
    await wait(20);
    expect((pinned as any).open).toBe(true);
  });
});
