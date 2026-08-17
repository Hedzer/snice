/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-link-preview TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/link-preview, `npm run test:matrix`) owns value
 * truth: which parts exist, what the title/description/footer say, that a
 * `title` ATTRIBUTE never becomes the card's title, that `link-click` carries
 * the url. It cannot own the one thing the component's documentation leads
 * with, because happy-dom performs no layout:
 *
 *     variant: 'vertical' | 'horizontal'
 *
 * Those two words are a claim about GEOMETRY. In the DOM both variants emit the
 * identical node order — image, then content — and only a browser applies the
 * `flex-direction` rules that decide whether the image sits ABOVE the text or
 * BESIDE it. The same is true of the `size` scale, and of `image`: a card can
 * carry a perfectly correct `<img src>` and still paint nothing.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host and both documented parts have real, visible boxes;
 *   · `[part="content"]` lies inside `[part="base"]`, which lies inside the host;
 *   · vertical puts the image strictly ABOVE the content; horizontal puts it
 *     strictly to the LEFT, and both agree with the computed `flex-direction`;
 *   · the text stack (title, description, footer) descends without overlapping
 *     and never escapes the card, however long the strings are;
 *   · the favicon has a real box and does not sit on top of the site name;
 *   · title and description survive an elementFromPoint probe through the
 *     shadow boundary.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   `image` present in the DOM and `image` painted on the screen are different
 *   claims — a zero-height flex child, a broken URL, or an `object-fit` slip
 *   all pass layer 1. These decode the PNG inside the browser under test.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/link-preview/matrix.html';

type Variant = 'vertical' | 'horizontal';
type Size = 'small' | 'medium' | 'large';
type Fill = 'full' | 'no-image' | 'text-only';
type Length = 'short' | 'long';

/** A flat-colour SVG: one known RGB triple, so a pixel read is unambiguous. */
const flat = (hex: string) => 'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">'
    + `<rect width="16" height="16" fill="${hex}"/></svg>`);

const IMAGE = flat('#1e40af');
const IMAGE_RGB: RGB = [30, 64, 175];
const FAVICON = flat('#b91c1c');

const SHORT_TITLE = 'A Perfectly Ordinary Headline';
const LONG_TITLE = 'A Headline So Long That It Has To Be Clamped By The Card '
  + 'Rather Than Allowed To Push The Layout Around, Repeated For Good Measure, '
  + 'A Headline So Long That It Has To Be Clamped By The Card';
const SHORT_DESC = 'Brief summary of the linked page.';
const LONG_DESC = ('Sentences that keep going well past the point where any card '
  + 'would want to stop rendering them, which is exactly the point. ').repeat(4);

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  fill: Fill;
  length: Length;
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

/**
 * variant (2) x size (3) x fill (3) x length (2) = 36 combos.
 *
 * Sized to a component whose documented surface is two layout words, a
 * three-step scale and six content strings. `fill` is the axis that decides
 * WHICH boxes exist to measure; `length` is the axis that decides whether the
 * measured boxes stay inside the card.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['vertical', 'horizontal'] as Variant[]) {
    for (const size of ['small', 'medium', 'large'] as Size[]) {
      for (const fill of ['full', 'no-image', 'text-only'] as Fill[]) {
        for (const length of ['short', 'long'] as Length[]) {
          combos.push({
            id: `${variant}/${size}/${fill}/${length}`,
            variant,
            size,
            fill,
            length,
            url: 'https://example.com/articles/one',
            title: length === 'long' ? LONG_TITLE : SHORT_TITLE,
            description: length === 'long' ? LONG_DESC : SHORT_DESC,
            image: fill === 'full' ? IMAGE : '',
            siteName: fill === 'text-only' ? '' : 'example.com',
            favicon: fill === 'text-only' ? '' : FAVICON,
          });
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning every violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') say(`host display "${hostCs.display}", expected block`);

    const base = sr.querySelector('[part="base"]') as HTMLElement | null;
    const content = sr.querySelector('[part="content"]') as HTMLElement | null;
    const titleEl = sr.querySelector('[part="title"]') as HTMLElement | null;
    if (!base) { say('no [part="base"]'); return problems; }
    if (!content) { say('no [part="content"]'); return problems; }

    const baseBox = rect(base);
    const contentBox = rect(content);

    // ── The documented parts are real, visible boxes, nested as documented ──
    for (const [name, node] of [['base', base], ['content', content]] as [string, HTMLElement][]) {
      const b = rect(node);
      const cs = getComputedStyle(node);
      if (b.width <= 0 || b.height <= 0) say(`[part="${name}"] renders at ${b.width}x${b.height}`);
      if (cs.visibility !== 'visible') say(`[part="${name}"] visibility "${cs.visibility}"`);
      if (Number(cs.opacity) <= 0) say(`[part="${name}"] opacity "${cs.opacity}"`);
    }
    const within = (inner: DOMRect, outer: DOMRect, what: string, of: string) => {
      if (inner.left < outer.left - 1 || inner.right > outer.right + 1
        || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
        say(`${what} (${inner.left.toFixed(0)},${inner.top.toFixed(0)}`
          + `,${inner.right.toFixed(0)},${inner.bottom.toFixed(0)}) escapes ${of}`
          + ` (${outer.left.toFixed(0)},${outer.top.toFixed(0)}`
          + `,${outer.right.toFixed(0)},${outer.bottom.toFixed(0)})`);
      }
    };
    within(baseBox, hostBox, '[part="base"]', 'the host');
    within(contentBox, baseBox, '[part="content"]', '[part="base"]');

    // ── The variant is a claim about geometry ───────────────────────────────
    const imageBox = sr.querySelector('.link-preview__image') as HTMLElement | null;
    const flexDirection = getComputedStyle(base).flexDirection;
    if (!imageBox) {
      say('no image slot: the card renders one for every combo, real or placeholder');
    } else {
      const ib = rect(imageBox);
      if (ib.width <= 0 || ib.height <= 0) say(`image slot renders at ${ib.width}x${ib.height}`);
      if (combo.variant === 'horizontal') {
        if (flexDirection !== 'row') say(`horizontal card flex-direction "${flexDirection}"`);
        if (!(ib.right <= contentBox.left + 1)) {
          say(`horizontal: image right edge ${ib.right.toFixed(1)} is not left of`
            + ` content left edge ${contentBox.left.toFixed(1)}`);
        }
      } else {
        if (flexDirection !== 'column') say(`vertical card flex-direction "${flexDirection}"`);
        if (!(ib.bottom <= contentBox.top + 1)) {
          say(`vertical: image bottom ${ib.bottom.toFixed(1)} is not above`
            + ` content top ${contentBox.top.toFixed(1)}`);
        }
      }
      within(ib, baseBox, 'the image slot', '[part="base"]');
    }

    // ── The text stack descends, does not overlap, and stays in the card ────
    const stack = [
      titleEl,
      sr.querySelector('.link-preview__description'),
      sr.querySelector('.link-preview__footer'),
    ].filter(Boolean) as HTMLElement[];
    if (combo.title && !titleEl) say('a title was set but no [part="title"] rendered');
    for (const [i, node] of stack.entries()) {
      const b = rect(node);
      if (b.width <= 0 || b.height <= 0) {
        say(`text row ${i} (.${node.className.split(' ')[0]}) renders at ${b.width}x${b.height}`);
      }
      within(b, contentBox, `text row ${i} (.${node.className.split(' ')[0]})`, '[part="content"]');
      if (i > 0) {
        const above = rect(stack[i - 1]);
        if (b.top < above.bottom - 1) {
          say(`text row ${i} (top ${b.top.toFixed(1)}) overlaps row ${i - 1}`
            + ` (bottom ${above.bottom.toFixed(1)})`);
        }
      }
    }

    // ── Long strings are the card's problem, not the layout's ───────────────
    //
    // A card 520px wide must not grow to fit a 200-character headline: the
    // title/description are clamped and the host width is set by the stage.
    if (Math.round(hostBox.width) !== 520) {
      say(`host is ${hostBox.width.toFixed(1)}px wide; the stage is 520px`
        + ' — content is pushing the card out');
    }

    // ── The footer's parts sit side by side, not on top of each other ───────
    const favicon = sr.querySelector('.link-preview__favicon') as HTMLElement | null;
    const siteName = sr.querySelector('.link-preview__site-name') as HTMLElement | null;
    if (combo.favicon && !favicon) say('a favicon was set but none rendered');
    if (favicon && siteName) {
      const fb = rect(favicon);
      const sb = rect(siteName);
      if (fb.width <= 0 || fb.height <= 0) say(`favicon renders at ${fb.width}x${fb.height}`);
      if (!(fb.right <= sb.left + 1)) {
        say(`favicon right ${fb.right.toFixed(1)} overlaps site name left ${sb.left.toFixed(1)}`);
      }
    }

    // ── Nothing occludes the text a reader came for ─────────────────────────
    for (const node of stack.slice(0, 2)) {
      const b = rect(node);
      if (b.width <= 0 || b.height <= 0) continue;
      const x = b.left + Math.min(8, b.width / 2);
      const y = b.top + b.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`.${node.className.split(' ')[0]}: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== node && !node.contains(hit as Node)) {
        say(`.${node.className.split(' ')[0]} is occluded by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('link-preview visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.base, `combo ${combo.id}: no base part`).toBe(true);
      expect(mounted.content, `combo ${combo.id}: no content part`).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The documented size scale, measured across mounts ───────────────────────

test.describe('link-preview visual matrix: size scale', () => {
  async function measure(variant: Variant, size: Size) {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant, size, url: 'https://example.com/', title: SHORT_TITLE,
      description: SHORT_DESC, image: IMAGE, siteName: 'example.com', favicon: FAVICON,
    } as any);
    return page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const title = sr.querySelector('[part="title"]') as HTMLElement;
      const image = sr.querySelector('.link-preview__image') as HTMLElement;
      return {
        titleFontSize: parseFloat(getComputedStyle(title).fontSize),
        imageWidth: image.getBoundingClientRect().width,
        cardHeight: sr.querySelector('[part="base"]')!.getBoundingClientRect().height,
      };
    });
  }

  test('the title grows with size: small < medium < large', async () => {
    const small = await measure('vertical', 'small');
    const medium = await measure('vertical', 'medium');
    const large = await measure('vertical', 'large');
    expect(small.titleFontSize, `small ${small.titleFontSize} vs medium ${medium.titleFontSize}`)
      .toBeLessThan(medium.titleFontSize);
    expect(medium.titleFontSize, `medium ${medium.titleFontSize} vs large ${large.titleFontSize}`)
      .toBeLessThan(large.titleFontSize);
  });

  test('a horizontal card gives the image more room as it grows', async () => {
    const small = await measure('horizontal', 'small');
    const medium = await measure('horizontal', 'medium');
    const large = await measure('horizontal', 'large');
    expect(small.imageWidth, `small ${small.imageWidth} vs medium ${medium.imageWidth}`)
      .toBeLessThan(medium.imageWidth);
    expect(medium.imageWidth, `medium ${medium.imageWidth} vs large ${large.imageWidth}`)
      .toBeLessThan(large.imageWidth);
  });

  test('a vertical card is taller than the horizontal card of the same size', async () => {
    const vertical = await measure('vertical', 'medium');
    const horizontal = await measure('horizontal', 'medium');
    expect(vertical.cardHeight, `vertical ${vertical.cardHeight} vs horizontal ${horizontal.cardHeight}`)
      .toBeGreaterThan(horizontal.cardHeight);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose: a screenshot costs two orders of magnitude more than an
// evaluate, and layer 1 already measured the model the browser built. These
// exist because "an <img src> is in the shadow root" and "a reader sees the
// image" are different claims, and only pixels settle them.

test.describe('link-preview visual matrix: marquee pixels', () => {
  const probeImageCentre = `(host) => {
    const box = host.shadowRoot.querySelector('.link-preview__image').getBoundingClientRect();
    return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
  }`;

  // `page.evaluate` ships a FUNCTION to the browser, not a closure: module
  // constants have to travel as arguments or they are simply undefined there.
  const marquee = (over: Record<string, unknown>) => ({
    url: 'https://example.com/', title: SHORT_TITLE, description: SHORT_DESC,
    siteName: 'example.com', favicon: FAVICON, ...over,
  });

  test('the image property paints the image', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      marquee({ variant: 'vertical', size: 'large', image: IMAGE }) as any);
    const [pixel] = await capture(page, '#subject', 'link-preview-image', probeImageCentre);
    expect(sameColor(pixel, IMAGE_RGB as RGB),
      `image slot painted ${pixel.join(',')}, expected ${IMAGE_RGB.join(',')}`).toBe(true);
  });

  test('with no image the slot paints the placeholder, not the image', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      marquee({ variant: 'vertical', size: 'large', image: '', favicon: '' }) as any);
    const [pixel] = await capture(page, '#subject', 'link-preview-placeholder', probeImageCentre);
    expect(sameColor(pixel, IMAGE_RGB as RGB),
      `the placeholder painted the image colour ${pixel.join(',')}`).toBe(false);
  });

  test('a horizontal card paints the image beside the text, not behind it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      marquee({ variant: 'horizontal', size: 'large', image: IMAGE }) as any);
    const [inImage, inText] = await capture(
      page, '#subject', 'link-preview-horizontal',
      `(host) => {
        const sr = host.shadowRoot;
        const image = sr.querySelector('.link-preview__image').getBoundingClientRect();
        const content = sr.querySelector('[part="content"]').getBoundingClientRect();
        return [
          { x: image.x + image.width / 2, y: image.y + image.height / 2 },
          { x: content.x + content.width - 6, y: content.y + content.height / 2 },
        ];
      }`,
    );
    expect(sameColor(inImage, IMAGE_RGB as RGB),
      `the image half painted ${inImage.join(',')}`).toBe(true);
    expect(sameColor(inText, IMAGE_RGB as RGB),
      `the text half painted the image colour ${inText.join(',')} — the image is behind the text`)
      .toBe(false);
  });
});
