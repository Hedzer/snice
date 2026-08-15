/**
 * snice-segmented-control matrix — INTERACTION slice.
 *
 * The cross of {5 option-set shapes} x {host enabled, host disabled} x {3 click
 * targets} = 30 combos. Each one clicks one segment and asserts BOTH the new
 * render (through the same oracle the render slice uses) and the event
 * contract, so a selection that fires the right event but paints the wrong
 * segment still fails.
 *
 * The documented rules under test, from docs/ai/components/segmented-control.md:
 *
 *  · `value-change` carries `{ value, previousValue, option, control }`;
 *  · "`value` is self-mutating: selecting an option assigns it BEFORE the event
 *    is dispatched" — so `detail.value` must already equal `control.value`, and
 *    `detail.previousValue` must be the value the control held going in;
 *  · one selected at a time — the newly clicked option becomes the only
 *    `aria-checked="true"` segment;
 *  · a disabled option, and every option while the CONTROL is disabled, is not
 *    selectable: no value change and no event. (Asserted by dispatching a real
 *    click rather than trusting the native `disabled` flag, because the guard
 *    that has to hold is the component's own.)
 *  · re-clicking the already-selected option is not a change, so it produces no
 *    event either.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  SHAPES, HOST_DISABLED, optionsFor, expectedInitialValue, mount, segments,
  expectRender, recordValueChange, wait,
  type SegmentedControlOption, type Shape, type SniceSegmentedControlElement,
} from './matrix-utils';

/**
 * Click targets. Each resolves to an option INDEX for a shape, or -1 when the
 * shape has no such option (an all-disabled set has no enabled option to move
 * to, and a plain set has no disabled one).
 */
const TARGETS = ['other-enabled', 'disabled-option', 'already-selected'] as const;
type Target = typeof TARGETS[number];

function targetIndex(
  target: Target,
  options: SegmentedControlOption[],
  currentValue: string,
): number {
  switch (target) {
    case 'other-enabled':
      return options.findIndex(o => !o.disabled && o.value !== currentValue);
    case 'disabled-option':
      return options.findIndex(o => o.disabled);
    case 'already-selected':
      return options.findIndex(o => o.value === currentValue);
  }
}

/** Whether the documented rules allow this click to change the selection. */
function selectable(
  option: SegmentedControlOption,
  hostDisabled: boolean,
  currentValue: string,
): boolean {
  if (hostDisabled) return false;
  if (option.disabled) return false;
  return option.value !== currentValue;
}

let el: SniceSegmentedControlElement | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('segmented-control matrix: interaction', () => {
  for (const shape of SHAPES) {
    for (const hostDisabled of HOST_DISABLED) {
      for (const target of TARGETS) {
        const id = `${shape}/${hostDisabled ? 'disabled' : 'enabled'}/click-${target}`;

        it(id, async () => {
          const options = optionsFor(shape as Shape);
          // Mount with no authored value so the control lands on its
          // documented auto-selection answer first; the click then moves it (or
          // is documented not to).
          const combo = { id, size: 'medium' as const, hostDisabled, shape: shape as Shape, valueKind: 'unset' as const };
          el = await mount(combo);

          const before = expectedInitialValue('', options);
          const index = targetIndex(target, options, before);
          if (index < 0) return; // shape has no such option — nothing to click

          const option = options[index];
          const seen = recordValueChange(el);

          segments(el)[index].click();
          await wait(30);

          const allowed = selectable(option, hostDisabled, before);
          const after = allowed ? option.value : before;

          expectRender(el, options, after, { ...combo, id });

          if (!allowed) {
            expect(seen, `${id}: an unselectable click still dispatched value-change`)
              .toEqual([]);
            return;
          }

          expect(seen, `${id}: expected exactly one value-change`).toHaveLength(1);
          const detail = seen[0];
          // `value` is assigned BEFORE the event is dispatched, so the detail
          // and the live property agree, and previousValue is what it replaced.
          expect(detail.value).toBe(option.value);
          expect(detail.value).toBe(el.value);
          expect(detail.previousValue).toBe(before);
          expect(detail.option).toEqual(option);
          expect(detail.control).toBe(el);
        });
      }
    }
  }

  // A selection SEQUENCE: every enabled option in turn, so the "one selected at
  // a time" rule is asserted across transitions rather than only on the first.
  it('walking every enabled option keeps exactly one selected and reports each hop', async () => {
    const options = optionsFor('middle-off');
    el = await mount({
      id: 'walk', size: 'medium', hostDisabled: false, shape: 'middle-off', valueKind: 'unset',
    });
    const seen = recordValueChange(el);

    const enabled = options.filter(o => !o.disabled);
    let previous = expectedInitialValue('', options);
    const hops: Array<{ value: string; previousValue: string }> = [];

    for (const option of enabled) {
      const index = options.indexOf(option);
      segments(el)[index].click();
      await wait(20);
      expectRender(el, options, option.value, {
        id: `walk→${option.value}`, size: 'medium', hostDisabled: false,
      });
      if (option.value !== previous) {
        hops.push({ value: option.value, previousValue: previous });
        previous = option.value;
      }
    }

    expect(seen.map(d => ({ value: d.value, previousValue: d.previousValue }))).toEqual(hops);
  });
});
