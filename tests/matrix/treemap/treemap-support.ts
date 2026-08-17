/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-treemap feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything asserted in this directory comes from
 * `docs/ai/components/treemap.md` plus `snice-treemap.types.ts`:
 *
 *   · PROPERTIES — `data: TreemapNode` (JS only), `showLabels` (attr
 *     `show-labels`, default TRUE), `showValues` (attr `show-values`, default
 *     FALSE), `colorScheme` (eight documented values, attr `color-scheme`),
 *     `padding`, `animation`, and the read-only `drillPath`.
 *   · METHODS — `drillDown(node)` ("Drill into node's children"), `drillUp()`
 *     ("Go back one level"), `drillToRoot()` ("Reset to root").
 *   · EVENTS — `treemap-click { node, depth }`, `treemap-hover { node, depth }
 *     | null`, `treemap-drill { node, path }`.
 *   · CSS PARTS — `breadcrumbs`, `base`, `chart`, `tooltip`.
 *
 * The oracle below encodes the one structural rule the whole component follows:
 * a treemap draws ONE RECTANGLE PER CHILD of the node currently in view, sized
 * by that child's total value, and a label or value is written into a rectangle
 * only when it is being shown AND the rectangle is big enough to hold it.
 * Everything else — the exact squarified geometry, the palette hues — is
 * asserted as a relationship (areas ordered by value, siblings distinguishable)
 * rather than as pixel arithmetic the docs never promise.
 *
 * happy-dom performs no layout, so the component's `ResizeObserver` never
 * reports a box and it keeps its own 600x400 default. That is stable and
 * sufficient for every assertion here; the real geometry belongs to the visual
 * tier at `tests/live/matrix/treemap/`.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/treemap/snice-treemap';
import type {
  TreemapColorScheme, TreemapNode, SniceTreemapElement,
} from '../../../packages/components/src/treemap/snice-treemap.types';

export { wait };
export type { TreemapColorScheme, TreemapNode, SniceTreemapElement };

/** Render settle window: the chart is rebuilt on a microtask plus a task. */
export const SETTLE = 30;

/** Every documented `colorScheme`. */
export const SCHEMES: TreemapColorScheme[] = [
  'default', 'blue', 'green', 'purple', 'orange', 'warm', 'cool', 'rainbow',
];

/** The four documented CSS parts. */
export const DOC_PARTS = ['breadcrumbs', 'base', 'chart', 'tooltip'] as const;

/** The component's own default viewport when nothing has measured it. */
export const VIEW = { width: 600, height: 400 };

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The doc's own example tree, verbatim. */
export const DOC_TREE: TreemapNode = {
  label: 'Root',
  value: 0,
  children: [
    { label: 'A', value: 50 },
    { label: 'B', value: 30, color: '#e74c3c' },
    {
      label: 'C',
      value: 20,
      children: [
        { label: 'C1', value: 12 },
        { label: 'C2', value: 8 },
      ],
    },
  ],
};

export const TREES: Record<string, TreemapNode> = {
  /** The doc's example. */
  doc: DOC_TREE,
  /** A leaf: nothing to lay out inside it. */
  leaf: { label: 'Only', value: 100 },
  /** The documented empty default. */
  empty: { label: '', value: 0 },
  /** One child: the whole viewport is one rectangle. */
  single: { label: 'Root', value: 0, children: [{ label: 'Solo', value: 42 }] },
  /** Equal siblings: two rectangles that must not collapse into one. */
  equal: {
    label: 'Root',
    value: 0,
    children: [{ label: 'A', value: 100 }, { label: 'B', value: 100 }],
  },
  /** A steep drop: the small child is where a rectangle can vanish. */
  steep: {
    label: 'Root',
    value: 0,
    children: [{ label: 'Huge', value: 100000 }, { label: 'Tiny', value: 1 }],
  },
  /** A zero-valued sibling: documented `value: number`, no exception for 0. */
  zero: {
    label: 'Root',
    value: 0,
    children: [{ label: 'Real', value: 60 }, { label: 'Nothing', value: 0 }],
  },
  /** Three levels, for the drill path. */
  deep: {
    label: 'Root',
    value: 0,
    children: [
      {
        label: 'Branch',
        value: 0,
        children: [
          { label: 'Leaf 1', value: 30, children: [{ label: 'Deep', value: 30 }] },
          { label: 'Leaf 2', value: 20 },
        ],
      },
      { label: 'Other', value: 40 },
    ],
  },
  /** Every child carries its own colour. */
  colored: {
    label: 'Root',
    value: 0,
    children: [
      { label: 'Red', value: 40, color: '#e74c3c' },
      { label: 'Green', value: 30, color: '#2e7d32' },
      { label: 'Blue', value: 20, color: '#1565c0' },
    ],
  },
  /** More children than the palette has colours: where a scheme has to wrap. */
  many: {
    label: 'Root',
    value: 0,
    children: Array.from({ length: 12 }, (_, index) => ({
      label: `N${index + 1}`,
      value: 100 - index * 7,
    })),
  },
  /** Labels a renderer must escape rather than interpret. */
  markup: {
    label: 'Root',
    value: 0,
    children: [
      { label: '<script>alert(1)</script>', value: 50 },
      { label: 'A & B "quoted"', value: 50 },
    ],
  },
};

/** The documented total of a node: leaves carry it, parents sum their children. */
export function totalOf(node: TreemapNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + totalOf(child), 0);
  }
  return Math.max(0, node.value);
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface TreemapCombo {
  tree?: keyof typeof TREES;
  showLabels?: boolean;
  showValues?: boolean;
  colorScheme?: TreemapColorScheme;
  padding?: number;
  animation?: boolean;
}

export function comboId(combo: TreemapCombo): string {
  return `${combo.tree ?? 'doc'}`
    + `/scheme=${combo.colorScheme ?? 'default'}`
    + `/labels=${combo.showLabels === false ? 'off' : 'on'}`
    + `/values=${combo.showValues ? 'on' : 'off'}`
    + `/padding=${combo.padding ?? 2}`;
}

/**
 * Mount one combo. `data` has no attribute form (`attribute: false` in the
 * source, "JS only" in the doc), so it crosses the property channel; every
 * display switch has an attribute and crosses that one, except `showLabels` and
 * `animation`, whose documented defaults are TRUE and can therefore only be
 * turned off through a property.
 */
export async function mountTreemap(combo: TreemapCombo = {}): Promise<SniceTreemapElement> {
  const el = document.createElement('snice-treemap') as SniceTreemapElement;
  if (combo.showValues) el.setAttribute('show-values', '');
  if (combo.colorScheme) el.setAttribute('color-scheme', combo.colorScheme);
  if (combo.padding !== undefined) el.setAttribute('padding', String(combo.padding));
  document.body.appendChild(el);
  await (el as any).ready;
  if (combo.showLabels === false) el.showLabels = false;
  if (combo.animation === false) el.animation = false;
  el.data = TREES[combo.tree ?? 'doc'];
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceTreemapElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-treemap rendered no shadow root');
  return root;
}

export function partEl(el: SniceTreemapElement, name: string): HTMLElement | null {
  return exactPart<HTMLElement>(el as HTMLElement, name);
}

export function rects(el: SniceTreemapElement): SVGRectElement[] {
  return [...sr(el).querySelectorAll<SVGRectElement>('rect.treemap__rect')];
}

export function labels(el: SniceTreemapElement): Element[] {
  return [...sr(el).querySelectorAll('text.treemap__label')];
}

export function values(el: SniceTreemapElement): Element[] {
  return [...sr(el).querySelectorAll('text.treemap__value')];
}

export function breadcrumbs(el: SniceTreemapElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.treemap__breadcrumb')];
}

export function tooltip(el: SniceTreemapElement): HTMLElement | null {
  return partEl(el, 'tooltip');
}

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The geometry of every rectangle, in the component's own viewport units. */
export function boxes(el: SniceTreemapElement): Array<{ x: number; y: number; w: number; h: number }> {
  return rects(el).map(rect => ({
    x: Number(rect.getAttribute('x')),
    y: Number(rect.getAttribute('y')),
    w: Number(rect.getAttribute('width')),
    h: Number(rect.getAttribute('height')),
  }));
}

export function fills(el: SniceTreemapElement): string[] {
  return rects(el).map(rect => rect.getAttribute('fill') ?? '');
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

export function hover(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
}

export function unhover(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
}

// ── Oracles ─────────────────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];

  check(ok: boolean, message: string): boolean {
    if (!ok) this.list.push(message);
    return ok;
  }

  equal(actual: unknown, expected: unknown, what: string): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    return same;
  }
}

export function expectClean(problems: Problems, id: string): void {
  expect(problems.list, `combo ${id}`).toEqual([]);
}

/** The children currently in view: the drill target's, or the root's. */
export function visibleChildren(el: SniceTreemapElement, tree: TreemapNode): TreemapNode[] {
  const path = el.drillPath;
  const current = path.length > 0 ? path[path.length - 1] : tree;
  return current.children ?? [];
}

/**
 * The whole-chart oracle.
 *
 * "Hierarchical data as nested rectangles with squarified layout": one
 * rectangle per child in view, areas ordered by total value, labels and values
 * written only when they are switched on and the rectangle can hold them.
 */
export function expectChartMatches(el: SniceTreemapElement, combo: TreemapCombo): void {
  const problems = new Problems();
  const tree = TREES[combo.tree ?? 'doc'];
  const children = visibleChildren(el, tree);

  // ── Parts ───────────────────────────────────────────────────────────────
  for (const name of DOC_PARTS) {
    problems.check(!!partEl(el, name), `missing part="${name}"`);
  }

  // ── One rectangle per child in view ─────────────────────────────────────
  const drawn = boxes(el);
  problems.equal(drawn.length, children.length, 'rectangle count');

  // ── Every rectangle is a real, visible area inside the viewport ─────────
  drawn.forEach((box, index) => {
    if (!Number.isFinite(box.x) || !Number.isFinite(box.y)
      || !Number.isFinite(box.w) || !Number.isFinite(box.h)) {
      problems.list.push(`rect ${index} has a non-finite box ${JSON.stringify(box)}`);
      return;
    }
    if (box.w < 0 || box.h < 0) problems.list.push(`rect ${index} has a negative size ${JSON.stringify(box)}`);
    if (box.x < -0.01 || box.y < -0.01) problems.list.push(`rect ${index} starts outside the viewport`);
    if (box.x + box.w > VIEW.width + 0.01 || box.y + box.h > VIEW.height + 0.01) {
      problems.list.push(`rect ${index} escapes the viewport ${JSON.stringify(box)}`);
    }
  });

  // ── Area follows value ──────────────────────────────────────────────────
  // The doc's whole premise: a bigger number is a bigger rectangle. Compare
  // the DRAWN order against the value order rather than absolute areas, which
  // the padding shrinks.
  if (children.length > 1 && drawn.length === children.length) {
    const positive = children.filter(child => totalOf(child) > 0);
    if (positive.length === children.length) {
      const byValue = [...children].map(totalOf).sort((a, b) => b - a);
      const areas = drawn.map(box => box.w * box.h);
      const ranked = [...areas].sort((a, b) => b - a);
      const sameOrder = areas.every((area, index) =>
        byValue[index] === undefined || ranked.indexOf(area) === areas.indexOf(area));
      problems.check(sameOrder, `areas ${JSON.stringify(areas)} do not follow values ${JSON.stringify(byValue)}`);
    }
  }

  // ── Fills ───────────────────────────────────────────────────────────────
  const painted = fills(el);
  painted.forEach((fill, index) => {
    if (!fill) problems.list.push(`rect ${index} has no fill`);
  });
  // "color?: string" on a node is an explicit override and must win.
  const sorted = [...children].sort((a, b) => totalOf(b) - totalOf(a));
  sorted.forEach((child, index) => {
    if (child.color && painted[index] && painted[index] !== child.color) {
      problems.list.push(`rect ${index} (${child.label}) painted ${painted[index]}, not its own ${child.color}`);
    }
  });

  // ── Labels and values ───────────────────────────────────────────────────
  // A label is written when `showLabels` is on and the rectangle can hold it;
  // the same for values with `showValues`. Neither may appear when its switch
  // is off — that is the only part of the rule the docs state absolutely.
  if (combo.showLabels === false) {
    problems.equal(labels(el).length, 0, 'labels drawn with show-labels off');
  }
  if (!combo.showValues) {
    problems.equal(values(el).length, 0, 'values drawn with show-values off');
  }
  problems.check(labels(el).length <= drawn.length, 'more labels than rectangles');
  problems.check(values(el).length <= drawn.length, 'more values than rectangles');

  // ── Accessibility ───────────────────────────────────────────────────────
  const base = partEl(el, 'base');
  problems.equal(base?.getAttribute('role'), 'img', 'base role');
  problems.check(!!base?.getAttribute('aria-label'), 'base has no aria-label');

  expectClean(problems, comboId(combo));
}

/** Record the named events in dispatch order. */
export const ALL_EVENTS = ['treemap-click', 'treemap-hover', 'treemap-drill'];

export function captureEvents(
  el: SniceTreemapElement,
  types: string[] = ALL_EVENTS,
): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}
