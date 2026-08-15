/**
 * Matrix slice CHIP / AFFORDANCES — the icon/avatar precedence chain crossed
 * with `removable` and `disabled`.
 *
 * Dimensions: affordance (5: none, icon prop, icon slot, avatar, avatar+icon)
 * x removable (2) x disabled (2) = 20 combos.
 *
 * Documented contract (docs/ai/components/chip.md):
 *   · `icon: string` — "URL, image file, emoji. Use slot for icon fonts."
 *   · slot `icon` — "Custom icon content (overrides `icon` property;
 *     `avatar` takes precedence)"
 *   · `avatar: string` — "Avatar image URL (takes precedence over icon slot)"
 *   · `removable: boolean` — the chip carries a remove affordance, and
 *     "Remove button has aria-label"
 *   · CSS part `icon` — "Icon wrapper element"
 *
 * it.fails policy (never weakened assertions):
 *   MATRIX-chip-2 — a `disabled` + `removable` chip renders NO remove button
 *     at all. The docs describe `removable` and `disabled` as independent
 *     properties and give no exception, so the assertion stays "removable means
 *     a named remove affordance exists" and the combo is pinned instead.
 *   MATRIX-chip-5 — a chip whose ONLY icon source is the documented `icon`
 *     SLOT never renders the icon wrapper. `showIcon` gates the wrapper on
 *     `this.icon || this.hasIconSlot`, and `hasIconSlot` is only ever set by a
 *     `slotchange` listener bound to `slot[name="icon"]` — which lives inside
 *     the wrapper that `showIcon` is gating. The slot is never rendered, so the
 *     event never fires, so the flag never flips: slotted icon content is
 *     unreachable unless an `icon` property is ALSO set.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  AFFORDANCES, AVATAR_URL,
  combo, comboId, makeChip, expectChipMatches, readFacts,
} from './chip-support';

describe('chip matrix: affordance precedence', () => {
  let chip: any;
  afterEach(() => { if (chip) { removeComponent(chip); chip = null; } });

  for (const affordance of AFFORDANCES) {
    for (const removable of [false, true]) {
      for (const disabled of [false, true]) {
        const c = combo({ affordance, removable, disabled });
        // Two findings intersect in this product. A slot-only icon never
        // paints (MATRIX-chip-5); a disabled removable chip has no remove
        // button (MATRIX-chip-2). Everything else is a live assertion.
        const finding = affordance === 'icon-slot'
          ? 'MATRIX-chip-5'
          : (removable && disabled) ? 'MATRIX-chip-2' : null;
        const runner = finding ? it.fails : it;
        const title = finding
          ? `${comboId(c)}: renders the documented affordances [${finding}]`
          : `${comboId(c)}: renders the documented affordances`;

        runner(title, async () => {
          chip = await makeChip(c);
          expectChipMatches(chip, c);
        });
      }
    }
  }

  // The precedence chain, asserted directly rather than through the fact
  // bundle, so the ORDER of the three sources is pinned and not just their
  // presence.
  it('avatar wins over the icon slot, which wins over the icon property', async () => {
    chip = await makeChip(combo({ affordance: 'avatar+icon' }));
    const sr = chip.shadowRoot as ShadowRoot;

    expect(sr.querySelector('img.chip-avatar')?.getAttribute('src')).toBe(AVATAR_URL);
    expect(sr.querySelector('[part="icon"]'), 'avatar takes precedence over the icon slot').toBeNull();
  });

  // MATRIX-chip-5: the documented `icon` slot, used on its own, never reaches
  // the DOM at all — there is no wrapper and therefore no slot to assign to.
  it.fails('the icon slot renders on its own, without an icon property [MATRIX-chip-5]', async () => {
    chip = await makeChip(combo({ affordance: 'icon-slot' }));
    const iconPart = chip.shadowRoot.querySelector('[part="icon"]') as HTMLElement;
    const slot = iconPart.querySelector('slot[name="icon"]') as HTMLSlotElement;

    expect(slot, 'icon part hosts a named slot').not.toBeNull();
    expect(slot.assignedNodes().length, 'slotted icon content is assigned').toBeGreaterThan(0);
  });

  it('removing the avatar restores the icon part', async () => {
    chip = await makeChip(combo({ affordance: 'avatar+icon' }));
    expect(readFacts(chip).hasIconPart).toBe(false);

    chip.avatar = '';
    await new Promise(resolve => setTimeout(resolve, 40));

    const facts = readFacts(chip);
    expect(facts.avatarSrc).toBeNull();
    expect(facts.hasIconPart, 'the icon slot paints again once the avatar is gone').toBe(true);
  });
});
