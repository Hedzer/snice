/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-card TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/card, `npm run test:matrix`) owns structure
 * truth: which regions exist per slot set, the role/tabindex/aria surface, the
 * `card-click` toggle. This component is MOSTLY PRESENTATIONAL — a box with
 * four slots — so its matrix here is deliberately a modest one, and it exists
 * for the five claims happy-dom cannot see:
 *
 *   · three VARIANTS whose entire difference is a shadow (`elevated`), a rule
 *     (`bordered`) or neither (`flat`);
 *   · three SIZES, which are padding — the thing a DOM assertion cannot tell
 *     apart at all;
 *   · `accent="…"` — "adds a coloured TOP-BORDER accent";
 *   · "clickable cards TILT toward the cursor on hover (±3° perspective)";
 *   · a header slotted AFTER connection, which reaches the card through
 *     `slotchange` — an event happy-dom does not emit, so the DOM tier handed
 *     this claim over.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/card/matrix.html';

type Variant = 'elevated' | 'bordered' | 'flat';
type Size = 'small' | 'medium' | 'large';
type Slots = 'body' | 'header' | 'footer' | 'all';

const VARIANTS: Variant[] = ['elevated', 'bordered', 'flat'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const SLOT_SETS: Slots[] = ['body', 'header', 'footer', 'all'];
const ACCENTS = ['primary', 'success', 'warning', 'danger', 'brand'] as const;

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  slots: Slots;
  clickable: boolean;
}

/**
 * 3 variants x 3 sizes x 4 slot sets, with the clickable switch rotated
 * through them — 36 combos. Deliberately modest: a card is a container, and a
 * container's visual contract is "the regions stack in order, nothing escapes,
 * nothing covers anything". The paint that IS distinctive (shadow vs rule,
 * padding, the accent, the tilt) gets its own pinned tests below.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let i = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const slots of SLOT_SETS) {
        const clickable = i++ % 2 === 0;
        combos.push({
          id: `${variant}/${size}/${slots}/${clickable ? 'clickable' : 'plain'}`,
          variant, size, slots, clickable,
        });
      }
    }
  }
  return combos;
}

const mountArgs = (combo: Combo) => ({
  variant: combo.variant,
  size: combo.size,
  clickable: combo.clickable,
  header: combo.slots === 'header' || combo.slots === 'all',
  footer: combo.slots === 'footer' || combo.slots === 'all',
  image: combo.slots === 'all',
});

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partOf = (name: string) =>
      ([...sr.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;
    const shown = (node: Element | null) => {
      if (!node) return false;
      const cs = getComputedStyle(node as HTMLElement);
      if (cs.display === 'none' || cs.visibility !== 'visible') return false;
      return rect(node).height > 0;
    };

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the card renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── In the content flow, filling its column ─────────────────────────────
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (Math.abs(hostBox.width - stage.width) > 1) {
      say(`the card is ${hostBox.width.toFixed(0)}px wide in a ${stage.width.toFixed(0)}px column`);
    }
    const before = document.getElementById('before')!.getBoundingClientRect();
    const after = document.getElementById('after')!.getBoundingClientRect();
    if (hostBox.top < before.bottom - EPS) say('the card is painted over the block before it');
    if (after.top < hostBox.bottom - EPS) {
      say('the block after the card does not clear it — the card takes no space');
    }

    const base = partOf('base');
    if (!base) { say('no [part="base"]'); return problems; }
    const baseBox = rect(base);

    // ── The regions stack in the documented order, inside the base ──────────
    const wantHeader = combo.slots === 'header' || combo.slots === 'all';
    const wantFooter = combo.slots === 'footer' || combo.slots === 'all';

    if (shown(partOf('header')) !== wantHeader) {
      say(`[part="header"] is ${shown(partOf('header')) ? 'shown' : 'hidden'}`
        + ` for slot set "${combo.slots}"`);
    }
    if (shown(partOf('footer')) !== wantFooter) {
      say(`[part="footer"] is ${shown(partOf('footer')) ? 'shown' : 'hidden'}`
        + ` for slot set "${combo.slots}"`);
    }

    const stack: Array<[string, HTMLElement]> = [];
    if (wantHeader) stack.push(['header', partOf('header')!]);
    const body = partOf('body');
    if (!body) { say('no [part="body"]'); return problems; }
    stack.push(['body', body]);
    if (wantFooter) stack.push(['footer', partOf('footer')!]);

    let previousBottom = -Infinity;
    for (const [name, node] of stack) {
      const box = rect(node);
      if (box.height <= 0) say(`[part="${name}"] renders at ${box.width}x${box.height}`);
      if (box.top < previousBottom - EPS) {
        say(`[part="${name}"] (top ${box.top.toFixed(1)}) overlaps the region above it`
          + ` (bottom ${previousBottom.toFixed(1)})`);
      }
      previousBottom = box.bottom;
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS
        || box.bottom > baseBox.bottom + EPS) {
        say(`[part="${name}"] escapes [part="base"]`);
      }
    }

    // An image slot sits at the TOP of the card, above everything else.
    if (combo.slots === 'all') {
      const image = document.getElementById('card-image');
      if (!image) say('the image was not slotted');
      else {
        const box = image.getBoundingClientRect();
        if (box.height <= 0) say(`the slotted image renders at ${box.width}x${box.height}`);
        const headerBox = rect(partOf('header')!);
        if (box.bottom > headerBox.top + EPS) say('the image overlaps the header');
      }
    }

    // ── The body text is really painted, and nothing covers it ──────────────
    const text = document.getElementById('body-text');
    if (!text) say('the body text was not slotted');
    else {
      const box = text.getBoundingClientRect();
      if (box.height <= 0) say('the body text has no box');
      const y = box.top + box.height / 2;
      for (const fraction of [0.15, 0.5]) {
        const x = box.left + box.width * fraction;
        const hit = document.elementFromPoint(x, y);
        if (hit !== host && hit !== text && !text.contains(hit as Node)) {
          say(`the body text @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
      const cs = getComputedStyle(text);
      if (Number(cs.opacity) <= 0.05) say(`the body text is transparent (opacity ${cs.opacity})`);
      if (parseFloat(cs.fontSize) < 9) say(`the body text is ${cs.fontSize}`);
    }

    // ── The footer's own control is reachable ───────────────────────────────
    if (wantFooter) {
      const button = document.getElementById('footer-button');
      if (!button) say('the footer button was not slotted');
      else {
        const box = button.getBoundingClientRect();
        if (box.width < 20 || box.height < 12) {
          say(`the footer button renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
        } else {
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          // The card is the host; a light-DOM child hit-tests as itself or as
          // the host depending on where the pointer lands inside it.
          if (hit !== button && hit !== host && !button.contains(hit as Node)) {
            say(`the footer button is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
    }

    // ── The clickable switch really changes the affordance ──────────────────
    const cs = getComputedStyle(base);
    if (combo.clickable && cs.cursor !== 'pointer') {
      say(`a clickable card shows the "${cs.cursor}" cursor`);
    }
    if (!combo.clickable && cs.cursor === 'pointer') {
      say('a plain card shows a pointer cursor it cannot honour');
    }

    return problems;
  }, combo as any);
}

/**
 * Put the REAL pointer at a horizontal fraction of the card and read back what
 * the tilt resolved to. Real movement matters: the handler is delegated, so a
 * synthetic event dispatched at the shadow node would reach it with the wrong
 * `currentTarget` and write the custom properties onto the wrong element.
 */
async function hoverAt(fraction: number): Promise<{ mx: string; my: string; transform: string }> {
  const point = await page.evaluate(f => (window as any).matrix.pointFor(f), fraction);
  await page.mouse.move(point.x, point.y);
  await page.evaluate(() => (window as any).matrix.settle());
  return page.evaluate(() => (window as any).matrix.readTilt());
}

const combos = generateCombos();

test.describe('card visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The claims the DOM tier handed over ─────────────────────────────────────

test.describe('card visual matrix: a header that arrives late', () => {
  test('slotting a header after connection reveals the header band', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'elevated', header: false, footer: false,
    } as any);

    const measure = () => page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const header = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('header'))!;
      return {
        height: header.getBoundingClientRect().height,
        hidden: (header as HTMLElement).hasAttribute('hidden'),
      };
    });

    const before = await measure();
    expect(before.height, 'a card with no header content paints a header band').toBe(0);

    await page.evaluate(() => (window as any).matrix.addHeader());
    const after = await measure();
    expect(after.hidden, 'the header band is still marked hidden after a header arrived')
      .toBe(false);
    expect(after.height, 'the header band did not open for a slotted header')
      .toBeGreaterThan(0);
  });
});

test.describe('card visual matrix: the cursor tilt', () => {
  /**
   * FINDING VISUAL-MATRIX-card-2 (fixed) — the documented cursor tilt used to
   * never happen, and every pointer move over a clickable card threw.
   *
   * The doc: "clickable cards tilt toward cursor on hover (±3° perspective)".
   * The stylesheet was ready for it — `.card:hover` rotates by
   * `(var(--card-mx) - 0.5) * 3deg` — and `handlePointerMove` was supposed to
   * write `--card-mx`/`--card-my` from the cursor's position inside the card.
   *
   * It was registered as `@on('pointermove', '.card')`, which is DELEGATED:
   * the listener lived on the shadow ROOT and the handler read
   * `event.currentTarget`, which is the ShadowRoot rather than the matched
   * `.card`, so the first line of the handler threw:
   *
   *   Error in event handler handlePointerMove:
   *   TypeError: card.getBoundingClientRect is not a function
   *
   * The handlers now write the custom properties onto the queried `.card`,
   * and the assertions below run unpinned as regression guards.
   */
  test('VISUAL-MATRIX-card-2 (fixed): a clickable card tilts toward the cursor', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'elevated', clickable: true, header: true, footer: true,
    } as any);

    const left = await hoverAt(0.1);
    const right = await hoverAt(0.9);

    expect(Number(left.mx), `--card-mx at the left edge is "${left.mx}"`).toBeLessThan(0.3);
    expect(Number(right.mx), `--card-mx at the right edge is "${right.mx}"`).toBeGreaterThan(0.7);
    expect(right.transform,
      `the card paints the same transform at both edges (${right.transform})`)
      .not.toBe(left.transform);
  });

  test('a clickable card still lifts on hover, and a plain one does not', async () => {
    // The half of the hover treatment that never depended on the tilt: the
    // stylesheet's own translateY(-2px), which needs no custom property.
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'elevated', clickable: true,
    } as any);
    const lifted = await hoverAt(0.5);
    expect(lifted.transform, 'a hovered clickable card resolves no transform at all')
      .not.toBe('none');

    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'elevated', clickable: false,
    } as any);
    const flat = await hoverAt(0.5);
    expect(flat.transform,
      `a card that is not clickable lifts on hover (${flat.transform})`)
      .not.toBe(lifted.transform);
  });

  test('a plain card never tilts', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'elevated', clickable: false,
    } as any);

    const left = await hoverAt(0.1);
    const right = await hoverAt(0.9);
    expect(right.transform,
      'a card that is not clickable tilts toward the cursor').toBe(left.transform);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('card visual matrix: marquee pixels', () => {
  test('the three variants paint three different edges', async () => {
    const edges: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), { variant } as any);
      const [edge] = await capture(
        page, '#stage', `card-${variant}`,
        `() => {
          const box = document.getElementById('subject').getBoundingClientRect();
          // Two pixels OUTSIDE the card's left edge, vertically centred: an
          // elevated card's shadow falls here, a bordered card's rule does not,
          // and a flat card leaves the page's own colour.
          return [{ x: box.left - 2, y: box.y + box.height / 2 }];
        }`,
      );
      edges[variant] = edge.join(',');
    }
    expect(new Set(Object.values(edges)).size,
      `the three variants painted ${JSON.stringify(edges)} outside their left edge`)
      .toBeGreaterThan(1);
  });

  test('the three sizes really pad differently', async () => {
    const heights: Record<string, number> = {};
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c), { size, header: true } as any);
      heights[size] = await page.evaluate(() =>
        document.getElementById('subject')!.getBoundingClientRect().height);
    }
    expect(heights.small, `sizes measured ${JSON.stringify(heights)}`)
      .toBeLessThan(heights.medium);
    expect(heights.medium, `sizes measured ${JSON.stringify(heights)}`)
      .toBeLessThan(heights.large);
  });

  test('every accent paints its own rule along the top edge', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {} as any);
    const [plain] = await capture(
      page, '#subject', 'card-accent-none',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + 1 }];
      }`,
    );

    const painted: Record<string, string> = {};
    for (const accent of ACCENTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), { accent } as any);
      const [top] = await capture(
        page, '#subject', `card-accent-${accent}`,
        `(host) => {
          const box = host.getBoundingClientRect();
          // One pixel down from the top edge: where a top-border accent lands.
          return [{ x: box.x + box.width / 2, y: box.y + 1 }];
        }`,
      );
      painted[accent] = top.join(',');
      expect(sameColor(top, plain),
        `accent="${accent}" paints rgb(${top.join(',')}), the same as no accent at all`)
        .toBe(false);
    }
    // Five named accents that all resolve to one colour are one accent.
    expect(new Set(Object.values(painted)).size,
      `the five accents painted ${JSON.stringify(painted)}`)
      .toBeGreaterThan(1);
  });
});
