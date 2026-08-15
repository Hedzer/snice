/**
 * snice-tree matrix — the rendering cross.
 *
 * Dimensions (docs/ai/components/tree.md):
 *   shape          flat | nested | deep | lazy | mixed   (5)
 *   showIcons      true | false                          (2)
 *   showCheckboxes true | false                          (2)
 *   selectionMode  single | multiple | none              (3)
 *
 * 5 x 2 x 2 x 3 = 60 combos. Each one is judged by the whole oracle at once —
 * the container parts and role, the full depth-first row set, and every
 * documented per-row claim (label, aria-level/posinset/setsize, disabled,
 * expandability, which icon channel won, checkbox visibility and state).
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, SHAPES, allItems, checkContainer, checkRow, checkRows,
  expectClean, flatten, itemFor, makeTree, nodesFor, removeComponent, rowOf, text,
  type TreeVector,
} from './tree-support';

let tree: any = null;
afterEach(() => { if (tree) { removeComponent(tree); tree = null; } });

const MODES = ['single', 'multiple', 'none'] as const;

/** Position/size of a node among its siblings — the documented ARIA pair. */
function siblingInfo(nodes: any[]): Map<string, { level: number; pos: number; size: number }> {
  const out = new Map<string, { level: number; pos: number; size: number }>();
  const walk = (list: any[], level: number) => {
    list.forEach((node, i) => {
      out.set(node.id, { level, pos: i + 1, size: list.length });
      if (node.children) walk(node.children, level + 1);
    });
  };
  walk(nodes, 0);
  return out;
}

describe('tree matrix / rendering cross', () => {
  for (const shape of SHAPES) {
    for (const showIcons of [true, false]) {
      for (const showCheckboxes of [true, false]) {
        for (const selectionMode of MODES) {
          const id = `${shape}/icons=${showIcons}/checkboxes=${showCheckboxes}/${selectionMode}`;
          it(id, async () => {
            const vector: TreeVector = {
              ...DEFAULTS, showIcons, showCheckboxes, selectionMode,
            };
            const nodes = nodesFor(shape);
            tree = await makeTree(vector, nodes);
            const problems = new Problems();

            checkContainer(problems, tree, vector);
            checkRows(problems, tree, nodes);

            const info = siblingInfo(nodes);
            for (const { node } of flatten(nodes)) {
              const item = itemFor(tree, node.id);
              if (!problems.check(!!item, `node ${node.id} was not rendered`)) continue;
              const place = info.get(node.id)!;
              checkRow(problems, item, node, place.level, place.pos, place.size, vector);
            }

            expectClean(problems, id);
          });
        }
      }
    }
  }
});

describe('tree matrix / structural invariants', () => {
  // Documented CSS parts on the tree itself, and the group role that makes a
  // subtree a subtree. These hold for every shape, so they get one pass each
  // rather than a place in the product above.
  for (const shape of SHAPES) {
    it(`${shape}: every item exposes the documented parts`, async () => {
      const nodes = nodesFor(shape);
      tree = await makeTree({}, nodes);
      const problems = new Problems();

      for (const item of allItems(tree)) {
        const id = item.node?.id;
        for (const name of ['content', 'expander', 'checkbox', 'label', 'children', 'loading']) {
          problems.check(
            !!item.shadowRoot?.querySelector(`[part~="${name}"]`),
            `node ${id}: no [part~="${name}"]`,
          );
        }
        const group = item.shadowRoot?.querySelector('[part~="children"]');
        problems.equal(group?.getAttribute('role'), 'group', `node ${id}: children role`);
        // Documented: `loading` is the lazy-loading indicator, so it is not
        // showing on a row that is not loading.
        const loading = item.shadowRoot?.querySelector('[part~="loading"]') as HTMLElement;
        problems.equal(loading?.style.display, 'none', `node ${id}: loading indicator visible`);
        problems.equal(rowOf(item)?.getAttribute('aria-busy'), 'false', `node ${id}: aria-busy`);
      }

      expectClean(problems, `parts/${shape}`);
    });
  }

  it('labels are projected as text, never as markup', async () => {
    // `label: string` — a label containing markup characters is a label, and a
    // tree that renders it as HTML is an injection.
    const nodes = [
      { id: 'x', label: '<b>bold</b> & "quoted"' },
      { id: 'y', label: 'plain' },
    ];
    tree = await makeTree({}, nodes);
    const problems = new Problems();

    const item = itemFor(tree, 'x');
    problems.check(!!item, 'node x was not rendered');
    if (item) {
      const label = item.shadowRoot.querySelector('[part~="label"]');
      problems.equal(text(label), '<b>bold</b> & "quoted"', 'label text');
      problems.check(!label.querySelector('b'), 'the label rendered real markup');
    }

    expectClean(problems, 'label-escaping');
  });
});

describe('tree matrix / iconImage safety', () => {
  /**
   * Documented: "`iconImage` takes precedence; `icon` is the load-error
   * fallback" and "Unsafe/malformed image sources and SVG data payloads are
   * rejected". Each source below is one clause of that sentence.
   */
  const SOURCES: Array<{ id: string; source: string; safe: boolean }> = [
    { id: 'https', source: 'https://example.test/a.png', safe: true },
    { id: 'http', source: 'http://example.test/a.png', safe: true },
    { id: 'blob', source: 'blob:https://example.test/1234', safe: true },
    { id: 'relative', source: '/assets/workspace.png', safe: true },
    { id: 'data-png', source: 'data:image/png;base64,iVBORw0KGgo=', safe: true },
    { id: 'data-svg', source: 'data:image/svg+xml,<svg/>', safe: false },
    { id: 'javascript', source: 'javascript:alert(1)', safe: false },
    { id: 'spaces', source: 'https://example.test/a b.png', safe: false },
    { id: 'quote', source: 'https://example.test/a".png', safe: false },
    { id: 'angle', source: 'https://example.test/<a>.png', safe: false },
    { id: 'empty', source: '', safe: false },
  ];

  for (const { id, source, safe } of SOURCES) {
    it(`${id} is ${safe ? 'accepted' : 'rejected'}`, async () => {
      const nodes = [{ id: 'n', label: 'Node', icon: 'FB', iconImage: source }];
      tree = await makeTree({}, nodes);
      const problems = new Problems();

      const item = itemFor(tree, 'n');
      if (problems.check(!!item, 'node n was not rendered')) {
        const image = item.shadowRoot.querySelector('[part~="icon-image"]');
        const textIcon = item.shadowRoot.querySelector('[part~="icon-text"]');
        problems.equal(!!image, safe, 'icon-image rendered');
        // "`icon` is the load-error fallback" — and a rejected source is a
        // source that never loads, so the text icon has to stand in.
        problems.equal(!!textIcon, !safe, 'icon-text fallback rendered');
        if (textIcon) problems.equal(text(textIcon), 'FB', 'fallback icon text');
      }

      expectClean(problems, `iconImage/${id}`);
    });
  }
});
