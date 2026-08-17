/**
 * snice-sankey — clicking, hovering, and the highlight the doc promises.
 *
 * The doc gives three events and one interaction behaviour:
 *
 *   sankey-node-click → { node: SankeyNode }
 *   sankey-link-click → { link: SankeyLink }
 *   sankey-hover      → { type: 'node'|'link', item } | null
 *   "Hover highlighting dims non-connected elements"
 *
 * AXES: every node and every link of three flow shapes, crossed against the
 * two things a consumer depends on — that the detail is the ORIGINAL datum it
 * handed in (not the component's internal layout node), and that the highlight
 * state returns to neutral when the pointer leaves.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountSankey, nodeGroups, linkGroups, tooltip, text, partEl, captureEvents,
  keysOf, click, moveOver, leave, drawableLinks, DATASETS, wait, SETTLE,
} from './sankey-support';

afterEach(() => { document.body.innerHTML = ''; });

const SHAPES = ['doc', 'chain', 'diamond', 'merge'] as const;

describe('snice-sankey matrix: clicking a node', () => {
  for (const dataset of SHAPES) {
    it(`${dataset}: every node announces itself`, async () => {
      const el = await mountSankey({ dataset });
      const events = captureEvents(el, ['sankey-node-click']);
      const groups = nodeGroups(el);

      for (const group of groups) click(group);
      await wait(SETTLE);

      expect(events).toHaveLength(groups.length);
      for (const event of events) {
        expect(keysOf(event.detail)).toEqual(['node']);
      }
      // The detail is the ORIGINAL node object the consumer handed in — a
      // listener looks up its own record by identity.
      const announced = events.map(event => event.detail.node);
      for (const node of announced) {
        expect(DATASETS[dataset].nodes).toContain(node);
      }
      expect(new Set(announced.map((node: any) => node.id)).size).toBe(groups.length);
    });
  }
});

describe('snice-sankey matrix: clicking a link', () => {
  for (const dataset of SHAPES) {
    it(`${dataset}: every ribbon announces itself`, async () => {
      const el = await mountSankey({ dataset });
      const events = captureEvents(el, ['sankey-link-click']);
      const groups = linkGroups(el);

      for (const group of groups) click(group);
      await wait(SETTLE);

      expect(events).toHaveLength(groups.length);
      for (const event of events) {
        expect(keysOf(event.detail)).toEqual(['link']);
        expect(DATASETS[dataset].links).toContain(event.detail.link);
      }
    });
  }

  it('a ribbon click is not also a node click', async () => {
    // The two events are separate contracts; a consumer that drills on node
    // clicks must not drill when the user picks a flow.
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el);
    click(linkGroups(el)[0]);
    await wait(SETTLE);
    expect(events.map(event => event.type)).toEqual(['sankey-link-click']);
  });

  it('clicking the empty chart announces nothing', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el);
    click(partEl(el, 'chart'));
    await wait(SETTLE);
    expect(events).toEqual([]);
  });
});

describe('snice-sankey matrix: hover', () => {
  for (const dataset of SHAPES) {
    it(`${dataset}: hovering a node announces { type: 'node', item }`, async () => {
      const el = await mountSankey({ dataset });
      const events = captureEvents(el, ['sankey-hover']);

      moveOver(nodeGroups(el)[0]);
      await wait(SETTLE);

      expect(events).toHaveLength(1);
      expect(keysOf(events[0].detail)).toEqual(['item', 'type']);
      expect(events[0].detail.type).toBe('node');
      expect(DATASETS[dataset].nodes).toContain(events[0].detail.item);
    });

    it(`${dataset}: hovering a ribbon announces { type: 'link', item }`, async () => {
      const el = await mountSankey({ dataset });
      const events = captureEvents(el, ['sankey-hover']);

      moveOver(linkGroups(el)[0]);
      await wait(SETTLE);

      expect(events[0].detail.type).toBe('link');
      expect(DATASETS[dataset].links).toContain(events[0].detail.item);
    });
  }

  it('leaving the chart announces null', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el, ['sankey-hover']);

    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    leave(el);
    await wait(SETTLE);

    expect(events).toHaveLength(2);
    expect(events[1].detail).toBeNull();
  });

  it('hovering nothing inside the chart also clears', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const events = captureEvents(el, ['sankey-hover']);

    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    moveOver(partEl(el, 'chart'));
    await wait(SETTLE);

    expect(events[events.length - 1].detail).toBeNull();
  });
});

describe('snice-sankey matrix: the hover highlight', () => {
  it('hovering a node dims the diagram and lights the node up', async () => {
    // "Hover highlighting dims non-connected elements".
    const el = await mountSankey({ dataset: 'diamond' });
    const base = partEl(el, 'base')!;
    expect(base.classList.contains('sankey--dimmed')).toBe(false);

    const group = nodeGroups(el)[0];
    moveOver(group);
    await wait(SETTLE);

    expect(base.classList.contains('sankey--dimmed')).toBe(true);
    expect(group.classList.contains('sankey__node--highlighted')).toBe(true);
  });

  it('a hovered node lights up the ribbons that touch it', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const groups = nodeGroups(el);
    const inNode = groups.find(group => group.getAttribute('data-node-id') === 'in')!;

    moveOver(inNode);
    await wait(SETTLE);

    const links = drawableLinks(DATASETS.diamond);
    const highlighted = linkGroups(el)
      .map((group, index) => (group.classList.contains('sankey__link--highlighted') ? index : -1))
      .filter(index => index >= 0);
    const touching = links
      .map((link, index) => (link.source === 'in' || link.target === 'in' ? index : -1))
      .filter(index => index >= 0);
    expect(highlighted).toEqual(touching);
  });

  it('a hovered ribbon lights up both of its ends', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const links = drawableLinks(DATASETS.diamond);
    const index = 0;

    moveOver(linkGroups(el)[index]);
    await wait(SETTLE);

    const lit = nodeGroups(el)
      .filter(group => group.classList.contains('sankey__node--highlighted'))
      .map(group => group.getAttribute('data-node-id'));
    expect(lit.sort()).toEqual([links[index].source, links[index].target].sort());
  });

  it('leaving restores every mark', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    leave(el);
    await wait(SETTLE);

    expect(partEl(el, 'base')!.classList.contains('sankey--dimmed')).toBe(false);
    expect(nodeGroups(el).filter(g => g.classList.contains('sankey__node--highlighted'))).toEqual([]);
    expect(linkGroups(el).filter(g => g.classList.contains('sankey__link--highlighted'))).toEqual([]);
  });
});

describe('snice-sankey matrix: the tooltip', () => {
  it('a hovered node names itself and its value', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    const tip = tooltip(el)!;
    expect(tip.classList.contains('sankey__tooltip--visible')).toBe(false);

    const sink = nodeGroups(el).find(group => group.getAttribute('data-node-id') === 'sink')!;
    moveOver(sink);
    await wait(SETTLE);

    expect(tip.classList.contains('sankey__tooltip--visible')).toBe(true);
    expect(text(tip)).toBe('Sink Value: 100');
  });

  it('a hovered ribbon names both ends and its value', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    moveOver(linkGroups(el)[0]);
    await wait(SETTLE);
    // Source → Target, with the flow's own value.
    expect(text(tooltip(el))).toBe('A → Sink Value: 30');
  });

  it('leaving hides the tooltip again', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    leave(el);
    await wait(SETTLE);
    expect(tooltip(el)!.classList.contains('sankey__tooltip--visible')).toBe(false);
  });

  it('an unlabelled node is named by its id in the tooltip too', async () => {
    const el = await mountSankey({ dataset: 'unlabelled' });
    moveOver(nodeGroups(el)[0]);
    await wait(SETTLE);
    expect(text(tooltip(el))).toContain('alpha');
  });
});
