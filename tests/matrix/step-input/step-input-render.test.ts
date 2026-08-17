/**
 * MATRIX slice — snice-step-input: the rendered shape, and who may change it.
 *
 * Dimensions (docs/ai/components/step-input.md):
 *   size (3) x disabled (2) x readonly (2) x boundary position (3)
 *   x wrap (2) = 72 combos
 *
 * What this slice grades:
 *
 *   · the four documented CSS parts — `base`, `decrement-button`,
 *     `increment-button`, `input` — present in EVERY combo, because the docs
 *     list them unconditionally and name no property that removes one;
 *   · the native mirror the control keeps on its own `<input>`: `type`,
 *     `min`/`max`/`step`, `disabled`, `readonly`, and the `spinbutton` ARIA
 *     numbers, all of which must agree with the constraints the author set;
 *   · "Buttons disabled at min/max (unless `wrap` is set)", crossed with
 *     `disabled`, which disables them for a different reason;
 *   · `size` — a pure style axis whose observable DOM contract is the attribute
 *     (`:host([size=…])`) plus the base's own size class;
 *   · `disabled` vs `readonly`: "Disabled controls are omitted/barred. Readonly
 *     controls remain successful but are barred." Both refuse to move, and only
 *     one of them stops rendering as an enabled control.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, click, unmountAll } from '../matrix-utils';
import {
  SIZES, DOCUMENTED_PARTS,
  mountStepInput, tick, expectedShape, readShape, expectedSize, readSize,
  incrementButton, decrementButton, inputPart, recordValueChange, pressKey,
  typeValue, partNames,
} from './step-input-support';
import '../../../packages/components/src/step-input/snice-step-input';

/** A bounded range whose ends are lattice points, so the cue is unambiguous. */
const RANGE = { min: 0, max: 10, step: 2 };

/** Where the value sits relative to the two documented boundaries. */
const POSITIONS = { 'at-min': 0, middle: 4, 'at-max': 10 } as const;

const COMBOS = product({
  size: SIZES,
  disabled: [false, true],
  readonly: [false, true],
  position: Object.keys(POSITIONS) as Array<keyof typeof POSITIONS>,
  wrap: [false, true],
});

afterEach(() => { unmountAll(); });

describe(`step-input matrix: rendered shape x disabled x readonly (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `${combo.size}/${combo.position}/${combo.wrap ? 'wrap' : 'clamp'}`
      + `/${combo.disabled ? 'disabled' : 'enabled'}`
      + `/${combo.readonly ? 'readonly' : 'editable'}`;

    it(id, async () => {
      const vector = {
        ...RANGE,
        size: combo.size,
        disabled: combo.disabled,
        readonly: combo.readonly,
        wrap: combo.wrap,
        defaultValue: POSITIONS[combo.position],
      };
      const el = await mountStepInput(vector);
      const value = POSITIONS[combo.position];
      expect(el.value, `${id} authored default`).toBe(value);

      expectShape(readShape(el), expectedShape(vector, value), `shape ${id}`);
      expectShape(readSize(el), expectedSize(vector), `size ${id}`);
      expect(partNames(el), `parts ${id}`).toEqual(DOCUMENTED_PARTS);
    });
  }
});

/**
 * "Disabled controls are omitted/barred. Readonly controls remain successful
 * but are barred." Both refuse every documented way of moving the value, and
 * neither may dispatch `value-change` for a change it did not make.
 */
describe('step-input matrix: a barred control refuses every entry point', () => {
  // `typing` is deliberately NOT one of these entry points. A user cannot type
  // into a disabled or readonly field at all — the browser refuses before any
  // handler runs — so synthesising a `change` event on one would test a
  // sequence that cannot occur, and grade the component on an input the
  // platform guarantees it never receives. What IS asserted for those two is
  // that the control sets the native attribute the platform enforces, below.
  const BARRED = product({
    barrier: ['disabled', 'readonly'] as const,
    entry: ['method', 'button', 'key'] as const,
  });

  for (const combo of BARRED) {
    it(`${combo.barrier} refuses ${combo.entry}`, async () => {
      const el = await mountStepInput({
        ...RANGE,
        defaultValue: 4,
        disabled: combo.barrier === 'disabled',
        readonly: combo.barrier === 'readonly',
      });
      const seen = recordValueChange(el);

      switch (combo.entry) {
        case 'method': el.increment(); break;
        case 'button': click(incrementButton(el)); break;
        case 'key': pressKey(el, 'ArrowUp'); break;
      }
      await tick(el);

      expect(el.value, `${combo.barrier}/${combo.entry} value`).toBe(4);
      expect(seen, `${combo.barrier}/${combo.entry} events`).toEqual([]);
      // Whatever the user did to the field, the control re-renders the value it
      // actually holds — a barred control never shows a number it did not take.
      expect(inputPart(el)?.value, `${combo.barrier}/${combo.entry} rendered`).toBe('4');
    });
  }

  it('a disabled control disables its input and both buttons', async () => {
    const el = await mountStepInput({ ...RANGE, defaultValue: 4, disabled: true });
    expect(inputPart(el)?.disabled).toBe(true);
    expect(incrementButton(el)?.disabled).toBe(true);
    expect(decrementButton(el)?.disabled).toBe(true);
  });

  it('a readonly control marks its input readonly and stays enabled', async () => {
    // "Readonly controls remain SUCCESSFUL" — a successful control is one that
    // still submits, so it is not disabled; it simply refuses edits.
    const el = await mountStepInput({ ...RANGE, defaultValue: 4, readonly: true });
    expect(inputPart(el)?.readOnly).toBe(true);
    expect(inputPart(el)?.disabled).toBe(false);
  });
});

/**
 * Direct entry through the field. "Input ... dirties it", and the typed number
 * goes through the same lattice as everything else — so a user who types 7 into
 * a 0..10/step-2 control gets 8 back (the tie rounds up), and the field shows
 * the number the control actually took, never the one that was typed.
 */
describe('step-input matrix: typing into the field', () => {
  const TYPED: Array<[string, number]> = [
    ['7', 8],       // exactly between 6 and 8; the lattice rounds the tie up
    ['5', 6],       // likewise between 4 and 6
    ['-3', 0],      // clamps to min
    ['99', 10],     // clamps to max
    ['4', 4],       // already a lattice point: unchanged
  ];

  for (const [typed, expected] of TYPED) {
    it(`typing "${typed}" settles on ${expected}`, async () => {
      const el = await mountStepInput({ ...RANGE, defaultValue: 4 });
      const seen = recordValueChange(el);
      typeValue(el, typed);
      await tick(el);

      expect(el.value).toBe(expected);
      expect(inputPart(el)?.value).toBe(String(expected));
      expect(seen).toEqual(expected === 4
        ? []
        : [{ value: expected, oldValue: 4, isComponent: true }]);
    });
  }

  it('typing something that is not a number leaves the value alone', async () => {
    const el = await mountStepInput({ ...RANGE, defaultValue: 4 });
    const seen = recordValueChange(el);
    typeValue(el, 'abc');
    await tick(el);
    expect(el.value).toBe(4);
    expect(inputPart(el)?.value).toBe('4');
    expect(seen).toEqual([]);
  });
});
