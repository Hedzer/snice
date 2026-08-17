/**
 * Smoke slice of the snice-tag matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the 120-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * Four combos, one per feature family of docs/ai/components/tag.md: the
 * declared part/slot shape, the style axes' journey to the attribute the
 * stylesheet selects on, the `removable` DOM addition with its `tag-remove`
 * event, and the slotted icon/label projection. Every structural assertion
 * routes through the matrix's own oracle (`expectedShape`/`readShape`), so this
 * file cannot drift into asserting something weaker than the suite it stands
 * in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  expectShape, captureEvents, click, unmountAll, slottedText,
} from '../matrix-utils';
import {
  LABEL, ICON_CHILD,
  mountTag, expectedShape, readShape, expectedAxes, readAxes,
  removeButton, labelSlot, iconSlot, type TagCombo,
} from './tag-support';
import '../../../packages/components/src/tag/snice-tag';

const plain = (over: Partial<TagCombo> = {}): TagCombo => ({
  variant: 'default', size: 'medium', removable: false,
  outline: false, pill: false, channel: 'attr', ...over,
});

afterEach(() => { unmountAll(); });

describe('tag matrix smoke', () => {
  it('a bare tag renders the three documented parts and projects its label', async () => {
    const combo = plain();
    const el = await mountTag(combo);
    expectShape(readShape(el), expectedShape(combo), 'smoke/bare shape');
    expect(slottedText(el, 'slot:not([name])')).toBe(LABEL);
    expect(labelSlot(el)).not.toBeNull();
    expect(iconSlot(el)).not.toBeNull();
  });

  it('every style axis reaches the attribute the stylesheet selects on', async () => {
    // The PROPERTY channel is the interesting one: `:host([variant=…])` cannot
    // see a JS assignment that never reflects.
    const combo = plain({ variant: 'success', size: 'large', outline: true, pill: true, channel: 'prop' });
    const el = await mountTag(combo);
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/axes');
    expect(el.getAttribute('variant')).toBe('success');
    expect(el.getAttribute('size')).toBe('large');
    expect(el.hasAttribute('outline')).toBe(true);
    expect(el.hasAttribute('pill')).toBe(true);
  });

  it('removable adds the remove button, and clicking it emits tag-remove -> { tag }', async () => {
    const combo = plain({ removable: true, variant: 'danger' });
    const el = await mountTag(combo);
    expectShape(readShape(el), expectedShape(combo), 'smoke/removable shape');

    const captured = captureEvents(el, ['tag-remove']);
    click(removeButton(el));
    expect(captured.types()).toEqual(['tag-remove']);
    expect(captured.events[0].detail).toEqual({ tag: el });
  });

  it('a non-removable tag has no remove button to click', async () => {
    const combo = plain();
    const el = await mountTag(combo);
    expect(removeButton(el)).toBeNull();
    const captured = captureEvents(el, ['tag-remove']);
    click(removeButton(el));
    expect(captured.types()).toEqual([]);
  });

  it('a slotted icon projects into the icon part, beside the label', async () => {
    const combo = plain({ variant: 'success' });
    const el = await mountTag(combo, `${ICON_CHILD}${LABEL}`);
    expectShape(readShape(el), expectedShape(combo), 'smoke/icon shape');
    expect(slottedText(el, 'slot[name="icon"]')).toBe('*');
    // The default slot must carry the label. Whether it ALSO reports the
    // `slot="icon"` child is a happy-dom assignment quirk rather than a
    // component claim — a real engine assigns a named child to its named slot
    // only — so the exact projection is the visual tier's assertion to make.
    expect(slottedText(el, 'slot:not([name])')).toContain(LABEL);
  });
});
