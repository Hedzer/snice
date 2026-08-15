/**
 * Smoke slice of the snice-radio matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * radio matrix (153 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · presentation — the block variant, the only one with extra parts;
 *   · exclusivity  — selecting a member deselects the old one silently;
 *   · identity     — an empty name is NOT a group;
 *   · tab stop     — the roving tab stop follows the selection;
 *   · keyboard     — an arrow key selects the next enabled member;
 *   · validity     — a required group reports valueMissing on every member;
 *   · gating       — a loading member cannot be activated.
 *
 * Every assertion routes through the matrix's own oracles (`expectedShape`,
 * `expectedTabStops`, `expectedGroupFlags`, `EVENT_ORDER`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, expectShape } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  DESCRIPTION, EVENT_ORDER, mountGroup, expectedShape, readShape, activate, arrow,
  selection, tabStops, expectedTabStops, expectedGroupFlags, readFlags,
  recordEvents, recordGroup, expectDetail,
} from './radio-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

const PLANS = [{ value: 'basic' }, { value: 'pro' }, { value: 'team' }];

describe('snice-radio matrix smoke', () => {
  it('presentation: a block radio renders content, label and description', async () => {
    const combo = {
      variant: 'block', size: 'medium', gate: 'none', checked: false,
      required: false, invalid: false, description: true,
    } as const;
    const [radio] = await mountGroup([{
      variant: 'block', description: DESCRIPTION,
    }]);
    expectShape(readShape(radio), expectedShape(combo), 'block');
  });

  it('exclusivity: selecting a member deselects the old one, and only it emits', async () => {
    const group = await mountGroup(PLANS);
    await activate(group[0], 'input');
    const recorders = recordGroup(group);

    await activate(group[2], 'input');

    expect(selection(group)).toEqual([false, false, true]);
    expect(recorders[0].seen, 'the deselected member emitted').toEqual([]);
    expect(recorders[2].seen).toEqual([...EVENT_ORDER]);
    expectDetail(recorders[2].details[0], group[2], 'selection');
  });

  it('identity: empty-name radios are independent', async () => {
    const group = await mountGroup([{ name: '' }, { name: '' }]);
    await activate(group[0], 'input');
    await activate(group[1], 'input');
    expect(selection(group)).toEqual([true, true]);
  });

  it('tab stop: exactly one member is tabbable, and it follows the selection', async () => {
    const group = await mountGroup(PLANS);
    expect(tabStops(group)).toEqual(expectedTabStops([{}, {}, {}]));
    await activate(group[1], 'input');
    expect(tabStops(group)).toEqual(expectedTabStops([{}, { checked: true }, {}]));
  });

  it('keyboard: an arrow key selects the next enabled member and skips a disabled one', async () => {
    const group = await mountGroup([
      { value: 'a' }, { value: 'b', gate: 'disabled' }, { value: 'c' },
    ]);
    await activate(group[0], 'input');
    await arrow(group[0], 'ArrowDown');
    expect(selection(group)).toEqual([false, false, true]);
  });

  it('validity: a required group marks every member until one is checked', async () => {
    const specs = [{ value: 'a', required: true }, { value: 'b' }];
    const group = await mountGroup(specs);
    expect(group.map(readFlags)).toEqual(expectedGroupFlags([
      { required: true, checked: false }, { required: false, checked: false },
    ]));

    await activate(group[1], 'input');
    expect(group.map(readFlags)).toEqual(expectedGroupFlags([
      { required: true, checked: false }, { required: false, checked: true },
    ]));
  });

  it('gating: a loading member cannot be activated', async () => {
    const [radio] = await mountGroup([{ gate: 'loading' }]);
    const recorder = recordEvents(radio);
    await activate(radio, 'click()');
    expect(recorder.seen).toEqual([]);
    expect(radio.checked).toBe(false);
  });
});
