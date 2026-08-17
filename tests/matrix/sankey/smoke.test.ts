/**
 * Smoke slice of the snice-sankey matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/sankey/`, 115 combos across data shapes,
 * display switches, alignment, geometry, events and the tooltip) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This
 * file lives at `smoke.test.ts` so it stays collected, and every structural
 * assertion routes through the matrix's own oracle, so it cannot claim less
 * than the suite it stands in for.
 *
 * The marquee combos: the doc's own example, the text switches off, an
 * alignment override, a geometry override, the three events, the tooltip, and
 * the two standing findings.
 *
 * BUDGET: under 10s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountSankey, expectDiagramMatches, comboId, nodeGroups, linkGroups, linkEnds,
  tooltip, text, captureEvents, click, moveOver, leave, drawableLinks,
  DATASETS, wait, SETTLE,
} from './sankey-support';

afterEach(() => { document.body.innerHTML = ''; });

describe('sankey matrix smoke', () => {
  it('the doc example renders one mark per datum', async () => {
    const combo = { dataset: 'doc' as const };
    const el = await mountSankey(combo);
    expectDiagramMatches(el, combo);
  });

  it('labels and values off leaves the geometry intact', async () => {
    const combo = { dataset: 'merge' as const, showLabels: false, showValues: false };
    const el = await mountSankey(combo);
    expectDiagramMatches(el, combo);
  });

  it('right alignment keeps flow running left to right', async () => {
    const combo = { dataset: 'diamond' as const, alignment: 'right' as const };
    const el = await mountSankey(combo);
    expectDiagramMatches(el, combo);
  });

  it('node-width and node-padding overrides hold', async () => {
    const combo = { dataset: 'diamond' as const, nodeWidth: 30, nodePadding: 20 };
    const el = await mountSankey(combo);
    expectDiagramMatches(el, combo);
  });

  it('a node click announces the original node', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el, ['sankey-node-click']);
    click(nodeGroups(el)[0]);
    await wait(SETTLE);
    expect(events).toHaveLength(1);
    expect(DATASETS.diamond.nodes).toContain(events[0].detail.node);
  });

  it('a ribbon click announces the original link', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el, ['sankey-link-click']);
    click(linkGroups(el)[0]);
    await wait(SETTLE);
    expect(events).toHaveLength(1);
    expect(DATASETS.diamond.links).toContain(events[0].detail.link);
  });

  it('hover announces the item and null on leave', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el, ['sankey-hover']);
    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    leave(el);
    await wait(SETTLE);
    expect(events[0].detail.type).toBe('node');
    expect(DATASETS.diamond.nodes).toContain(events[0].detail.item);
    expect(events[events.length - 1].detail).toBeNull();
  });

  it('the tooltip names a node and its value', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    const sink = nodeGroups(el).find(group => group.getAttribute('data-node-id') === 'sink')!;
    moveOver(sink);
    await wait(SETTLE);
    expect(text(tooltip(el))).toBe('Sink Value: 100');
  });

  it('the tooltip names both ends of a ribbon and its value', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    moveOver(linkGroups(el)[0]);
    await wait(SETTLE);
    expect(text(tooltip(el))).toBe('A → Sink Value: 30');
  });

  it('an unlabelled node is named by its id', async () => {
    const el = await mountSankey({ dataset: 'unlabelled' });
    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    expect(text(tooltip(el))).toContain('alpha');
  });

  // ── Standing findings — see tests/matrix/sankey/layout-and-display.test.ts ─

  // MATRIX-sankey-1: a zero-value flow degenerates to a NaN path.
  it.fails('MATRIX-sankey-1: a zero-value flow is drawn as a real ribbon', async () => {
    const el = await mountSankey({ dataset: 'zero' });
    for (const end of linkEnds(el)) {
      expect(Number.isFinite(end.x0) && Number.isFinite(end.y0)).toBe(true);
    }
  });

  // MATRIX-sankey-2: ribbon width follows the target, overflowing its source.
  it.fails('MATRIX-sankey-2: a node is at least as tall as the flow leaving it', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const boxes = [...nodeGroups(el)].map(group => group.querySelector('rect')!);
    const ends = linkEnds(el);
    const links = drawableLinks(DATASETS.diamond);
    for (let i = 0; i < boxes.length; i++) {
      const id = nodeGroups(el)[i].getAttribute('data-node-id')!;
      const outgoing = links
        .map((link, index) => ({ link, end: ends[index] }))
        .filter(entry => entry.link.source === id);
      if (outgoing.length === 0) continue;
      const total = outgoing.reduce((sum, entry) => sum + entry.end.width, 0);
      const height = Number(boxes[i].getAttribute('height'));
      expect(total, `node ${id}`).toBeLessThanOrEqual(height + 1);
    }
  });
});
