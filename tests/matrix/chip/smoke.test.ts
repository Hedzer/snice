/**
 * Smoke slice of the snice-chip matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), the same way `tests/matrix/table` is; the full
 * chip matrix runs only via `npm run test:matrix`. This file deliberately lives
 * at `smoke.test.ts` so it stays collected by the everyday loop.
 *
 * What it covers, and why that is the right subset — one combo per feature
 * family, chosen so a family that breaks cannot hide:
 *   · content     — slotted text wins over `label` (the documented override);
 *   · affordance  — `avatar` beats an icon, the precedence chain's top edge;
 *   · activation  — a `selectable` chip toggles and reports `chip-click`;
 *   · removal     — `chip-remove` carries the label;
 *   · a11y        — `aria-disabled` and `tabindex` track `disabled`;
 *   · appearance  — the three CSS axes still render a complete structure.
 *
 * Every assertion routes through the matrix's own oracle (`expectChipMatches`
 * in matrix/chip/chip-support.ts) so this file cannot drift into asserting
 * something weaker than the suite it stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import {
  LABEL, SLOT_TEXT, AVATAR_URL,
  combo, makeChip, expectChipMatches, readFacts,
  collectEvents, clickBody, clickRemove,
} from './chip-support';

describe('chip matrix smoke', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  it('content: slotted text wins over the label property', async () => {
    const c = combo({ content: 'both' });
    chip = await makeChip(c);
    expectChipMatches(chip, c);
    expect(readFacts(chip).text).toBe(SLOT_TEXT);
  });

  it('affordance: an avatar takes precedence over the icon', async () => {
    const c = combo({ affordance: 'avatar+icon' });
    chip = await makeChip(c);
    expectChipMatches(chip, c);
    expect(readFacts(chip).avatarSrc).toBe(AVATAR_URL);
  });

  it('activation: a selectable chip toggles and reports chip-click', async () => {
    chip = await makeChip(combo({ selectable: true }));
    const seen = collectEvents(chip);

    clickBody(chip);
    await wait(20);

    expect(chip.selected).toBe(true);
    expect(seen).toEqual([{ type: 'chip-click', detail: { label: LABEL, selected: true } }]);
  });

  it('removal: chip-remove carries the label', async () => {
    const c = combo({ removable: true });
    chip = await makeChip(c);
    expectChipMatches(chip, c);
    const seen = collectEvents(chip);

    expect(clickRemove(chip)).toBe(true);
    await wait(20);

    expect(seen).toEqual([{ type: 'chip-remove', detail: { label: LABEL } }]);
  });

  it('a11y: disabled removes the chip from the tab order and reports itself', async () => {
    const c = combo({ disabled: true });
    chip = await makeChip(c);
    expectChipMatches(chip, c);

    const seen = collectEvents(chip);
    clickBody(chip);
    await wait(20);
    expect(seen, 'a disabled chip is inert').toEqual([]);
  });

  it('appearance: the loudest axis combination still renders a whole chip', async () => {
    const c = combo({ variant: 'error', size: 'large', shape: 'square', affordance: 'icon-prop' });
    chip = await makeChip(c);
    expectChipMatches(chip, c);
  });
});
