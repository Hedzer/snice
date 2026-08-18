/**
 * Matrix slice CHIP / INTERACTION — the activation cross.
 *
 * Dimensions: selectable (2) x removable (2) x disabled (2) x gesture
 * (3: click, Enter, Space) = 24 combos, plus the remove-affordance gestures
 * (click the button, Delete, Backspace) x disabled (2) = 6.
 *
 * Documented contract (docs/ai/components/chip.md):
 *   · `selectable: boolean = false;  // click/keyboard toggles selected;
 *     chips are read-only by default`
 *   · `chip-click -> { label: string, selected: boolean }`
 *   · `chip-remove -> { label: string }`
 *   · Accessibility: "Enter/Space to activate"
 *   · `disabled` — an inert chip: no toggle, no events.
 *
 * it.fails policy (never weakened assertions):
 *   MATRIX-chip-3 (fixed) — `selectable` used NOT to toggle `selected` when
 *     the chip was also `removable`: both gesture handlers guarded the toggle
 *     with `&& !this.removable`, against docs that describe `selectable` and
 *     `removable` as independent properties.
 *   MATRIX-chip-4 (fixed) — a `removable` chip used to dispatch NO
 *     `chip-click` on Enter/Space; the docs list `chip-click` unconditionally
 *     and say Enter/Space activate the chip.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import {
  LABEL, combo, comboId, makeChip, collectEvents, clickBody, clickRemove, press,
} from './chip-support';

type Gesture = 'click' | 'Enter' | ' ';
const GESTURES: Gesture[] = ['click', 'Enter', ' '];
const gestureName = (g: Gesture) => (g === ' ' ? 'Space' : g === 'Enter' ? 'Enter' : 'click');

function activate(chip: any, gesture: Gesture) {
  if (gesture === 'click') clickBody(chip);
  else press(chip, gesture);
}

describe('chip matrix: activation', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  for (const selectable of [false, true]) {
    for (const removable of [false, true]) {
      for (const disabled of [false, true]) {
        for (const gesture of GESTURES) {
          const c = combo({ selectable, removable, disabled });
          const id = `${comboId(c)}/${gestureName(gesture)}`;

          // Documented outcome of one activation gesture:
          //  · disabled  — nothing at all;
          //  · otherwise — one chip-click, and `selected` toggled iff selectable.
          const expectedSelected = !disabled && selectable ? true : false;
          const expectedEvents = disabled
            ? []
            : [{ type: 'chip-click', detail: { label: LABEL, selected: expectedSelected } }];

          it(`${id}: activation follows the documented contract`, async () => {
            chip = await makeChip(c);
            const seen = collectEvents(chip);

            activate(chip, gesture);
            await wait(30);

            expect(chip.selected, 'selected after activation').toBe(expectedSelected);
            expect(seen).toEqual(expectedEvents);
          });
        }
      }
    }
  }

  it('a second activation toggles a selectable chip back off', async () => {
    const c = combo({ selectable: true });
    chip = await makeChip(c);
    const seen = collectEvents(chip);

    clickBody(chip);
    await wait(20);
    clickBody(chip);
    await wait(20);

    expect(chip.selected).toBe(false);
    expect(seen).toEqual([
      { type: 'chip-click', detail: { label: LABEL, selected: true } },
      { type: 'chip-click', detail: { label: LABEL, selected: false } },
    ]);
  });

  it('a chip that is neither selectable nor removable stays read-only but still reports clicks', async () => {
    chip = await makeChip(combo());
    const seen = collectEvents(chip);

    clickBody(chip);
    await wait(20);

    expect(chip.selected, 'chips are read-only by default').toBe(false);
    expect(seen).toEqual([{ type: 'chip-click', detail: { label: LABEL, selected: false } }]);
  });
});

describe('chip matrix: removal', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  for (const disabled of [false, true]) {
    const c = combo({ removable: true, disabled });

    it(`${comboId(c)}: the remove button exists and reports only when enabled`, async () => {
      chip = await makeChip(c);
      const seen = collectEvents(chip);

      const clicked = clickRemove(chip);
      await wait(20);

      expect(clicked, 'a removable chip renders a remove button').toBe(true);
      expect(seen).toEqual(disabled ? [] : [{ type: 'chip-remove', detail: { label: LABEL } }]);
    });

    for (const key of ['Delete', 'Backspace']) {
      it(`${comboId(c)}/${key}: ${disabled ? 'inert' : 'requests removal'}`, async () => {
        chip = await makeChip(c);
        const seen = collectEvents(chip);

        press(chip, key);
        await wait(20);

        expect(seen).toEqual(disabled ? [] : [{ type: 'chip-remove', detail: { label: LABEL } }]);
      });
    }
  }

  it('clicking the remove button never also reports a chip-click', async () => {
    chip = await makeChip(combo({ removable: true, selectable: true }));
    const seen = collectEvents(chip);

    clickRemove(chip);
    await wait(20);

    expect(seen.map(s => s.type), 'remove is not an activation').toEqual(['chip-remove']);
    expect(chip.selected).toBe(false);
  });

  it('a non-removable chip ignores Delete and Backspace', async () => {
    chip = await makeChip(combo({ selectable: true }));
    const seen = collectEvents(chip);

    press(chip, 'Delete');
    press(chip, 'Backspace');
    await wait(20);

    expect(seen).toEqual([]);
    expect(chip.selected).toBe(false);
  });
});
