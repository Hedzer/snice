/**
 * Smoke slice of the snice-tree matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/tree/, 205 combos across
 * rendering / selection / checkboxes / expansion) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle, so it cannot claim less than the suite it stands in for.
 *
 * The marquee combos: one nested render with icons and checkboxes on (the
 * shape that exercises every documented row region at once), single and
 * multiple selection, the checkbox cascade, the expander, the lazy handshake,
 * and one regression guard from each of the four findings the full suite
 * pinned (all fixed).
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, checkChecked, checkContainer, checkRow, checkRows,
  checkSelection, clickExpander, clickRow, expectClean, flatten, itemFor,
  itemPart, makeTree, nodesFor, removeComponent, rowOf, wait,
  type TreeVector,
} from './tree-support';

let tree: any = null;
afterEach(() => { if (tree) { removeComponent(tree); tree = null; } });

describe('tree matrix smoke', () => {
  it('a nested tree with icons and checkboxes renders every documented region', async () => {
    const vector: TreeVector = { ...DEFAULTS, showCheckboxes: true };
    const nodes = nodesFor('nested');
    tree = await makeTree(vector, nodes);
    const problems = new Problems();

    checkContainer(problems, tree, vector);
    checkRows(problems, tree, nodes);

    // src is root 1 of 2; its two children are 1 and 2 of 2 at level 1.
    checkRow(problems, itemFor(tree, 'src'), nodes[0], 0, 1, 2, vector);
    checkRow(problems, itemFor(tree, 'index'), nodes[0].children![0], 1, 1, 2, vector);
    checkRow(problems, itemFor(tree, 'docs'), nodes[1], 0, 2, 2, vector);

    expectClean(problems, 'smoke/render');
  });

  it('single selection replaces, multiple selection accumulates', async () => {
    const single: TreeVector = { ...DEFAULTS, selectionMode: 'single' };
    tree = await makeTree(single, nodesFor('nested'));
    let problems = new Problems();
    clickRow(itemFor(tree, 'src'));
    await wait(20);
    clickRow(itemFor(tree, 'index'));
    await wait(20);
    checkSelection(problems, tree, single, ['index']);
    expectClean(problems, 'smoke/single');
    removeComponent(tree);

    const multiple: TreeVector = { ...DEFAULTS, selectionMode: 'multiple' };
    tree = await makeTree(multiple, nodesFor('nested'));
    problems = new Problems();
    clickRow(itemFor(tree, 'src'));
    await wait(20);
    clickRow(itemFor(tree, 'index'));
    await wait(20);
    checkSelection(problems, tree, multiple, ['src', 'index']);
    expectClean(problems, 'smoke/multiple');
  });

  it('checking a parent cascades to its children', async () => {
    tree = await makeTree({ showCheckboxes: true }, nodesFor('nested'));
    const problems = new Problems();

    const box = itemPart(itemFor(tree, 'src'), 'checkbox')!.querySelector('snice-checkbox')!;
    box.dispatchEvent(new CustomEvent('checkbox-change', {
      detail: { checked: true }, bubbles: true, composed: true,
    }));
    await wait(30);

    checkChecked(problems, tree, ['src', 'index', 'main']);
    expectClean(problems, 'smoke/cascade');
  });

  it('the expander chevron expands and collapses a node', async () => {
    tree = await makeTree({}, nodesFor('nested'));
    const problems = new Problems();

    problems.equal(rowOf(itemFor(tree, 'docs'))?.getAttribute('aria-expanded'), 'false',
      'docs starts collapsed');
    clickExpander(itemFor(tree, 'docs'));
    await wait(30);
    problems.equal(rowOf(itemFor(tree, 'docs'))?.getAttribute('aria-expanded'), 'true',
      'docs after the expander click');

    expectClean(problems, 'smoke/expander');
  });

  it('a lazy node asks for its children instead of expanding empty', async () => {
    tree = await makeTree({}, nodesFor('lazy'));
    const seen: any[] = [];
    tree.addEventListener('tree-node-lazy-load', (e: Event) => seen.push((e as CustomEvent).detail));

    clickExpander(itemFor(tree, 'remote'));
    await wait(30);

    expect(seen.map(detail => detail.nodeId)).toEqual(['remote']);
    expect(itemFor(tree, 'remote').loading).toBe(true);
  });

  // ── Regression guards for the four findings, all fixed ────────

  // MATRIX-tree-1 (fixed): `expand-on-click` used to be declared and never read.
  it('MATRIX-tree-1 (fixed): a row click expands when expand-on-click is set', async () => {
    tree = await makeTree({ expandOnClick: true }, nodesFor('nested'));
    clickRow(itemFor(tree, 'docs'));
    await wait(20);
    expect(rowOf(itemFor(tree, 'docs'))?.getAttribute('aria-expanded')).toBe('true');
  });

  // MATRIX-tree-2 (fixed): a row click used to paint itself selected even when
  // selection was off.
  it('MATRIX-tree-2 (fixed): selection-mode="none" leaves a clicked row unselected', async () => {
    const vector: TreeVector = { ...DEFAULTS, selectionMode: 'none' };
    tree = await makeTree(vector, nodesFor('nested'));
    const problems = new Problems();
    clickRow(itemFor(tree, 'src'));
    await wait(20);
    checkSelection(problems, tree, vector, []);
    expectClean(problems, 'smoke/none');
  });

  // MATRIX-tree-3 (fixed): a partially checked parent never became indeterminate.
  it('MATRIX-tree-3 (fixed): one checked child of two makes the parent indeterminate', async () => {
    tree = await makeTree({ showCheckboxes: true }, nodesFor('nested'));
    const box = itemPart(itemFor(tree, 'index'), 'checkbox')!.querySelector('snice-checkbox')!;
    box.dispatchEvent(new CustomEvent('checkbox-change', {
      detail: { checked: true }, bubbles: true, composed: true,
    }));
    await wait(30);
    const parentBox = itemPart(itemFor(tree, 'src'), 'checkbox')!
      .querySelector('snice-checkbox') as any;
    expect(parentBox.indeterminate).toBe(true);
  });

  // MATRIX-tree-4 (fixed): the programmatic expansion API never reached the
  // rendered rows.
  it('MATRIX-tree-4 (fixed): expandNode() expands the rendered row', async () => {
    tree = await makeTree({}, nodesFor('nested'));
    tree.expandNode('docs');
    await wait(30);
    expect(rowOf(itemFor(tree, 'docs'))?.getAttribute('aria-expanded')).toBe('true');
  });

  it('the documented node set is rendered depth-first', async () => {
    const nodes = nodesFor('deep');
    tree = await makeTree({}, nodes);
    const problems = new Problems();
    checkRows(problems, tree, nodes);
    expect(flatten(nodes).map(({ node }) => node.id)).toEqual(['l1', 'l2', 'l3a', 'l3b']);
    expectClean(problems, 'smoke/depth-first');
  });
});
