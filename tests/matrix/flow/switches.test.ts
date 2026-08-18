/**
 * Matrix slice FLOW / SWITCHES — the five documented booleans and `gridSize`.
 *
 * Dimensions:
 *   · all 2^5 switch vectors, on the doc's own graph   = 32 combos
 *   · snapToGrid x gridSize, as a drag lands            = 12 combos
 *   · zoomEnabled / panEnabled gating                   =  8 combos
 *   · minimap gating                                    =  6 combos
 *   · editable gating                                   =  6 combos
 *   Total 64.
 *
 * Documented contract (docs/ai/components/flow.md):
 *   · `snapToGrid = true` / `gridSize = 20` — "snap-to-grid": a dragged node
 *     comes to rest on a multiple of `gridSize`, and does not when the switch
 *     is off;
 *   · `zoomEnabled = true` — "zoom/pan canvas": with it off, a wheel gesture
 *     must not re-scale the canvas;
 *   · `panEnabled = true` — with it off, a background drag must not move it;
 *   · `minimap = true` — the documented "minimap" panel, present or absent;
 *   · `editable = true` — the switch that says whether this editor edits.
 *
 * ── FINDINGS ───────────────────────────────────────────────────────────────
 *
 * MATRIX-flow-1 (fixed)  `editable = false` used not to stop a node being
 *   edited. A node drag now respects the switch — selection still works, the
 *   position does not move and `node-drag` stays silent. Unpinned below as the
 *   regression guard.
 *
 * MATRIX-flow-2 (fixed)  `minimap = false` used never to hide the minimap
 *   panel: the host template rendered once with the default `true`, and the
 *   `@watch` handler's early return only stopped refreshing it. The panel's
 *   visibility now follows the property both ways, at mount time and after.
 *   Unpinned below as the regression guard.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  GRID_SIZES, combo, comboId, graphOf, makeFlow, readFacts, structureProblems,
  minimapProblems, collectEvents, dragNode, dragCanvas, wheelCanvas, snapTo,
  nodeTransformOf, expectClean, removeComponent, wait, REBUILD,
} from './flow-support';

/** All 2^5 vectors over the documented switches. */
function switchVectors(): Array<Pick<
  ReturnType<typeof combo>, 'snapToGrid' | 'zoomEnabled' | 'panEnabled' | 'minimap' | 'editable'
>> {
  const flags = ['snapToGrid', 'zoomEnabled', 'panEnabled', 'minimap', 'editable'] as const;
  const out: any[] = [];
  for (let bits = 0; bits < 32; bits++) {
    const vector: any = {};
    flags.forEach((flag, i) => { vector[flag] = !!(bits & (1 << i)); });
    out.push(vector);
  }
  return out;
}

describe('flow matrix: switches', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('every switch vector still renders the editor', () => {
    for (const vector of switchVectors()) {
      const c = combo({ graph: 'doc', ...vector });

      it(`${comboId(c)}: the documented layers survive`, async () => {
        const data = graphOf(c);
        el = await makeFlow(c, data);
        expectClean(structureProblems(el, c, data), comboId(c));

        // The minimap's own visibility claim is asserted once per graph in
        // the `minimap` dimension below, not sixteen times through this
        // product.

        // Every switch reaches its property, whatever the others say.
        expect(el.snapToGrid).toBe(c.snapToGrid);
        expect(el.zoomEnabled).toBe(c.zoomEnabled);
        expect(el.panEnabled).toBe(c.panEnabled);
        expect(el.minimap).toBe(c.minimap);
        expect(el.editable).toBe(c.editable);
      });
    }
  });

  describe('snap-to-grid', () => {
    for (const snapToGrid of [true, false]) {
      for (const gridSize of GRID_SIZES) {
        for (const drop of [{ x: 317, y: 243 }, { x: 288, y: 196 }]) {
          const c = combo({ graph: 'doc', snapToGrid, gridSize });
          const id = `${comboId(c)}/drop=${drop.x},${drop.y}`;

          it(`${id}: a dropped node lands ${snapToGrid ? `on a ${gridSize}px multiple` : 'exactly where it was dropped'}`, async () => {
            const data = graphOf(c);
            el = await makeFlow(c, data);
            const seen = collectEvents(el);

            expect(await dragNode(el, 'a', { x: 100, y: 100 }, drop)).toBe(true);

            const drags = seen.filter(event => event.type === 'node-drag');
            expect(drags.length).toBeGreaterThan(0);
            const last = drags[drags.length - 1].detail;

            // "node-drag → { node, x, y }" reports where the node came to rest.
            expect(last.x).toBe(data.nodes[0].x);
            expect(last.y).toBe(data.nodes[0].y);

            if (snapToGrid) {
              expect(last.x % gridSize, `x ${last.x} is not a ${gridSize}px multiple`).toBe(0);
              expect(last.y % gridSize, `y ${last.y} is not a ${gridSize}px multiple`).toBe(0);
              // …and it is the NEAREST multiple to where the pointer let go.
              expect(last.x).toBe(snapTo(last.x, gridSize, true));
            }
          });
        }
      }
    }
  });

  describe('zoomEnabled gates the wheel', () => {
    for (const zoomEnabled of [true, false]) {
      for (const deltaY of [-120, 120]) {
        const c = combo({ graph: 'doc', zoomEnabled });
        const id = `${comboId(c)}/wheel=${deltaY}`;

        it(`${id}: ${zoomEnabled ? 're-scales' : 'leaves'} the canvas ${zoomEnabled ? '' : 'alone'}`, async () => {
          el = await makeFlow(c);
          const before = nodeTransformOf(el, 'b');
          expect(before).not.toBeNull();

          expect(await wheelCanvas(el, deltaY)).toBe(true);
          const after = nodeTransformOf(el, 'b');

          if (zoomEnabled) {
            expect(after).not.toEqual(before);
          } else {
            expect(after).toEqual(before);
          }
        });
      }
    }
  });

  describe('panEnabled gates the background drag', () => {
    for (const panEnabled of [true, false]) {
      for (const [dx, dy] of [[120, 0], [0, -90]]) {
        const c = combo({ graph: 'doc', panEnabled });
        const id = `${comboId(c)}/pan=${dx},${dy}`;

        it(`${id}: ${panEnabled ? 'moves' : 'does not move'} the canvas`, async () => {
          el = await makeFlow(c);
          const before = nodeTransformOf(el, 'a');

          expect(await dragCanvas(el, dx, dy)).toBe(true);
          const after = nodeTransformOf(el, 'a');

          if (panEnabled) {
            expect(after).toEqual({ left: before!.left + dx, top: before!.top + dy });
          } else {
            expect(after).toEqual(before);
          }
          // Panning is a VIEW operation: the node's own coordinates never move.
          expect(el.nodes[0].x).toBe(50);
          expect(el.nodes[0].y).toBe(50);
        });
      }
    }
  });

  describe('minimap', () => {
    for (const graph of ['empty', 'doc', 'large'] as const) {
      for (const minimap of [true, false]) {
        const c = combo({ graph, minimap });

        it(`${comboId(c)}: the panel is ${minimap ? 'shown' : 'hidden'} as authored${
          minimap ? '' : ' [MATRIX-flow-2 (fixed)]'}`, async () => {
          const data = graphOf(c);
          el = await makeFlow(c, data);
          expectClean(minimapProblems(el, c, data), comboId(c));
        });
      }
    }
  });

  describe('editable', () => {
    for (const editable of [true, false]) {
      const c = combo({ graph: 'doc', editable });

      it(`${comboId(c)}: node selection still works`, async () => {
        // Selection is a VIEW operation, not an edit, so it is unaffected by
        // the switch either way — which is what isolates MATRIX-flow-1 to
        // dragging rather than to interaction in general.
        el = await makeFlow(c);
        const seen = collectEvents(el);

        await dragNode(el, 'a', { x: 100, y: 100 }, { x: 100, y: 100 });

        const selects = seen.filter(event => event.type === 'node-select');
        expect(selects.length).toBeGreaterThan(0);
        expect(selects[0].detail.node.id).toBe('a');
      });
    }

    it('an editable flow moves a dragged node', async () => {
      const c = combo({ graph: 'doc', editable: true });
      const data = graphOf(c);
      el = await makeFlow(c, data);
      const seen = collectEvents(el);

      expect(await dragNode(el, 'a', { x: 100, y: 100 }, { x: 300, y: 240 })).toBe(true);

      expect(seen.filter(event => event.type === 'node-drag').length).toBeGreaterThan(0);
      expect(data.nodes[0].x).not.toBe(50);
    });

    // ── MATRIX-flow-1 (fixed) ───────────────────────────────────────────────
    it('MATRIX-flow-1 (fixed) editable=false leaves a dragged node where it was', async () => {
      const c = combo({ graph: 'doc', editable: false });
      const data = graphOf(c);
      const before = { x: data.nodes[0].x, y: data.nodes[0].y };
      el = await makeFlow(c, data);
      const seen = collectEvents(el);

      expect(await dragNode(el, 'a', { x: 100, y: 100 }, { x: 300, y: 240 })).toBe(true);

      expect(seen.filter(event => event.type === 'node-drag')).toHaveLength(0);
      expect({ x: data.nodes[0].x, y: data.nodes[0].y }).toEqual(before);
    });

    it('MATRIX-flow-1 (fixed) editable=false blocks the drag at every grid setting', async () => {
      const c = combo({ graph: 'chain', editable: false, snapToGrid: false });
      const data = graphOf(c);
      const before = data.nodes.map(node => ({ x: node.x, y: node.y }));
      el = await makeFlow(c, data);

      await dragNode(el, 'n2', { x: 200, y: 100 }, { x: 420, y: 310 });

      expect(data.nodes.map(node => ({ x: node.x, y: node.y }))).toEqual(before);
    });
  });

  // ── MATRIX-flow-2 (fixed) ─────────────────────────────────────────────────
  describe('MATRIX-flow-2 (fixed): minimap after mount', () => {
    it('assigning minimap = false hides the panel', async () => {
      const c = combo({ graph: 'doc', minimap: true });
      const data = graphOf(c);
      el = await makeFlow(c, data);
      expect(readFacts(el).minimapHidden).toBe(false);

      el.minimap = false;
      await wait(REBUILD);

      expect(el.minimap).toBe(false);
      expect(readFacts(el).minimapHidden, 'the minimap panel is still visible').toBe(true);
    });

    it('assigning minimap = true does repaint the panel', async () => {
      // The other direction works, which is what makes the finding a one-way
      // gap rather than a property that is simply inert.
      const c = combo({ graph: 'doc', minimap: false });
      const data = graphOf(c);
      el = await makeFlow(c, data);
      expect(readFacts(el).minimapNodes).toBe(0);

      el.minimap = true;
      await wait(REBUILD);

      expect(readFacts(el).minimapNodes).toBe(data.nodes.length);
    });

    it('minimap authored false at mount time hides the panel', async () => {
      const c = combo({ graph: 'doc', minimap: false });
      el = await makeFlow(c);
      expect(el.minimap).toBe(false);
      expect(readFacts(el).minimapHidden, 'the minimap panel is still in the layout').toBe(true);
    });

    it('minimap=false hides the panel and empties it', async () => {
      // What IS true after the fix, stated positively: the panel is absent
      // from the layout and carries no stale contents.
      const c = combo({ graph: 'doc', minimap: false });
      el = await makeFlow(c);
      const facts = readFacts(el);
      expect(facts.minimapHidden).toBe(true);
      expect(facts.minimapNodes).toBe(0);
      expect(facts.minimapEdges).toBe(0);
    });
  });
});
