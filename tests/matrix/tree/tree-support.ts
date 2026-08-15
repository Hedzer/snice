/**
 * snice-tree matrix — the oracle.
 *
 * Every expectation below is written from docs/ai/components/tree.md and the
 * two types files (snice-tree.types.ts, snice-tree-item.types.ts). Nothing is
 * read off the component's output.
 *
 * The documented surface, restated as the axes a matrix has to cross:
 *
 *   · `selectable` (default true) x `selectionMode` ('single' | 'multiple' |
 *     'none') decide whether, and how many, nodes may be selected;
 *   · `showCheckboxes` (false) puts a checkbox on every row, with the
 *     documented `checked` / `indeterminate` node states;
 *   · `showIcons` (true) shows `iconImage` if it is safe, else `icon` as text;
 *   · `expandOnClick` (false) makes a row click expand instead of only select;
 *   · `nodes` is a tree of `TreeNode`, each with optional `children`,
 *     `disabled`, `expanded`, `lazy`;
 *   · fifteen public methods and five events.
 *
 * STRUCTURE. `snice-tree` renders its root `snice-tree-item`s into ITS shadow
 * root, and each item renders its own children into ITS shadow root. So an
 * item's DOM position is a chain of shadow roots, and every helper here walks
 * that chain rather than pretending `querySelectorAll` can see through it.
 *
 * SIMULATION BOUNDARY. happy-dom performs no layout, so "collapsed" is judged
 * by the documented state — the `tree-item__children--expanded` class the
 * stylesheet keys off, and `aria-expanded` — not by measured height. Whether a
 * collapsed subtree really disappears is the visual tier's job
 * (tests/live/matrix/tree/tree-visual.spec.ts).
 */
import { Problems, SETTLE, expectClean, removeComponent, text, wait } from '../matrix-kit';
import '../../../packages/components/src/tree/snice-tree';
import type { TreeNode } from '../../../packages/components/src/tree/snice-tree.types';

export { Problems, expectClean, removeComponent, text, wait, SETTLE };
export type { TreeNode };

export interface TreeVector {
  selectable: boolean;
  selectionMode: 'single' | 'multiple' | 'none';
  showCheckboxes: boolean;
  showIcons: boolean;
  expandOnClick: boolean;
}

export const DEFAULTS: TreeVector = {
  selectable: true,
  selectionMode: 'single',
  showCheckboxes: false,
  showIcons: true,
  expandOnClick: false,
};

// ── Node fixtures ───────────────────────────────────────────────────────────
//
// Five shapes, each chosen because it makes a different documented rule
// observable. A matrix over one shape only proves the component handles that
// shape.

export type Shape = 'flat' | 'nested' | 'deep' | 'lazy' | 'mixed';

export const SHAPES: Shape[] = ['flat', 'nested', 'deep', 'lazy', 'mixed'];

/** A fresh copy every call — the component clones its input, tests must too. */
export function nodesFor(shape: Shape): TreeNode[] {
  switch (shape) {
    case 'flat':
      // No children anywhere: every expander must be hidden, and nothing can
      // be expanded however hard the API is pushed.
      return [
        { id: 'a', label: 'Alpha', icon: 'A' },
        { id: 'b', label: 'Bravo', icon: 'B' },
        { id: 'c', label: 'Charlie', icon: 'C' },
      ];
    case 'nested':
      // One expanded parent and one collapsed parent, so both branches of the
      // documented `expanded` flag appear in the same combo.
      return [
        {
          id: 'src', label: 'src', icon: 'F', expanded: true,
          children: [
            { id: 'index', label: 'index.ts', icon: 'D' },
            { id: 'main', label: 'main.ts', icon: 'D' },
          ],
        },
        {
          id: 'docs', label: 'docs', icon: 'F',
          children: [{ id: 'readme', label: 'README.md', icon: 'D' }],
        },
      ];
    case 'deep':
      // Three levels, all expanded: aria-level, aria-posinset and aria-setsize
      // are only meaningfully wrong below the root.
      return [{
        id: 'l1', label: 'Level 1', expanded: true,
        children: [{
          id: 'l2', label: 'Level 2', expanded: true,
          children: [
            { id: 'l3a', label: 'Level 3 A' },
            { id: 'l3b', label: 'Level 3 B' },
          ],
        }],
      }];
    case 'lazy':
      // `lazy: true` with no children yet — the documented lazy-load path.
      return [
        { id: 'remote', label: 'Remote', lazy: true },
        { id: 'local', label: 'Local', children: [{ id: 'leaf', label: 'Leaf' }] },
      ];
    case 'mixed':
      // Disabled rows, a pre-checked row, and an image icon with a text
      // fallback — three independent documented rules in one shape.
      return [
        { id: 'ok', label: 'Enabled', icon: 'E' },
        { id: 'no', label: 'Disabled', icon: 'X', disabled: true },
        {
          id: 'group', label: 'Group', expanded: true,
          children: [
            { id: 'g1', label: 'Group child 1' },
            { id: 'g2', label: 'Group child 2', disabled: true },
          ],
        },
        { id: 'img', label: 'With image', icon: '?', iconImage: 'https://example.test/icon.png' },
      ];
  }
}

/** Every node in the fixture, depth-first, paired with its depth. */
export function flatten(nodes: TreeNode[], level = 0): Array<{ node: TreeNode; level: number }> {
  const out: Array<{ node: TreeNode; level: number }> = [];
  for (const node of nodes) {
    out.push({ node, level });
    if (node.children) out.push(...flatten(node.children, level + 1));
  }
  return out;
}

// ── Mounting ────────────────────────────────────────────────────────────────

export async function makeTree(
  vector: Partial<TreeVector>,
  nodes: TreeNode[],
): Promise<any> {
  const merged = { ...DEFAULTS, ...vector };
  const tree = document.createElement('snice-tree') as any;
  // The documented attribute forms, so each combo really crosses the converter
  // (`selection-mode="multiple"`, `show-checkboxes`, `show-icons="false"`).
  tree.setAttribute('selection-mode', merged.selectionMode);
  if (!merged.selectable) tree.setAttribute('selectable', 'false');
  if (merged.showCheckboxes) tree.setAttribute('show-checkboxes', '');
  if (!merged.showIcons) tree.setAttribute('show-icons', 'false');
  if (merged.expandOnClick) tree.setAttribute('expand-on-click', '');

  document.body.appendChild(tree);
  await tree.ready;
  tree.nodes = nodes;
  await wait(SETTLE);
  return tree;
}

// ── Reading through the shadow chain ────────────────────────────────────────

/**
 * Every `snice-tree-item` in the tree, in visual order.
 *
 * Root items live in the tree's shadow root; each item's children live in that
 * item's shadow root under `.tree-item__children`. Order is depth-first, which
 * is the order a reader sees.
 */
export function allItems(tree: any): any[] {
  const out: any[] = [];
  // `:scope >` is not supported by happy-dom, so each level is addressed by the
  // container that owns it — which is unambiguous here, because an item's own
  // shadow root contains exactly one `.tree-item__children`.
  const walk = (root: ShadowRoot | null | undefined, selector: string) => {
    if (!root) return;
    for (const item of [...root.querySelectorAll(selector)] as any[]) {
      if (out.includes(item)) continue;
      out.push(item);
      walk(item.shadowRoot, '.tree-item__children > snice-tree-item');
    }
  };
  walk(tree.shadowRoot, '.tree__content > snice-tree-item');
  return out;
}

/** The item rendering node `id`, or null. */
export function itemFor(tree: any, id: string): any | null {
  return allItems(tree).find(item => item.node?.id === id) ?? null;
}

/** First element exposing `part` inside an ITEM's own shadow root. */
export function itemPart(item: any, name: string): HTMLElement | null {
  return item.shadowRoot?.querySelector(`[part~="${name}"]`) ?? null;
}

/** The row element (`part="content"`) — the thing a user clicks. */
export function rowOf(item: any): HTMLElement | null {
  return itemPart(item, 'content');
}

/** The tree's own container parts. */
export function treePart(tree: any, name: string): HTMLElement | null {
  return tree.shadowRoot?.querySelector(`[part~="${name}"]`) ?? null;
}

/** Click a row the way a pointer would. */
export function clickRow(item: any): void {
  rowOf(item)?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Click the expander chevron. */
export function clickExpander(item: any): void {
  itemPart(item, 'expander')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true }),
  );
}

/** Record every event of `type` the tree emits. */
export function capture<T = any>(tree: any, type: string): T[] {
  const seen: T[] = [];
  tree.addEventListener(type, (e: Event) => seen.push((e as CustomEvent).detail));
  return seen;
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The tree container: the two documented parts, and the documented tree role.
 */
export function checkContainer(problems: Problems, tree: any, vector: TreeVector): void {
  problems.check(!!treePart(tree, 'container'), 'no [part~="container"]');
  problems.check(!!treePart(tree, 'content'), 'no [part~="content"]');
  // A tree widget is `role="tree"`, and multiple selection is announced.
  problems.equal(tree.getAttribute('role'), 'tree', 'host role');
  problems.equal(
    tree.getAttribute('aria-multiselectable'),
    vector.selectionMode === 'multiple' ? 'true' : null,
    'aria-multiselectable',
  );
}

/**
 * Which rows exist. A row exists for every node whose ancestors are all
 * expanded — that is what `expanded` means, and it is the only reading under
 * which a collapsed branch is not "rendered but invisible".
 *
 * The component renders every descendant into the DOM and hides collapsed
 * subtrees with a class, so the assertion is on the RENDERED SET (all nodes)
 * plus the documented expansion state of each container.
 */
export function checkRows(problems: Problems, tree: any, nodes: TreeNode[]): void {
  const expected = flatten(nodes);
  const items = allItems(tree);
  problems.equal(
    items.map(item => item.node?.id),
    expected.map(({ node }) => node.id),
    'rendered node ids, depth-first',
  );
}

/**
 * One row's documented contract: its label, its level/position ARIA, whether
 * it is disabled, whether it can be expanded, and which icon channel won.
 */
export function checkRow(
  problems: Problems,
  item: any,
  node: TreeNode,
  level: number,
  posInSet: number,
  setSize: number,
  vector: TreeVector,
): void {
  const where = `node ${node.id}`;
  const row = rowOf(item);
  if (!problems.check(!!row, `${where}: no [part~="content"] row`)) return;

  problems.equal(text(itemPart(item, 'label')), node.label, `${where}: label`);
  problems.equal(row!.getAttribute('role'), 'treeitem', `${where}: role`);
  problems.equal(row!.getAttribute('aria-level'), String(level + 1), `${where}: aria-level`);
  problems.equal(row!.getAttribute('aria-posinset'), String(posInSet), `${where}: aria-posinset`);
  problems.equal(row!.getAttribute('aria-setsize'), String(setSize), `${where}: aria-setsize`);
  problems.equal(row!.getAttribute('aria-disabled'), String(!!node.disabled), `${where}: aria-disabled`);
  problems.equal(row!.getAttribute('tabindex'), node.disabled ? '-1' : '0', `${where}: tabindex`);

  // "children?: TreeNode[]" and "lazy?: boolean" both make a node expandable;
  // a node with neither is a leaf and must not advertise an expanded state.
  const expandable = !!node.children?.length || !!node.lazy;
  problems.equal(
    row!.getAttribute('aria-expanded'),
    expandable ? String(!!node.expanded) : null,
    `${where}: aria-expanded`,
  );

  const expander = itemPart(item, 'expander');
  problems.check(!!expander, `${where}: no [part~="expander"]`);
  if (expander) {
    problems.equal(
      expander.classList.contains('tree-item__expander--hidden'),
      !expandable,
      `${where}: expander hidden`,
    );
  }

  checkIcon(problems, item, node, vector);
  checkCheckbox(problems, item, node, vector);
}

/**
 * Icons. Documented: "`iconImage` takes precedence; `icon` is the load-error
 * fallback", "Unsafe/malformed image sources and SVG data payloads are
 * rejected", and `showIcons = false` shows neither.
 */
export function checkIcon(
  problems: Problems, item: any, node: TreeNode, vector: TreeVector,
): void {
  const where = `node ${node.id}`;
  const image = itemPart(item, 'icon-image') as HTMLImageElement | null;
  const textIcon = itemPart(item, 'icon-text');

  const safeImage = vector.showIcons && isSafeIconSource(node.iconImage);
  problems.equal(!!image, safeImage, `${where}: icon-image present`);
  problems.equal(!!textIcon, vector.showIcons && !safeImage && !!node.icon,
    `${where}: icon-text present`);
  if (image) {
    problems.equal(image.getAttribute('src') ?? (image as any).src, node.iconImage,
      `${where}: icon-image src`);
    // The image is decorative: the label already carries the name.
    problems.equal(image.getAttribute('alt'), '', `${where}: icon-image alt`);
    problems.equal(image.getAttribute('aria-hidden'), 'true', `${where}: icon-image aria-hidden`);
  }
  if (textIcon && node.icon) {
    problems.equal(text(textIcon), node.icon, `${where}: icon-text content`);
  }
}

/**
 * The documented `iconImage` contract: "relative, HTTP(S), blob, or raster
 * data-image URL", with unsafe/malformed sources and SVG payloads rejected.
 */
export function isSafeIconSource(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const source = value.trim();
  if (!source) return false;
  // Control characters, spaces and the delimiters that would let a URL carry
  // raw markup are rejected: "Unsafe/malformed image sources and SVG data
  // payloads are rejected" (docs).
  if (/[\u0000-\u0020\u007f"'<>`]/.test(source)) return false;
  if (source.toLowerCase().startsWith('data:')) {
    return /^data:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon)(?:;base64)?,/i.test(source);
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(source)) {
    return /^(?:https?|blob):/i.test(source);
  }
  return true; // relative
}

/**
 * Checkboxes. Documented: `showCheckboxes` shows them; a node's `checked` and
 * `indeterminate` flags are its state; a disabled node's checkbox is disabled.
 */
export function checkCheckbox(
  problems: Problems, item: any, node: TreeNode, vector: TreeVector,
): void {
  const where = `node ${node.id}`;
  const holder = itemPart(item, 'checkbox');
  problems.check(!!holder, `${where}: no [part~="checkbox"] holder`);
  if (!holder) return;
  // The holder is always rendered; `showCheckboxes` decides whether it shows.
  problems.equal(holder.style.display === 'none', !vector.showCheckboxes,
    `${where}: checkbox hidden`);

  const box = holder.querySelector('snice-checkbox') as any;
  problems.check(!!box, `${where}: no snice-checkbox`);
  if (!box) return;
  problems.equal(!!box.checked, !!node.checked, `${where}: checkbox checked`);
  problems.equal(!!box.disabled, !!node.disabled, `${where}: checkbox disabled`);
}

/**
 * Selection, as the docs define it: `selectable = false` or
 * `selectionMode = 'none'` means nothing may be selected; `'single'` means at
 * most one; `'multiple'` means any number.
 */
export function checkSelection(
  problems: Problems, tree: any, vector: TreeVector, expected: string[],
): void {
  problems.equal([...tree.selectedNodes].sort(), [...expected].sort(), 'selectedNodes');
  problems.equal(
    tree.getSelectedNodes().map((node: TreeNode) => node.id).sort(),
    [...expected].sort(),
    'getSelectedNodes()',
  );
  if (vector.selectionMode === 'single') {
    problems.check(tree.selectedNodes.length <= 1,
      `single selection holds ${tree.selectedNodes.length} nodes`);
  }
  if (!vector.selectable || vector.selectionMode === 'none') {
    problems.check(tree.selectedNodes.length === 0,
      `selection is disabled but ${tree.selectedNodes.length} nodes are selected`);
  }

  // The DOM must agree with the property: every selected row says so.
  for (const item of allItems(tree)) {
    const id = item.node?.id;
    const row = rowOf(item);
    if (!row || !id) continue;
    problems.equal(row.getAttribute('aria-selected'), String(expected.includes(id)),
      `node ${id}: aria-selected`);
    problems.equal(row.classList.contains('tree-item__content--selected'), expected.includes(id),
      `node ${id}: selected class`);
  }
}

/** Checked state, as `checkedNodes` and as the rendered checkboxes. */
export function checkChecked(problems: Problems, tree: any, expected: string[]): void {
  problems.equal([...tree.checkedNodes].sort(), [...expected].sort(), 'checkedNodes');
  problems.equal(
    tree.getCheckedNodes().map((node: TreeNode) => node.id).sort(),
    [...expected].sort(),
    'getCheckedNodes()',
  );
}
