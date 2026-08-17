/**
 * snice-accordion matrix — BEHAVIOUR: exclusivity, the five container methods,
 * the four item entry points, and `disabled`.
 *
 * The cross that carries this component is `multiple` x ENTRY POINT. There are
 * five documented ways to open an item — the header button, Enter/Space on it,
 * `item.toggle()`, `item.expand()`, and the container's
 * `openItem`/`toggleItem` — and `multiple: false` is documented to mean "only
 * one open at a time" for ALL of them. A single-open rule enforced in the
 * click handler but not in the imperative path is the classic version of this
 * bug, and only crossing the entry points against the mode finds it.
 *
 * `disabled` gets the same treatment for the same reason: the doc gives the
 * item one disabled flag, and it must hold against a header click, a keypress,
 * the item's own methods and the container's methods alike.
 *
 * The animation itself is not asserted here — `max-height` animates towards
 * `scrollHeight`, which is zero without layout. That is the visual tier's.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE,
  ariaVector, clickHeader, combo, expect, expectAccordionMatches, itemsOf,
  makeAccordion, openVector, pressHeader, recordContainer, recordItem, specs,
  teardown, wait,
} from './accordion-support';

/** Every documented way to open the item at `index`. */
const OPENERS: Array<{ name: string; open: (el: any, index: number) => void }> = [
  { name: 'header click', open: (el, i) => clickHeader(itemsOf(el)[i]) },
  { name: 'Enter on header', open: (el, i) => pressHeader(itemsOf(el)[i], 'Enter') },
  { name: 'Space on header', open: (el, i) => pressHeader(itemsOf(el)[i], ' ') },
  { name: 'item.toggle()', open: (el, i) => itemsOf(el)[i].toggle() },
  { name: 'item.expand()', open: (el, i) => itemsOf(el)[i].expand() },
  { name: 'container.openItem()', open: (el, i) => el.openItem(`i${i}`) },
  { name: 'container.toggleItem()', open: (el, i) => el.toggleItem(`i${i}`) },
];

describe('snice-accordion matrix — behaviour', () => {
  afterEach(teardown);

  // ── entry point x mode: exclusivity ──────────────────────────────────────
  for (const opener of OPENERS) {
    for (const multiple of [false, true]) {
      it(`${opener.name} in ${multiple ? 'multiple' : 'single'} mode`, async () => {
        const el = await makeAccordion(combo({ multiple }));

        opener.open(el, 0);
        await wait(SETTLE);
        expect(openVector(el), 'first item opened').toEqual([true, false, false]);

        opener.open(el, 1);
        await wait(SETTLE);
        // "multiple: Allow multiple items open" — its absence closes the rest.
        expect(openVector(el), 'second item opened').toEqual(
          multiple ? [true, true, false] : [false, true, false],
        );
        expect(ariaVector(el), 'aria-expanded follows the state').toEqual(
          (multiple ? [true, true, false] : [false, true, false]).map(String),
        );
        expect([...el.activeItems].sort(), 'activeItems agrees')
          .toEqual(multiple ? ['i0', 'i1'] : ['i1']);
      });
    }
  }

  // ── every opener closes again ────────────────────────────────────────────
  for (const opener of OPENERS.filter(o => !o.name.includes('expand') && !o.name.includes('openItem'))) {
    it(`${opener.name} toggles an open item shut`, async () => {
      const el = await makeAccordion(combo({ multiple: true }));
      opener.open(el, 0);
      await wait(SETTLE);
      expect(openVector(el)[0]).toBe(true);

      opener.open(el, 0);
      await wait(SETTLE);
      expect(openVector(el)[0], 'the same gesture closes it').toBe(false);
      expect([...el.activeItems]).toEqual([]);
    });
  }

  it('expand() is idempotent — it opens, it never closes', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const item = itemsOf(el)[0];
    item.expand();
    await wait(SETTLE);
    item.expand();
    await wait(SETTLE);
    expect(item.open, 'expand() on an open item leaves it open').toBe(true);
  });

  it('collapse() is idempotent — it closes, it never opens', async () => {
    const el = await makeAccordion(combo({ items: specs(3, { 0: { open: true } }) }));
    const item = itemsOf(el)[0];
    item.collapse();
    await wait(SETTLE);
    item.collapse();
    await wait(SETTLE);
    expect(item.open).toBe(false);
  });

  it('expand(false) and collapse(false) still change the state', async () => {
    // The documented signature is `expand(animate = true)`; passing false is
    // documented as suppressing the animation, not the state change.
    const el = await makeAccordion(combo({ multiple: true }));
    const item = itemsOf(el)[0];
    item.expand(false);
    await wait(SETTLE);
    expect(item.open, 'expand(false) opens').toBe(true);

    item.collapse(false);
    await wait(SETTLE);
    expect(item.open, 'collapse(false) closes').toBe(false);
  });

  // ── openAll / closeAll ───────────────────────────────────────────────────
  for (const multiple of [false, true]) {
    it(`openAll() in ${multiple ? 'multiple' : 'single'} mode`, async () => {
      const el = await makeAccordion(combo({ multiple }));
      el.openAll();
      await wait(SETTLE);
      // "openAll() - Open all (multiple mode only)".
      expect(openVector(el)).toEqual(
        multiple ? [true, true, true] : [false, false, false],
      );
    });

    it(`closeAll() in ${multiple ? 'multiple' : 'single'} mode`, async () => {
      const el = await makeAccordion(combo({
        multiple, items: specs(3, { 0: { open: true }, 1: multiple ? { open: true } : {} }),
      }));
      el.closeAll();
      await wait(SETTLE);
      expect(openVector(el)).toEqual([false, false, false]);
      expect([...el.activeItems]).toEqual([]);
    });
  }

  it('openAll() skips disabled items even in multiple mode', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: specs(3, { 1: { disabled: true } }),
    }));
    el.openAll();
    await wait(SETTLE);
    expect(openVector(el)).toEqual([true, false, true]);
  });

  // ── disabled holds against every entry point ─────────────────────────────
  for (const opener of OPENERS) {
    it(`a disabled item resists ${opener.name}`, async () => {
      const el = await makeAccordion(combo({
        multiple: true, items: specs(3, { 1: { disabled: true } }),
      }));
      const events = recordContainer(el);

      opener.open(el, 1);
      await wait(SETTLE);

      expect(openVector(el)[1], 'a disabled item never opens').toBe(false);
      expect(events.log, 'and never announces one').toEqual([]);
    });
  }

  it('a disabled item that was authored open can still be closed', async () => {
    // `disabled` is documented as blocking the trigger, not as freezing the
    // state — `closeItem` is how a page recovers from a stuck panel.
    const el = await makeAccordion(combo({
      items: specs(2, { 0: { open: true, disabled: true } }),
    }));
    el.closeItem('i0');
    await wait(SETTLE);
    expect(openVector(el)[0]).toBe(false);
  });

  // ── container methods address items by their documented id ───────────────
  it('openItem / closeItem / toggleItem address items by itemId', async () => {
    const el = await makeAccordion(combo({ multiple: true }));

    el.openItem('i2');
    await wait(SETTLE);
    expect(openVector(el)).toEqual([false, false, true]);

    el.toggleItem('i0');
    await wait(SETTLE);
    expect(openVector(el)).toEqual([true, false, true]);

    el.closeItem('i2');
    await wait(SETTLE);
    expect(openVector(el)).toEqual([true, false, false]);
  });

  it('a container method aimed at an unknown id is a silent no-op', async () => {
    const c = combo({ multiple: true });
    const el = await makeAccordion(c);
    const events = recordContainer(el);

    el.openItem('nope');
    el.closeItem('nope');
    el.toggleItem('nope');
    await wait(SETTLE);

    expect(openVector(el)).toEqual([false, false, false]);
    expect(events.log).toEqual([]);
    expectAccordionMatches(el, c);
  });

  it('auto-generated ids are addressable by the container methods', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: [{ id: undefined }, { id: undefined }],
    }));
    const second = itemsOf(el)[1];
    el.openItem(second.itemId);
    await wait(SETTLE);
    expect(openVector(el)).toEqual([false, true]);
  });

  // ── single mode with a pre-opened item ───────────────────────────────────
  it('single mode closes the item authored open when another is opened', async () => {
    const el = await makeAccordion(combo({ items: specs(3, { 0: { open: true } }) }));
    clickHeader(itemsOf(el)[2]);
    await wait(SETTLE);
    expect(openVector(el)).toEqual([false, false, true]);
    expect([...el.activeItems]).toEqual(['i2']);
  });

  it('single mode leaves the accordion fully closed when the open item is clicked', async () => {
    const el = await makeAccordion(combo({ items: specs(3, { 1: { open: true } }) }));
    clickHeader(itemsOf(el)[1]);
    await wait(SETTLE);
    expect(openVector(el)).toEqual([false, false, false]);
    expect([...el.activeItems]).toEqual([]);
  });

  it('a keypress that is neither Enter nor Space leaves the item alone', async () => {
    const el = await makeAccordion(combo());
    const item = itemsOf(el)[0];
    const events = recordItem(item);
    for (const key of ['a', 'Tab', 'Escape', 'ArrowRight']) pressHeader(item, key);
    await wait(SETTLE);
    expect(item.open).toBe(false);
    expect(events.log).toEqual([]);
  });
});
