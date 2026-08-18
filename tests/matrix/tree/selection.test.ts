/**
 * snice-tree matrix — the selection cross.
 *
 * Dimensions (docs/ai/components/tree.md):
 *   selectionMode  single | multiple | none        (3)
 *   selectable     true | false                    (2)
 *   shape          flat | nested | mixed           (3)
 *   entry point    row click | selectNode()        (2)
 *
 * 3 x 2 x 3 x 2 = 36 combos, each one selecting two different enabled nodes in
 * turn so the difference between `single` (the second replaces the first) and
 * `multiple` (both survive) is observed rather than assumed, and every
 * selection-disabled combo is checked to have selected NOTHING through either
 * entry point.
 *
 * The oracle is `checkSelection`, which judges `selectedNodes`,
 * `getSelectedNodes()`, and every row's `aria-selected` / selected class
 * together — a component may keep the property right and the DOM wrong.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, allItems, capture, checkSelection, clickRow, expectClean,
  itemFor, makeTree, nodesFor, removeComponent, rowOf, wait,
  type TreeVector,
} from './tree-support';

let tree: any = null;
afterEach(() => { if (tree) { removeComponent(tree); tree = null; } });

const MODES = ['single', 'multiple', 'none'] as const;
const SHAPES = ['flat', 'nested', 'mixed'] as const;

/** Two enabled, selectable node ids per shape. */
const TARGETS: Record<string, [string, string]> = {
  flat: ['a', 'b'],
  nested: ['src', 'index'],
  mixed: ['ok', 'g1'],
};

/**
 * MATRIX-tree-2 (fixed): through a ROW CLICK, turning selection off used not
 * to hold. `snice-tree-item`'s `handleContentClick` set its own
 * `selected = true` and painted the row before dispatching; `snice-tree`'s
 * early return never rolled that back, so the row announced itself selected
 * while `selectedNodes` stayed empty. The tree now rolls the optimistic paint
 * back when `selectable`/`selectionMode` forbid selection, so every combo
 * below runs unpinned.
 */
describe('tree matrix / selection cross', () => {
  for (const selectionMode of MODES) {
    for (const selectable of [true, false]) {
      for (const shape of SHAPES) {
        for (const entry of ['click', 'api'] as const) {
          const id = `${selectionMode}/selectable=${selectable}/${shape}/${entry}`;
          it(id, async () => {
            const vector: TreeVector = { ...DEFAULTS, selectionMode, selectable };
            tree = await makeTree(vector, nodesFor(shape));
            const problems = new Problems();
            const [first, second] = TARGETS[shape];

            const select = async (nodeId: string) => {
              if (entry === 'click') clickRow(itemFor(tree, nodeId));
              else tree.selectNode(nodeId);
              await wait(20);
            };

            const enabled = selectable && selectionMode !== 'none';

            await select(first);
            checkSelection(problems, tree, vector, enabled ? [first] : []);

            await select(second);
            const expected = !enabled
              ? []
              : selectionMode === 'multiple'
                ? [first, second]
                : [second];
            checkSelection(problems, tree, vector, expected);

            expectClean(problems, id);
          });
        }
      }
    }
  }
});

describe('tree matrix / deselection', () => {
  for (const selectionMode of ['single', 'multiple'] as const) {
    it(`${selectionMode}: deselectNode removes exactly one node`, async () => {
      const vector: TreeVector = { ...DEFAULTS, selectionMode };
      tree = await makeTree(vector, nodesFor('nested'));
      const problems = new Problems();

      tree.selectNode('src');
      tree.selectNode('index');
      await wait(20);
      const afterBoth = selectionMode === 'multiple' ? ['src', 'index'] : ['index'];
      checkSelection(problems, tree, vector, afterBoth);

      tree.deselectNode('index');
      await wait(20);
      checkSelection(problems, tree, vector, afterBoth.filter(id => id !== 'index'));

      expectClean(problems, `deselect/${selectionMode}`);
    });

    it(`${selectionMode}: toggleSelection flips a node both ways`, async () => {
      const vector: TreeVector = { ...DEFAULTS, selectionMode };
      tree = await makeTree(vector, nodesFor('nested'));
      const problems = new Problems();

      tree.toggleSelection('main');
      await wait(20);
      checkSelection(problems, tree, vector, ['main']);

      tree.toggleSelection('main');
      await wait(20);
      checkSelection(problems, tree, vector, []);

      expectClean(problems, `toggle/${selectionMode}`);
    });
  }
});

describe('tree matrix / disabled nodes', () => {
  // "disabled?: boolean" — a disabled row is not selectable through the UI, and
  // its row says so.
  for (const selectionMode of MODES) {
    it(`${selectionMode}: clicking a disabled row selects nothing`, async () => {
      const vector: TreeVector = { ...DEFAULTS, selectionMode };
      tree = await makeTree(vector, nodesFor('mixed'));
      const problems = new Problems();

      clickRow(itemFor(tree, 'no'));
      await wait(20);
      checkSelection(problems, tree, vector, []);

      clickRow(itemFor(tree, 'g2'));
      await wait(20);
      checkSelection(problems, tree, vector, []);

      expectClean(problems, `disabled/${selectionMode}`);
    });
  }
});

describe('tree matrix / tree-node-select', () => {
  // "tree-node-select -> { nodeId, node, selectedNodes, tree }"
  for (const selectionMode of ['single', 'multiple'] as const) {
    it(`${selectionMode}: the event carries the node and the new selection`, async () => {
      tree = await makeTree({ selectionMode }, nodesFor('nested'));
      const seen = capture<any>(tree, 'tree-node-select');

      clickRow(itemFor(tree, 'src'));
      await wait(20);

      expect(seen.length).toBe(1);
      expect(seen[0].nodeId).toBe('src');
      expect(seen[0].node.id).toBe('src');
      expect(seen[0].tree).toBe(tree);
      expect(seen[0].selectedNodes.map((node: any) => node.id)).toEqual(['src']);
    });
  }

  it('a selection-disabled tree emits nothing on a row click', async () => {
    tree = await makeTree({ selectionMode: 'none' }, nodesFor('nested'));
    const seen = capture<any>(tree, 'tree-node-select');

    clickRow(itemFor(tree, 'src'));
    await wait(20);

    expect(seen).toEqual([]);
  });
});

/**
 * MATRIX-tree-1 (fixed): `expandOnClick` used to be declared and never read —
 * a row click only ever selected. With the flag on, a row click on an
 * expandable node now toggles its expansion (docs/ai/components/tree.md:
 * `expandOnClick: boolean = false`, "makes a row click expand instead of only
 * select"). The assertions below are the documented ones and always were.
 */
describe('tree matrix / expand-on-click', () => {
  for (const shape of ['nested', 'deep'] as const) {
    const target = shape === 'nested' ? 'docs' : 'l1';
    it(`${shape}: clicking a row expands it [MATRIX-tree-1]`, async () => {
      tree = await makeTree({ expandOnClick: true }, nodesFor(shape));
      const problems = new Problems();

      const item = itemFor(tree, target);
      const before = rowOf(item)?.getAttribute('aria-expanded');
      clickRow(item);
      await wait(20);
      const after = rowOf(itemFor(tree, target))?.getAttribute('aria-expanded');

      problems.check(before !== after,
        `expand-on-click: aria-expanded stayed "${before}" after a row click`);
      expectClean(problems, `expand-on-click/${shape}`);
    });
  }

  it('expandOnClick=false leaves a row click to selection alone', async () => {
    // The other half of the same documented sentence, and the one that holds.
    tree = await makeTree({ expandOnClick: false }, nodesFor('nested'));
    const problems = new Problems();

    const item = itemFor(tree, 'docs');
    clickRow(item);
    await wait(20);

    problems.equal(rowOf(itemFor(tree, 'docs'))?.getAttribute('aria-expanded'), 'false',
      'a row click expanded the node with expand-on-click off');
    problems.equal(tree.selectedNodes, ['docs'], 'row click selection');

    expectClean(problems, 'expand-on-click/off');
  });
});

describe('tree matrix / selection does not mutate the caller data', () => {
  // The tree clones its input (`buildNodeMap`), so a selection must never write
  // `selected: true` back into the array the application still owns.
  for (const selectionMode of ['single', 'multiple'] as const) {
    it(`${selectionMode}: the input nodes are untouched`, async () => {
      const nodes = nodesFor('nested');
      const snapshot = JSON.stringify(nodes);
      tree = await makeTree({ selectionMode }, nodes);

      clickRow(itemFor(tree, 'src'));
      await wait(20);
      tree.selectNode('index');
      await wait(20);

      expect(JSON.stringify(nodes)).toBe(snapshot);
    });
  }
});

describe('tree matrix / every enabled node is reachable', () => {
  // A selection matrix that only ever clicks the first row proves nothing about
  // the rest. This walks every enabled row of every shape.
  for (const shape of SHAPES) {
    it(`${shape}: each enabled row can be selected in turn`, async () => {
      const vector: TreeVector = { ...DEFAULTS, selectionMode: 'single' };
      tree = await makeTree(vector, nodesFor(shape));
      const problems = new Problems();

      for (const item of allItems(tree)) {
        const node = item.node;
        if (!node || node.disabled) continue;
        clickRow(item);
        await wait(10);
        checkSelection(problems, tree, vector, [node.id]);
      }

      expectClean(problems, `reachable/${shape}`);
    });
  }
});
