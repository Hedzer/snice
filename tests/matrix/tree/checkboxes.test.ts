/**
 * snice-tree matrix — the checkbox cross.
 *
 * Dimensions (docs/ai/components/tree.md):
 *   shape    nested | deep | mixed                                  (3)
 *   entry    checkNode | uncheckNode | toggleCheck | checkedNodes=   (4)
 *   target   a leaf | a parent                                      (2)
 *
 * 3 x 4 x 2 = 24 combos, plus the cascade and indeterminate rules that
 * `indeterminate?: boolean` on `TreeNode` only means anything under.
 *
 * Every combo asserts BOTH halves of the documented state: `checkedNodes` /
 * `getCheckedNodes()`, and the `snice-checkbox` each row actually renders. A
 * tree that keeps the array right and the boxes wrong has failed.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  Problems, allItems, capture, checkChecked, expectClean, itemFor, itemPart,
  makeTree, nodesFor, removeComponent, wait,
} from './tree-support';

let tree: any = null;
afterEach(() => { if (tree) { removeComponent(tree); tree = null; } });

const SHAPES = ['nested', 'deep', 'mixed'] as const;

/** A leaf and a parent per shape — the two structurally different targets. */
const TARGETS: Record<string, { leaf: string; parent: string }> = {
  nested: { leaf: 'index', parent: 'src' },
  deep: { leaf: 'l3a', parent: 'l2' },
  mixed: { leaf: 'g1', parent: 'group' },
};

/** The rendered checkbox for a node, through the item's shadow root. */
function boxFor(tree: any, id: string): any {
  const holder = itemPart(itemFor(tree, id), 'checkbox');
  return holder?.querySelector('snice-checkbox') ?? null;
}

/** Every rendered checkbox's state, keyed by node id. */
function boxStates(tree: any): Record<string, { checked: boolean; indeterminate: boolean }> {
  const out: Record<string, { checked: boolean; indeterminate: boolean }> = {};
  for (const item of allItems(tree)) {
    const id = item.node?.id;
    if (!id) continue;
    const box = itemPart(item, 'checkbox')?.querySelector('snice-checkbox') as any;
    out[id] = { checked: !!box?.checked, indeterminate: !!box?.indeterminate };
  }
  return out;
}

describe('tree matrix / checkbox API cross', () => {
  for (const shape of SHAPES) {
    for (const entry of ['checkNode', 'uncheckNode', 'toggleCheck', 'assign'] as const) {
      for (const which of ['leaf', 'parent'] as const) {
        const id = `${shape}/${entry}/${which}`;
        it(id, async () => {
          const target = TARGETS[shape][which];
          tree = await makeTree({ showCheckboxes: true }, nodesFor(shape));
          const problems = new Problems();

          checkChecked(problems, tree, []);

          switch (entry) {
            case 'checkNode':
              tree.checkNode(target);
              break;
            case 'uncheckNode':
              // Unchecking something that is not checked is a no-op, which is
              // the half of the contract a "check then uncheck" test skips.
              tree.uncheckNode(target);
              break;
            case 'toggleCheck':
              tree.toggleCheck(target);
              break;
            case 'assign':
              tree.checkedNodes = [target];
              break;
          }
          await wait(20);

          const expected = entry === 'uncheckNode' ? [] : [target];
          checkChecked(problems, tree, expected);
          problems.equal(boxFor(tree, target)?.checked ?? false, expected.includes(target),
            `${target}: rendered checkbox`);

          // The inverse move always returns the tree to empty.
          if (entry === 'toggleCheck') tree.toggleCheck(target);
          else tree.uncheckNode(target);
          await wait(20);
          checkChecked(problems, tree, []);
          problems.equal(boxFor(tree, target)?.checked ?? false, false,
            `${target}: rendered checkbox after undo`);

          expectClean(problems, id);
        });
      }
    }
  }
});

describe('tree matrix / cascade', () => {
  /**
   * `TreeNode` carries both `checked?: boolean` and `indeterminate?: boolean`.
   * An indeterminate state has exactly one meaning in a tree of checkboxes:
   * some but not all of this node's children are checked. So the documented
   * type pins the cascade — checking a parent through its checkbox checks its
   * enabled descendants, and checking one child of two makes the parent
   * indeterminate rather than checked.
   */
  for (const shape of SHAPES) {
    it(`${shape}: checking a parent checks its enabled descendants`, async () => {
      const parent = TARGETS[shape].parent;
      tree = await makeTree({ showCheckboxes: true }, nodesFor(shape));
      const problems = new Problems();

      const box = boxFor(tree, parent);
      problems.check(!!box, `${parent}: no checkbox`);
      box.dispatchEvent(new CustomEvent('checkbox-change', {
        detail: { checked: true }, bubbles: true, composed: true,
      }));
      await wait(30);

      const node = tree.getNode(parent);
      const enabledChildren = (node.children ?? []).filter((child: any) => !child.disabled);
      for (const child of enabledChildren) {
        problems.check(tree.checkedNodes.includes(child.id),
          `${child.id} was not checked when its parent was`);
      }
      // A disabled child is never dragged along.
      for (const child of (node.children ?? []).filter((c: any) => c.disabled)) {
        problems.check(!tree.checkedNodes.includes(child.id),
          `disabled ${child.id} was checked by the cascade`);
      }

      expectClean(problems, `cascade/${shape}`);
    });
  }

  /**
   * MATRIX-tree-3 (fixed): no documented input used to produce an
   * `indeterminate` parent. The downward cascade wrote to the `nodeMap`
   * clones, but `updateAncestors` resolved the parent from `this.nodes` (the
   * caller's array) and judged `allChecked`/`allUnchecked` from those
   * untouched children, while the rendered checkbox read the clone that was
   * never written. Ancestors are now resolved from the same clone tree, so a
   * half-checked folder renders indeterminate.
   */
  it('checking one of two children leaves the parent indeterminate, not checked [MATRIX-tree-3]', async () => {
    tree = await makeTree({ showCheckboxes: true }, nodesFor('nested'));
    const problems = new Problems();

    const box = boxFor(tree, 'index');
    box.dispatchEvent(new CustomEvent('checkbox-change', {
      detail: { checked: true }, bubbles: true, composed: true,
    }));
    await wait(30);

    const states = boxStates(tree);
    problems.equal(states.index.checked, true, 'index checked');
    problems.equal(states.main.checked, false, 'main checked');
    problems.equal(states.src.checked, false, 'src fully checked');
    problems.equal(states.src.indeterminate, true, 'src indeterminate');
    problems.check(!tree.checkedNodes.includes('src'),
      'a partially checked parent is in checkedNodes');

    expectClean(problems, 'indeterminate/partial');
  });

  it('checking every child promotes the parent to checked', async () => {
    tree = await makeTree({ showCheckboxes: true }, nodesFor('nested'));
    const problems = new Problems();

    for (const id of ['index', 'main']) {
      boxFor(tree, id).dispatchEvent(new CustomEvent('checkbox-change', {
        detail: { checked: true }, bubbles: true, composed: true,
      }));
      await wait(20);
    }

    const states = boxStates(tree);
    problems.equal(states.src.checked, true, 'src checked');
    problems.equal(states.src.indeterminate, false, 'src still indeterminate');
    problems.check(tree.checkedNodes.includes('src'), 'src is not in checkedNodes');

    expectClean(problems, 'indeterminate/full');
  });
});

describe('tree matrix / tree-node-check', () => {
  // "tree-node-check -> { nodeId, node, checked, checkedNodes, tree }"
  for (const checked of [true, false]) {
    it(`${checked ? 'checkNode' : 'uncheckNode'} emits the documented detail`, async () => {
      tree = await makeTree({ showCheckboxes: true }, nodesFor('nested'));
      if (!checked) {
        tree.checkNode('index');
        await wait(20);
      }
      const seen = capture<any>(tree, 'tree-node-check');

      if (checked) tree.checkNode('index');
      else tree.uncheckNode('index');
      await wait(20);

      expect(seen.length).toBe(1);
      expect(seen[0].nodeId).toBe('index');
      expect(seen[0].node.id).toBe('index');
      expect(seen[0].checked).toBe(checked);
      expect(seen[0].tree).toBe(tree);
      expect(seen[0].checkedNodes.map((node: any) => node.id))
        .toEqual(checked ? ['index'] : []);
    });
  }
});

describe('tree matrix / showCheckboxes visibility', () => {
  // The boxes exist either way; `showCheckboxes` decides whether they show.
  for (const shape of SHAPES) {
    for (const showCheckboxes of [true, false]) {
      it(`${shape}/showCheckboxes=${showCheckboxes}`, async () => {
        tree = await makeTree({ showCheckboxes }, nodesFor(shape));
        const problems = new Problems();

        for (const item of allItems(tree)) {
          const holder = itemPart(item, 'checkbox') as HTMLElement;
          problems.equal(holder?.style.display === 'none', !showCheckboxes,
            `node ${item.node?.id}: checkbox hidden`);
        }

        expectClean(problems, `visibility/${shape}/${showCheckboxes}`);
      });
    }
  }
});
