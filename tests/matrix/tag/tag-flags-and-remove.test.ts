/**
 * MATRIX slice — snice-tag style booleans and the `tag-remove` contract.
 *
 * Dimensions:
 *   outline (2) x pill (2) x variant (3 representative) x channel (2) = 24
 *   removal: variant (6) x size (3)                                   = 18
 *   inert:   variant (6)                                              = 6
 *
 * `tag-remove -> { tag: SniceTagElement }` (docs/ai/components/tag.md and
 * snice-tag.types.ts) is the tag's ONLY behaviour, so it is crossed against
 * every variant and size rather than sampled — 18 combos is cheap and the
 * event is the whole non-presentational surface of the component.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  product, comboId, expectShape, captureEvents, click, removeComponent,
} from '../matrix-utils';
import {
  VARIANTS, SIZES, CHANNELS, DEFAULTS, LABEL,
  mountTag, expectedShape, readShape, expectedAxes, readAxes,
  removeButton, type TagCombo, type Variant,
} from './tag-support';
import '../../../packages/components/src/tag/snice-tag';

const STYLE_COMBOS: TagCombo[] = product({
  variant: ['default', 'primary', 'danger'] as const,
  outline: [false, true],
  pill: [false, true],
  channel: CHANNELS,
}).map(c => ({ ...c, size: DEFAULTS.size, removable: DEFAULTS.removable }));

const REMOVE_COMBOS: TagCombo[] = product({
  variant: VARIANTS,
  size: SIZES,
}).map(c => ({
  ...c,
  removable: true,
  outline: DEFAULTS.outline,
  pill: DEFAULTS.pill,
  channel: 'attr' as const,
}));

describe('tag matrix: outline x pill are style-only', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const combo of STYLE_COMBOS) {
    const id = comboId(combo);

    it(`${id}: neither boolean adds or removes documented DOM`, async () => {
      // docs list `outline` and `pill` under Properties only; neither appears
      // in CSS Parts, Slots, or Events, so the shape is the plain-tag shape.
      el = await mountTag(combo);
      expectShape(readShape(el), expectedShape(combo), id);
    });

    it(`${id}: both booleans reach the attribute the stylesheet selects on`, async () => {
      el = await mountTag(combo);
      expectShape(readAxes(el, combo), expectedAxes(combo), id);
    });
  }
});

describe('tag matrix: tag-remove contract', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const combo of REMOVE_COMBOS) {
    const id = comboId(combo);

    it(`${id}: pressing remove emits exactly one tag-remove carrying the host`, async () => {
      el = await mountTag(combo);
      const seen = captureEvents(el, ['tag-remove']);

      click(removeButton(el));

      expect(seen.types()).toEqual(['tag-remove']);
      expect(seen.events[0].detail).toEqual({ tag: el });
      seen.stop();
    });

    it(`${id}: tag-remove bubbles and is composed`, async () => {
      el = await mountTag(combo);
      const captured: CustomEvent[] = [];
      const listener = (e: Event) => captured.push(e as CustomEvent);
      document.addEventListener('tag-remove', listener);

      click(removeButton(el));
      document.removeEventListener('tag-remove', listener);

      // Reaching `document` at all proves composed:true crossed the shadow
      // boundary; bubbles is read off the event the listener received.
      expect(captured.length).toBe(1);
      expect(captured[0].bubbles).toBe(true);
      expect(captured[0].composed).toBe(true);
    });

    it(`${id}: the remove press is not also reported as a tag click`, async () => {
      el = await mountTag(combo);
      let hostClicks = 0;
      el.addEventListener('click', () => { hostClicks++; });

      click(removeButton(el));

      expect(hostClicks).toBe(0);
    });

    it(`${id}: the tag stays connected — removal is the consumer's job`, async () => {
      // The doc defines tag-remove as a notification carrying `{ tag }`; no
      // documented behaviour detaches the element.
      el = await mountTag(combo);
      click(removeButton(el));
      expect(el.isConnected).toBe(true);
      expect(removeButton(el)).not.toBeNull();
    });

    it(`${id}: repeated presses emit one event each`, async () => {
      el = await mountTag(combo);
      const seen = captureEvents(el, ['tag-remove']);

      click(removeButton(el));
      click(removeButton(el));
      click(removeButton(el));

      expect(seen.types()).toEqual(['tag-remove', 'tag-remove', 'tag-remove']);
      seen.stop();
    });
  }
});

describe('tag matrix: a non-removable tag has no remove affordance', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const variant of VARIANTS) {
    it(`variant=${variant}: no button, and no tag-remove from any click`, async () => {
      const combo: TagCombo = {
        variant: variant as Variant,
        size: DEFAULTS.size,
        removable: false,
        outline: false,
        pill: false,
        channel: 'attr',
      };
      el = await mountTag(combo, LABEL);
      const seen = captureEvents(el, ['tag-remove']);

      click(el);
      click(el.shadowRoot!.querySelector('[part~="base"]'));
      click(el.shadowRoot!.querySelector('[part~="label"]'));

      expect(removeButton(el)).toBeNull();
      expect(seen.types()).toEqual([]);
      seen.stop();
    });
  }
});
