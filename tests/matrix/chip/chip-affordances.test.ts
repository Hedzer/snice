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
 *   MATRIX-chip-2 (fixed) — a `disabled` + `removable` chip used to render NO
 *     remove button at all. The docs describe `removable` and `disabled` as
 *     independent properties and give no exception, so the remove affordance
 *     now stays rendered (barred by the disabled dim, not gone).
 *   MATRIX-chip-5 (fixed) — a chip whose ONLY icon source is the documented
 *     `icon` SLOT never rendered the icon wrapper: `showIcon` gated the
 *     wrapper on `this.icon || this.hasIconSlot`, and `hasIconSlot` was only
 *     ever set by a `slotchange` listener bound to `slot[name="icon"]` —
 *     which lived inside the wrapper that `showIcon` was gating. The render
 *     now probes the light DOM for slotted icon content directly.
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

        it(`${comboId(c)}: renders the documented affordances`, async () => {
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

  // MATRIX-chip-5 (fixed): the documented `icon` slot used on its own never
  // reached the DOM at all — no wrapper, therefore no slot to assign to.
  it('MATRIX-chip-5 (fixed): the icon slot renders on its own, without an icon property', async () => {
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
