/**
 * Smoke slice of the snice-timeline matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/timeline, 48 layout combos + 96 item combos)
 * runs via `npm run test:matrix`. This file stays collected by the default
 * loop and pays for one combo per family:
 *
 *   · the documented three-item example at its documented defaults;
 *   · `position="alternate"` + `orientation="horizontal"`, the two layout
 *     enumerations reaching the container together;
 *   · `reverse`, the ordering claim, including the caller-array immutability
 *     half of it;
 *   · a bare item (title only) — the shape that decides whether the optional
 *     parts are correctly absent;
 *   · a consumer `icon`, the branch that overrides the variant's own glyph.
 *
 * Every assertion routes through the matrix's own oracle, so this file cannot
 * drift into something weaker than the suite it stands in for.
 * BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, text } from '../matrix-kit';
import { exactParts } from '../part-exact';
import { DOC_ITEMS, checkTimeline, itemsOf, mountTimeline } from './timeline-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const titles = (host: HTMLElement) =>
  exactParts(host, 'item').map(node => text(node.querySelector('[part~="title"]')));

describe('timeline matrix smoke', () => {
  it('the documented example renders vertical/left with all eight parts', async () => {
    const options = { items: DOC_ITEMS };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'defaults');
    expect(titles(el)).toEqual(['Created', 'Review', 'Launch']);
  });

  it('orientation and position both reach the container', async () => {
    const options = {
      orientation: 'horizontal' as const, position: 'alternate' as const, items: DOC_ITEMS,
    };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'horizontal/alternate');
  });

  it('reverse shows the newest event first and leaves the array alone', async () => {
    const items = [...DOC_ITEMS];
    const options = { position: 'right' as const, reverse: true, items };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'right/reverse');
    expect(titles(el)).toEqual(['Launch', 'Review', 'Created']);
    expect(items.map(item => item.title)).toEqual(['Created', 'Review', 'Launch']);
  });

  it('a title-only item renders no timestamp and no description part', async () => {
    const options = { items: itemsOf('bare', 2) };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'bare');
    expect(exactParts(el, 'timestamp')).toHaveLength(0);
    expect(exactParts(el, 'description')).toHaveLength(0);
  });

  it('a consumer icon replaces the variant glyph in the marker', async () => {
    const options = { items: [{ title: 'Review', variant: 'warning' as const, icon: '!' }] };
    el = await mountTimeline(options);
    expectClean(checkTimeline(el, options), 'consumer-icon');
    expect(text(exactParts(el, 'marker')[0])).toContain('!');
  });
});
