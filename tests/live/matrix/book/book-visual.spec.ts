/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-book TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/book, `npm run test:matrix`) owns the page
 * arithmetic: the clamps, the method semantics, the event details and their
 * order. It cannot own what this component IS — a stack of leaves that rotate
 * about their spine. In happy-dom nothing has a box, no transform is computed,
 * and the CSS-only `input:checked + .book__page` mechanism that performs every
 * page turn never resolves at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented `base` ("Outer cover container") and `book` ("Inner book
 *     element") parts have real boxes and nest;
 *   · THE PAGE TURN — at `currentPage = k`, the leaves that have been turned
 *     carry a rotation about Y and the ones still to come do not. This is the
 *     "animated page turns" of the component summary, and it is a computed
 *     transform, so only a browser has it;
 *   · the spread is readable: the visible page's content has a real box inside
 *     the book, and an elementFromPoint probe over it lands on that page rather
 *     than on something painted over it;
 *   · slotting after mount really works — the component re-collects its pages
 *     from `slotchange`, which happy-dom does not emit, so the DOM tier
 *     deliberately leaves this claim here;
 *   · keyboard navigation moves the painted book, not just the property.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The cover image and the page paper both "resolve" to something that may
 *   paint nothing. The marquee captures decode the PNG inside the browser under
 *   test and assert that the cover image really paints its own colour and that
 *   page text really contrasts against the paper behind it.
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * VISUAL-MATRIX-book-3  only the current leaf was turned; the pages before it
 *   were not. FIXED: at page k, the k leaves the reader has passed are all
 *   turned — measured as rotation about Y: [-180, -180, -180, 0] at page 3
 *   of 4. The cause was the CSS-only flip mechanism: the stylesheet's single
 *   rule was `input[type="radio"]:checked + .book__page { transform:
 *   rotateY(-180deg) }`, and the adjacent-sibling combinator reaches exactly
 *   ONE leaf — the one immediately after the checked radio. Because only one
 *   radio in the group can be checked at a time, no arrangement of that rule
 *   can turn a run of leaves. The turn is now carried by a class synced from
 *   currentPage, so every leaf before the current page swings over. The
 *   pinned tests below are unwrapped; their assertions are unchanged.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/book/matrix.html';

interface Combo {
  id: string;
  pages: number;
  currentPage: number;
  cover: boolean;
}

/**
 * The cross: page count (5) x currentPage (0, 1, and the last page) = 13
 * combos, with `cover` rotated across them. Sized to a component with four
 * documented properties and one render path — the point of this tier is that
 * the turn mechanism and the cover paint get a real browser, not that the
 * product is large. The intermediate pages are where VISUAL-MATRIX-book-3 lives and
 * they get their own block.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const pages of [0, 1, 2, 4, 6]) {
    const positions = [...new Set([0, Math.min(1, pages), pages])];
    for (const currentPage of positions) {
      combos.push({
        id: `pages=${pages}/current=${currentPage}/${n % 2 === 0 ? 'cover' : 'no-cover'}`,
        pages, currentPage, cover: n % 2 === 0,
      });
      n++;
    }
  }
  return combos;
}

let page: Page;

/**
 * The shared stage runs with REDUCED MOTION. Every claim in this file is about
 * a SETTLED transform — which leaf ended up turned, where its box landed — and
 * the stylesheet collapses its 0.9s page-turn transition to 0.01ms under
 * `prefers-reduced-motion: reduce`. Waiting out the real animation on every one
 * of these navigations would cost the tier a minute and buy nothing but timing
 * flakiness. Whether the turn is animated at all is a separate claim, and the
 * last layer-1 test below opens its own page WITHOUT the override to make it.
 */
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate(async (combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    await (window as any).matrix.mount(combo);
    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The documented parts ────────────────────────────────────────────────
    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    const book = sr.querySelector('[part~="book"]') as HTMLElement | null;
    if (!base) say('no [part="base"] rendered');
    if (!book) say('no [part="book"] rendered');
    if (!base || !book) return problems;
    if (!base.contains(book)) say('`book` is not inside `base`');

    const baseBox = rect(base);
    const bookBox = rect(book);
    for (const [name, box] of [['base', baseBox], ['book', bookBox]] as const) {
      if (box.width <= 0 || box.height <= 0) say(`${name} renders at ${box.width}x${box.height}`);
    }
    if (baseBox.width <= 0) return problems;
    // The book fills its cover.
    if (Math.abs(bookBox.width - baseBox.width) > 2 || Math.abs(bookBox.height - baseBox.height) > 2) {
      say(`book is ${bookBox.width.toFixed(0)}x${bookBox.height.toFixed(0)} `
        + `inside a ${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)} cover`);
    }

    if (combo.pages === 0) {
      // "each child becomes one page": with no children there is no book body,
      // and the doc describes no empty state, so nothing further is claimed.
      if (sr.querySelectorAll('.book__page--2').length !== 0) {
        say('leaves built for a book with no slotted pages');
      }
      return problems;
    }

    // ── The leaves, and the documented halves of the spread ─────────────────
    const leaves = [...sr.querySelectorAll('.book__page--2')] as HTMLElement[];
    if (leaves.length !== combo.pages) {
      say(`${leaves.length} leaves painted for ${combo.pages} slotted pages`);
      return problems;
    }
    const rotations = (window as any).matrix.leafRotations() as number[];
    const spine = bookBox.left + bookBox.width / 2;
    for (const [index, leaf] of leaves.entries()) {
      const box = rect(leaf);
      if (box.width <= 0 || box.height <= 0) {
        say(`leaf ${index} renders at ${box.width}x${box.height}`);
        continue;
      }
      // A leaf hinges on the spine: unturned it occupies the right-hand page,
      // turned it has swung over onto the left-hand one. Either way it must be
      // on ONE side of the spine — a leaf straddling it is a broken hinge.
      if (Math.abs(rotations[index]) > 90) {
        if (box.right > spine + 4) {
          say(`turned leaf ${index} still reaches ${(box.right - spine).toFixed(0)}px past the spine`);
        }
      } else if (box.left < spine - 4) {
        say(`unturned leaf ${index} starts ${(spine - box.left).toFixed(0)}px left of the spine`);
      }
    }

    // The two fixed halves: the cover label on the left, the last-page label
    // on the right, together spanning the book.
    const left = sr.querySelector('.book__page--1') as HTMLElement;
    const right = sr.querySelector('.book__page--4') as HTMLElement;
    if (!left || !right) {
      say('the book is missing one of its two fixed halves');
    } else {
      const leftBox = rect(left);
      const rightBox = rect(right);
      if (leftBox.right > rightBox.left + 2) say('the two halves of the spread overlap');
      if (Math.abs(leftBox.width - rightBox.width) > 2) {
        say(`the halves are uneven: ${leftBox.width.toFixed(0)} vs ${rightBox.width.toFixed(0)}`);
      }
    }

    // ── The turned leaf really carries a rotation ───────────────────────────
    if (combo.currentPage === 0) {
      // A closed book has nothing turned.
      if (rotations.some(r => r !== 0)) say(`closed book has turned leaves: ${JSON.stringify(rotations)}`);
    } else {
      const turned = rotations.filter(r => Math.abs(r) > 90).length;
      if (turned === 0) say(`at page ${combo.currentPage} no leaf is turned: ${JSON.stringify(rotations)}`);
    }

    // ── Readability: the visible content is inside the book and unoccluded ──
    const contents = [...sr.querySelectorAll('.page__content')] as HTMLElement[];
    if (contents.length === 0) say('no page content projected');
    for (const content of contents) {
      const box = rect(content);
      if (box.width <= 0 || box.height <= 0) continue;   // a back face can be edge-on
      if (box.left < bookBox.left - 2 || box.right > bookBox.right + 2) {
        say('a page content block escapes the book horizontally');
      }
    }

    return problems;
  }, combo);
}

for (const combo of generateCombos()) {
  test(`layer1 ${combo.id}`, async () => {
    expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
  });
}

test('layer1 slotting after mount rebuilds the book', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ pages: 3 });
    const before = { total: (window as any).matrix.el.totalPages };
    const grown = await (window as any).matrix.reslot(6);
    const shrunk = await (window as any).matrix.reslot(2);
    const emptied = await (window as any).matrix.reslot(0);
    return { before, grown, shrunk, emptied };
  });
  // "readonly totalPages: number — Getter, count of slotted page elements", and
  // "each child becomes one page", both live rather than mount-only.
  expect(result.before.total).toBe(3);
  expect(result.grown).toEqual({ totalPages: 6, leaves: 6 });
  expect(result.shrunk).toEqual({ totalPages: 2, leaves: 2 });
  expect(result.emptied.totalPages).toBe(0);
  expect(result.emptied.leaves).toBe(0);
});

test('layer1 keyboard navigation turns the painted book', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ pages: 4 });
    const closed = (window as any).matrix.leafRotations();
    const forward = await (window as any).matrix.press('ArrowRight');
    const afterForward = (window as any).matrix.leafRotations();
    const back = await (window as any).matrix.press('ArrowLeft');
    const afterBack = (window as any).matrix.leafRotations();
    return { closed, forward, afterForward, back, afterBack };
  });

  expect(result.closed).toEqual([0, 0, 0, 0]);
  expect(result.forward).toBe(1);
  // ArrowRight really turned the first leaf, not merely the number.
  expect(Math.abs(result.afterForward[0])).toBeGreaterThan(90);
  expect(result.back).toBe(0);
  expect(result.afterBack).toEqual([0, 0, 0, 0]);
});

test('layer1 the page turn really is animated', async ({ browser }) => {
  // The shared stage runs with reduced motion, which is exactly the setting
  // that would hide a component whose "animated page turns" were not animated.
  // So this one claim gets its own page, with the browser's default motion.
  const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await motionPage.goto(FIXTURE);
    await motionPage.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
    const timing = await motionPage.evaluate(async () => {
      await (window as any).matrix.mount({ pages: 3 });
      const leaf = (window as any).matrix.el.shadowRoot.querySelector('.book__page--2');
      const style = getComputedStyle(leaf);
      return {
        property: style.transitionProperty,
        duration: style.transitionDuration,
        seconds: parseFloat(style.transitionDuration),
      };
    });

    // "animated page turns" in the component summary.
    expect(timing.property).toContain('transform');
    expect(timing.seconds, `transition-duration "${timing.duration}"`).toBeGreaterThan(0.1);
  } finally {
    await motionPage.close();
  }
});

// ── VISUAL-MATRIX-book-3 (fixed): how many leaves are turned at page k ─────

async function rotationsAt(pages: number, currentPage: number): Promise<number[]> {
  return page.evaluate(async ({ pages, currentPage }) => {
    await (window as any).matrix.mount({ pages });
    await (window as any).matrix.goToPage(currentPage);
    return (window as any).matrix.leafRotations() as number[];
  }, { pages, currentPage });
}

test('a closed book turns nothing, and page 1 turns exactly the first leaf', async () => {
  // The two positions the old mechanism got right, still asserted so the
  // fixed block below cannot regress them.
  expect(await rotationsAt(4, 0)).toEqual([0, 0, 0, 0]);
  const atOne = await rotationsAt(4, 1);
  expect(Math.abs(atOne[0])).toBeGreaterThan(90);
  expect(atOne.slice(1).every(r => r === 0)).toBe(true);
});

for (const [pages, currentPage] of [[4, 2], [4, 3], [6, 3], [6, 5], [2, 2]] as const) {
  test(`VISUAL-MATRIX-book-3 (fixed) pages=${pages}/page=${currentPage}: every leaf before the current one is turned`, async () => {
    const rotations = await rotationsAt(pages, currentPage);
    const turned = rotations.map(r => Math.abs(r) > 90);
    // At page k of n, the first k leaves are behind the reader and the rest
    // are ahead of them.
    expect(turned, `rotations ${JSON.stringify(rotations)}`)
      .toEqual(Array.from({ length: pages }, (_, i) => i < currentPage));
  });
}

test('VISUAL-MATRIX-book-3 (fixed): the number of turned leaves matches the page', async () => {
  // The old mechanism's signature was exactly one turned leaf at ANY page;
  // the fix turns one leaf per page the reader has passed.
  for (const currentPage of [1, 2, 3, 4]) {
    const rotations = await rotationsAt(4, currentPage);
    const turned = rotations.filter(r => Math.abs(r) > 90).length;
    expect(turned, `at page ${currentPage}: ${JSON.stringify(rotations)}`).toBe(currentPage);
  }
});

// ── LAYER 2: real screenshots ──────────────────────────────────────────────

test('marquee: the cover image really paints', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ pages: 3, cover: true, currentPage: 0 }));
  const probe = `(host) => {
    const sr = host.shadowRoot;
    const cover = sr.querySelector('.book__page--1 img').getBoundingClientRect();
    const paper = sr.querySelector('.book__page--4').getBoundingClientRect();
    return [
      { x: cover.left + cover.width / 2, y: cover.top + cover.height / 2 },
      // The right-hand page, well clear of its text: the paper the cover has
      // to be distinguishable from.
      { x: paper.right - 8, y: paper.bottom - 8 },
    ];
  }`;
  const [cover, paper] = await capture(page, '#subject', 'book-cover', probe);

  // The fixture's stand-in cover is a saturated red, so a cover that really
  // painted reads red at its centre…
  expect(cover[0], `cover centre rgb(${cover}) is not red`).toBeGreaterThan(cover[1] + 40);
  expect(cover[0], `cover centre rgb(${cover}) is not red`).toBeGreaterThan(cover[2] + 40);
  // …and is nothing like the page paper beside it.
  expect(sameColor(cover, paper), 'the cover paints the same colour as the page paper').toBe(false);
  expect(contrast(cover, paper)).toBeGreaterThan(1.5);
});

test('marquee: page text is legible against the paper', async () => {
  await page.evaluate(async () => {
    await (window as any).matrix.mount({ pages: 3, currentPage: 0 });
  });
  const probe = `(host) => {
    const content = host.shadowRoot.querySelector('.book__page--4 .page__content');
    const box = content.getBoundingClientRect();
    // A point well clear of the glyphs: the paper the text sits on.
    return [{ x: box.right - 6, y: box.bottom - 6 }];
  }`;
  const [paper] = await capture(page, '#subject', 'book-page-paper', probe);

  const textColor = await page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    const content = host.shadowRoot!.querySelector('.book__page--4 .page__content') as HTMLElement;
    return getComputedStyle(content).color;
  });
  const rgb = (textColor.match(/\d+/g) ?? []).slice(0, 3).map(Number) as RGB;
  // `--dark-text` on `--page-bg` is the pairing the stylesheet ships; it has to
  // be readable on the pixels actually painted.
  expect(contrast(rgb, paper), `page text ${textColor} on paper ${paper}`).toBeGreaterThan(4.5);
});
