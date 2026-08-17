/**
 * snice-sankey — the laid-out diagram, across data shapes and display switches.
 *
 * AXES:
 *   dataset      11 flow shapes (the doc's example, the empty default, nodes
 *                with no links, a chain, a diamond, a merge, unlabelled nodes,
 *                a zero flow, a dangling link, a cycle, a steep ratio, markup)
 *   showLabels   on | off
 *   showValues   on | off
 *   alignment    the four documented values
 *   nodeWidth    the default plus two overrides
 *   nodePadding  the default plus two overrides
 *
 * The dataset x labels x values cross is the body of the matrix; the alignment
 * and geometry sweeps below cross the same oracle against the four documented
 * column placements.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountSankey, expectDiagramMatches, comboId, nodeGroups, linkGroups, nodeBoxes,
  linkEnds, labels, values, text, sr, partEl, svg, DATASETS, ALIGNMENTS, VIEW,
  drawableLinks, wait, SETTLE,
} from './sankey-support';

afterEach(() => { document.body.innerHTML = ''; });

const DATASET_NAMES = Object.keys(DATASETS) as Array<keyof typeof DATASETS>;

describe('snice-sankey matrix: data shapes x text switches', () => {
  /**
   * FINDING MATRIX-sankey-1 (the `zero` dataset only).
   *
   * `SankeyLink.value: number` admits zero, and a zero flow is ordinary data —
   * a funnel stage nobody reached, a route with no traffic this week. The
   * layout recomputes every ribbon's width from its TARGET
   * (`value / target.value * target.height`), and a node whose only inflow is
   * zero has `value === 0`, so the division is `0 / 0`. The ribbon is emitted
   * as `d="M100,NaN C300,NaN 300,NaN 500,NaN"` with `stroke-width="NaN"`: an
   * undrawable path, and NaN coordinates in the serialised SVG.
   *
   * The assertions stay as they are — a zero-value link is still a link.
   */
  for (const dataset of DATASET_NAMES) {
    for (const showLabels of [true, false]) {
      for (const showValues of [true, false]) {
        const combo = { dataset, showLabels, showValues };
        const declare = dataset === 'zero' ? it.fails : it;
        const prefix = dataset === 'zero' ? 'MATRIX-sankey-1: ' : '';
        declare(`${prefix}${comboId(combo)}`, async () => {
          const el = await mountSankey(combo);
          expectDiagramMatches(el, combo);
        });
      }
    }
  }

  it('MATRIX-sankey-1 reproduces: a zero-value flow is emitted as a NaN path', async () => {
    const el = await mountSankey({ dataset: 'zero' });
    const ends = linkEnds(el);
    expect(ends).toHaveLength(2);
    // The non-zero flow is fine; only the zero one degenerates.
    expect(Number.isFinite(ends[0].x0) && Number.isFinite(ends[0].y0)).toBe(true);
    const raw = el.shadowRoot!.querySelectorAll('g.sankey__link path')[1];
    expect(raw.getAttribute('d')).toContain('NaN');
    expect(raw.getAttribute('stroke-width')).toBe('NaN');
  });
});

describe('snice-sankey matrix: alignment', () => {
  for (const alignment of ALIGNMENTS) {
    for (const dataset of ['chain', 'diamond', 'merge'] as const) {
      const combo = { dataset, alignment };
      it(comboId(combo), async () => {
        const el = await mountSankey(combo);
        expectDiagramMatches(el, combo);
      });
    }
  }

  it('every alignment lays the columns out left to right', async () => {
    // Whatever the alignment does to the ENDS of the diagram, flow still runs
    // in one direction: a source is never to the right of its target.
    for (const alignment of ALIGNMENTS) {
      const el = await mountSankey({ dataset: 'chain', alignment });
      const boxes = nodeBoxes(el);
      const byId = Object.fromEntries(boxes.map(box => [box.id, box]));
      for (const link of DATASETS.chain.links) {
        expect(byId[link.source].x, `${alignment}: ${link.source} → ${link.target}`)
          .toBeLessThan(byId[link.target].x);
      }
    }
  });

  it('a sink is pushed to the last column by right and justify', async () => {
    // "alignment: 'left'|'right'|'center'|'justify'" — right and justify both
    // pin the nodes with no outgoing flow to the far column.
    for (const alignment of ['right', 'justify'] as const) {
      const el = await mountSankey({ dataset: 'merge', alignment });
      const boxes = nodeBoxes(el);
      const sink = boxes.find(box => box.id === 'sink')!;
      const others = boxes.filter(box => box.id !== 'sink');
      for (const other of others) {
        expect(sink.x, `${alignment}`).toBeGreaterThan(other.x);
      }
    }
  });

  it('changing alignment relays the diagram out', async () => {
    const el = await mountSankey({ dataset: 'merge', alignment: 'left' });
    const before = nodeBoxes(el).map(box => box.x);
    el.alignment = 'center';
    await wait(SETTLE);
    expect(nodeBoxes(el)).toHaveLength(before.length);
  });
});

describe('snice-sankey matrix: node geometry', () => {
  for (const nodeWidth of [4, 20, 48]) {
    const combo = { dataset: 'diamond' as const, nodeWidth };
    it(`node-width=${nodeWidth} is the width of every node`, async () => {
      const el = await mountSankey(combo);
      expectDiagramMatches(el, combo);
    });
  }

  for (const nodePadding of [0, 10, 40]) {
    const combo = { dataset: 'diamond' as const, nodePadding };
    it(`node-padding=${nodePadding} keeps the column inside the viewport`, async () => {
      const el = await mountSankey(combo);
      expectDiagramMatches(el, combo);
    });
  }

  it('nodes in a column never overlap', async () => {
    // The padding exists to separate them; an overlap is two flows drawn on
    // top of each other.
    for (const nodePadding of [0, 10, 40]) {
      const el = await mountSankey({ dataset: 'diamond', nodePadding });
      const boxes = nodeBoxes(el);
      const columns = new Map<number, typeof boxes>();
      for (const box of boxes) {
        const column = columns.get(Math.round(box.x)) ?? [];
        column.push(box);
        columns.set(Math.round(box.x), column);
      }
      for (const column of columns.values()) {
        const sorted = [...column].sort((a, b) => a.y - b.y);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].y, `padding=${nodePadding}`)
            .toBeGreaterThanOrEqual(sorted[i - 1].y + sorted[i - 1].h - 0.01);
        }
      }
    }
  });

  /**
   * FINDING MATRIX-sankey-2.
   *
   * A Sankey's defining property is conservation: a ribbon's thickness is its
   * value, so the ribbons LEAVING a node cannot be thicker than the node they
   * leave. The layout computes each ribbon's width from its source
   * (`value / source.value * source.height`) and then, in a second pass over
   * the same links, OVERWRITES it with the target's proportion
   * (`value / target.value * target.height`). Only the second number survives,
   * so a ribbon flowing into a taller node is drawn thicker than its source:
   * in the diamond, node `x` is 186 tall and its single outgoing ribbon is
   * drawn 192 wide, visibly overflowing the node it comes out of.
   */
  it.fails('MATRIX-sankey-2: a node is at least as tall as the flow leaving it', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const boxes = nodeBoxes(el);
    const ends = linkEnds(el);
    const links = drawableLinks(DATASETS.diamond);

    for (const box of boxes) {
      const outgoing = links
        .map((link, index) => ({ link, end: ends[index] }))
        .filter(entry => entry.link.source === box.id);
      if (outgoing.length === 0) continue;
      const total = outgoing.reduce((sum, entry) => sum + entry.end.width, 0);
      expect(total, `node ${box.id}`).toBeLessThanOrEqual(box.h + 1);
    }
  });

  it('MATRIX-sankey-2 reproduces: the ribbon width follows the target, not the source', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    const boxes = nodeBoxes(el);
    const ends = linkEnds(el);
    const links = drawableLinks(DATASETS.diamond);

    const source = boxes.find(box => box.id === 'x')!;
    const target = boxes.find(box => box.id === 'out')!;
    const index = links.findIndex(link => link.source === 'x' && link.target === 'out');
    const width = ends[index].width;

    // 60/60 of x's height would be 186; 60/100 of out's height is 192.
    expect(Math.round(width)).toBe(Math.round((60 / 100) * target.h));
    expect(width).toBeGreaterThan(source.h);
  });

  it('a ribbon entering a node fits inside it', async () => {
    // The half of conservation the second pass does get right — the guard that
    // MATRIX-sankey-2 is one pass overwriting the other, not the widths being
    // arbitrary.
    const el = await mountSankey({ dataset: 'diamond' });
    const boxes = nodeBoxes(el);
    const ends = linkEnds(el);
    const links = drawableLinks(DATASETS.diamond);

    for (const box of boxes) {
      const incoming = links
        .map((link, index) => ({ link, end: ends[index] }))
        .filter(entry => entry.link.target === box.id);
      if (incoming.length === 0) continue;
      const total = incoming.reduce((sum, entry) => sum + entry.end.width, 0);
      expect(total, `node ${box.id}`).toBeLessThanOrEqual(box.h + 1);
    }
  });

  it('a bigger flow is a thicker ribbon', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    const ends = linkEnds(el);
    const links = drawableLinks(DATASETS.merge);
    const thirty = ends[links.findIndex(link => link.value === 30)];
    const seventy = ends[links.findIndex(link => link.value === 70)];
    expect(seventy.width).toBeGreaterThan(thirty.width);
  });

  it('the steep ratio still draws both ribbons', async () => {
    // 100000 against 1: the thin one is documented data like any other, and a
    // ribbon of width 0 is a flow the reader cannot see at all.
    const el = await mountSankey({ dataset: 'steep' });
    const ends = linkEnds(el);
    expect(ends).toHaveLength(2);
    for (const end of ends) {
      expect(end.width).toBeGreaterThan(0);
    }
  });
});

describe('snice-sankey matrix: what the diagram says', () => {
  it('a node with no label is named by its id', async () => {
    const el = await mountSankey({ dataset: 'unlabelled' });
    expect(labels(el).map(text).sort()).toEqual(['alpha', 'beta']);
  });

  it('show-values writes the value flowing through each node', async () => {
    const el = await mountSankey({ dataset: 'merge', showValues: true });
    const shown = values(el).map(text).sort();
    // A source carries what it sends, a sink what it receives.
    expect(shown).toEqual(['100', '30', '70']);
  });

  it('markup in a label is text, not markup', async () => {
    const el = await mountSankey({ dataset: 'markup' });
    expect(sr(el).querySelector('script')).toBeNull();
    expect(labels(el).map(text).join(' ')).toContain('<script>');
  });

  it('a dangling link is skipped, not drawn to nowhere', async () => {
    // A link naming a node that is not in `nodes` cannot be laid out; drawing
    // it would put a ribbon at NaN.
    const el = await mountSankey({ dataset: 'danglingLink' });
    expect(linkGroups(el)).toHaveLength(1);
    for (const end of linkEnds(el)) {
      expect(Number.isFinite(end.x0)).toBe(true);
      expect(Number.isFinite(end.x1)).toBe(true);
    }
  });

  it('a cycle terminates and still draws both flows', async () => {
    const el = await mountSankey({ dataset: 'cycle' });
    expect(nodeGroups(el)).toHaveLength(2);
    expect(linkGroups(el)).toHaveLength(2);
  });

  it('the documented empty default draws an empty chart', async () => {
    const el = await mountSankey({ dataset: 'empty' });
    expect(nodeGroups(el)).toEqual([]);
    expect(linkGroups(el)).toEqual([]);
    // The parts survive, ready for the next `data` assignment.
    expect(partEl(el, 'chart')).toBeTruthy();
  });

  it('nodes with no links draw nothing', async () => {
    // A Sankey diagram is made of flows; nodes alone have no height to take.
    const el = await mountSankey({ dataset: 'nodesOnly' });
    expect(nodeGroups(el)).toEqual([]);
  });

  it('the chart declares a viewBox that contains every mark', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    expect(svg(el)!.getAttribute('viewBox')).toBe(`0 0 ${VIEW.width} ${VIEW.height}`);
  });
});

describe('snice-sankey matrix: re-assignment', () => {
  it('assigning new data replaces the whole diagram', async () => {
    const el = await mountSankey({ dataset: 'doc' });
    expect(nodeGroups(el)).toHaveLength(2);

    el.data = DATASETS.diamond;
    await wait(SETTLE);
    expect(nodeGroups(el)).toHaveLength(4);
    expect(linkGroups(el)).toHaveLength(4);
  });

  it('assigning the empty default clears the diagram', async () => {
    const el = await mountSankey({ dataset: 'diamond' });
    el.data = { nodes: [], links: [] };
    await wait(SETTLE);
    expect(nodeGroups(el)).toEqual([]);
  });

  it('toggling a text switch redraws without new data', async () => {
    const el = await mountSankey({ dataset: 'merge' });
    expect(labels(el).length).toBeGreaterThan(0);

    el.showLabels = false;
    await wait(SETTLE);
    expect(labels(el)).toEqual([]);

    el.showValues = false;
    await wait(SETTLE);
    expect(values(el)).toEqual([]);
  });
});
