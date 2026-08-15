/**
 * snice-tree matrix — the expansion cross.
 *
 * Dimensions (docs/ai/components/tree.md):
 *   shape    nested | deep | lazy | mixed                              (4)
 *   entry    expandNode | collapseNode | toggleNode | expander click   (4)
 *   plus the two bulk methods (expandAll / collapseAll) and the lazy path.
 *
 * 4 x 4 = 16 combos in the cross, plus 8 bulk combos, the three expansion
 * events, and the documented lazy-load handshake.
 *
 * SIMULATION BOUNDARY: happy-dom performs no layout, so "collapsed" is judged
 * by the documented state a reader and a stylesheet both see — `aria-expanded`
 * on the row and the `tree-item__children--expanded` class on the group — not
 * by measured height. Whether a collapsed subtree really disappears is the
 * visual tier's job.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  Problems, allItems, capture, clickExpander, expectClean, itemFor, itemPart,
  makeTree, nodesFor, removeComponent, rowOf, wait,
} from './tree-support';

let tree: any = null;
afterEach(() => { if (tree) { removeComponent(tree); tree = null; } });

const SHAPES = ['nested', 'deep', 'lazy', 'mixed'] as const;

/** An expandable node per shape, and whether the fixture starts it expanded. */
const TARGETS: Record<string, { id: string; startsExpanded: boolean }> = {
  nested: { id: 'docs', startsExpanded: false },
  deep: { id: 'l1', startsExpanded: true },
  lazy: { id: 'local', startsExpanded: false },
  mixed: { id: 'group', startsExpanded: true },
};

/** The documented expansion state of one node, read from the rendered row. */
function expansionOf(tree: any, id: string): { aria: string | null; group: boolean } {
  const item = itemFor(tree, id);
  const group = itemPart(item, 'children');
  return {
    aria: rowOf(item)?.getAttribute('aria-expanded') ?? null,
    group: !!group?.classList.contains('tree-item__children--expanded'),
  };
}

/** aria-expanded and the group class must never disagree. */
function checkAgreement(problems: Problems, tree: any, id: string, expanded: boolean): void {
  const state = expansionOf(tree, id);
  problems.equal(state.aria, String(expanded), `${id}: aria-expanded`);
  problems.equal(state.group, expanded, `${id}: children--expanded class`);
}

/**
 * FINDING — MATRIX-tree-4.
 *
 * docs/ai/components/tree.md documents five programmatic expansion methods:
 * `expandNode(id)`, `collapseNode(id)`, `toggleNode(id)`, `expandAll()` and
 * `collapseAll()`. None of them changes what is rendered.
 *
 * Each one writes `expanded` onto the CLONE it looks up in `nodeMap`, then
 * re-assigns `this.nodes = [...this.nodes]` to force a re-render. The re-render
 * runs `updateTreeItems()`, which hands each row `this.nodes[index]` — the
 * CALLER's node object, not the clone that was just written. So the new state
 * lands somewhere the renderer never reads: `getNode(id).expanded` reports
 * `true`, `tree-node-expand` fires with the node, and the row still says
 * `aria-expanded="false"` with a collapsed children group.
 *
 * The expander chevron is unaffected — `snice-tree-item.expand()` sets its own
 * `expanded` property — which is why the same combos pass through that entry
 * point and fail through every documented method.
 *
 * A combo is affected exactly when a documented method is asked to CHANGE the
 * state; asking for the state a node already has is a no-op either way. The
 * assertions below are the documented ones and stay that way.
 */
const brokenByApi = (entry: string, startsExpanded: boolean) => {
  if (entry === 'expander') return false;
  if (entry === 'toggleNode') return true;
  return entry === 'expandNode' ? !startsExpanded : startsExpanded;
};

describe('tree matrix / expansion cross', () => {
  for (const shape of SHAPES) {
    for (const entry of ['expandNode', 'collapseNode', 'toggleNode', 'expander'] as const) {
      const broken = brokenByApi(entry, TARGETS[shape].startsExpanded);
      const id = `${broken ? 'MATRIX-tree-4: ' : ''}${shape}/${entry}`;
      (broken ? it.fails : it)(id, async () => {
        const target = TARGETS[shape];
        tree = await makeTree({}, nodesFor(shape));
        const problems = new Problems();

        checkAgreement(problems, tree, target.id, target.startsExpanded);

        let expected = target.startsExpanded;
        switch (entry) {
          case 'expandNode':
            tree.expandNode(target.id);
            expected = true;
            break;
          case 'collapseNode':
            tree.collapseNode(target.id);
            expected = false;
            break;
          case 'toggleNode':
            tree.toggleNode(target.id);
            expected = !target.startsExpanded;
            break;
          case 'expander':
            clickExpander(itemFor(tree, target.id));
            expected = !target.startsExpanded;
            break;
        }
        await wait(30);

        checkAgreement(problems, tree, target.id, expected);
        expectClean(problems, id);
      });
    }
  }
});

describe('tree matrix / leaves cannot expand', () => {
  // "children?: TreeNode[]" — a node without children (and without `lazy`) has
  // nothing to show, so every expansion entry point must leave it alone.
  for (const shape of ['flat', 'nested', 'mixed'] as const) {
    it(`${shape}: a leaf stays collapsed however it is pushed`, async () => {
      tree = await makeTree({}, nodesFor(shape));
      const problems = new Problems();

      for (const item of allItems(tree)) {
        const node = item.node;
        if (!node || node.children?.length || node.lazy) continue;
        tree.expandNode(node.id);
        tree.toggleNode(node.id);
        clickExpander(item);
        await wait(10);
        problems.equal(rowOf(itemFor(tree, node.id))?.getAttribute('aria-expanded'), null,
          `leaf ${node.id} advertises an expanded state`);
      }

      expectClean(problems, `leaf/${shape}`);
    });
  }
});

// MATRIX-tree-4 again, through the two bulk methods. `expandAll()` is affected
// on any shape that starts with a collapsed parent, `collapseAll()` on any
// shape that starts with an expanded one — the same "asked to change" rule.
const EXPAND_ALL_BROKEN = new Set(['nested', 'lazy']);
const COLLAPSE_ALL_BROKEN = new Set(['nested', 'deep', 'mixed']);

describe('tree matrix / expandAll and collapseAll', () => {
  for (const shape of SHAPES) {
    const expandBroken = EXPAND_ALL_BROKEN.has(shape);
    const collapseBroken = COLLAPSE_ALL_BROKEN.has(shape);
    (expandBroken ? it.fails : it)(`${expandBroken ? 'MATRIX-tree-4: ' : ''}${shape}: expandAll expands every node that has children`, async () => {
      const nodes = nodesFor(shape);
      tree = await makeTree({}, nodes);
      const problems = new Problems();

      tree.expandAll();
      await wait(30);

      for (const item of allItems(tree)) {
        const node = item.node;
        if (!node?.children?.length) continue;
        checkAgreement(problems, tree, node.id, true);
      }

      expectClean(problems, `expandAll/${shape}`);
    });

    (collapseBroken ? it.fails : it)(`${collapseBroken ? 'MATRIX-tree-4: ' : ''}${shape}: collapseAll collapses every node that has children`, async () => {
      tree = await makeTree({}, nodesFor(shape));
      const problems = new Problems();

      tree.expandAll();
      await wait(30);
      tree.collapseAll();
      await wait(30);

      for (const item of allItems(tree)) {
        const node = item.node;
        if (!node?.children?.length) continue;
        checkAgreement(problems, tree, node.id, false);
      }

      expectClean(problems, `collapseAll/${shape}`);
    });
  }
});

describe('tree matrix / expansion events', () => {
  // "tree-node-expand -> { nodeId, node, tree }" / "tree-node-collapse -> ..."
  for (const entry of ['api', 'expander'] as const) {
    it(`${entry}: expanding emits tree-node-expand with the node`, async () => {
      tree = await makeTree({}, nodesFor('nested'));
      const expanded = capture<any>(tree, 'tree-node-expand');

      if (entry === 'api') tree.expandNode('docs');
      else clickExpander(itemFor(tree, 'docs'));
      await wait(30);

      expect(expanded.length).toBeGreaterThan(0);
      const last = expanded[expanded.length - 1];
      expect(last.nodeId).toBe('docs');
      expect(last.node.id).toBe('docs');
      expect(last.tree).toBe(tree);
    });

    it(`${entry}: collapsing emits tree-node-collapse with the node`, async () => {
      tree = await makeTree({}, nodesFor('nested'));
      const collapsed = capture<any>(tree, 'tree-node-collapse');

      if (entry === 'api') tree.collapseNode('src');
      else clickExpander(itemFor(tree, 'src'));
      await wait(30);

      expect(collapsed.length).toBeGreaterThan(0);
      const last = collapsed[collapsed.length - 1];
      expect(last.nodeId).toBe('src');
      expect(last.node.id).toBe('src');
      expect(last.tree).toBe(tree);
    });
  }
});

describe('tree matrix / lazy loading', () => {
  /**
   * "lazy?: boolean" plus "tree-node-lazy-load -> { nodeId, node, tree }".
   * The documented handshake: expanding a lazy node with no children asks the
   * application for them (and shows the `loading` indicator meanwhile) instead
   * of expanding an empty subtree; assigning the children finishes the load.
   */
  it('expanding a lazy node asks for its children instead of expanding', async () => {
    tree = await makeTree({}, nodesFor('lazy'));
    const problems = new Problems();
    const asked = capture<any>(tree, 'tree-node-lazy-load');

    clickExpander(itemFor(tree, 'remote'));
    await wait(30);

    problems.equal(asked.length, 1, 'tree-node-lazy-load count');
    if (asked.length) {
      problems.equal(asked[0].nodeId, 'remote', 'lazy-load nodeId');
      problems.equal(asked[0].tree, tree, 'lazy-load tree');
    }

    const item = itemFor(tree, 'remote');
    problems.equal(item.loading, true, 'the row is not marked loading');
    problems.equal(rowOf(item)?.getAttribute('aria-busy'), 'true', 'aria-busy while loading');
    const indicator = itemPart(item, 'loading') as HTMLElement;
    problems.equal(indicator?.style.display, 'inline-flex', 'loading indicator hidden');
    problems.equal(rowOf(item)?.getAttribute('aria-expanded'), 'false',
      'a lazy node expanded before its children arrived');

    expectClean(problems, 'lazy/request');
  });

  it('supplying the children finishes the load and expands the node', async () => {
    tree = await makeTree({}, nodesFor('lazy'));
    const problems = new Problems();

    clickExpander(itemFor(tree, 'remote'));
    await wait(30);

    tree.updateNode('remote', {
      children: [
        { id: 'r1', label: 'Remote 1' },
        { id: 'r2', label: 'Remote 2' },
      ],
    });
    await wait(50);

    const item = itemFor(tree, 'remote');
    problems.equal(item.loading, false, 'the row is still marked loading');
    problems.equal(rowOf(item)?.getAttribute('aria-busy'), 'false', 'aria-busy after the load');
    checkAgreement(problems, tree, 'remote', true);
    problems.equal(
      allItems(tree).map((node: any) => node.node?.id),
      ['remote', 'r1', 'r2', 'local', 'leaf'],
      'rendered ids after the lazy load',
    );

    expectClean(problems, 'lazy/finish');
  });

  it('a non-lazy node never asks for children', async () => {
    tree = await makeTree({}, nodesFor('lazy'));
    const asked = capture<any>(tree, 'tree-node-lazy-load');

    clickExpander(itemFor(tree, 'local'));
    await wait(30);

    expect(asked).toEqual([]);
  });
});

describe('tree matrix / updateNode', () => {
  // "updateNode(id, updates) - Update node properties"
  for (const [what, updates, read] of [
    ['label', { label: 'Renamed' }, (tree: any) => itemPart(itemFor(tree, 'index'), 'label')?.textContent?.trim()],
    ['icon', { icon: 'Z' }, (tree: any) => itemPart(itemFor(tree, 'index'), 'icon-text')?.textContent?.trim()],
    ['disabled', { disabled: true }, (tree: any) => rowOf(itemFor(tree, 'index'))?.getAttribute('aria-disabled')],
  ] as const) {
    it(`updating ${what} re-renders the row`, async () => {
      tree = await makeTree({}, nodesFor('nested'));
      tree.updateNode('index', updates as any);
      await wait(50);

      const expected = what === 'label' ? 'Renamed' : what === 'icon' ? 'Z' : 'true';
      expect(read(tree)).toBe(expected);
    });
  }
});
