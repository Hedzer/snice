/**
 * snice-masonry matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/masonry.md and
 * packages/components/src/masonry/snice-masonry.types.ts. Nothing here is read
 * off the component's output.
 *
 * The documented surface is three properties and one container:
 *
 *   · `columns: number = 3`            — column count, 0 = auto from minColumnWidth
 *   · `gap: string = '1rem'`           — gap between items
 *   · `minColumnWidth: string = '250px'` (attr `min-column-width`)
 *   · CSS part `base` — the masonry layout container
 *   · slot `(default)` — the items to arrange
 *   · a11y: "The masonry container has `role="list"` for screen readers"
 *
 * SIMULATION BOUNDARY. Masonry is a CSS-columns layout: `column-count`,
 * `column-gap` and `column-width` are the entire mechanism, and happy-dom
 * performs no layout, so the DOM tier can only assert the CONTRACT the
 * stylesheet consumes — the three custom properties the component publishes on
 * its host, and the `columns` attribute the `:host([columns="0"])` auto rule
 * keys off. Whether those values actually produce N columns of the right width
 * is the visual tier's job (tests/live/matrix/masonry/masonry-visual.spec.ts).
 *
 * That boundary is exactly why the custom-property assertions below are not
 * "testing the implementation": `--masonry-columns` / `--masonry-gap` /
 * `--masonry-column-width` are the only observable consequence of the three
 * documented properties in an environment without layout, and a component that
 * publishes the wrong one lays out wrongly in every browser.
 */
import { Problems, SETTLE, mount, part, sr, text, wait } from '../matrix-kit';
import '../../../packages/components/src/masonry/snice-masonry';

export { Problems, mount, part, sr, text };

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  columns: 3,
  gap: '1rem',
  minColumnWidth: '250px',
} as const;

export interface Vector {
  columns: number;
  gap: string;
  minColumnWidth: string;
}

/** Light-DOM children for a combo: `count` plain items to arrange. */
export function itemsHtml(count: number): string {
  return Array.from({ length: count }, (_, i) => `<div class="card">Card ${i + 1}</div>`).join('');
}

/**
 * Mount one combo with its items in place BEFORE the host connects.
 *
 * The component assigns `role="listitem"` from a microtask queued in its
 * `@ready` hook, and refreshes it on `slotchange`. happy-dom does not fire
 * `slotchange` for an `innerHTML` write that lands after connection, so a
 * post-connect mount would test nothing but the harness. Real browsers handle
 * both orders; the dynamic one belongs to the visual tier.
 */
async function mountWithItems(
  itemCount: number,
  attrs: Record<string, string>,
  props: Record<string, unknown>,
): Promise<HTMLElement> {
  const el = document.createElement('snice-masonry');
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  el.innerHTML = itemsHtml(itemCount);
  document.body.appendChild(el);
  await (el as any).ready;
  for (const [key, value] of Object.entries(props)) (el as any)[key] = value;
  await wait(SETTLE);
  return el;
}

/**
 * Mount one combo with `columns` and `gap` through the ATTRIBUTE channel — the
 * form every documented example uses (`<snice-masonry columns="3" gap="1rem">`)
 * and the only one the `:host([columns="0"])` rule can see.
 *
 * `minColumnWidth` keeps crossing the property channel here (its documented
 * attribute is covered unpinned by its own oracle below, MATRIX-masonry-1
 * fixed); mixing the two into one combo would let an attribute regression in
 * either property hide behind the other.
 */
export async function mountMasonry(vector: Vector, itemCount: number): Promise<HTMLElement> {
  return mountWithItems(itemCount, {
    columns: String(vector.columns),
    gap: vector.gap,
  }, { minColumnWidth: vector.minColumnWidth });
}

/**
 * Mount with `min-column-width` set the documented way: as an attribute,
 * exactly as `<snice-masonry columns="0" min-column-width="300px">` does.
 */
export async function mountMasonryMinWidthAttribute(
  minColumnWidth: string, itemCount = 3,
): Promise<HTMLElement> {
  return mountWithItems(itemCount, {
    columns: '0',
    'min-column-width': minColumnWidth,
  }, {});
}

/** Mount the same combo through the PROPERTY channel instead. */
export async function mountMasonryByProperty(vector: Vector, itemCount: number): Promise<HTMLElement> {
  return mountWithItems(itemCount, {}, {
    columns: vector.columns,
    gap: vector.gap,
    minColumnWidth: vector.minColumnWidth,
  });
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The container: one `[part="base"]` element carrying `role="list"`, holding
 * the default slot. Every documented structural claim about the component.
 */
export function checkContainer(problems: Problems, el: HTMLElement): void {
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no [part~="base"] container')) return;
  problems.equal(base!.getAttribute('role'), 'list', 'container role');
  problems.check(
    !!base!.querySelector('slot'),
    'the container holds no <slot> — slotted items have nowhere to go',
  );
  problems.check(sr(el).querySelectorAll('slot').length === 1,
    'more than one slot: the documented API has a single default slot');
}

/**
 * The three documented properties reach the stylesheet.
 *
 * `columns`, `gap` and `minColumnWidth` have no rendered text and no DOM of
 * their own; the component's contract with its own CSS is the trio of custom
 * properties below, plus the reflected `columns` attribute that the documented
 * auto mode (`columns="0"`) is selected by.
 */
export function checkLayoutVariables(problems: Problems, el: HTMLElement, vector: Vector): void {
  problems.equal(el.style.getPropertyValue('--masonry-columns'), String(vector.columns),
    '--masonry-columns');
  problems.equal(el.style.getPropertyValue('--masonry-gap'), vector.gap, '--masonry-gap');
  problems.equal(el.style.getPropertyValue('--masonry-column-width'), vector.minColumnWidth,
    '--masonry-column-width');

  // The documented auto mode ("0 = auto based on minColumnWidth") is a
  // stylesheet rule keyed on the ATTRIBUTE — `:host([columns="0"]) .masonry
  // { column-count: auto; column-width: var(--masonry-column-width) }`. So
  // `columns = 0` is only really auto if the attribute says so, whichever
  // channel set the property. Non-zero values need no attribute: they are read
  // from `--masonry-columns` by the default rule.
  if (vector.columns === 0) {
    problems.equal(el.getAttribute('columns'), '0',
      'columns attribute in auto mode (the :host([columns="0"]) rule needs it)');
  }
}

/**
 * `--masonry-column-width` alone, so the documented `min-column-width`
 * ATTRIBUTE can be judged separately from the two properties that work.
 */
export function checkColumnWidth(problems: Problems, el: HTMLElement, minColumnWidth: string): void {
  problems.equal(el.style.getPropertyValue('--masonry-column-width'), minColumnWidth,
    '--masonry-column-width');
}

/**
 * Items: every slotted child is announced as a list item, because the container
 * is `role="list"` and an ARIA list whose children are not list items is not a
 * list. An element that already declares a role keeps it, and a native `<li>`
 * needs none.
 */
export function checkItemRoles(problems: Problems, el: HTMLElement, expectedCount: number): void {
  const items = [...el.children] as HTMLElement[];
  problems.equal(items.length, expectedCount, 'slotted item count');
  items.forEach((item, i) => {
    problems.equal(item.getAttribute('role'), 'listitem', `item ${i} role`);
  });
}

/** Item text survives slotting unchanged — the slot projects, never rewrites. */
export function checkItemText(problems: Problems, el: HTMLElement, expectedCount: number): void {
  const seen = [...el.children].map(child => text(child));
  const want = Array.from({ length: expectedCount }, (_, i) => `Card ${i + 1}`);
  problems.equal(seen, want, 'slotted item text');
}
