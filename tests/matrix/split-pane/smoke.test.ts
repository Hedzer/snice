/**
 * Smoke slice of the snice-split-pane matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/split-pane/, ~110 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and it routes every assertion through
 * the matrix's own oracle so it cannot claim something the full suite does not.
 *
 * The marquee combos: the documented default (a 50/50 horizontal split), the
 * other documented direction, the clamp both minimums impose, the keyboard
 * path, `disabled`, and the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkDirectionAttribute, checkDivider, checkGetters,
  checkResizeEvent, checkSizing, checkSlotted, checkStructure, clampedSize, decreaseKey,
  increaseKey, mountDefaults,
  mountSplitPane, pressDivider, snapped, wait, SETTLE, type ResizeDetail,
} from './split-pane-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('split-pane matrix smoke', () => {
  it('the documented defaults are a 50/50 horizontal split with a separator between', async () => {
    el = await mountDefaults();
    const problems = new Problems();

    checkStructure(problems, el);
    checkSizing(problems, el, { ...DEFAULTS });
    checkDivider(problems, el, { ...DEFAULTS });
    checkGetters(problems, el, { ...DEFAULTS });
    checkSlotted(problems, el);

    expectClean(problems, 'smoke/defaults');
  });

  it('direction="vertical" sizes the primary pane on the other axis', async () => {
    const vector = { ...DEFAULTS, direction: 'vertical' as const, primarySize: 30 };
    el = await mountSplitPane(vector);
    const problems = new Problems();

    checkStructure(problems, el);
    checkSizing(problems, el, vector);
    checkDirectionAttribute(problems, el, 'vertical');
    checkDivider(problems, el, vector);

    expectClean(problems, 'smoke/vertical');
  });

  it('setPrimarySize is bounded by both documented minimums and announces the result', async () => {
    const vector = { ...DEFAULTS, minPrimarySize: 20, minSecondarySize: 30 };
    el = await mountSplitPane(vector);
    const events = captureEvents<ResizeDetail>(el, 'pane-resize');
    const problems = new Problems();

    const want = clampedSize(95, 20, 30);
    (el as any).setPrimarySize(95);
    await wait(SETTLE);

    problems.equal((el as any).primarySize, want, 'setPrimarySize(95)');
    checkGetters(problems, el, { ...vector, primarySize: want });
    checkResizeEvent(problems, events, el, want, 'setPrimarySize(95)');

    expectClean(problems, 'smoke/clamp');
  });

  it('arrow keys along the split resize it; arrow keys across it do not', async () => {
    el = await mountSplitPane({ ...DEFAULTS });
    const problems = new Problems();

    await pressDivider(el, increaseKey('horizontal'));
    problems.check((el as any).primarySize > 50, 'ArrowRight did not grow the primary pane');
    const grown = (el as any).primarySize;

    await pressDivider(el, decreaseKey('horizontal'));
    problems.check((el as any).primarySize < grown, 'ArrowLeft did not shrink the primary pane');
    const shrunk = (el as any).primarySize;

    await pressDivider(el, 'ArrowUp');
    problems.equal((el as any).primarySize, shrunk, 'ArrowUp moved a horizontal split');

    expectClean(problems, 'smoke/keyboard');
  });

  it('a disabled split pane is inert to the keyboard', async () => {
    el = await mountSplitPane({ ...DEFAULTS, disabled: true });
    const events = captureEvents<ResizeDetail>(el, 'pane-resize');
    const problems = new Problems();

    await pressDivider(el, increaseKey('horizontal'));

    problems.equal((el as any).primarySize, 50, 'disabled pane moved');
    problems.equal(events.length, 0, 'disabled pane emitted pane-resize');
    checkDivider(problems, el, { ...DEFAULTS, disabled: true });

    expectClean(problems, 'smoke/disabled');
  });

  // MATRIX-split-pane-1 — see tests/matrix/split-pane/clamping.test.ts.
  // reset() writes 50 straight onto the property, below the documented floor.
  it.fails('MATRIX-split-pane-1: reset() cannot land below minPrimarySize', async () => {
    el = await mountSplitPane({ ...DEFAULTS, primarySize: 80, minPrimarySize: 60 });
    (el as any).reset();
    await wait(SETTLE);
    expect((el as any).primarySize).toBe(60);
  });

  // MATRIX-split-pane-2 — see tests/matrix/split-pane/keyboard.test.ts.
  // snapSize is honoured by the drag path only, never by the keyboard.
  it.fails('MATRIX-split-pane-2: keyboard resize lands on the snap grid', async () => {
    el = await mountSplitPane({ ...DEFAULTS, primarySize: 50, snapSize: 10 });
    await pressDivider(el, increaseKey('horizontal'));
    const after = (el as any).primarySize as number;
    expect(after).toBe(snapped(after, 10));
  });

  // MATRIX-split-pane-3 (fixed) — see tests/matrix/split-pane/layout.test.ts.
  // The default direction now reaches the attribute the divider is sized by.
  it('MATRIX-split-pane-3 (fixed): <snice-split-pane> carries direction="horizontal"', async () => {
    el = await mountDefaults();
    const problems = new Problems();
    checkDirectionAttribute(problems, el, DEFAULTS.direction);
    expectClean(problems, 'smoke/direction-attribute');
  });
});
