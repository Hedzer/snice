/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-pagination matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/pagination.md` and
 * `snice-pagination.types.ts`:
 *
 *   current  number = 1        total number = 1
 *   siblings number = 1        "Pages shown each side of current"
 *   showFirst / showLast / showPrev / showNext  boolean = true
 *                              (attributes `show-first` … `show-next`)
 *   size     small|medium|large = medium
 *   variant  default|rounded|text = default
 *   methods  goToPage(page) nextPage() previousPage() firstPage() lastPage()
 *   event    pagination-change → { page, previousPage }
 *   parts    base, button, first-button, prev-button, pages, ellipsis,
 *            next-button, last-button
 *   a11y     <nav aria-label="Pagination">, aria-current="page" on the active
 *            page, aria-label on the navigation buttons, "Disabled state for
 *            boundary buttons".
 *
 * ── Why the page window is judged by INVARIANTS, not a copied algorithm ────
 *
 * The doc specifies WHAT the window must contain — the current page, `siblings`
 * on each side of it, the first and last page, and an ellipsis where pages are
 * skipped — but not the exact threshold at which the component stops eliding.
 * Re-implementing the component's `getPageNumbers()` here would violate the
 * first rule of this tier (`.ai/fuzzing.md`: expectations come from the docs,
 * never from the code) and would turn a legitimate design choice into dozens
 * of false findings.
 *
 * So the oracle asserts every documented claim EXACTLY, and only stops short
 * of the undocumented threshold:
 *
 *   1. every rendered entry is a page number in [1, total] or an ellipsis;
 *   2. the page numbers are strictly ascending and unique;
 *   3. the required set — {1, total} ∪ [current-siblings, current+siblings]
 *      clamped to the range — is entirely present;
 *   4. an ellipsis stands between exactly the pairs of shown pages that have a
 *      gap between them, and nowhere else: an ellipsis that hides nothing is a
 *      lie, and a gap with no ellipsis is a silently missing page;
 *   5. if NO ellipsis is rendered, nothing was hidden, so the window must be
 *      the complete 1..total;
 *   6. if an ellipsis IS rendered, at most `2*siblings + 3` page numbers are
 *      shown — first, last, current, and `siblings` each side is the whole of
 *      what the doc promises to display;
 *   7. exactly one button carries `aria-current="page"`, and it is `current`;
 *   8. every page button is labelled `Page N`, and the four navigation
 *      buttons carry their documented labels;
 *   9. first/prev are disabled at page 1 and next/last at page `total` —
 *      the doc's "Disabled state for boundary buttons".
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';

import '../../../packages/components/src/pagination/snice-pagination';

export { expect, mount, unmountAll, wait };

export const SETTLE = 20;

// ── Documented dimensions ───────────────────────────────────────────────────

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = typeof SIZES[number];

export const VARIANTS = ['default', 'rounded', 'text'] as const;
export type Variant = typeof VARIANTS[number];

/** The four documented visibility switches and their kebab attributes. */
export const SWITCHES = {
  showFirst: 'show-first',
  showPrev: 'show-prev',
  showNext: 'show-next',
  showLast: 'show-last',
} as const;
export type SwitchName = keyof typeof SWITCHES;

/** Each switch's button part and its documented aria-label. */
export const NAV_BUTTONS: Record<SwitchName, { part: string; label: string; selector: string }> = {
  showFirst: { part: 'first-button', label: 'First page', selector: '.pagination-first' },
  showPrev: { part: 'prev-button', label: 'Previous page', selector: '.pagination-prev' },
  showNext: { part: 'next-button', label: 'Next page', selector: '.pagination-next' },
  showLast: { part: 'last-button', label: 'Last page', selector: '.pagination-last' },
};

export const DEFAULTS = {
  current: 1,
  total: 1,
  siblings: 1,
  showFirst: true,
  showLast: true,
  showPrev: true,
  showNext: true,
  size: 'medium' as Size,
  variant: 'default' as Variant,
};

// ── Mounting ────────────────────────────────────────────────────────────────

export interface PageCombo {
  id: string;
  current: number;
  total: number;
  siblings: number;
  showFirst: boolean;
  showPrev: boolean;
  showNext: boolean;
  showLast: boolean;
  size: Size;
  variant: Variant;
}

export function combo(overrides: Partial<PageCombo> = {}): PageCombo {
  const base: PageCombo = {
    id: '',
    current: 1,
    total: 10,
    siblings: 1,
    showFirst: true,
    showPrev: true,
    showNext: true,
    showLast: true,
    size: 'medium',
    variant: 'default',
    ...overrides,
  };
  const off = (Object.keys(SWITCHES) as SwitchName[])
    .filter(name => !base[name]).map(name => SWITCHES[name]);
  base.id = base.id || `page ${base.current}/${base.total} siblings=${base.siblings}`
    + `/${base.size}/${base.variant}${off.length ? `/no-[${off.join(',')}]` : ''}`;
  return base;
}

/**
 * Mount through the ATTRIBUTE channel, the way the doc's example does
 * (`<snice-pagination current="1" total="10">`).
 *
 * The `show-*` switches default to TRUE, so switching one off is expressed as
 * `show-first="false"` — the documented attribute carrying an explicit false,
 * which is the only markup form that can override a true default. That is the
 * form a page author must use, so it is the form the matrix exercises.
 */
export async function makePagination(c: PageCombo): Promise<any> {
  const attrs: Record<string, any> = {
    current: c.current,
    total: c.total,
    siblings: c.siblings,
    size: c.size,
    variant: c.variant,
  };
  for (const [property, attribute] of Object.entries(SWITCHES)) {
    if (!(c as any)[property]) attrs[attribute] = 'false';
  }
  return mount<any>('snice-pagination', attrs);
}

// ── Reading ─────────────────────────────────────────────────────────────────

export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-pagination rendered no shadow root');
  return root;
}

export const part = (el: HTMLElement, name: string): HTMLElement | null =>
  sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);

export const parts = (el: HTMLElement, name: string): HTMLElement[] =>
  [...sr(el).querySelectorAll<HTMLElement>(`[part~="${name}"]`)];

/** One entry of the rendered window: a page number, or the ellipsis marker. */
export type Entry = number | '…';

/**
 * The window as a reader sees it, in document order: every page button and
 * every ellipsis, interleaved exactly as rendered.
 */
export function readWindow(el: HTMLElement): Entry[] {
  const container = part(el, 'pages');
  if (!container) return [];
  const out: Entry[] = [];
  for (const node of container.querySelectorAll('[part~="ellipsis"], .pagination-page')) {
    if (node.getAttribute('part')?.split(/\s+/).includes('ellipsis')) { out.push('…'); continue; }
    const raw = node.getAttribute('data-page');
    out.push(raw === null ? Number.NaN : Number(raw));
  }
  return out;
}

export const pageNumbers = (el: HTMLElement): number[] =>
  readWindow(el).filter((entry): entry is number => entry !== '…');

// ── The oracle ──────────────────────────────────────────────────────────────

/** {1, total} ∪ the sibling window around `current`, clamped to the range. */
export function requiredPages(c: PageCombo): number[] {
  const required = new Set<number>([1, c.total]);
  for (let page = c.current - c.siblings; page <= c.current + c.siblings; page++) {
    if (page >= 1 && page <= c.total) required.add(page);
  }
  return [...required].sort((a, b) => a - b);
}

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

export function windowProblems(el: any, c: PageCombo): Problems {
  const problems = new Problems();
  const entries = readWindow(el);
  const numbers = entries.filter((entry): entry is number => entry !== '…');

  // 1 — every entry is a real page or an ellipsis
  for (const page of numbers) {
    problems.check(Number.isInteger(page) && page >= 1 && page <= c.total,
      `page ${page} is outside [1, ${c.total}]`);
  }

  // 2 — strictly ascending, no repeats
  const ascending = numbers.every((page, i) => i === 0 || page > numbers[i - 1]);
  problems.check(ascending, `page numbers not strictly ascending: ${JSON.stringify(numbers)}`);

  // 3 — the documented required set is present
  const shown = new Set(numbers);
  for (const page of requiredPages(c)) {
    problems.check(shown.has(page),
      `page ${page} is required (first/last/current±${c.siblings}) but missing`);
  }

  // 4 — an ellipsis stands exactly where pages are skipped
  const gaps: number[] = [];
  numbers.forEach((page, i) => { if (i > 0 && page > numbers[i - 1] + 1) gaps.push(i); });
  const ellipses = entries.filter(entry => entry === '…').length;
  problems.equal(ellipses, gaps.length, 'ellipsis count vs skipped runs');
  // …and each one really sits BETWEEN the two pages whose gap it stands for.
  for (let i = 1; i < entries.length - 1; i++) {
    if (entries[i] !== '…') continue;
    const before = entries[i - 1];
    const after = entries[i + 1];
    problems.check(typeof before === 'number' && typeof after === 'number' && after > before + 1,
      `ellipsis at index ${i} hides nothing (between ${String(before)} and ${String(after)})`);
  }

  // 5 — no ellipsis means nothing was hidden
  if (ellipses === 0) {
    problems.equal(numbers, Array.from({ length: c.total }, (_, i) => i + 1),
      'an un-elided window must be the complete page list');
  }

  // 6 — an elided window shows at most first + last + current + 2*siblings
  if (ellipses > 0) {
    problems.check(numbers.length <= c.siblings * 2 + 3,
      `${numbers.length} pages shown, but siblings=${c.siblings} promises at most `
      + `${c.siblings * 2 + 3}`);
  }

  // 7 — exactly one aria-current, and it is `current`
  const currents = [...sr(el).querySelectorAll('[aria-current="page"]')];
  problems.equal(currents.length, 1, 'aria-current="page" count');
  if (currents.length === 1) {
    problems.equal(currents[0].getAttribute('data-page'), String(c.current), 'aria-current page');
  }

  // 8 — every page button is labelled "Page N"
  for (const button of sr(el).querySelectorAll('.pagination-page')) {
    const page = button.getAttribute('data-page');
    problems.equal(button.getAttribute('aria-label'), `Page ${page}`, `label of page ${page}`);
  }

  return problems;
}

/** Chrome: which navigation buttons exist, how they are labelled and disabled. */
export function chromeProblems(el: any, c: PageCombo): Problems {
  const problems = new Problems();

  // "Uses <nav> with aria-label='Pagination'"
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no part="base"')) return problems;
  problems.equal(base!.tagName, 'NAV', 'base element');
  problems.equal(base!.getAttribute('aria-label'), 'Pagination', 'nav aria-label');
  problems.check(!!part(el, 'pages'), 'no part="pages"');

  for (const [name, spec] of Object.entries(NAV_BUTTONS) as [SwitchName, typeof NAV_BUTTONS[SwitchName]][]) {
    const visible = c[name];
    const button = part(el, spec.part) as HTMLButtonElement | null;
    problems.equal(!!button, visible, `${spec.part} rendered`);
    if (!button) continue;

    // Every navigation button carries the shared `button` part too.
    problems.check(button.getAttribute('part')!.split(/\s+/).includes('button'),
      `${spec.part} is missing the shared part="button"`);
    problems.equal(button.getAttribute('aria-label'), spec.label, `${spec.part} aria-label`);

    // "Disabled state for boundary buttons".
    const atStart = c.current === 1;
    const atEnd = c.current === c.total;
    const shouldDisable = name === 'showFirst' || name === 'showPrev' ? atStart : atEnd;
    problems.equal(button.hasAttribute('disabled'), shouldDisable, `${spec.part} disabled`);
  }

  return problems;
}

export function expectWindowMatches(el: any, c: PageCombo): void {
  expect(windowProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

export function expectChromeMatches(el: any, c: PageCombo): void {
  expect(chromeProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function recordChanges(el: HTMLElement): Array<{ page: number; previousPage: number }> {
  const seen: Array<{ page: number; previousPage: number }> = [];
  el.addEventListener('pagination-change', (event: Event) => {
    seen.push((event as CustomEvent).detail);
  });
  return seen;
}

export function clickNav(el: HTMLElement, name: SwitchName): boolean {
  const button = sr(el).querySelector(NAV_BUTTONS[name].selector);
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

export function clickPage(el: HTMLElement, page: number): boolean {
  const button = sr(el).querySelector(`.pagination-page[data-page="${page}"]`);
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

export function teardown(): void {
  unmountAll();
}
