/**
 * Smoke slice of the snice-accordion matrix — the everyday-loop tier.
 *
 * One combo per feature family, so a family that breaks cannot hide:
 *
 *   · structure   — the five documented item parts and the header/region ARIA;
 *   · ids         — the documented auto-generated id, addressable by the
 *                   container methods;
 *   · exclusivity — single mode closes the previous item, multiple does not;
 *   · methods     — openAll/closeAll and their "multiple mode only" clause;
 *   · disabled    — a disabled item resists its trigger;
 *   · events      — accordion-open / accordion-close / accordion-item-toggle.
 *
 * Structure routes through the matrix oracle (`expectAccordionMatches`).
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE,
  ariaVector, clickHeader, combo, expect, expectAccordionMatches, itemsOf,
  makeAccordion, openVector, recordContainer, recordItem, specs, teardown, wait,
} from './accordion-support';

describe('accordion matrix smoke', () => {
  afterEach(teardown);

  it('structure: the documented parts, slots and header ARIA render', async () => {
    const c = combo({ variant: 'elevated', items: specs(2, { 0: { open: true } }) });
    const el = await makeAccordion(c);
    expectAccordionMatches(el, c);
    expect(ariaVector(el)).toEqual(['true', 'false']);
  });

  it('ids: an id-less item is auto-named and stays addressable', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: [{ id: undefined }, { id: undefined }],
    }));
    const ids = itemsOf(el).map(item => item.itemId);
    expect(new Set(ids).size).toBe(2);

    el.openItem(ids[1]);
    await wait(SETTLE);
    expect(openVector(el)).toEqual([false, true]);
  });

  it('exclusivity: single mode closes the previous item, multiple does not', async () => {
    const single = await makeAccordion(combo());
    clickHeader(itemsOf(single)[0]);
    await wait(SETTLE);
    clickHeader(itemsOf(single)[1]);
    await wait(SETTLE);
    expect(openVector(single)).toEqual([false, true, false]);
    teardown();

    const many = await makeAccordion(combo({ multiple: true }));
    clickHeader(itemsOf(many)[0]);
    await wait(SETTLE);
    clickHeader(itemsOf(many)[1]);
    await wait(SETTLE);
    expect(openVector(many)).toEqual([true, true, false]);
  });

  it('methods: openAll is multiple-only, closeAll always closes', async () => {
    const single = await makeAccordion(combo());
    single.openAll();
    await wait(SETTLE);
    expect(openVector(single), 'openAll is documented multiple-only')
      .toEqual([false, false, false]);
    teardown();

    const many = await makeAccordion(combo({ multiple: true }));
    many.openAll();
    await wait(SETTLE);
    expect(openVector(many)).toEqual([true, true, true]);

    many.closeAll();
    await wait(SETTLE);
    expect(openVector(many)).toEqual([false, false, false]);
  });

  it('disabled: the item resists its own trigger and the container methods', async () => {
    const el = await makeAccordion(combo({
      multiple: true, items: specs(2, { 1: { disabled: true } }),
    }));
    const events = recordContainer(el);

    clickHeader(itemsOf(el)[1]);
    el.openItem('i1');
    el.toggleItem('i1');
    await wait(SETTLE);

    expect(openVector(el)).toEqual([false, false]);
    expect(events.log).toEqual([]);
  });

  it('events: the container and item events carry their documented details', async () => {
    const el = await makeAccordion(combo({ multiple: true }));
    const container = recordContainer(el);
    const item = recordItem(itemsOf(el)[0]);

    clickHeader(itemsOf(el)[0]);
    await wait(SETTLE);
    clickHeader(itemsOf(el)[0]);
    await wait(SETTLE);

    expect(container.log).toEqual(['open:i0', 'close:i0']);
    expect(container.details[0].item).toBe(itemsOf(el)[0]);
    expect(item.details).toEqual([{ itemId: 'i0', open: true }, { itemId: 'i0', open: false }]);
  });
});
