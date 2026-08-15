/**
 * Generic matrix harness, scoped to this component directory.
 *
 * `tests/matrix/table/matrix-utils.ts` is the original of this
 * pattern: the matrix's shared oracle helper lives next to the suites that use
 * it, so a slice can be read (and a failure understood) without leaving the
 * directory. Everything here is component-agnostic; the component's own
 * documented oracles live in `player-support.ts`.
 *
 * The reporting shape is the one the table matrix established: collect
 * human-readable problem sentences, then assert the list is empty. A failing
 * combo then prints everything wrong with it in one run instead of one
 * violation per re-run.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';

export { wait, createComponent };

/** One settle tick — a Snice render plus its microtask flush. */
export async function settle(ms = 20): Promise<void> {
  await wait(ms);
}

// ── Combination generator ───────────────────────────────────────────────────

export type Dimensions = Record<string, readonly unknown[]>;
export type Combo<D extends Dimensions> = { [K in keyof D]: D[K][number] } & { id: string };

/**
 * Full cartesian product of the named dimensions. Each combo carries a stable,
 * readable `id` built from its axis values — that id is what a failure report
 * names, so it must not depend on anything but the combo itself.
 */
export function cross<D extends Dimensions>(dims: D): Combo<D>[] {
  const keys = Object.keys(dims);
  let rows: Record<string, unknown>[] = [{}];
  for (const key of keys) {
    const next: Record<string, unknown>[] = [];
    for (const row of rows) for (const value of dims[key]) next.push({ ...row, [key]: value });
    rows = next;
  }
  return rows.map(row => ({ ...row, id: keys.map(k => `${k}=${labelOf(row[k])}`).join(' ') })) as any;
}

function labelOf(value: unknown): string {
  if (value === '') return "''";
  if (Array.isArray(value)) return `[${value.length}]`;
  if (value && typeof value === 'object') return 'obj';
  return String(value);
}

// ── Mounting ────────────────────────────────────────────────────────────────

const mounted: HTMLElement[] = [];

export interface MountOptions {
  /** Attributes set before connect — the authored-markup channel. */
  attrs?: Record<string, any>;
  /** Properties assigned after connect and first render — the JS channel. */
  props?: Record<string, any>;
  settleMs?: number;
}

export async function mount<T extends HTMLElement = any>(
  tag: string, options: MountOptions = {},
): Promise<T> {
  const el = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    if (value === false || value == null) continue;
    el.setAttribute(name, value === true ? '' : String(value));
  }
  document.body.appendChild(el);
  mounted.push(el);
  await (el as any).ready;
  for (const [name, value] of Object.entries(options.props ?? {})) (el as any)[name] = value;
  await settle(options.settleMs);
  return el;
}

/** Tear down everything `mount` created. Call from `afterEach`. */
export function cleanup(): void {
  while (mounted.length) mounted.pop()!.remove();
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

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

// ── Problem collection ──────────────────────────────────────────────────────

export class Problems {
  readonly list: string[] = [];

  say(message: string): void { this.list.push(message); }

  /** Assert `actual === expected`, naming the axis under test. */
  eq(what: string, actual: unknown, expected: unknown): void {
    if (!Object.is(actual, expected)) {
      this.say(`${what}: ${JSON.stringify(actual)} != expected ${JSON.stringify(expected)}`);
    }
  }

  ok(condition: boolean, message: string): void {
    if (!condition) this.say(message);
  }
}

export function expectClean(problems: Problems, comboId: string): void {
  expect(problems.list, `combo ${comboId}`).toEqual([]);
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface Recorded { type: string; detail: any }

/**
 * Record the named events in order. Matrix assertions are on the SEQUENCE:
 * ordering is contract here (a track change precedes the play it triggers) and
 * a set-membership assertion cannot see it.
 */
export function record(el: HTMLElement, types: string[]): Recorded[] {
  const events: Recorded[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      events.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return events;
}

export const sequence = (events: Recorded[]): string[] => events.map(e => e.type);

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export function key(node: Element | null | undefined, name: string, init: KeyboardEventInit = {}): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key: name, bubbles: true, composed: true, cancelable: true, ...init,
  }));
}
