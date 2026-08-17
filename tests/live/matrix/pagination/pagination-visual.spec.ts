/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-pagination TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/pagination, `npm run test:matrix`) owns the
 * VALUE truth: which page numbers and ellipses the window renders, the
 * aria shell, aria-current, which boundary buttons carry `disabled`, and the
 * pagination-change events. It cannot own the component's visual subject,
 * because pagination IS a row of chips: `--pagination-gap: 4px`, a
 * `--pagination-button-size` per glyph chip (exact height, width floor), a
 * 3-word size axis
 * that only a layout engine can order, three variants whose names are paint
 * contracts (`rounded`, `text`), a primary-filled active page, and a dimmed
 * disabled boundary. happy-dom stacks nothing, rounds nothing, paints nothing.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the nav is one centred row: every chip ascends left to right, disjoint,
 *     uniformly tall, vertically centred, inside the nav's own box, with the
 *     documented `--pagination-gap: 4px` between adjacent chips;
 *   · the medium size is exactly the documented `--pagination-button-size:
 *     32px` tall, and the size axis is an ordering (measured once, small <
 *     medium < large in both chip height and type size);
 *   · `default` paints a bordered chip on the theme's raised surface and is
 *     NOT fully rounded; `rounded` fully rounds a square navigation chip
 *     (radius ≥ half its height); `text` drops the chip chrome — no fill, no
 *     border — from every non-active page;
 *   · the active page is the only chip on the theme's primary with inverse
 *     ink (`aria-current="page"` locates it — its own documented contract);
 *   · an ellipsis sits BETWEEN its neighbours, vertically centred, never
 *     overlapping a chip;
 *   · boundary buttons at the ends of the range render dimmed (opacity < 1)
 *     while their opposites stay full-opacity;
 *   · chips are reachable by a pointer: hit-probes on the first, active and
 *     last chips must land inside each (through the shadow root).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The active page's ink on its primary fill (readability is a pixel claim),
 *   the `rounded` corner actually showing the page through where `default`
 *   paints a border, and the dimmed disabled chip actually painting dimmer.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/pagination/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Variant = 'default' | 'rounded' | 'text';

const SIZES: Size[] = ['small', 'medium', 'large'];
const VARIANTS: Variant[] = ['default', 'rounded', 'text'];

interface Combo {
  id: string;
  current: number;
  total: number;
  siblings: number;
  size: Size;
  variant: Variant;
  showFirst: boolean;
  showPrev: boolean;
  showNext: boolean;
  showLast: boolean;
  /** The one combo that also asserts the documented 32px medium chip exactly. */
  exactMedium?: boolean;
}

const base = (over: Partial<Combo>): Combo => ({
  id: '', current: 5, total: 20, siblings: 1,
  size: 'medium', variant: 'default',
  showFirst: true, showPrev: true, showNext: true, showLast: true,
  ...over,
});

/**
 * Two crosses rather than one product.
 *
 * PRESENTATION: variant (3) x size (3) = 9, at a middle-of-range page so no
 * boundary is dimmed and every assertion is about paint. A variant changes
 * which rules paint a chip; a size changes the box it paints into — crossed
 * because a radius is "half the height" and only means something per size.
 *
 * STATE: the window/boundary axes at the default presentation — first page,
 * middle, last, both flag-off variants, a wider sibling window, and a total
 * small enough that no ellipsis exists. These move which boxes exist and
 * which are dimmed, independent of colour or size.
 */
function presentationCombos(): Combo[] {
  return VARIANTS.flatMap(variant => SIZES.map(size => base({
    id: `${variant}/${size}`,
    variant, size,
    exactMedium: variant === 'default' && size === 'medium',
  })));
}

function stateCombos(): Combo[] {
  return [
    base({ id: 'state/first-page', current: 1 }),
    base({ id: 'state/middle-page', current: 10 }),
    base({ id: 'state/last-page', current: 20 }),
    base({
      id: 'state/no-nav-buttons', current: 1,
      showFirst: false, showPrev: false, showNext: false, showLast: false,
    }),
    base({
      id: 'state/no-nav-buttons/middle', current: 10,
      showFirst: false, showPrev: false, showNext: false, showLast: false,
    }),
    base({ id: 'state/siblings=2', current: 10, siblings: 2 }),
    base({ id: 'state/short-total-no-ellipsis', current: 3, total: 5 }),
  ];
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 0.6;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const nav = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!nav) { say('no part="base" painted'); return problems; }
    const navBox = nav.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    if (navBox.width <= 0 || navBox.height <= 0) {
      say(`the nav renders at ${navBox.width}x${navBox.height}`);
      return problems;
    }
    if (navStyle.display !== 'flex') say(`nav display "${navStyle.display}", expected "flex"`);
    if (navStyle.alignItems !== 'center') {
      say(`nav align-items "${navStyle.alignItems}", expected "center"`);
    }
    // "Uses <nav> with aria-label='Pagination'" locates the right element.
    if (nav.getAttribute('aria-label') !== 'Pagination') {
      say(`nav aria-label "${nav.getAttribute('aria-label')}", expected "Pagination"`);
    }

    const named = (name: string) =>
      sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    // ── The row: every chip ascends, disjoint, uniformly tall, centred ───────
    //
    // The doc's own part order — first-button, prev-button, pages,
    // next-button, last-button — is the reading order of the row.
    const navChips: Array<{ what: string; el: HTMLElement }> = [];
    const order: Array<[string, boolean]> = [
      ['first-button', combo.showFirst], ['prev-button', combo.showPrev],
      ['next-button', combo.showNext], ['last-button', combo.showLast],
    ];
    for (const [name, shown] of order) {
      const chip = named(name);
      if (!shown && chip) say(`${name} painted although its show-* switch is off`);
      if (shown && !chip) say(`${name} missing although its show-* switch is on`);
      if (shown && chip) navChips.push({ what: name, el: chip });
    }
    const pages = named('pages');
    if (!pages) { say('no part="pages" painted'); return problems; }

    const pageChips = [...pages.querySelectorAll('.pagination-page')] as HTMLElement[];
    const ellipses = [...pages.querySelectorAll('[part~="ellipsis"]')] as HTMLElement[];
    if (pageChips.length === 0) { say('no page chips painted'); return problems; }

    // The whole visual row, in the part order the doc lists: first, prev,
    // the pages block, next, last.
    const row = [...navChips.filter(c => c.what !== 'next-button' && c.what !== 'last-button'),
      { what: 'pages', el: pages },
      ...navChips.filter(c => c.what === 'next-button' || c.what === 'last-button')];
    let previous: DOMRect | null = null;
    let previousWhat = '';
    for (const { what, el } of row) {
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) { say(`${what} renders empty`); continue; }
      if (box.top < navBox.top - EPS || box.bottom > navBox.bottom + EPS) {
        say(`${what} is not vertically inside the nav`);
      }
      if (previous && box.left < previous.right - EPS) {
        say(`${what} does not come after ${previousWhat} in the row`);
      }
      if (previous) {
        const gap = box.left - previous.right;
        // "--pagination-gap: 4px" — the documented spacing between chips.
        if (Math.abs(gap - 4) > EPS) {
          say(`the gap between ${previousWhat} and ${what} is ${round(gap)}px,`
            + ' expected the documented --pagination-gap of 4px');
        }
      }
      previous = box;
      previousWhat = what;
    }

    // Inside the pages block: page chips and ellipses, ascending and gapped.
    const inner = [...pages.children].map(el => ({
      what: el.getAttribute('part')?.includes('ellipsis') ? 'ellipsis' : `page ${el.getAttribute('data-page')}`,
      el: el as HTMLElement,
    }));
    let innerPrevious: DOMRect | null = null;
    let innerPreviousWhat = '';
    for (const { what, el } of inner) {
      const box = el.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) { say(`${what} renders empty`); continue; }
      if (innerPrevious) {
        if (box.left < innerPrevious.right - EPS) {
          say(`${what} does not come after ${innerPreviousWhat}`);
        }
        const gap = box.left - innerPrevious.right;
        if (Math.abs(gap - 4) > EPS) {
          say(`the gap between ${innerPreviousWhat} and ${what} is ${round(gap)}px,`
            + ' expected the documented --pagination-gap of 4px');
        }
      }
      innerPrevious = box;
      innerPreviousWhat = what;
    }

    // Uniform height, vertical centring, and the documented medium size.
    const chips = [...pageChips, ...navChips.map(c => c.el)];
    const heights = chips.map(c => c.getBoundingClientRect().height);
    const tallest = Math.max(...heights);
    const shortest = Math.min(...heights);
    if (tallest - shortest > EPS) {
      say(`chips are ${round(shortest)}–${round(tallest)}px tall — one row, one height`);
    }
    for (const { what, el } of row) {
      const box = el.getBoundingClientRect();
      if (Math.abs(box.top + box.height / 2 - (navBox.top + navBox.height / 2)) > 1) {
        say(`${what} is not vertically centred in the row`);
      }
    }
    if (combo.exactMedium) {
      // "--pagination-button-size: 32px" — the documented default, and the
      // number the small/large custom-property sets scale away from.
      if (Math.abs(tallest - 32) > EPS) {
        say(`a medium chip is ${round(tallest)}px tall, expected the documented 32px`);
      }
    }
    // A glyph chip carries the documented size exactly in height, and never
    // shrinks below it in width: "--pagination-button-size | Button width
    // and height" (docs/components/pagination.md) is the stylesheet's
    // `height` + `min-width` pair, so horizontal padding can stretch a chip
    // past the token but nothing can paint under it.
    const buttonSize = parseFloat(
      getComputedStyle(host).getPropertyValue('--pagination-button-size'));
    for (const { what, el } of navChips) {
      const box = el.getBoundingClientRect();
      if (Math.abs(box.height - buttonSize) > EPS) {
        say(`${what} is ${round(box.height)}px tall, expected the documented`
          + ` --pagination-button-size of ${buttonSize}px`);
      }
      if (box.width + 1 < buttonSize) {
        say(`${what} is ${round(box.width)}px wide, under the documented`
          + ` --pagination-button-size floor of ${buttonSize}px`);
      }
    }

    // ── Variant paint contracts ──────────────────────────────────────────────
    const sampleChip = navChips[0]?.el ?? pageChips.find(c =>
      c.getAttribute('aria-current') !== 'page') ?? pageChips[0];
    const sampleStyle = getComputedStyle(sampleChip);
    const chipHeight = sampleChip.getBoundingClientRect().height;
    const radius = parseFloat(sampleStyle.borderTopLeftRadius);

    if (combo.variant === 'text') {
      // 'text' — page numbers as text: no chip fill, no rule.
      const plain = pageChips.find(c => c.getAttribute('aria-current') !== 'page');
      const plainStyle = plain ? getComputedStyle(plain) : null;
      if (plainStyle && plainStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        say(`a text-variant page painted a fill "${plainStyle.backgroundColor}"`);
      }
      if (plainStyle && parseFloat(plainStyle.borderTopWidth) !== 0) {
        say(`a text-variant page drew a border (${plainStyle.borderTopWidth})`);
      }
    } else {
      // 'default' and 'rounded' share the raised, bordered chip.
      const fill = token('--snice-color-surface-container-low');
      if (sampleStyle.backgroundColor !== fill) {
        say(`chip fill "${sampleStyle.backgroundColor}", expected`
          + ` --snice-color-surface-container-low "${fill}"`);
      }
      if (parseFloat(sampleStyle.borderTopWidth) !== 1) {
        say(`chip rule width ${sampleStyle.borderTopWidth}, expected 1px`);
      }
      if (combo.variant === 'rounded') {
        // "rounded" — a square chip fully rounded, radius at least half its
        // height, exactly the pill contract a circle-name promises.
        if (radius < chipHeight / 2 - EPS) {
          say(`rounded chip radius ${round(radius)}px does not fully round a`
            + ` ${round(chipHeight)}px tall chip`);
        }
      } else if (radius >= chipHeight / 2 - EPS) {
        say(`a default chip is fully rounded (radius ${round(radius)}px on a`
          + ` ${round(chipHeight)}px tall chip) — that is the rounded variant`);
      }
    }

    // ── The active page: the theme's primary, the only one ──────────────────
    const active = pageChips.find(c => c.getAttribute('aria-current') === 'page') ?? null;
    if (!active) { say('no aria-current="page" chip painted'); }
    else {
      const activeStyle = getComputedStyle(active);
      const primary = token('--snice-color-primary');
      if (activeStyle.backgroundColor !== primary) {
        say(`the active page fill "${activeStyle.backgroundColor}", expected`
          + ` --snice-color-primary "${primary}"`);
      }
      const ink = token('--snice-color-text-inverse');
      if (activeStyle.color !== ink) {
        say(`the active page ink "${activeStyle.color}", expected`
          + ` --snice-color-text-inverse "${ink}"`);
      }
      const plain = pageChips.filter(c => c !== active)
        .find(c => parseFloat(getComputedStyle(c).opacity) === 1);
      if (plain && getComputedStyle(plain).backgroundColor === activeStyle.backgroundColor) {
        say('another page chip paints the same fill as the active page');
      }
    }

    // ── Ellipses sit between their neighbours, centred ───────────────────────
    for (const el of ellipses) {
      const box = el.getBoundingClientRect();
      if (Math.abs(box.top + box.height / 2 - (navBox.top + navBox.height / 2)) > 1) {
        say('an ellipsis is not vertically centred in the row');
      }
    }

    // ── Boundary dimming: "Disabled state for boundary buttons" ─────────────
    //
    // The DOM tier owns whether the `disabled` attribute is set; the visual
    // contract is that the boundary position itself dims its chips — so the
    // expectation is keyed to the position, and a boundary chip painting at
    // full opacity is a finding here even if its attribute is correct.
    const boundary = (name: string, atBoundary: boolean) => {
      const chip = named(name);
      if (!chip) return;
      const style = getComputedStyle(chip);
      if (atBoundary && Number(style.opacity) >= 1) {
        say(`${name} is at the boundary but paints at full opacity ${style.opacity}`);
      }
      if (!atBoundary && Number(style.opacity) < 1) {
        say(`${name} is not at a boundary but paints dimmed at opacity ${style.opacity}`);
      }
    };
    boundary('first-button', combo.current === 1);
    boundary('prev-button', combo.current === 1);
    boundary('next-button', combo.current === combo.total);
    boundary('last-button', combo.current === combo.total);

    // ── With every nav button hidden, the pages ARE the row ─────────────────
    if (!combo.showFirst && !combo.showPrev && !combo.showNext && !combo.showLast) {
      const first = pageChips[0].getBoundingClientRect();
      const last = pageChips[pageChips.length - 1].getBoundingClientRect();
      if (Math.abs(first.left - pages.getBoundingClientRect().left) > EPS) {
        say('a hidden nav button still offsets the first page chip');
      }
      if (Math.abs(last.right - pages.getBoundingClientRect().right) > EPS) {
        say('a hidden nav button still offsets the last page chip');
      }
    }

    // ── Occlusion: first, active and last chips answer their own hit-test ────
    const probes: Array<{ what: string; el: HTMLElement | null }> = [
      { what: 'first chip', el: navChips[0]?.el ?? pageChips[0] ?? null },
      { what: 'active chip', el: active },
      { what: 'last chip', el: navChips[navChips.length - 1]?.el ?? pageChips[pageChips.length - 1] ?? null },
    ];
    for (const { what, el } of probes) {
      if (!el) continue;
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`${what}'s hit-test finds <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the pagination');
        continue;
      }
      const inner = sr.elementFromPoint(x, y) as Element | null;
      if (inner !== el && inner !== null && !el.contains(inner)) {
        say(`${what} is occluded from the pointer by <${inner.tagName.toLowerCase()}>`);
      }
    }

    return problems;
  }, combo as any);
}

test.describe('pagination visual matrix: layer 1 — presentation', () => {
  for (const combo of presentationCombos()) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.reflected.size, `attribute reflection for ${combo.id}`).toBe(combo.size);
      expect(mounted.reflected.variant, `attribute reflection for ${combo.id}`).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('pagination visual matrix: layer 1 — window and boundary state', () => {
  for (const combo of stateCombos()) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it.
 * Measured once across the three documented sizes.
 */
test.describe('pagination visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in both chip height and type size', async () => {
    const measured: Record<string, { height: number; fontSize: number }> = {};
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({
        current: 5, total: 20, size: s,
      }), size);
      measured[size] = await page.evaluate(() => {
        const chip = document.getElementById('subject')!.shadowRoot!
          .querySelector('.pagination-page') as HTMLElement;
        return {
          height: chip.getBoundingClientRect().height,
          fontSize: parseFloat(getComputedStyle(chip).fontSize),
        };
      });
    }
    expect(measured.small.height, 'small height < medium').toBeLessThan(measured.medium.height);
    expect(measured.medium.height, 'medium height < large').toBeLessThan(measured.large.height);
    expect(measured.small.fontSize, 'small type < medium').toBeLessThan(measured.medium.fontSize);
    expect(measured.medium.fontSize, 'medium type < large').toBeLessThan(measured.large.fontSize);
  });
});

// ── Interaction: the row really navigates, by real pointer and by method ────

test.describe('pagination visual matrix: interaction', () => {
  test('a real-pointer page click moves the active fill and fires the documented event', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ current: 5, total: 20 }));
    const [page6] = await page.evaluate(() =>
      (window as any).matrix.centers(['.pagination-page[data-page="6"]']));
    await page.mouse.click(page6.x, page6.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const result = await page.evaluate(() => ({
      changes: (window as any).matrix.recordedChanges(),
      activeFill: getComputedStyle(document.getElementById('subject')!.shadowRoot!
        .querySelector('.pagination-page[aria-current="page"]') as Element).backgroundColor,
    }));
    expect(result.changes, 'pagination-change events').toEqual([
      { page: 6, previousPage: 5 },
    ]);
    const primary = await page.evaluate(() =>
      (window as any).matrix.token('--snice-color-primary'));
    expect(result.activeFill,
      'the new page did not take the primary fill').toBe(primary);
  });

  test('goToPage() navigates without a pointer', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ current: 5, total: 20 }));
    const moved = await page.evaluate(() => (window as any).matrix.goTo(2));
    expect(moved.current).toBe(2);
    const changes = await page.evaluate(() => (window as any).matrix.recordedChanges());
    expect(changes).toEqual([{ page: 2, previousPage: 5 }]);
  });

  test('a real click on a dimmed boundary chip does nothing', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ current: 1, total: 20 }));
    const [prev] = await page.evaluate(() =>
      (window as any).matrix.centers(['.pagination-prev']));
    await page.mouse.click(prev.x, prev.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const result = await page.evaluate(() => ({
      current: (window as any).matrix.el.current,
      changes: (window as any).matrix.recordedChanges(),
    }));
    expect(result.changes, 'a disabled chip still fired pagination-change').toEqual([]);
    expect(result.current, 'a disabled chip still navigated').toBe(1);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('pagination visual matrix: marquee pixels', () => {
  test('the active page is readable: ink on its primary fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ current: 5, total: 20 }));
    const pixels = await capture(
      page, '#subject', 'pagination-active',
      `(host) => {
        const chip = host.shadowRoot.querySelector('.pagination-page[aria-current="page"]');
        const box = chip.getBoundingClientRect();
        // A 14px digit is ~8px of strokes with gaps between them; a handful
        // of eighth-points along the midline lands between those strokes.
        // Sweep the chip's interior on a 1px lattice instead.
        const points = [];
        for (let y = 3; y <= box.height - 3; y++) {
          for (let x = 3; x <= box.width - 3; x++) {
            points.push({ x: box.x + x, y: box.y + y });
          }
        }
        points.push({ x: box.x + 2, y: box.y + 2 });
        return points;
      }`,
    );
    const fill = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, fill)),
      `every probed digit pixel equals the fill ${fill.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, fill)));
    // 14px digits on a 32px primary chip; 3:1 is the antialiased-glyph bar a
    // "readable page number" claim has to clear.
    expect(best, `best ink-vs-fill contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('rounded corners let the page show through where default paints a chip', async () => {
    // The host shrink-wraps the nav, so the page surface reference is the
    // documented 4px GAP between the first two chips, read in the same
    // capture. The corner probe sits at (2,2) of the square prev chip: inside
    // the default chip's radius-4 corner (fill), outside a radius-16 circle
    // (page) — the one pixel pair that tells the variants apart.
    const cornerProbe = `(host) => {
      const chips = [...host.shadowRoot.querySelectorAll('.pagination-button')];
      const prev = chips[1].getBoundingClientRect();
      return [
        { x: prev.x + 2, y: prev.y + 2 },
        { x: prev.right + 2, y: prev.y + prev.height / 2 },
      ];
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      current: 5, total: 20, variant: 'default',
    }));
    const [defaultCorner, pageSurface] = await capture(
      page, '#subject', 'pagination-default-corner', cornerProbe);
    await page.evaluate(() => (window as any).matrix.mount({
      current: 5, total: 20, variant: 'rounded',
    }));
    const [roundedCorner, pageSurfaceAgain] = await capture(
      page, '#subject', 'pagination-rounded-corner', cornerProbe);
    expect(sameColor(pageSurfaceAgain as RGB, pageSurface as RGB),
      'the two captures read different page surfaces — the reference moved').toBe(true);
    expect(sameColor(roundedCorner as RGB, pageSurface as RGB),
      `the rounded chip's corner painted ${roundedCorner.join(',')} instead of the`
        + ` page's ${pageSurface.join(',')}`).toBe(true);
    expect(sameColor(defaultCorner as RGB, pageSurface as RGB),
      `the default chip's corner painted the page surface ${defaultCorner.join(',')} —`
        + ' the chip did not paint at its own corner').toBe(false);
  });

  test('a dimmed boundary chip really paints dimmer than its enabled opposite', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ current: 1, total: 20 }));
    const [dim, lit] = await capture(
      page, '#subject', 'pagination-disabled-dim',
      `(host) => {
        const prev = host.shadowRoot.querySelector('.pagination-prev').getBoundingClientRect();
        const next = host.shadowRoot.querySelector('.pagination-next').getBoundingClientRect();
        return [
          { x: prev.x + prev.width / 2, y: prev.y + prev.height / 2 },
          { x: next.x + next.width / 2, y: next.y + next.height / 2 },
        ];
      }`,
    );
    // Both chips are the same raised surface with the same glyph; the only
    // difference the docs promise is the disabled dimming.
    expect(sameColor(dim as RGB, lit as RGB),
      `the disabled chip (${dim.join(',')}) paints identically to the enabled`
        + ` one (${lit.join(',')})`).toBe(false);
  });
});
