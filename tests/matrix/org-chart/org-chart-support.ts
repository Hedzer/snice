/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-org-chart feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from docs/ai/components/org-chart.md, docs/components/org-chart.md and
 * snice-org-chart.types.ts, never from observed output:
 *
 *   Properties  data: OrgChartNode | null (JS only),
 *               direction: 'top-down' | 'left-right', compact: boolean
 *   Type        OrgChartNode { id, name, title?, avatar?, children? }
 *   Methods     collapseNode(id), expandNode(id), expandAll(), collapseAll()
 *   Events      node-click / node-expand / node-collapse -> { node }
 *   Parts       base, tree, node
 *   A11y        "Nodes are clickable with expand/collapse toggle buttons";
 *               "Avatar placeholders display name initials when no image is
 *                provided";
 *               "Nodes display name, title, and optional avatar"
 *
 * ── The oracle: the rendered tree IS the data ───────────────────────────────
 *
 * An org chart's whole contract is that the tree on screen is the tree it was
 * handed, minus the branches the reader has collapsed. So the oracle walks the
 * DATA and the DOM in lockstep: same nodes, same order, same nesting, and at
 * every node the documented card — name, optional title, avatar or initials,
 * a toggle button exactly when there are children to toggle — plus the ARIA
 * that makes it a tree rather than a pile of divs.
 */
import { createComponent, removeComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/org-chart/snice-org-chart';
import type {
  OrgChartNode, OrgChartDirection,
} from '../../../packages/components/src/org-chart/snice-org-chart.types';

export { createComponent, removeComponent, wait };
export type { OrgChartNode, OrgChartDirection };

export const DIRECTIONS: readonly OrgChartDirection[] = ['top-down', 'left-right'] as const;
export const SETTLE = 30;

// ── Tree fixtures ───────────────────────────────────────────────────────────

export interface Fixture { id: string; data: OrgChartNode | null; why: string }

export const FIXTURES: Fixture[] = [
  { id: 'null', data: null, why: 'the documented default — no data at all' },
  {
    id: 'lone-root',
    data: { id: 'ceo', name: 'Jane Smith', title: 'CEO' },
    why: 'a root with no children — nothing to toggle',
  },
  {
    id: 'bare-root',
    data: { id: 'solo', name: 'Solo' },
    why: 'no title and no avatar — both optional fields absent',
  },
  {
    id: 'doc-example',
    data: {
      id: 'ceo', name: 'Jane Smith', title: 'CEO', avatar: '/avatars/jane.jpg',
      children: [
        {
          id: 'cto', name: 'Bob Jones', title: 'CTO',
          children: [{ id: 'dev1', name: 'Alice', title: 'Engineer' }],
        },
        { id: 'cfo', name: 'Carol White', title: 'CFO' },
      ],
    },
    why: "the docs' own example, three levels deep",
  },
  {
    id: 'wide',
    data: {
      id: 'root', name: 'Root', title: 'Head',
      children: Array.from({ length: 6 }, (_, i) => ({
        id: `c${i}`, name: `Child ${i}`, title: `Role ${i}`,
      })),
    },
    why: 'six siblings — sibling order must survive',
  },
  {
    id: 'deep-chain',
    data: {
      id: 'l0', name: 'Level 0',
      children: [{
        id: 'l1', name: 'Level 1',
        children: [{
          id: 'l2', name: 'Level 2',
          children: [{ id: 'l3', name: 'Level 3' }],
        }],
      }],
    },
    why: 'four levels of nesting in a single chain',
  },
  {
    id: 'mixed-avatars',
    data: {
      id: 'root', name: 'Root', avatar: '/img/root.png',
      children: [
        { id: 'with', name: 'With Avatar', avatar: '/img/a.png', title: 'Has image' },
        { id: 'without', name: 'Without Avatar', title: 'No image' },
      ],
    },
    why: 'the avatar/placeholder branch, side by side',
  },
  {
    id: 'empty-children',
    data: {
      id: 'root', name: 'Root',
      children: [],
    },
    why: 'an empty children array is not the same as children',
  },
  {
    id: 'lowercase-names',
    data: {
      id: 'root', name: 'ada lovelace', title: 'analyst',
      children: [{ id: 'kid', name: 'grace hopper' }],
    },
    why: 'the initial in a placeholder must be upper-cased',
  },
  {
    id: 'markup-in-text',
    data: {
      id: 'root', name: '<b>Bold</b> & Co', title: 'Head of "Quotes"',
      children: [{ id: 'kid', name: 'A & B <script>' }],
    },
    why: 'names and titles are text, never markup',
  },
];

export const FIXTURE = Object.fromEntries(FIXTURES.map(f => [f.id, f])) as Record<string, Fixture>;

// ── Combo ───────────────────────────────────────────────────────────────────

export interface ChartCombo {
  id: string;
  fixture: Fixture;
  direction: OrgChartDirection;
  compact: boolean;
  /** Ids the test has collapsed through the documented methods. */
  collapsed: string[];
}

export function combo(
  id: string, fixture: Fixture, overrides: Partial<ChartCombo> = {},
): ChartCombo {
  return { direction: 'top-down', compact: false, collapsed: [], fixture, id, ...overrides };
}

export async function mountChart(c: ChartCombo): Promise<any> {
  const el = await createComponent<any>('snice-org-chart');
  el.direction = c.direction;
  el.compact = c.compact;
  el.data = c.fixture.data;
  await wait(SETTLE);
  for (const id of c.collapsed) el.collapseNode(id);
  if (c.collapsed.length) await wait(SETTLE);
  return el;
}

export function sr(el: any): ShadowRoot {
  const root = el.shadowRoot as ShadowRoot | null;
  if (!root) throw new Error('snice-org-chart rendered no shadow root');
  return root;
}

const text = (node: Element | null | undefined): string =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

// ── Documented derivations ──────────────────────────────────────────────────

/** Every node in the tree, depth-first, in document order. */
export function flatten(node: OrgChartNode | null): OrgChartNode[] {
  if (!node) return [];
  return [node, ...(node.children ?? []).flatMap(flatten)];
}

/** The nodes still on screen once `collapsed` branches are folded away. */
export function visibleNodes(
  node: OrgChartNode | null, collapsed: Set<string>,
): OrgChartNode[] {
  if (!node) return [];
  if (collapsed.has(node.id)) return [node];
  return [node, ...(node.children ?? []).flatMap(child => visibleNodes(child, collapsed))];
}

/** The documented accessible name of a node card. */
export const expectedNodeLabel = (node: OrgChartNode): string =>
  node.title ? `${node.name}, ${node.title}` : node.name;

/**
 * The documented avatar placeholder: "Avatar placeholders display name
 * initials when no image is provided".
 */
export const expectedInitials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map(word => word.charAt(0).toUpperCase()).join('');

export const hasChildren = (node: OrgChartNode): boolean =>
  Array.isArray(node.children) && node.children.length > 0;

// ── Reading the rendered chart ──────────────────────────────────────────────

export interface RenderedNode {
  label: string;
  expanded: string | null;
  name: string;
  title: string | null;
  avatarSrc: string | null;
  avatarAlt: string | null;
  placeholder: string | null;
  toggleLabel: string | null;
  compactCard: boolean;
  compactAvatar: boolean;
  tabIndex: string | null;
  childIds: string[];
  wrapper: Element;
  card: Element | null;
  toggle: HTMLButtonElement | null;
  childGroup: Element | null;
}

/** The chart's rendered tree, as a nested description. */
export function readTree(el: any): RenderedNode[] {
  const tree = sr(el).querySelector('[part="tree"]');
  if (!tree) return [];
  return readWrappers(tree);
}

function directChildWrappers(container: Element): Element[] {
  // The template nests: wrapper > .org-children > .org-branch > wrapper.
  const group = [...container.children].find(child => child.classList.contains('org-children'));
  if (!group) return [];
  return [...group.children]
    .flatMap(branch => branch.classList.contains('org-branch') ? [...branch.children] : [branch])
    .filter(node => node.classList.contains('org-node-wrapper'));
}

function readWrappers(container: Element): RenderedNode[] {
  const wrappers = [...container.children]
    .flatMap(child => child.classList.contains('org-branch') ? [...child.children] : [child])
    .filter(node => node.classList.contains('org-node-wrapper'));
  return wrappers.map(readWrapper);
}

function readWrapper(wrapper: Element): RenderedNode {
  const card = wrapper.querySelector(':scope > .org-node');
  const avatar = card?.querySelector('.org-avatar') as HTMLImageElement | null;
  const placeholder = card?.querySelector('.org-avatar-placeholder') ?? null;
  const toggle = (card?.querySelector('.org-toggle') ?? null) as HTMLButtonElement | null;
  const group = [...wrapper.children].find(child => child.classList.contains('org-children')) ?? null;
  return {
    label: wrapper.getAttribute('aria-label') ?? '',
    expanded: wrapper.getAttribute('aria-expanded'),
    name: text(card?.querySelector('.org-node-name')),
    title: card?.querySelector('.org-node-title')
      ? text(card.querySelector('.org-node-title')) : null,
    avatarSrc: avatar?.getAttribute('src') ?? null,
    avatarAlt: avatar?.getAttribute('alt') ?? null,
    placeholder: placeholder ? text(placeholder) : null,
    toggleLabel: toggle?.getAttribute('aria-label') ?? null,
    compactCard: !!card?.classList.contains('org-node--compact'),
    compactAvatar: !!(avatar?.classList.contains('org-avatar--compact')
      || placeholder?.classList.contains('org-avatar-placeholder--compact')),
    tabIndex: card?.getAttribute('tabindex') ?? null,
    childIds: [],
    wrapper,
    card,
    toggle,
    childGroup: group,
  };
}

/** Find the rendered card whose accessible name matches a data node. */
export function cardFor(el: any, node: OrgChartNode): Element | null {
  const wrapper = [...sr(el).querySelectorAll('.org-node-wrapper')]
    .find(candidate => candidate.getAttribute('aria-label') === expectedNodeLabel(node));
  return wrapper?.querySelector(':scope > .org-node') ?? null;
}

export function toggleFor(el: any, node: OrgChartNode): HTMLButtonElement | null {
  return (cardFor(el, node)?.querySelector('.org-toggle') ?? null) as HTMLButtonElement | null;
}

export function captureEvents(el: any, types: string[]): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    el.addEventListener(type, (event: CustomEvent) => seen.push({ type, detail: event.detail }));
  }
  return seen;
}

// ── The oracle ──────────────────────────────────────────────────────────────

export function chartProblems(el: any, c: ChartCombo): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const root = sr(el);
  const collapsed = new Set(c.collapsed);

  const base = root.querySelector('[part="base"]');
  if (!base) { say('no part="base" container'); return problems; }

  const tree = root.querySelector('[part="tree"]');

  // ── No data ───────────────────────────────────────────────────────────────
  if (!c.fixture.data) {
    if (tree) say('a chart with no data still rendered a tree');
    if (!text(base)) say('a chart with no data rendered nothing at all — not even a message');
    return problems;
  }

  if (!tree) { say('no part="tree" wrapper'); return problems; }
  if (tree.getAttribute('role') !== 'tree') {
    say(`the tree wrapper has role "${tree.getAttribute('role')}", expected "tree"`);
  }
  if (!(tree.getAttribute('aria-label') ?? '').trim()) {
    say('the tree wrapper carries no aria-label');
  }

  // ── direction: the documented layout switch ───────────────────────────────
  const leftRight = tree.classList.contains('org-tree--left-right');
  if (c.direction === 'left-right' && !leftRight) {
    say('direction="left-right" did not put the tree into its horizontal layout');
  }
  if (c.direction === 'top-down' && leftRight) {
    say('direction="top-down" left the tree in its horizontal layout');
  }

  // ── Walk the data and the DOM together ────────────────────────────────────
  const rendered = readTree(el);
  if (rendered.length !== 1) {
    say(`${rendered.length} root nodes rendered, expected exactly 1`);
    return problems;
  }
  walk(c.fixture.data, rendered[0], collapsed, c, say, []);

  // Nothing outside the walk may exist: a stale card from a previous render
  // would still be in the shadow tree.
  const wantVisible = visibleNodes(c.fixture.data, collapsed);
  const allCards = root.querySelectorAll('.org-node').length;
  if (allCards !== wantVisible.length) {
    say(`${allCards} node cards in the shadow tree, but ${wantVisible.length} nodes`
      + ` should be visible (${c.collapsed.length} branches collapsed)`);
  }

  return problems;
}

function walk(
  node: OrgChartNode,
  drawn: RenderedNode | undefined,
  collapsed: Set<string>,
  c: ChartCombo,
  say: (m: string) => void,
  path: string[],
): void {
  const where = [...path, node.id].join(' > ');
  if (!drawn) { say(`node "${where}" was not rendered at all`); return; }

  // ── The card itself ───────────────────────────────────────────────────────
  if (drawn.name !== node.name) {
    say(`${where}: name reads "${drawn.name}", expected "${node.name}"`);
  }
  if (node.title) {
    if (drawn.title === null) say(`${where}: title "${node.title}" is not displayed`);
    else if (drawn.title !== node.title) {
      say(`${where}: title reads "${drawn.title}", expected "${node.title}"`);
    }
  } else if (drawn.title !== null) {
    say(`${where}: no title in the data but "${drawn.title}" is displayed`);
  }

  // ── Avatar or initials ────────────────────────────────────────────────────
  if (node.avatar) {
    if (drawn.avatarSrc === null) {
      say(`${where}: avatar "${node.avatar}" is set but no image is rendered`);
    } else {
      if (drawn.avatarSrc !== node.avatar) {
        say(`${where}: avatar src is "${drawn.avatarSrc}", expected "${node.avatar}"`);
      }
      if (drawn.avatarAlt !== node.name) {
        say(`${where}: avatar alt is "${drawn.avatarAlt}", expected the name "${node.name}"`);
      }
    }
    if (drawn.placeholder !== null) {
      say(`${where}: an image avatar AND an initials placeholder are both rendered`);
    }
  } else {
    if (drawn.avatarSrc !== null) {
      say(`${where}: no avatar in the data but an image "${drawn.avatarSrc}" is rendered`);
    }
    if (drawn.placeholder === null) {
      say(`${where}: no avatar, so a placeholder with the name initials is documented`);
    } else {
      // The FULL documented rendering ("name initials", plural) is asserted in
      // the findings slice; what every combo must satisfy is the part that is
      // not in dispute — a placeholder that is non-empty and starts with the
      // upper-cased first letter of the name.
      const first = node.name.trim().charAt(0).toUpperCase();
      if (!drawn.placeholder) {
        say(`${where}: the avatar placeholder is empty`);
      } else if (drawn.placeholder.charAt(0) !== first) {
        say(`${where}: the placeholder reads "${drawn.placeholder}", which does not`
          + ` start with "${first}"`);
      }
    }
  }

  // ── compact ───────────────────────────────────────────────────────────────
  if (drawn.compactCard !== c.compact) {
    say(`${where}: card is ${drawn.compactCard ? '' : 'not '}compact,`
      + ` expected ${c.compact ? '' : 'not '}compact`);
  }
  if (drawn.compactAvatar !== c.compact) {
    say(`${where}: avatar is ${drawn.compactAvatar ? '' : 'not '}compact,`
      + ` expected ${c.compact ? '' : 'not '}compact`);
  }

  // ── ARIA: this is a tree ──────────────────────────────────────────────────
  if (drawn.wrapper.getAttribute('role') !== 'treeitem') {
    say(`${where}: wrapper role is "${drawn.wrapper.getAttribute('role')}",`
      + ' expected "treeitem"');
  }
  if (drawn.label !== expectedNodeLabel(node)) {
    say(`${where}: aria-label is "${drawn.label}", expected "${expectedNodeLabel(node)}"`);
  }
  if (drawn.tabIndex !== '0') {
    say(`${where}: the card is not keyboard reachable (tabindex "${drawn.tabIndex}")`);
  }

  // ── Children, toggling, and the collapsed set ─────────────────────────────
  const branches = node.children ?? [];
  const isCollapsed = collapsed.has(node.id);
  if (hasChildren(node)) {
    if (drawn.expanded !== (isCollapsed ? 'false' : 'true')) {
      say(`${where}: aria-expanded is "${drawn.expanded}",`
        + ` expected "${isCollapsed ? 'false' : 'true'}"`);
    }
    if (!drawn.toggle) {
      say(`${where}: has ${branches.length} children but no toggle button`);
    } else {
      const want = `${isCollapsed ? 'Expand' : 'Collapse'} ${node.name}`;
      if (drawn.toggleLabel !== want) {
        say(`${where}: toggle is labelled "${drawn.toggleLabel}", expected "${want}"`);
      }
    }
  } else {
    if (drawn.toggle) say(`${where}: has no children but still renders a toggle button`);
    if (drawn.expanded) {
      say(`${where}: has no children but reports aria-expanded="${drawn.expanded}"`);
    }
  }

  const shown = hasChildren(node) && !isCollapsed;
  if (!shown) {
    if (drawn.childGroup) {
      say(`${where}: ${isCollapsed ? 'is collapsed' : 'has no children'} but still`
        + ' renders a children group');
    }
    return;
  }

  if (!drawn.childGroup) { say(`${where}: expanded but renders no children group`); return; }
  if (drawn.childGroup.getAttribute('role') !== 'group') {
    say(`${where}: children container has role`
      + ` "${drawn.childGroup.getAttribute('role')}", expected "group"`);
  }

  const childNodes = directChildWrappers(drawn.wrapper).map(readWrapper);
  if (childNodes.length !== branches.length) {
    say(`${where}: ${childNodes.length} children rendered, expected ${branches.length}`);
  }
  branches.forEach((child, i) => walk(child, childNodes[i], collapsed, c, say, [...path, node.id]));
}
