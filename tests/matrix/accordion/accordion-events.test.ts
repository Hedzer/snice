/**
 * snice-accordion matrix — EVENTS.
 *
 * Three documented events across two elements:
 *
 *   accordion-open       { itemId, item }   on the CONTAINER
 *   accordion-close      { itemId, item }   on the CONTAINER
 *   accordion-item-toggle{ itemId, open }   on the ITEM
 *
 * The cross is ENTRY POINT x MODE again, but judged on the event stream rather
 * than the state — a component can reach the right state by the wrong route,
 * and a consumer that fetches a section's body on `accordion-open` cares about
 * the route. Single mode is the interesting half: opening B while A is open
 * must produce a close for A as well as an open for B, and neither may be
 * duplicated.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE,
  clickHeader, combo, expect, itemsOf, makeAccordion, recordContainer,
  recordItem, specs, teardown, wait,
} from './accordion-support';

/** The documented ways to change an item's state, for the event cross. */
const ENTRIES: Array<{ name: string; act: (el: any, index: number) => void }> = [
  { name: 'header click', act: (el, i) => clickHeader(itemsOf(el)[i]) },
  { name: 'item.toggle()', act: (el, i) => itemsOf(el)[i].toggle() },
  { name: 'container.toggleItem()', act: (el, i) => el.toggleItem(`i${i}`) },
];

describe('snice-accordion matrix — events', () => {
  afterEach(teardown);

  // ── opening: one accordion-open, with the documented detail ──────────────
  for (const entry of ENTRIES) {
    for (const multiple of [false, true]) {
      it(`${entry.name} announces one open (${multiple ? 'multiple' : 'single'})`, async () => {
        const el = await makeAccordion(combo({ multiple }));
        const events = recordContainer(el);

        entry.act(el, 1);
        await wait(SETTLE);

        expect(events.log).toEqual(['open:i1']);
        expect(events.details[0].itemId).toBe('i1');
        expect(events.details[0].item, 'the detail carries the item element')
          .toBe(itemsOf(el)[1]);
      });

      it(`${entry.name} announces one close (${multiple ? 'multiple' : 'single'})`, async () => {
        const el = await makeAccordion(combo({
          multiple, items: specs(3, { 1: { open: true } }),
        }));
        const events = recordContainer(el);

        entry.act(el, 1);
        await wait(SETTLE);

        expect(events.log).toEqual(['close:i1']);
        expect(events.details[0].itemId).toBe('i1');
      });
    }
  }

  // ── single mode: the displaced item is announced closed ──────────────────
  for (const entry of ENTRIES) {
    it(`${entry.name}: single mode announces the displaced item's close`, async () => {
      const el = await makeAccordion(combo({ items: specs(3, { 0: { open: true } }) }));
      const events = recordContainer(el);

      entry.act(el, 2);
      await wait(SETTLE);

      // Both facts must reach a listener: i0 closed, i2 opened.
      expect(events.log.filter(entry => entry.startsWith('close:')), 'the displaced close')
        .toEqual(['close:i0']);
      expect(events.log.filter(entry => entry.startsWith('open:')), 'the new open')
        .toEqual(['open:i2']);
    });
  }

  it('multiple mode displaces nothing, so it announces nothing extra', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: specs(3, { 0: { open: true } }),
    }));
    const events = recordContainer(el);

    clickHeader(itemsOf(el)[2]);
    await wait(SETTLE);

    expect(events.log).toEqual(['open:i2']);
  });

  // ── the item event ───────────────────────────────────────────────────────
  it('accordion-item-toggle carries { itemId, open } from the item', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const item = itemsOf(el)[1];
    const events = recordItem(item);

    clickHeader(item);
    await wait(SETTLE);
    clickHeader(item);
    await wait(SETTLE);

    expect(events.log).toEqual(['i1:true', 'i1:false']);
    expect(events.details).toEqual([
      { itemId: 'i1', open: true },
      { itemId: 'i1', open: false },
    ]);
  });

  it('accordion-item-toggle bubbles out of the item and is composed', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const seen: any[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent).detail);
    document.addEventListener('accordion-item-toggle', listener);

    clickHeader(itemsOf(el)[0]);
    await wait(SETTLE);
    document.removeEventListener('accordion-item-toggle', listener);

    expect(seen).toEqual([{ itemId: 'i0', open: true }]);
  });

  it('the container events bubble and are composed', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const seen: string[] = [];
    const open = (event: Event) => seen.push(`open:${(event as CustomEvent).detail.itemId}`);
    const close = (event: Event) => seen.push(`close:${(event as CustomEvent).detail.itemId}`);
    document.addEventListener('accordion-open', open);
    document.addEventListener('accordion-close', close);

    clickHeader(itemsOf(el)[0]);
    await wait(SETTLE);
    clickHeader(itemsOf(el)[0]);
    await wait(SETTLE);

    document.removeEventListener('accordion-open', open);
    document.removeEventListener('accordion-close', close);
    expect(seen).toEqual(['open:i0', 'close:i0']);
  });

  // ── no state change, no event ────────────────────────────────────────────
  it('expand() on an already-open item announces nothing', async () => {
    const el = await makeAccordion(combo({ items: specs(2, { 0: { open: true } }) }));
    const events = recordContainer(el);
    itemsOf(el)[0].expand();
    await wait(SETTLE);
    expect(events.log).toEqual([]);
  });

  it('collapse() on an already-closed item announces nothing', async () => {
    const el = await makeAccordion(combo());
    const events = recordContainer(el);
    itemsOf(el)[0].collapse();
    await wait(SETTLE);
    expect(events.log).toEqual([]);
  });

  it('closeAll() on an all-closed accordion announces nothing', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const events = recordContainer(el);
    el.closeAll();
    await wait(SETTLE);
    expect(events.log).toEqual([]);
  });

  it('closeAll() announces one close per item that was open', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: specs(3, { 0: { open: true }, 2: { open: true } }),
    }));
    const events = recordContainer(el);

    el.closeAll();
    await wait(SETTLE);

    expect(events.log.slice().sort()).toEqual(['close:i0', 'close:i2']);
  });

  it('openAll() announces one open per item it opened', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const events = recordContainer(el);

    el.openAll();
    await wait(SETTLE);

    expect(events.log.slice().sort()).toEqual(['open:i0', 'open:i1', 'open:i2']);
  });

  it('assigning open on the item drives the container events too', async () => {
    // The doc gives the item a public `open: boolean`; a page that sets it
    // must reach the container's own event contract.
    const el = await makeAccordion(combo({ multiple: true }));
    const events = recordContainer(el);

    itemsOf(el)[1].open = true;
    await wait(SETTLE);
    itemsOf(el)[1].open = false;
    await wait(SETTLE);

    expect(events.log).toEqual(['open:i1', 'close:i1']);
  });
});
