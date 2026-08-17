/**
 * snice-menu matrix — STRUCTURE.
 *
 * The cross that owns the rendered shape: `placement` (all 8 documented
 * values) x `open` (2) x the two documented image slots (none / both) = 32
 * combos, each judged by the whole oracle in `menu-support.ts` — every part,
 * every slot, the trigger's ARIA disclosure state, the panel's role, its
 * `popover` mode, its placement class, and the `--menu-distance` custom
 * property `distance` is expressed in.
 *
 * Why placement is crossed with `open` rather than tested alone: the panel's
 * class list is the ONLY observable `placement` has in a DOM tier (happy-dom
 * lays nothing out), and `menu__panel--open` is added to that same list. A
 * suite that checked them separately could not catch the two colliding, which
 * is exactly the bug shape a class-string builder produces.
 *
 * The remaining slices here cover the dimensions that are not worth a full
 * cross: the individual image slots, the divider, and the documented defaults.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, MENU_PARTS, PLACEMENTS, SAMPLE_ITEMS,
  combo, defaultSlotText, expect, expectMenuMatches, makeMenu, part, parts, teardown, text,
} from './menu-support';

describe('snice-menu matrix — structure', () => {
  afterEach(teardown);

  // ── placement x open x images ─────────────────────────────────────────────
  for (const placement of PLACEMENTS) {
    for (const open of [false, true]) {
      for (const images of ['none', 'both'] as const) {
        const c = combo({ placement, open, images });
        it(`renders the documented shape: ${c.id}`, async () => {
          const el = await makeMenu(c);
          expectMenuMatches(el, c);
        });
      }
    }
  }

  // ── the two image slots, independently ───────────────────────────────────
  for (const images of ['none', 'left', 'right', 'both'] as const) {
    const c = combo({ images });
    it(`image slots project independently: images=${images}`, async () => {
      const el = await makeMenu(c);
      expectMenuMatches(el, c);

      // The doc gives each image its own slot AND its own part, so a wrapper
      // must exist whether or not anything was slotted into it — otherwise a
      // page that styles ::part(image-left) breaks the day the slot is empty.
      const left = part(el, 'image-left')!;
      const right = part(el, 'image-right')!;
      const assigned = (host: HTMLElement, name: string) =>
        (host.querySelector(`slot[name="${name}"]`) as HTMLSlotElement)
          ?.assignedElements().length ?? -1;
      expect(assigned(left, 'image-left'), 'image-left assigned')
        .toBe(images === 'left' || images === 'both' ? 1 : 0);
      expect(assigned(right, 'image-right'), 'image-right assigned')
        .toBe(images === 'right' || images === 'both' ? 1 : 0);
    });
  }

  // ── the divider is a peer of the items in the default slot ───────────────
  for (const divider of [false, true]) {
    const c = combo({ divider });
    it(`divider participates in the default slot: divider=${divider}`, async () => {
      const el = await makeMenu(c);
      expectMenuMatches(el, c);

      const rule = el.querySelector('snice-menu-divider');
      expect(!!rule, 'divider element present').toBe(divider);
      if (!divider) return;
      // `snice-menu-divider` documents exactly one part and is a separator.
      const line = part(rule, 'divider');
      expect(!!line, 'divider exposes part="divider"').toBe(true);
      expect(line!.getAttribute('role'), 'divider role').toBe('separator');
      expect(parts(rule, 'divider').length, 'divider part count').toBe(1);
    });
  }

  // ── documented defaults ──────────────────────────────────────────────────
  it('defaults match the documented values with no attributes at all', async () => {
    const el = await makeMenu(combo({
      placement: DEFAULTS.placement, trigger: DEFAULTS.trigger, distance: DEFAULTS.distance,
    }));
    expect({
      open: el.open,
      placement: el.placement,
      trigger: el.trigger,
      closeOnSelect: el.closeOnSelect,
      distance: el.distance,
    }).toEqual(DEFAULTS);
  });

  it('every documented part is exposed exactly once, closed and open', async () => {
    const el = await makeMenu(combo());
    for (const name of MENU_PARTS) {
      expect(parts(el, name).length, `closed part="${name}"`).toBe(1);
    }
    el.openMenu();
    await new Promise(resolve => setTimeout(resolve, 20));
    for (const name of MENU_PARTS) {
      expect(parts(el, name).length, `open part="${name}"`).toBe(1);
    }
  });

  it('the panel content wrapper holds the default slot, not the trigger slot', async () => {
    const el = await makeMenu(combo());
    const content = part(el, 'content')!;
    expect(content.querySelector('slot:not([name])'), 'default slot inside content')
      .not.toBeNull();
    expect(content.querySelector('slot[name="trigger"]'), 'trigger slot must NOT be in content')
      .toBeNull();
    const trigger = part(el, 'trigger')!;
    expect(trigger.querySelector('slot[name="trigger"]'), 'trigger slot inside trigger part')
      .not.toBeNull();
  });

  it('an authored trigger and its items keep their own labels', async () => {
    const el = await makeMenu(combo());
    expect(text(el.querySelector('button[slot="trigger"]'))).toBe('File');
    // The doc's contract is that the item's DEFAULT slot is the label; icon and
    // shortcut live in their own named slots and must not be folded into it.
    for (const spec of SAMPLE_ITEMS) {
      const item = el.querySelector(`snice-menu-item[value="${spec.value}"]`)!;
      expect(defaultSlotText(item), `label of ${spec.value}`).toBe(spec.label);
    }
  });
});
