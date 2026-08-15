/**
 * MATRIX slice — snice-tag shadow shape and style axes.
 *
 * Dimensions (docs/ai/components/tag.md):
 *   variant (6) x size (3) x removable (2) x channel (2) = 72 combos
 *
 * `outline` and `pill` are crossed in tag-flags-and-remove.test.ts instead of
 * being multiplied in here: they are pure style booleans that share this exact
 * shape oracle, so folding them in would quadruple the count without reaching
 * one new rendering path. That is the ".ai/fuzzing.md" sizing rule — a
 * display-only token gets tens of combos, not the table's hundreds.
 *
 * `channel` is a real axis, not a convenience: an authored attribute and a
 * post-connect property assignment are two different paths into the same style
 * state, and only the attribute one is what the stylesheet's `:host([variant])`
 * rules can see.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, afterEach } from 'vitest';
import { product, comboId, expectShape, removeComponent } from '../matrix-utils';
import {
  VARIANTS, SIZES, CHANNELS, DEFAULTS, LABEL, ICON_CHILD,
  mountTag, expectedShape, readShape, expectedAxes, readAxes,
  labelSlot, iconSlot, type TagCombo,
} from './tag-support';
import '../../../packages/components/src/tag/snice-tag';

const COMBOS: TagCombo[] = product({
  variant: VARIANTS,
  size: SIZES,
  removable: [false, true],
  channel: CHANNELS,
}).map(c => ({ ...c, outline: DEFAULTS.outline, pill: DEFAULTS.pill }));

describe('tag matrix: shape x variant x size x removable x channel', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const combo of COMBOS) {
    const id = comboId(combo);

    it(`${id}: renders the documented parts, slots and remove affordance`, async () => {
      el = await mountTag(combo);
      expectShape(readShape(el), expectedShape(combo), id);
    });

    it(`${id}: carries the documented property and attribute state`, async () => {
      el = await mountTag(combo);
      expectShape(readAxes(el, combo), expectedAxes(combo), id);
    });

    it(`${id}: label and icon children land in their own documented slot`, async () => {
      el = await mountTag(combo, `${ICON_CHILD}${LABEL}`);

      // Shape must survive the extra light-DOM child unchanged.
      expectShape(readShape(el), expectedShape(combo), id);

      // Which slot a child lands in is the component's declaration (`name`) —
      // asserted here. That a named child is EXCLUDED from the default slot is
      // the browser's own assignment algorithm, which happy-dom does not model
      // faithfully; the visual tier asserts it where a real engine runs.
      const assignedIcon = iconSlot(el)!.assignedElements();
      const assignedLabel = labelSlot(el)!.assignedNodes();
      expectShape(
        {
          iconSlotName: iconSlot(el)!.getAttribute('name'),
          labelSlotName: labelSlot(el)!.getAttribute('name'),
          iconAssigned: assignedIcon.length,
          iconIsTheIconChild: assignedIcon[0]?.hasAttribute('data-icon') ?? false,
          labelHasText: assignedLabel.some(n => (n.textContent ?? '').includes(LABEL)),
        },
        {
          iconSlotName: 'icon',
          labelSlotName: null,
          iconAssigned: 1,
          iconIsTheIconChild: true,
          labelHasText: true,
        },
        id,
      );
    });
  }
});
