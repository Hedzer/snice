/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared harness for the per-component feature-combination matrices
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This is the `tests/matrix/table/matrix-utils.ts` oracle pattern
 * generalised for the rest of the component library. The table's matrix asks
 * one question of every combo — "does each rendered cell equal the value the
 * documented pipeline derives?" — and routes every assertion through a single
 * helper so no test can quietly assert something weaker.
 *
 * The same shape applies here, with the oracle's *subject* changed. A button, a
 * badge, or an alert has no data pipeline; what it has is a documented mapping
 * from its property vector to its rendered shadow tree: which classes the root
 * carries, which parts exist, which ARIA attributes are set, which events fire.
 * So the oracle for these components is:
 *
 *     expected(combo) -> a description of the shadow tree
 *     actual(element) -> the same description, read back
 *
 * and a matrix test is `expectMatch(subject, expected)`. Every mismatch in a
 * combo is reported at once (an array compared to `[]`), exactly as
 * `expectCellsMatch` does, so one failing combo tells you everything that is
 * wrong with it instead of one thing per re-run.
 *
 * ── Where expectations come from ────────────────────────────────────────────
 *
 * `.ai/fuzzing.md` is binding: expectations derive from `docs/ai/components/`,
 * never from observed output. Every `expected*` function in a per-component
 * support module carries the doc line it encodes. When a combo diverges, the
 * assertion STAYS and the test is marked `it.fails` with a `MATRIX-<component>-N`
 * id — see `finding()` below.
 *
 * ── Sizing ─────────────────────────────────────────────────────────────────
 *
 * The table is the ceiling, not the template. `product()` makes a full cross
 * cheap to write, which makes it easy to write one that is far too big; a
 * component's matrix should be sized to the number of features that can
 * actually interact. Presentational components get tens of combos, form
 * controls with dirty-state and validation get low hundreds.
 */
import { expect } from 'vitest';
import { createComponent, removeComponent, wait } from '../components/test-utils';

export { createComponent, removeComponent, wait };

// ── Combo generation ────────────────────────────────────────────────────────

/**
 * Full cartesian product of the named axes, in declaration order.
 *
 * ```ts
 * product({ variant: VARIANTS, size: SIZES, disabled: [false, true] })
 * ```
 *
 * The key order of the input object is the significance order of the output:
 * the LAST axis varies fastest, which keeps a truncated test report readable
 * (consecutive combos differ in one cheap dimension rather than all of them).
 */
export function product<T extends Record<string, readonly unknown[]>>(
  axes: T,
): Array<{ [K in keyof T]: T[K][number] }> {
  const keys = Object.keys(axes) as Array<keyof T>;
  let rows: Array<Record<string, unknown>> = [{}];
  for (const key of keys) {
    const next: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      for (const value of axes[key]) next.push({ ...row, [key as string]: value });
    }
    rows = next;
  }
  return rows as Array<{ [K in keyof T]: T[K][number] }>;
}

/**
 * A stable, readable id for a combo — the string a failing test is named by.
 * Booleans collapse to a present/absent flag list so ids stay short:
 * `primary/large/[disabled,loading]`.
 */
export function comboId(combo: Record<string, unknown>): string {
  const scalars: string[] = [];
  const flags: string[] = [];
  for (const [key, value] of Object.entries(combo)) {
    if (typeof value === 'boolean') { if (value) flags.push(key); continue; }
    if (value === '' || value == null) continue;
    scalars.push(String(value));
  }
  const head = scalars.join('/') || 'default';
  return `${head}/[${flags.join(',') || 'plain'}]`;
}

/**
 * Attribute payload for `createComponent` derived from a combo: booleans that
 * are false are dropped (an absent boolean attribute is not the same as
 * `attr="false"`), and empty strings are dropped so a component keeps its own
 * documented default.
 */
export function attrsFrom(
  combo: Record<string, unknown>,
  map: Record<string, string> = {},
): Record<string, any> {
  const attrs: Record<string, any> = {};
  for (const [key, value] of Object.entries(combo)) {
    const attribute = map[key] ?? key;
    if (typeof value === 'boolean') { if (value) attrs[attribute] = true; continue; }
    if (value === '' || value == null) continue;
    attrs[attribute] = value as any;
  }
  return attrs;
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Wait until the element has finished the render its last property change
 * scheduled. Components expose a `rendered` promise (the same one
 * `snice-badge` awaits internally); the trailing macrotask hop lets
 * `queueMicrotask`-deferred work — slot inspection, group reconciliation —
 * land before an assertion reads the tree.
 */
export async function settle(el: any, ms = 0): Promise<void> {
  await el?.rendered;
  await wait(ms);
}

/**
 * Mount a component the way a page authors one: attributes and light-DOM
 * children are in place BEFORE the element connects, then object-valued
 * properties are assigned once it is ready.
 *
 * The pre-connect ordering is load-bearing, not tidiness. Several components
 * read their light DOM during the first render (`snice-button` decides icon
 * placement from a `[slot="icon"]` child, `snice-card` from its header/footer
 * slots, `snice-tabs` from its `<snice-tab>` children). Appending children
 * afterwards would measure a different, un-authored first paint.
 */
export async function mount<T extends HTMLElement>(
  tag: string,
  attrs: Record<string, any> = {},
  innerHTML = '',
  props: Record<string, any> = {},
): Promise<T> {
  const el = document.createElement(tag) as any;
  for (const [name, value] of Object.entries(attrs)) {
    if (typeof value === 'boolean') { if (value) el.setAttribute(name, ''); continue; }
    if (value === '' || value == null) continue;
    el.setAttribute(name, String(value));
  }
  if (innerHTML) el.innerHTML = innerHTML;
  document.body.appendChild(el);
  await el.ready;
  if (Object.keys(props).length) Object.assign(el, props);
  await settle(el);
  return el as T;
}

/** Tear down everything a combo mounted. Call from `afterEach`. */
export function unmountAll(): void {
  document.body.innerHTML = '';
}

/** The shadow root, as a hard failure rather than a null-deref later. */
export function shadow(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} rendered no shadow root`);
  return root;
}

export function one<T extends Element = HTMLElement>(el: HTMLElement, selector: string): T | null {
  return shadow(el).querySelector<T>(selector);
}

export function all<T extends Element = HTMLElement>(el: HTMLElement, selector: string): T[] {
  return [...shadow(el).querySelectorAll<T>(selector)];
}

/** The element carrying `part="<name>"`, the component's public shadow API. */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  return shadow(el).querySelector<T>(`[part~="${name}"]`);
}

/** Normalised visible text of a shadow node (collapse whitespace, trim). */
export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The text a `<slot>` actually projects.
 *
 * `textContent` of a shadow subtree does NOT include slotted light DOM — a
 * `[part="label"]` wrapping `<slot></slot>` reads as empty however much text
 * the author put in the element. Reading `assignedNodes()` is the only way to
 * assert "the default slot content became the label", which is what the docs
 * promise for every slotted component here.
 */
export function slottedText(root: HTMLElement, selector: string): string {
  const slot = shadow(root).querySelector<HTMLSlotElement>(selector);
  if (!slot) return '∅ no slot';
  return slot.assignedNodes({ flatten: true })
    .map(node => node.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Class list of a node as a Set, for order-independent comparison. */
export function classesOf(node: Element | null | undefined): Set<string> {
  return new Set((node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
}

// ── The oracle plumbing ─────────────────────────────────────────────────────

/**
 * A description of a rendered component: flat, comparable, and printable. Both
 * sides of every matrix assertion are one of these — the expectation built from
 * the docs, and the reading taken from the DOM.
 */
export type Shape = Record<string, unknown>;

/**
 * Compare an observed shape against the documented one and report EVERY
 * divergence at once. The sibling of `expectCellsMatch`: it exists so a matrix
 * test cannot degrade into a single `expect(a).toBe(b)` that hides the other
 * nine things the combo got wrong.
 *
 * Only keys present in `expected` are checked, so a support module can assert
 * the part of the shape its slice owns and leave the rest to another file.
 */
export function expectShape(actual: Shape, expected: Shape, label: string): void {
  const problems: string[] = [];
  for (const key of Object.keys(expected)) {
    const want = expected[key];
    const got = actual[key];
    if (!deepEqual(want, got)) {
      problems.push(`${key}: ${print(got)} != ${print(want)}`);
    }
  }
  expect(problems, label).toEqual([]);
}

/** Assert a collected problem list is empty — the geometry-style oracle. */
export function expectNoProblems(problems: string[], label: string): void {
  expect(problems, label).toEqual([]);
}

function print(value: unknown): string {
  if (value instanceof Set) return `{${[...value].sort().join(',')}}`;
  if (Array.isArray(value)) return `[${value.map(print).join(',')}]`;
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const value of a) if (!b.has(value)) return false;
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, i) => deepEqual(value, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every(k => deepEqual((a as any)[k], (b as any)[k]));
  }
  return Object.is(a, b);
}

// ── Findings ────────────────────────────────────────────────────────────────

/**
 * The title of a test pinned to a known divergence from the docs.
 *
 * Policy (`.ai/fuzzing.md`): the assertion is NOT weakened and the component is
 * NOT changed. The test keeps asserting the documented behavior and is declared
 * with `it.fails(...)`, so the suite fails the day the component is fixed and
 * the finding can be closed — a fixed defect cannot leave a lie behind.
 */
export function finding(id: string, description: string): string {
  return `${id}: ${description}`;
}

// ── Event capture ───────────────────────────────────────────────────────────

export interface CapturedEvent { type: string; detail: any }

/**
 * Record the named events in dispatch ORDER. Order is part of several
 * documented contracts (`input` -> `change` -> `checkbox-change`), so the
 * recorder keeps a single ordered list rather than per-type counters.
 */
export function captureEvents(el: HTMLElement, types: string[]): {
  events: CapturedEvent[];
  types: () => string[];
  stop: () => void;
} {
  const events: CapturedEvent[] = [];
  const handlers = types.map(type => {
    const handler = (event: Event) => events.push({ type, detail: (event as CustomEvent).detail });
    el.addEventListener(type, handler);
    return { type, handler };
  });
  return {
    events,
    types: () => events.map(e => e.type),
    stop: () => handlers.forEach(({ type, handler }) => el.removeEventListener(type, handler)),
  };
}

/** A real user-ish click on a shadow node (bubbles + composed, as a browser's). */
export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

/** A keydown on a shadow node, with the composed flag a real key event has. */
export function key(node: Element | null | undefined, k: string, init: KeyboardEventInit = {}): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key: k, bubbles: true, composed: true, cancelable: true, ...init,
  }));
}
