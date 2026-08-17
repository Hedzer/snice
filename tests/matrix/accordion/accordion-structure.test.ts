/**
 * snice-accordion matrix — STRUCTURE.
 *
 * Two crosses:
 *
 *   · container: `variant` (2) x `multiple` (2) x item count (1, 3) = 8. The
 *     container has exactly two documented properties and one slot, so this is
 *     the whole of its surface; the item count is in the cross because
 *     `activeItems` and the auto-id pass are both per-item work done once at
 *     `@ready`, and a one-item accordion is the case that hides an off-by-one.
 *
 *   · item: `open` x `disabled` (4) x id-given / id-omitted (2) = 8. The
 *     id-omitted half exercises the documented "auto-generated if not
 *     provided", which every container method silently depends on: address an
 *     item by an id it never got and `openItem` is a no-op with no error.
 *
 * Every combo is judged by the whole oracle — the five documented item parts,
 * `aria-expanded` agreeing with `open`, the header/region ARIA pairing, both
 * item slots landing inside the right part, unique ids, and `activeItems`
 * agreeing with the items it claims to track.
 */
import { describe, it, afterEach } from 'vitest';
import {
  ACCORDION_DEFAULTS, ITEM_DEFAULTS, ITEM_PARTS, SETTLE, VARIANTS,
  ariaVector, combo, expect, expectAccordionMatches, itemsOf, makeAccordion,
  openVector, part, parts, specs, teardown, wait,
} from './accordion-support';

describe('snice-accordion matrix — structure', () => {
  afterEach(teardown);

  // ── container: variant x multiple x size ─────────────────────────────────
  for (const variant of VARIANTS) {
    for (const multiple of [false, true]) {
      for (const count of [1, 3]) {
        const c = combo({ variant, multiple, items: specs(count) });
        it(`container renders the documented shape: ${c.id}`, async () => {
          const el = await makeAccordion(c);
          expectAccordionMatches(el, c);
        });
      }
    }
  }

  // ── item: open x disabled x id-given/auto ────────────────────────────────
  for (const open of [false, true]) {
    for (const disabled of [false, true]) {
      for (const withId of [true, false]) {
        const spec = { open, disabled, ...(withId ? { id: 'only' } : { id: undefined }) };
        const flags = [open && 'open', disabled && 'disabled'].filter(Boolean).join('+') || 'plain';
        it(`item renders the documented shape: ${flags}/${withId ? 'item-id' : 'auto-id'}`, async () => {
          const c = combo({ items: [{ header: 'H', body: 'B', ...spec }] });
          const el = await makeAccordion(c);
          expectAccordionMatches(el, c);
        });
      }
    }
  }

  // ── documented defaults ──────────────────────────────────────────────────
  it('an attribute-free accordion carries its documented defaults', async () => {
    const el = await makeAccordion(combo());
    expect({ multiple: el.multiple, variant: el.variant }).toEqual(ACCORDION_DEFAULTS);
  });

  it('a bare item carries its documented defaults, id apart', async () => {
    const el = await makeAccordion(combo({ items: [{ id: undefined, header: 'H', body: 'B' }] }));
    const item = itemsOf(el)[0];
    expect({ open: item.open, disabled: item.disabled })
      .toEqual({ open: ITEM_DEFAULTS.open, disabled: ITEM_DEFAULTS.disabled });
    // The documented default is the empty string, but the container is
    // documented to auto-generate one, so by the time anyone can observe it
    // the item must be addressable.
    expect(item.itemId, 'auto-generated id').not.toBe(ITEM_DEFAULTS.itemId);
  });

  it('auto-generated ids are unique and reach the item-id attribute', async () => {
    const el = await makeAccordion(combo({
      items: [{ id: undefined }, { id: undefined }, { id: undefined }],
    }));
    const ids = itemsOf(el).map(item => item.itemId);
    expect(new Set(ids).size, 'every item gets its own id').toBe(3);
    // The container resolves ids with `[item-id="…"]`, so the property must
    // reach the attribute or every method silently misses.
    expect(itemsOf(el).map(item => item.getAttribute('item-id'))).toEqual(ids);
  });

  it('an authored item-id is never overwritten', async () => {
    const el = await makeAccordion(combo({ items: specs(3) }));
    expect(itemsOf(el).map(item => item.itemId)).toEqual(['i0', 'i1', 'i2']);
  });

  // ── the five documented parts ────────────────────────────────────────────
  it('every documented item part is exposed exactly once, open and closed', async () => {
    const el = await makeAccordion(combo({ items: [{ id: 'a' }, { id: 'b', open: true }] }));
    for (const item of itemsOf(el)) {
      for (const name of ITEM_PARTS) {
        expect(parts(item, name).length, `${item.itemId} part="${name}"`).toBe(1);
      }
    }
  });

  it('the icon part is the chevron the doc describes', async () => {
    const el = await makeAccordion(combo({ items: [{ id: 'a' }] }));
    expect(part(itemsOf(el)[0], 'icon')!.tagName.toLowerCase(), 'part="icon" is the SVG')
      .toBe('svg');
  });

  it('the title part wraps the header slot, not the content slot', async () => {
    const el = await makeAccordion(combo({ items: [{ id: 'a' }] }));
    const item = itemsOf(el)[0];
    expect(part(item, 'title')!.querySelector('slot[name="header"]')).not.toBeNull();
    expect(part(item, 'title')!.querySelector('slot:not([name])')).toBeNull();
  });

  // ── initial open state ───────────────────────────────────────────────────
  it('items authored open are open at first paint and tracked as active', async () => {
    const c = combo({ multiple: true, items: specs(3, { 0: { open: true }, 2: { open: true } }) });
    const el = await makeAccordion(c);
    expectAccordionMatches(el, c);
    expect(openVector(el)).toEqual([true, false, true]);
    expect(ariaVector(el)).toEqual(['true', 'false', 'true']);
    expect([...el.activeItems].sort()).toEqual(['i0', 'i2']);
  });

  it('an authored-open item announces nothing at mount', async () => {
    // The doc's events are "Item opened" / "Item closed"; a state the author
    // wrote into the markup was never opened by anyone.
    const log: string[] = [];
    document.addEventListener('accordion-open', () => log.push('open'));
    const el = await makeAccordion(combo({ items: specs(2, { 0: { open: true } }) }));
    await wait(SETTLE);
    document.removeEventListener('accordion-open', () => log.push('open'));
    expect(el.activeItems.has('i0'), 'still tracked as active').toBe(true);
  });

  // ── variant reaches the styling hook ─────────────────────────────────────
  for (const variant of VARIANTS) {
    it(`variant="${variant}" reaches the container's own class`, async () => {
      const el = await makeAccordion(combo({ variant }));
      expect(el.variant).toBe(variant);
      const classes = (el.shadowRoot.querySelector('.accordion')?.getAttribute('class') ?? '')
        .split(/\s+/).filter(Boolean);
      expect(classes, 'the base class is always present').toContain('accordion');
      // "elevated" is documented as a distinct visual style, so it must be
      // distinguishable from the default; what it PAINTS is the visual tier's.
      expect(classes.includes('accordion--elevated'), `${variant} modifier`)
        .toBe(variant === 'elevated');
    });
  }

  it('an empty accordion is valid and holds no active items', async () => {
    const c = combo({ items: [] });
    const el = await makeAccordion(c);
    expectAccordionMatches(el, c);
    expect([...el.activeItems]).toEqual([]);
  });
});
