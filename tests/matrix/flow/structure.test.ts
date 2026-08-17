/**
 * Matrix slice FLOW / STRUCTURE — every graph shape crossed with the grid
 * settings, and the edge presentation fields.
 *
 * Dimensions:
 *   · graph (11) x gridSize (3)   = 33 structure combos
 *   · graph (11) edges            = 11 edge-presentation combos
 *   Total 44.
 *
 * Documented contract (docs/ai/components/flow.md):
 *   · all four CSS parts — base, canvas, nodes, minimap — exist for every
 *     combo, graph or no graph, and the other three nest inside `base`;
 *   · "nodes — Node elements container" holds one element per `FlowNode`, in
 *     the authored order, each showing its `label` (or its `id` when unlabelled)
 *     and its `type` badge when one is authored;
 *   · "input/output ports" — every authored `FlowPort` renders on its own side,
 *     in the authored order;
 *   · "canvas — SVG edge/connection layer" holds one path per `FlowEdge`, and
 *     "bezier curve edges" means each path really is a cubic;
 *   · `FlowEdge.color`, `FlowEdge.animated` and `FlowEdge.label` are honoured.
 *
 * it.fails policy: nothing pinned. This component's findings (MATRIX-flow-1,
 * MATRIX-flow-2, MATRIX-flow-3) are in switches.test.ts and methods.test.ts.
 */
import { describe, it, afterEach } from 'vitest';
import {
  GRAPH_NAMES, GRID_SIZES, combo, comboId, graphOf, makeFlow,
  structureProblems, edgeProblems, expectClean, removeComponent,
} from './flow-support';

describe('flow matrix: structure', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('layers, nodes and ports', () => {
    for (const graph of GRAPH_NAMES) {
      for (const gridSize of GRID_SIZES) {
        const c = combo({ graph, gridSize });

        it(`${comboId(c)}: renders the documented editor`, async () => {
          const data = graphOf(c);
          el = await makeFlow(c, data);
          expectClean(structureProblems(el, c, data), comboId(c));
        });
      }
    }
  });

  describe('edge presentation', () => {
    for (const graph of GRAPH_NAMES) {
      const c = combo({ graph });

      it(`${comboId(c)}: bezier paths, colour and animation`, async () => {
        const data = graphOf(c);
        el = await makeFlow(c, data);
        expectClean(edgeProblems(el, data), comboId(c));
      });
    }
  });
});
