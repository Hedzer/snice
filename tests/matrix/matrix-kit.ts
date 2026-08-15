/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Matrix kit — mount / enumerate / collect, for the display-component suites
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `tests/matrix/table/matrix-utils.ts` is the pattern. Its oracle is
 * table-shaped (`expectedCellText`, `expectCellsMatch`); everything AROUND that
 * oracle is component-agnostic and lives here:
 *
 *   · mount one combo across BOTH channels — attributes (so the documented
 *     `<snice-x variant="…">` form really crosses its converter) and properties
 *     (arrays and objects have no attribute form) — and let it settle;
 *   · enumerate a cartesian product of documented feature dimensions, each
 *     point carrying a stable human-readable `id` that becomes the test name;
 *   · collect EVERY violation a combo commits and assert them all at once, so
 *     one run tells the whole story instead of dying on the first mismatch.
 *
 * The rules from `.ai/fuzzing.md` this exists to serve:
 *
 *   · expectations derive from `docs/ai/components/<name>.md` and the
 *     `.types.ts` contract, never from observed output — each component's
 *     `<component>-support.ts` reads like the doc it was written from;
 *   · a combo that diverges from the docs is a FINDING: the assertion stays
 *     correct and the test is marked `it.fails` with a `MATRIX-<component>-N`
 *     id. Nothing here offers a way to weaken an assertion, deliberately;
 *   · size the matrix to the component — the table is the ceiling, not the
 *     template.
 *
 * (`matrix-common.ts` in this directory is the same mechanism written for the
 * suites that mount purely through the property channel. This module is kept
 * separate rather than merged into it because the components below are
 * attribute-driven — `variant`, `status`, `size`, `type` are all documented as
 * attributes — and because both files are edited concurrently by different
 * component suites; a shared edit here would break suites nobody is looking at.)
 */
import { expect } from 'vitest';
import { createComponent, removeComponent, wait } from '../components/test-utils';

export { wait, removeComponent, createComponent };

/** Render settle window. Components render on a microtask plus a queued task. */
export const SETTLE = 30;

/**
 * Mount a component with a full feature vector applied.
 *
 * `attrs` cross the ATTRIBUTE channel before connection, `props` the PROPERTY
 * channel after the element is ready, and `html` seeds light-DOM children for
 * the components with a declarative slot API.
 */
export async function mount<T extends HTMLElement>(
  tag: string,
  attrs: Record<string, string | number | boolean> = {},
  props: Record<string, unknown> = {},
  options: { html?: string } = {},
): Promise<T> {
  const el = await createComponent<T>(tag, attrs);
  if (options.html !== undefined) {
    el.innerHTML = options.html;
    await wait(SETTLE);
  }
  for (const [key, value] of Object.entries(props)) {
    (el as any)[key] = value;
  }
  await wait(SETTLE);
  return el;
}

/** The shadow root, or a readable failure instead of `null.querySelector`. */
export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} has no shadow root`);
  return root;
}

export function one<T extends Element = Element>(el: HTMLElement, selector: string): T | null {
  return sr(el).querySelector<T>(selector);
}

export function all<T extends Element = Element>(el: HTMLElement, selector: string): T[] {
  return [...sr(el).querySelectorAll<T>(selector)];
}

/** First element exposing the given CSS part. */
export const part = (el: HTMLElement, name: string): HTMLElement | null =>
  one<HTMLElement>(el, `[part~="${name}"]`);

/** Every element exposing the given CSS part, in document order. */
export const parts = (el: HTMLElement, name: string): HTMLElement[] =>
  all<HTMLElement>(el, `[part~="${name}"]`);

/** Collapsed text content — the string a reader actually sees. */
export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ── Dimension enumeration ───────────────────────────────────────────────────

export type Dimensions = Record<string, readonly unknown[]>;

/** One point of the product, plus a stable human-readable id. */
export type Combo<D extends Dimensions> = { [K in keyof D]: D[K][number] } & { id: string };

/**
 * The full cartesian product of the named dimensions. Each combo's `id` reads
 * `variant=card/columns=2/shape=full`, and that id IS the test name — so a
 * failure names the exact feature vector that produced it, and re-running one
 * combo is a `-t` away.
 */
export function cross<D extends Dimensions>(dimensions: D): Combo<D>[] {
  const keys = Object.keys(dimensions) as (keyof D & string)[];
  let combos: Record<string, unknown>[] = [{}];
  for (const key of keys) {
    const next: Record<string, unknown>[] = [];
    for (const base of combos) {
      for (const value of dimensions[key]) next.push({ ...base, [key]: value });
    }
    combos = next;
  }
  return combos.map(combo => ({
    ...combo,
    id: keys.map(key => `${key}=${label(combo[key])}`).join('/'),
  })) as Combo<D>[];
}

/** Readable id fragment for a dimension value. */
export function label(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'none';
  if (value === '') return 'empty';
  if (Array.isArray(value)) return `[${value.map(label).join(',')}]`;
  if (typeof value === 'object') {
    const named = value as { name?: string; id?: string };
    if (typeof named.name === 'string') return named.name;
    if (typeof named.id === 'string') return named.id;
    return JSON.stringify(value);
  }
  return String(value);
}

/** All 2^n boolean vectors over `flags`, for suites with independent switches. */
export function flagVectors<K extends string>(flags: readonly K[]): Array<Record<K, boolean>> {
  const out: Array<Record<K, boolean>> = [];
  for (let bits = 0; bits < (1 << flags.length); bits++) {
    const vector = {} as Record<K, boolean>;
    flags.forEach((flag, i) => { vector[flag] = !!(bits & (1 << i)); });
    out.push(vector);
  }
  return out;
}

/** Compact id fragment naming the truthy flags of a vector. */
export function flagId(vector: Record<string, boolean>): string {
  const on = Object.keys(vector).filter(key => vector[key]);
  return on.length ? on.join('+') : 'plain';
}

// ── Problem collection ──────────────────────────────────────────────────────

/**
 * A per-combo violation list, mirroring the table oracle's `problems: string[]`.
 * `check`/`equal` return their verdict so a caller can skip dependent
 * assertions without hiding the failure that caused the skip.
 */
export class Problems {
  readonly list: string[] = [];

  say(message: string): void {
    this.list.push(message);
  }

  check(condition: boolean, message: string): boolean {
    if (!condition) this.say(message);
    return condition;
  }

  equal(actual: unknown, expected: unknown, what: string): boolean {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) this.say(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    return same;
  }
}

/** Assert a combo produced no violations, naming the combo on failure. */
export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** Record every `type` event the element emits; returns the growing detail list. */
export function captureEvents<T = unknown>(el: HTMLElement, type: string): T[] {
  const seen: T[] = [];
  el.addEventListener(type, (event: Event) => {
    seen.push((event as CustomEvent<T>).detail);
  });
  return seen;
}

/** Click a shadow node the way a user's pointer would. */
export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

/** Keydown on a shadow node — the Enter/Space activation paths. */
export function press(node: Element | null | undefined, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}
