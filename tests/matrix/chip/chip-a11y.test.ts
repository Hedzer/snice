/**
 * Matrix slice CHIP / ACCESSIBILITY — the documented ARIA surface across the
 * state cross.
 *
 * Dimensions: selected (2) x selectable (2) x removable (2) x disabled (2)
 * = 16 combos for `aria-selected`/`aria-disabled`/`tabindex`, plus the
 * live-update cases (toggling `selected` and `disabled` after first paint).
 *
 * Documented contract (docs/ai/components/chip.md, "Accessibility"):
 *   · "Enter/Space to activate"
 *   · "aria-selected, aria-disabled"
 *   · "Remove button has aria-label"
 *
 * it.fails policy (never weakened assertions):
 *   MATRIX-chip-1 (fixed) — a freshly rendered chip used to carry NO
 *   `aria-selected` at all: render() emitted `aria-pressed` instead, and
 *   `aria-selected` only appeared once the `selected`/`variant` watcher
 *   happened to run. The template now renders the documented attribute from
 *   first paint; the assertion runs unpinned as a regression guard. It stays
 *   out of the shared fact bundle (chip-support.ts `HELD_OUT`) purely so it
 *   is reported once rather than 100 times.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import { combo, comboId, makeChip, expectAriaSelected, readFacts } from './chip-support';

describe('chip matrix: ARIA surface', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  for (const selected of [false, true]) {
    for (const selectable of [false, true]) {
      for (const removable of [false, true]) {
        for (const disabled of [false, true]) {
          const c = combo({ selected, selectable, removable, disabled });

          it(`MATRIX-chip-1 (fixed): ${comboId(c)}: exposes aria-selected on first paint`, async () => {
            chip = await makeChip(c);
            expectAriaSelected(chip, c);
          });

          it(`${comboId(c)}: exposes aria-disabled and the matching tabindex`, async () => {
            chip = await makeChip(c);
            const facts = readFacts(chip);
            expect(facts.ariaDisabled).toBe(String(disabled));
            expect(facts.tabindex).toBe(disabled ? '-1' : '0');
          });
        }
      }
    }
  }
});

describe('chip matrix: ARIA follows late state changes', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  it('toggling `selected` after first paint updates aria-selected', async () => {
    const c = combo({ selectable: true });
    chip = await makeChip(c);

    chip.selected = true;
    await wait(40);
    expectAriaSelected(chip, combo({ selectable: true, selected: true }));

    chip.selected = false;
    await wait(40);
    expectAriaSelected(chip, combo({ selectable: true, selected: false }));
  });

  it('toggling `disabled` after first paint updates aria-disabled and tabindex', async () => {
    chip = await makeChip(combo());

    chip.disabled = true;
    await wait(40);
    expect(readFacts(chip).ariaDisabled).toBe('true');
    expect(readFacts(chip).tabindex).toBe('-1');

    chip.disabled = false;
    await wait(40);
    expect(readFacts(chip).ariaDisabled).toBe('false');
    expect(readFacts(chip).tabindex).toBe('0');
  });
});
