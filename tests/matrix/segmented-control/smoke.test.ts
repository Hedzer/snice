/**
 * Smoke slice of the snice-segmented-control matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (see
 * vitest.config.ts); the 121-combo matrix runs only via `npm run test:matrix`.
 * This file is the standing cost the everyday loop DOES pay, and it lives
 * at `smoke.test.ts` so it stays collected.
 *
 * The four combos below are chosen because each is the only place a whole
 * documented rule can break: the auto-selection rule, the option-vs-host
 * disabled split, the "assigned before dispatch" event contract, and the
 * icon/label render. Every assertion routes through the matrix's own oracle
 * (`expectRender`), so this file cannot drift into asserting something weaker
 * than the suite it stands in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mount, optionsFor, expectedInitialValue, expectRender, segments,
  recordValueChange, wait, type SniceSegmentedControlElement,
} from './matrix-utils';

let el: SniceSegmentedControlElement | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('segmented-control matrix smoke', () => {
  it('with no value set, the first NON-DISABLED option is selected', async () => {
    const options = optionsFor('first-off');
    el = await mount({
      id: 'smoke/auto-select', size: 'medium', hostDisabled: false,
      shape: 'first-off', valueKind: 'unset',
    });
    expect(el.value).toBe('week');
    expectRender(el, options, expectedInitialValue('', options),
      { id: 'smoke/auto-select', size: 'medium', hostDisabled: false });
  });

  it('a disabled CONTROL disables every segment without changing aria-disabled', async () => {
    const options = optionsFor('middle-off');
    el = await mount({
      id: 'smoke/host-disabled', size: 'large', hostDisabled: true,
      shape: 'middle-off', valueKind: 'valid',
    });
    // The oracle already pins the split; this makes the intent unmissable.
    expect(segments(el).map(b => b.disabled)).toEqual([true, true, true]);
    expect(segments(el).map(b => b.getAttribute('aria-disabled')))
      .toEqual(['false', 'true', 'false']);
    expectRender(el, options, 'month',
      { id: 'smoke/host-disabled', size: 'large', hostDisabled: true });
  });

  it('selecting assigns `value` BEFORE dispatching value-change', async () => {
    const options = optionsFor('plain');
    el = await mount({
      id: 'smoke/event', size: 'medium', hostDisabled: false,
      shape: 'plain', valueKind: 'unset',
    });
    const seen = recordValueChange(el);
    segments(el)[2].click();
    await wait(20);

    expect(seen).toHaveLength(1);
    expect(seen[0].value).toBe('month');
    expect(seen[0].previousValue).toBe('day');
    expect(seen[0].option).toEqual(options[2]);
    expect(seen[0].control).toBe(el);
    expect(el.value).toBe('month');
    expectRender(el, options, 'month',
      { id: 'smoke/event', size: 'medium', hostDisabled: false });
  });

  it('an option with an icon renders it; one without renders none', async () => {
    const options = optionsFor('iconed');
    el = await mount({
      id: 'smoke/icons', size: 'small', hostDisabled: false,
      shape: 'iconed', valueKind: 'unset',
    });
    expect(segments(el).map(b => b.querySelector('img')?.getAttribute('src') ?? null))
      .toEqual(['/icons/day.svg', null, '/icons/month.svg']);
    expectRender(el, options, 'day',
      { id: 'smoke/icons', size: 'small', hostDisabled: false });
  });
});
