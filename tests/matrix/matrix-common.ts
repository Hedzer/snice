// Shared harness for the per-component feature-combination matrices.
//
// The table matrix (tests/matrix/table/matrix-utils.ts) is the
// pattern this mirrors: every combo is judged by ONE oracle that derives its
// expectation from the documented behaviour in docs/ai/components/<name>.md,
// and a combo reports EVERY violation at once instead of dying on the first.
//
// The table's oracle is about cell VALUES, which is a table-shaped question.
// The components in this tree are shaped differently — their documented
// surface is "given this property vector, which parts exist, what do they say,
// and which state classes do they carry" — so the shared piece here is the
// mechanism (mount a combo, collect problems, assert none) rather than a
// single value oracle. Each component adds its own oracle in
// `matrix/<component>/<component>-utils.ts`.
import { expect } from 'vitest';
import { createComponent, removeComponent, wait } from '../components/test-utils';

export { wait, removeComponent };

/** One settle tick. Components render on a microtask + rAF; 20ms clears both. */
export async function settle(ms = 20): Promise<void> {
  await wait(ms);
}

/**
 * Mount a component with a property vector already applied.
 *
 * Properties are assigned through the PROPERTY channel (not attributes) after
 * the element is ready, because that is the channel every documented combo in
 * this tree is expressed in (`chart.datasets = [...]`, `list.loading = true`).
 * Attribute-only concerns get their own explicit tests where the docs single
 * them out.
 */
export async function mount<T extends HTMLElement>(
  tag: string,
  props: Record<string, any> = {},
  options: { html?: string } = {},
): Promise<T> {
  // Light-DOM children are placed BEFORE the element connects. Components that
  // read their slotted content on `@ready` (the list's role pass, the
  // carousel's slide count) would otherwise depend on `slotchange`, which
  // happy-dom does not emit for a post-connect innerHTML write. The real
  // browser handles both orders; the visual tier is where the dynamic one is
  // exercised.
  if (options.html !== undefined) {
    const el = document.createElement(tag) as T;
    el.innerHTML = options.html;
    document.body.appendChild(el);
    await (el as any).ready;
    for (const [key, value] of Object.entries(props)) {
      (el as any)[key] = value;
    }
    await settle();
    return el;
  }

  const el = await createComponent<T>(tag, {});
  for (const [key, value] of Object.entries(props)) {
    (el as any)[key] = value;
  }
  await settle();
  return el;
}

export function shadow(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} has no shadow root`);
  return root;
}

/** First element exposing the given CSS part. */
export function part(el: HTMLElement, name: string): HTMLElement | null {
  return shadow(el).querySelector(`[part~="${name}"]`) as HTMLElement | null;
}

/** Every element exposing the given CSS part, in document order. */
export function parts(el: HTMLElement, name: string): HTMLElement[] {
  return [...shadow(el).querySelectorAll(`[part~="${name}"]`)] as HTMLElement[];
}

export function textOf(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * A problem list. Mirrors the table oracle's `problems: string[]` contract:
 * accumulate human-readable violations, then assert the list is empty so one
 * failing combo tells the whole story in a single run.
 */
export class Problems {
  readonly list: string[] = [];

  /** Record `message` unless `ok` holds. */
  check(ok: boolean, message: string): void {
    if (!ok) this.list.push(message);
  }

  /** Record a mismatch unless `actual` equals `expected`. */
  equal(actual: unknown, expected: unknown, what: string): void {
    if (!Object.is(actual, expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }

  /** Record a mismatch unless the two arrays are element-wise equal. */
  equalList(actual: unknown[], expected: unknown[], what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }

  say(message: string): void {
    this.list.push(message);
  }
}

/** Assert a combo produced no problems at all. */
export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

/** Cartesian product helper — keeps combo generators declarative. */
export function cross<A, B>(as: readonly A[], bs: readonly B[]): Array<[A, B]> {
  return as.flatMap(a => bs.map(b => [a, b] as [A, B]));
}

/** All 2^n boolean vectors over `flags`, as a record per vector. */
export function flagVectors<K extends string>(flags: readonly K[]): Array<Record<K, boolean>> {
  const out: Array<Record<K, boolean>> = [];
  for (let bits = 0; bits < (1 << flags.length); bits++) {
    const vector = {} as Record<K, boolean>;
    flags.forEach((flag, i) => { vector[flag] = !!(bits & (1 << i)); });
    out.push(vector);
  }
  return out;
}

/** Compact combo id fragment for the truthy flags of a vector. */
export function flagId(vector: Record<string, boolean>): string {
  const on = Object.keys(vector).filter(k => vector[k]);
  return on.length ? on.join('+') : 'plain';
}
