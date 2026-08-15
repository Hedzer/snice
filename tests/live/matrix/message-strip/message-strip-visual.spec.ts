/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-message-strip TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/message-strip, `npm run test:matrix`)
 * owns structure truth: which parts exist per icon mode, the `dismiss` detail,
 * the show()/hide() state machine. Three of this component's documented claims
 * are invisible to it:
 *
 *   · "Inline contextual message bar WITHIN CONTENT FLOW. Differs from alert
 *     (card), banner (full-width), toast (floating)." — that is a statement
 *     about layout: the strip takes space, and the content after it moves;
 *   · four variants whose entire difference is colour;
 *   · `hide()` is a slide-OUT — an animation, then no box at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the strip is IN FLOW: static position, a real box, and the block after it
 *     starts below the block before it by at least the strip's height;
 *   · it fills its container's width (an inline bar, not a floating card);
 *   · icon, content and dismiss share ONE row, in that order, without
 *     overlapping — and `icon="none"` removes the icon's box entirely;
 *   · the variant tints the strip: its background differs from the page, and
 *     its border colour differs from its background;
 *   · the dismiss control is a real, hit-testable target that nothing covers.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The four variants have to paint four different colours, and a completed
 *   `hide()` has to leave nothing behind.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/message-strip/matrix.html';

type Variant = 'info' | 'success' | 'warning' | 'danger';
type IconMode = 'default' | 'none' | 'slotted';

const VARIANTS: Variant[] = ['info', 'success', 'warning', 'danger'];
const ICON_MODES: IconMode[] = ['default', 'none', 'slotted'];

const MESSAGE = 'Your changes have been saved.';

interface Combo { id: string; variant: Variant; icon: IconMode; dismissible: boolean }

/**
 * 4 variants x 3 icon modes x dismissible — 24 combos. Sized to a component
 * that is one row with three cells; the point of this tier is that the row and
 * the four tints meet a real layout and paint engine.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const icon of ICON_MODES) {
      for (const dismissible of [false, true]) {
        combos.push({
          id: `${variant}/icon=${icon}/${dismissible ? 'dismissible' : 'fixed'}`,
          variant, icon, dismissible,
        });
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo) {
  return {
    variant: combo.variant,
    dismissible: combo.dismissible,
    icon: combo.icon === 'none' ? 'none' : undefined,
    html: combo.icon === 'slotted' ? `<span slot="icon">★</span>${MESSAGE}` : MESSAGE,
  };
}

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

    const hostBox = rect(host);
    const hostStyle = getComputedStyle(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the strip renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── In the content flow, not floating over it ────────────────────────────
    if (hostStyle.position !== 'static') {
      say(`the strip is positioned "${hostStyle.position}" — it is not in the content flow`);
    }
    const before = document.getElementById('before')!.getBoundingClientRect();
    const after = document.getElementById('after')!.getBoundingClientRect();
    if (hostBox.top < before.bottom - EPS) say('the strip is painted over the block before it');
    if (after.top < hostBox.bottom - EPS) {
      say(`the block after the strip (top ${after.top.toFixed(1)}) does not clear it`
        + ` (bottom ${hostBox.bottom.toFixed(1)}) — the strip takes no space`);
    }
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (Math.abs(hostBox.width - stage.width) > 1) {
      say(`the strip is ${hostBox.width.toFixed(0)}px wide in a ${stage.width.toFixed(0)}px`
        + ' container — an inline bar fills its container');
    }

    // ── One row: icon, content, dismiss ──────────────────────────────────────
    const icon = partOf('icon');
    const content = partOf('content');
    const dismiss = partOf('dismiss');
    if (!content) { say('no [part="content"]'); return problems; }
    const contentBox = rect(content);
    if (contentBox.width <= 0 || contentBox.height <= 0) {
      say(`the content renders at ${contentBox.width}x${contentBox.height}`);
      return problems;
    }

    if (combo.icon === 'none') {
      if (icon) say('icon="none" still paints an icon container');
    } else if (!icon) {
      say(`icon mode "${combo.icon}" paints no icon container`);
    } else {
      const iconBox = rect(icon);
      if (iconBox.width <= 0 || iconBox.height <= 0) {
        say(`the icon renders at ${iconBox.width}x${iconBox.height}`);
      } else {
        if (iconBox.right > contentBox.left + EPS) {
          say(`the icon (right ${iconBox.right.toFixed(1)}) runs into the message`
            + ` (left ${contentBox.left.toFixed(1)})`);
        }
        const shareLine = Math.min(iconBox.bottom, contentBox.bottom)
          - Math.max(iconBox.top, contentBox.top);
        if (shareLine <= 0) say('the icon dropped off the message\'s line');
      }
    }

    if (combo.dismissible) {
      if (!dismiss) { say('dismissible strip paints no dismiss control'); }
      else {
        const box = rect(dismiss);
        if (box.width < 12 || box.height < 12) {
          say(`the dismiss control renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`
            + ' — too small to hit');
        } else {
          if (box.left < contentBox.right - EPS) {
            say(`the dismiss control (left ${box.left.toFixed(1)}) overlaps the message`
              + ` (right ${contentBox.right.toFixed(1)})`);
          }
          if (box.right > hostBox.right + EPS) say('the dismiss control hangs outside the strip');
          const hit = (sr as any).elementFromPoint(
            box.left + box.width / 2, box.top + box.height / 2) as Element | null;
          if (hit !== dismiss && !dismiss.contains(hit as Node)) {
            say(`the dismiss control is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
    } else if (dismiss) {
      say('a non-dismissible strip paints a dismiss control');
    }

    // ── The variant's tint ───────────────────────────────────────────────────
    const root = content.parentElement as HTMLElement;
    const rootStyle = getComputedStyle(root);
    const page = getComputedStyle(document.body).backgroundColor;
    if (rootStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say(`variant="${combo.variant}" leaves the strip transparent`);
    } else if (rootStyle.backgroundColor === page) {
      say(`variant="${combo.variant}" paints the page's own colour (${page}) — no tint at all`);
    }
    if (parseFloat(rootStyle.borderTopWidth) > 0
      && rootStyle.borderTopColor === rootStyle.backgroundColor) {
      say(`variant="${combo.variant}" border and background are the same colour`
        + ` (${rootStyle.backgroundColor})`);
    }

    // ── Occlusion: nothing paints over the message ───────────────────────────
    const y = contentBox.top + contentBox.height / 2;
    for (const fraction of [0.1, 0.5]) {
      const x = contentBox.left + contentBox.width * fraction;
      if (document.elementFromPoint(x, y) !== host) {
        say(`message @${Math.round(fraction * 100)}% is not inside the strip's hit area`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      // The message is LIGHT DOM projected through the content slot, so a
      // shadow-root hit-test on a glyph legitimately answers with the host
      // itself (a text node has no element of its own inside the shadow tree).
      // Anything else on top of the message is a real occlusion.
      const legitimate = hit === content || hit === host
        || content.contains(hit as Node) || (hit as Element)?.contains(content);
      if (!legitimate) {
        say(`message @${Math.round(fraction * 100)}% is occluded by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('message-strip visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('message-strip visual matrix: the slide-out', () => {
  test('a completed hide() gives the strip\'s space back, and show() takes it again', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
      id: 'x', variant: 'info', icon: 'default', dismissible: true,
    }) as any);
    const measure = () => page.evaluate(() => ({
      strip: document.getElementById('subject')!.getBoundingClientRect().height,
      after: document.getElementById('after')!.getBoundingClientRect().top,
    }));

    const open = await measure();
    expect(open.strip, 'the strip has no height before hiding').toBeGreaterThan(0);

    await page.evaluate(() => (window as any).matrix.hideAndSettle());
    const hidden = await measure();
    expect(hidden.strip, `hide() left a ${hidden.strip}px box behind`).toBe(0);
    expect(hidden.after,
      `the content after the strip did not move up (${open.after} → ${hidden.after})`)
      .toBeLessThan(open.after);

    await page.evaluate(() => (window as any).matrix.show());
    const reopened = await measure();
    expect(reopened.strip, 'show() did not give the strip its box back')
      .toBeGreaterThan(0);
    expect(Math.abs(reopened.after - open.after),
      `the layout did not return to where it started (${open.after} → ${reopened.after})`)
      .toBeLessThan(2);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 read the computed cascade; these exist because four
// variants that resolve to four cascade values still have to reach the screen as
// four different colours, and because a tint nobody can see is not a tint.

test.describe('message-strip visual matrix: marquee pixels', () => {
  test('the four variants paint four distinct backgrounds', async () => {
    const painted: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        variant, dismissible: true, html: MESSAGE,
      } as any);
      const [fill] = await capture(
        page, '#subject', `message-strip-${variant}`,
        `(host) => {
          const b = host.getBoundingClientRect();
          // Two pixels in from the trailing edge, vertically centred: the
          // strip's own fill, clear of the text and of the border.
          return [{ x: b.right - 24, y: b.y + b.height / 2 }];
        }`,
      );
      painted[variant] = fill.join(',');
    }
    const distinct = new Set(Object.values(painted));
    expect(distinct.size, `the four variants painted ${JSON.stringify(painted)}`).toBe(4);
  });

  test('the strip\'s tint is visible against the page behind it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'danger', dismissible: false, html: MESSAGE,
    } as any);
    const [strip, surface] = await capture(
      page, '#stage', 'message-strip-tint',
      `() => {
        const host = document.getElementById('subject');
        const b = host.getBoundingClientRect();
        const stage = document.getElementById('stage').getBoundingClientRect();
        return [
          { x: b.right - 24, y: b.y + b.height / 2 },
          // The page, just below the stage's own blocks.
          { x: stage.right - 24, y: stage.bottom + 12 },
        ];
      }`,
    );
    expect(sameColor(strip, surface),
      `the strip painted ${strip.join(',')}, identical to the page`).toBe(false);
    const distance = Math.max(...strip.map((channel, i) => Math.abs(channel - surface[i])));
    expect(distance,
      `the strip's tint rgb(${strip.join(',')}) is within ${distance} of the page`
      + ` rgb(${surface.join(',')})`)
      .toBeGreaterThanOrEqual(6);
    // …and the message must stay readable on top of whatever tint the variant
    // chose. Twelve probes across the text run, reduced to the darkest — a
    // single point can easily land between two glyphs and read as the tint.
    const glyphs = await capture(
      page, '#subject', 'message-strip-text',
      `(host) => {
        const content = host.shadowRoot.querySelector('[part~="content"]');
        const b = content.getBoundingClientRect();
        return Array.from({ length: 12 }, (_, i) => ({
          x: b.x + (b.width * (i + 0.5)) / 24,
          y: b.y + b.height / 2,
        }));
      }`,
    );
    const ink = glyphs.reduce((a, b) => (a[0] + a[1] + a[2] <= b[0] + b[1] + b[2] ? a : b));
    // 3:1 is the WCAG floor for large text; the message is small, but this is a
    // matrix guard against an unreadable pairing, not a full audit.
    expect(contrast(ink, strip),
      `the message paints rgb(${ink.join(',')}) on rgb(${strip.join(',')}) —`
      + ` ${contrast(ink, strip).toFixed(2)}:1`)
      .toBeGreaterThan(3);
  });
});
