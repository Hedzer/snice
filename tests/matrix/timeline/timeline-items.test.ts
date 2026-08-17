/**
 * snice-timeline matrix — the ITEM cross.
 *
 * `TimelineItem` has five fields; four of them are optional and each one
 * decides whether a documented part exists. This file crosses the item-level
 * surface the layout file holds constant:
 *
 *   · `variant` — five documented values plus "omitted", which the docs say
 *     defaults to 'default' (6);
 *   · `icon` — omitted, an emoji, a plain word, and an image URL, the four
 *     shapes the shared `renderIcon` contract distinguishes (4);
 *   · optional text fields — both, timestamp only, description only, neither
 *     (4).
 *
 * 6 x 4 x 4 = 96 combos, each mounted as a single-item timeline so a
 * divergence names exactly one item's field vector. Plus the edge cases the
 * `items` array itself can be in (empty, one, many) and the caller-array
 * immutability claim `reverse` must not break.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, text } from '../matrix-kit';
import { exactParts } from '../part-exact';
import {
  DOC_ITEMS, VARIANTS, checkTimeline, mountTimeline,
  type TimelineItem, type Variant,
} from './timeline-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * Four points of the documented icon resolution order: no icon at all (the
 * variant's own glyph), an emoji, a built-in catalogue name, and a URL. The
 * remaining branches — `img://`, `text://`, a ligature name that is NOT in the
 * catalogue — are covered once each below rather than crossed against
 * everything, because they are resolution rules, not layout states.
 */
const ICONS = [
  { name: 'none', value: undefined },
  { name: 'emoji', value: '🚀' },
  { name: 'catalogue', value: 'check' },
  { name: 'url', value: '/icons/rocket.svg' },
] as const;

const TEXT_FIELDS = [
  { name: 'both', timestamp: '2024-01-15', description: 'Project started' },
  { name: 'timestamp-only', timestamp: '2024-01-15', description: undefined },
  { name: 'description-only', timestamp: undefined, description: 'Project started' },
  { name: 'title-only', timestamp: undefined, description: undefined },
] as const;

interface ItemCombo {
  id: string;
  item: TimelineItem;
}

const COMBOS: ItemCombo[] = (() => {
  const out: ItemCombo[] = [];
  for (const variant of [undefined, ...VARIANTS] as Array<Variant | undefined>) {
    for (const icon of ICONS) {
      for (const fields of TEXT_FIELDS) {
        const item: TimelineItem = { title: 'Created' };
        if (variant !== undefined) item.variant = variant;
        if (icon.value !== undefined) item.icon = icon.value;
        if (fields.timestamp !== undefined) item.timestamp = fields.timestamp;
        if (fields.description !== undefined) item.description = fields.description;
        out.push({
          id: `variant=${variant ?? 'omitted'}/icon=${icon.name}/fields=${fields.name}`,
          item,
        });
      }
    }
  }
  return out;
})();

describe('timeline matrix: item variant x icon x optional fields', () => {
  for (const combo of COMBOS) {
    it(combo.id, async () => {
      const options = { items: [combo.item] };
      el = await mountTimeline(options);
      expectClean(checkTimeline(el, options), combo.id);
    });
  }
});

describe('timeline matrix: the remaining icon resolution branches', () => {
  const CASES = [
    { id: 'img:// override forces an image', icon: 'img://logo' },
    { id: 'text:// override forces text', icon: 'text:///not/a/path' },
    { id: 'a ligature name outside the catalogue stays text', icon: 'rocket_launch' },
    { id: 'a data: URL is an image', icon: 'data:image/svg+xml,<svg/>' },
    { id: 'an image filename with a query string is an image', icon: 'logo.svg?v=2' },
  ];
  for (const { id, icon } of CASES) {
    it(id, async () => {
      const options = { items: [{ title: 'Created', icon }] };
      el = await mountTimeline(options);
      expectClean(checkTimeline(el, options), `icon=${icon}`);
    });
  }
});

describe('timeline matrix: the items array itself', () => {
  it('items=[] renders a container and no items', async () => {
    const options = { items: [] as TimelineItem[] };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'items=[]');
    expect(exactParts(el, 'item')).toHaveLength(0);
  });

  it('the documented three-item example renders in source order', async () => {
    const options = { items: DOC_ITEMS };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'doc-example');
    expect(exactParts(el, 'item').map(node => text(node.querySelector('[part~="title"]'))))
      .toEqual(['Created', 'Review', 'Launch']);
  });

  it('reverse renders newest-first without mutating the caller\'s array', async () => {
    const items = [...DOC_ITEMS];
    const options = { items, reverse: true };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'doc-example/reverse');
    expect(exactParts(el, 'item').map(node => text(node.querySelector('[part~="title"]'))))
      .toEqual(['Launch', 'Review', 'Created']);
    expect(items.map(item => item.title), 'the caller\'s array was reordered in place')
      .toEqual(['Created', 'Review', 'Launch']);
  });

  it('a re-delivered items array replaces the previous render entirely', async () => {
    const first = { items: [{ title: 'Created', timestamp: '2024-01-15' }] };
    el = await mountTimeline(first);
    expectClean(checkTimeline(el, first), 'redeliver/first');

    const second = { items: [{ title: 'Launch', description: 'Deployed', variant: 'info' as const }] };
    (el as any).items = second.items;
    await new Promise(resolve => setTimeout(resolve, 30));
    expectClean(checkTimeline(el, second), 'redeliver/second');
    expect(exactParts(el, 'item')).toHaveLength(1);
  });

  it('orientation/position/reverse drive the same render through the property channel', async () => {
    const options = {
      orientation: 'horizontal' as const, position: 'alternate' as const,
      reverse: true, items: DOC_ITEMS, viaProperty: true,
    };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'property-channel');
  });
});
