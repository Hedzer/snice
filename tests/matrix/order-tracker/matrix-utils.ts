/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component matrix harness
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The generic half of `tests/matrix/table/matrix-utils.ts`, carried
 * next to the component whose matrix uses it: enumerate the cartesian product
 * of documented feature dimensions, mount one combo, collect EVERY violation
 * that combo has, and assert them all at once.
 *
 * The rules from `.ai/fuzzing.md` this exists to serve:
 *
 *   · Expectations derive from `docs/ai/components/<name>.md` and the
 *     component's `.types.ts` — never from what the component happens to emit.
 *   · A combo that diverges from the docs is a FINDING: the assertion stays
 *     correct, the case is marked `it.fails` with a `MATRIX-<component>-N` id,
 *     and the combo/expected/actual are recorded. Nothing here offers a way to
 *     weaken an assertion, deliberately.
 *   · Size the matrix to the component. The table is the ceiling, not the
 *     template.
 *
 * Collect-then-assert rather than assert-as-you-go: a combo that breaks usually
 * breaks several ways at once, and one run should report all of them instead of
 * costing one round trip per violation.
 *
 * This directory is EXCLUDED from the default vitest include (vitest.config.ts)
 * and runs only via `npx vitest run --config vitest.matrix.config.ts`. The
 * everyday-loop slice lives in `tests/matrix/<component>/smoke.test.ts`.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';

export { wait, createComponent };

/** One settle tick: a Snice render is a microtask plus a queued task. */
export async function settle(ms = 24): Promise<void> {
  await wait(ms);
}

// ── Combination generator ───────────────────────────────────────────────────

export type Dimensions = Record<string, readonly unknown[]>;
export type Combo<D extends Dimensions> = { [K in keyof D]: D[K][number] } & { id: string };

/**
 * Full cartesian product of the named dimensions. Every combo carries a stable
 * `id` built from its axis values — the id becomes the test name, so a failure
 * names the exact feature vector that produced it.
 */
export function cross<D extends Dimensions>(dims: D): Combo<D>[] {
  const keys = Object.keys(dims) as (keyof D & string)[];
  let rows: Record<string, unknown>[] = [{}];
  for (const key of keys) {
    const next: Record<string, unknown>[] = [];
    for (const row of rows) {
      for (const value of dims[key]) next.push({ ...row, [key]: value });
    }
    rows = next;
  }
  return rows.map(row => ({
    ...row,
    id: keys.map(k => `${k}=${label(row[k])}`).join(' '),
  })) as Combo<D>[];
}

/** Readable id fragment for one dimension value. */
export function label(value: unknown): string {
  if (value === '') return "''";
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.length}]`;
  if (value && typeof value === 'object') {
    const named = value as { id?: string; name?: string; label?: string };
    return named.id ?? named.name ?? named.label ?? 'obj';
  }
  return String(value);
}

/** Keep only the combos the component's documented contract admits. */
export function only<T>(combos: T[], keep: (combo: T) => boolean): T[] {
  return combos.filter(keep);
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface MountOptions {
  /** Attributes applied before connect — the authored-markup channel. */
  attrs?: Record<string, string | number | boolean>;
  /** Properties assigned after connect — arrays/objects have no attribute form. */
  props?: Record<string, unknown>;
  /** Light-DOM children, assigned before connect so slot-reading components see them. */
  html?: string;
  /** Settle time after mounting. */
  settleMs?: number;
}

const mounted: HTMLElement[] = [];

export async function mount<T extends HTMLElement = any>(
  tag: string,
  options: MountOptions = {},
): Promise<T> {
  let el: T;
  if (options.html !== undefined) {
    el = document.createElement(tag) as T;
    for (const [key, value] of Object.entries(options.attrs ?? {})) {
      if (value === false || value == null) continue;
      el.setAttribute(key, value === true ? '' : String(value));
    }
    el.innerHTML = options.html;
    document.body.appendChild(el);
    await (el as any).ready;
  } else {
    el = await createComponent<T>(tag, options.attrs ?? {});
  }
  mounted.push(el);
  for (const [key, value] of Object.entries(options.props ?? {})) {
    (el as any)[key] = value;
  }
  await settle(options.settleMs);
  return el;
}

/** Tear down everything `mount` created. Call from `afterEach`. */
export function cleanup(): void {
  while (mounted.length) mounted.pop()!.remove();
  document.body.innerHTML = '';
}

// ── Shadow queries ──────────────────────────────────────────────────────────

export function shadow(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} has no shadow root`);
  return root;
}

export function one<T extends Element = HTMLElement>(el: HTMLElement, selector: string): T | null {
  return shadow(el).querySelector<T>(selector);
}

export function all<T extends Element = HTMLElement>(el: HTMLElement, selector: string): T[] {
  return [...shadow(el).querySelectorAll<T>(selector)];
}

/** The single element exposing a documented CSS part, or null. */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  return shadow(el).querySelector<T>(`[part~="${name}"]`);
}

/** Every element exposing a documented CSS part, in document order. */
export function parts<T extends Element = HTMLElement>(el: HTMLElement, name: string): T[] {
  return [...shadow(el).querySelectorAll<T>(`[part~="${name}"]`)];
}

/** Collapsed text content — the string a reader would actually see. */
export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function partText(el: HTMLElement, name: string): string {
  return text(part(el, name));
}

/** True when `a` precedes `b` in document order. */
export function precedes(a: Element, b: Element): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

// ── Problem collection ──────────────────────────────────────────────────────

/**
 * The reporting shape every matrix assertion uses. Push a human-readable
 * sentence per violation, then `expectClean`, so a failing combo prints
 * everything wrong with it at once.
 */
export class Problems {
  readonly list: string[] = [];

  say(message: string): void {
    this.list.push(message);
  }

  /** Assert a boolean condition holds. */
  ok(condition: boolean, message: string): void {
    if (!condition) this.say(message);
  }

  /** Assert `actual` deep-equals `expected`, naming the axis being checked. */
  eq(what: string, actual: unknown, expected: unknown): void {
    const same = Object.is(actual, expected)
      || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) {
      this.say(`${what}: ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
    }
  }

  /** Assert a number matches within a tolerance (money and percentages). */
  close(what: string, actual: number, expected: number, epsilon = 1e-9): void {
    if (!(Math.abs(actual - expected) <= epsilon)) {
      this.say(`${what}: ${actual} != expected ${expected} (±${epsilon})`);
    }
  }
}

export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

// ── Event recording ─────────────────────────────────────────────────────────

export interface Recorded { type: string; detail: any }

/**
 * Record the named events for the life of the returned handle. Matrix tests
 * assert on the exact SEQUENCE, because ordering is contract in several of
 * these components and set-membership would not see it.
 */
export function record(el: HTMLElement, types: string[]): { events: Recorded[]; stop(): void } {
  const events: Recorded[] = [];
  const handlers = types.map(type => {
    const handler = (event: Event) => events.push({ type, detail: (event as CustomEvent).detail });
    el.addEventListener(type, handler);
    return { type, handler };
  });
  return {
    events,
    stop() { for (const { type, handler } of handlers) el.removeEventListener(type, handler); },
  };
}

/** Just the type names, in order — the usual assertion target. */
export function sequence(events: Recorded[]): string[] {
  return events.map(e => e.type);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function key(node: Element | null | undefined, name: string, init: KeyboardEventInit = {}): boolean {
  if (!node) return false;
  return node.dispatchEvent(new KeyboardEvent('keydown', {
    key: name, bubbles: true, composed: true, cancelable: true, ...init,
  }));
}

/** Toggle a checkbox the way a user would, then fire the `change` it listens for. */
export function toggleCheckbox(box: HTMLInputElement | null | undefined, checked: boolean): void {
  if (!box) return;
  box.checked = checked;
  box.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

/** Set an input's value and fire `input`, the way typing does. */
export function typeInto(input: HTMLInputElement | HTMLTextAreaElement | null | undefined, value: string): void {
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}
