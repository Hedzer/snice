/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-alert TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/alert, `npm run test:matrix`) owns
 * structure truth: which parts exist, which classes the root carries, what the
 * events say. It cannot own visual truth, because happy-dom performs no layout
 * — every box reads 0 and nothing is painted.
 *
 * The alert is very nearly a presentational component: its whole documented
 * appearance surface (`variant`, `size`, `appearance`) is CSS, producing only a
 * class name and a host attribute in the DOM. So this tier is where those three
 * axes are actually verified, and it is deliberately MODEST — 32 layer-1
 * combos, not the table's 1152.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the alert has a real box, is visible and opaque, and fills its container;
 *   · the message text is inside the alert's box and is never clipped away;
 *   · `size` really scales — small < medium < large in painted height for the
 *     same content;
 *   · `appearance="accent"` really paints the documented "neutral bg + colored
 *     left bar", i.e. a left border wider than the other three, which `filled`
 *     does not have;
 *   · the icon container, the content, and the dismiss button never overlap,
 *     and a hit-test inside each lands in that element rather than a sibling
 *     painted over it — the check with no DOM-tier equivalent at all;
 *   · the dismiss button is a real, clickable target of at least a usable size.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A tint that "has a background-color" can still be invisible, and four
 *   variants that resolve to four CSS variables can still resolve to the same
 *   painted colour if a token is missing. The marquee captures decode the PNG
 *   inside the browser under test and assert the four variants paint four
 *   distinguishable surfaces, and that the message text has readable contrast
 *   against the tint it sits on.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/alert/matrix.html';

type Variant = 'info' | 'success' | 'warning' | 'error';
type Size = 'small' | 'medium' | 'large';
type Appearance = 'filled' | 'accent';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  appearance: Appearance;
  title?: string;
  dismissible: boolean;
  icon?: string;
  iconSlot?: boolean;
}

const VARIANTS: Variant[] = ['info', 'success', 'warning', 'error'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const APPEARANCES: Appearance[] = ['filled', 'accent'];

/**
 * The cross: variant x size x appearance is 24, plus the eight combos that add
 * the two structural affordances (title, dismiss button) whose geometry is the
 * whole reason this tier exists — an overlapping dismiss button is invisible to
 * the DOM tier. 32 combos, sized to a component with one branchy render.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const appearance of APPEARANCES) {
        const dismissible = n % 2 === 0;
        const title = n % 3 === 0 ? 'Heads up' : undefined;
        combos.push({
          id: `${variant}/${size}/${appearance}/[${[
            dismissible ? 'dismissible' : '', title ? 'titled' : '',
          ].filter(Boolean).join(',') || 'plain'}]`,
          variant, size, appearance, dismissible, title,
        });
        n++;
      }
    }
  }
  // The affordance corners: an emoji icon, a slotted icon, no icon at all, and
  // a long title, each with the dismiss button present so the trailing-edge
  // geometry is exercised against every content shape.
  for (const [suffix, extra] of [
    ['icon:emoji', { icon: '🚀' }],
    ['icon:slot', { iconSlot: true }],
    ['icon:none', { icon: 'none' }],
    ['titled-long', { title: 'A rather long alert title that must not collide' }],
  ] as const) {
    for (const appearance of APPEARANCES) {
      combos.push({
        id: `affordance/${suffix}/${appearance}`,
        variant: 'warning', size: 'medium', appearance,
        dismissible: true, ...extra,
      });
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);

    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);
    if (hostBox.width < 100) say(`host is ${hostBox.width.toFixed(0)}px wide — it did not lay out`);
    if (hostBox.height < 16) say(`host is ${hostBox.height.toFixed(0)}px tall`);

    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!base) { say('CSS part "base" is missing'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width < hostBox.width - 2) {
      say(`base is ${baseBox.width.toFixed(0)}px inside a ${hostBox.width.toFixed(0)}px host`);
    }

    // ── The message is really there, inside the box, and readable ───────────
    const description = sr.querySelector('.alert-description') as HTMLElement | null;
    if (!description) say('.alert-description is missing');
    else {
      const box = rect(description);
      if (box.width < 1 || box.height < 1) {
        say(`message box is ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
      }
      if (box.right > baseBox.right + EPS || box.left < baseBox.left - EPS) {
        say('message overflows the alert horizontally');
      }
      const cs = getComputedStyle(description);
      if (Number(cs.opacity) <= 0) say('message is transparent');
      if (parseFloat(cs.fontSize) < 10) say(`message font-size ${cs.fontSize}`);
    }

    // ── `appearance="accent"`: neutral bg + coloured LEFT BAR ───────────────
    const baseCs = getComputedStyle(base);
    const left = parseFloat(baseCs.borderLeftWidth) || 0;
    const others = [
      parseFloat(baseCs.borderTopWidth) || 0,
      parseFloat(baseCs.borderRightWidth) || 0,
      parseFloat(baseCs.borderBottomWidth) || 0,
    ];
    if (combo.appearance === 'accent') {
      if (left <= Math.max(...others)) {
        say(`accent left bar is ${left}px, no wider than its other borders `
          + `(${others.join('/')}) — the documented accent rule did not apply`);
      }
      if (baseCs.borderLeftStyle === 'none') say('accent left bar has border-style: none');
    } else if (left > Math.max(...others) + EPS) {
      say(`filled appearance painted an accent-style left bar of ${left}px`);
    }

    // ── Structure never overlaps itself ─────────────────────────────────────
    const icon = sr.querySelector('.alert-icon') as HTMLElement | null;
    const dismiss = sr.querySelector('.alert-dismiss') as HTMLElement | null;
    const wantIcon = combo.icon !== 'none';
    if (wantIcon && !icon) say('icon container missing');
    if (!wantIcon && icon) say('icon container rendered for icon="none"');
    if (combo.dismissible && !dismiss) say('dismiss button missing');
    if (!combo.dismissible && dismiss) say('dismiss button rendered without `dismissible`');

    const boxes: Array<[string, DOMRect]> = [];
    if (icon) boxes.push(['icon', rect(icon)]);
    if (description) boxes.push(['message', rect(description)]);
    if (dismiss) boxes.push(['dismiss', rect(dismiss)]);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [an, a] = boxes[i];
        const [bn, b] = boxes[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > EPS && overlapY > EPS) {
          say(`${an} and ${bn} overlap by ${overlapX.toFixed(0)}x${overlapY.toFixed(0)}px`);
        }
      }
    }

    // ── Hit-testing: what would the cursor actually touch ───────────────────
    //
    // The message and the slotted icon are LIGHT DOM projected through a slot,
    // so a hit inside them legitimately resolves to the host element — that is
    // how shadow hit-testing reports slotted content, not a defect. The host is
    // therefore an accepted answer; anything else means a sibling is painted
    // over the element and the cursor would never reach it.
    for (const [name, box] of boxes) {
      if (box.width < 1 || box.height < 1) { say(`${name} has no painted box`); continue; }
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      const hit = (sr as any).elementFromPoint
        ? (sr as any).elementFromPoint(x, y)
        : document.elementFromPoint(x, y);
      const target = name === 'dismiss' ? dismiss : name === 'icon' ? icon : description;
      // `host.contains(hit)` covers the slotted case too: a `<span slot="icon">`
      // is a light-DOM child of the host, so it is never inside the shadow
      // `.alert-icon` box it is projected into.
      const acceptable = !hit || hit === host || hit === target || host.contains(hit)
        || (target && (target.contains(hit) || hit.contains(target)));
      if (!acceptable) {
        say(`${name} centre hit <${String(hit.tagName).toLowerCase()}`
          + `${hit.className ? `.${String(hit.className).split(' ')[0]}` : ''}> instead`);
      }
    }

    // ── The dismiss control is a usable target ──────────────────────────────
    if (dismiss) {
      const box = rect(dismiss);
      if (box.width < 14 || box.height < 14) {
        say(`dismiss target is ${box.width.toFixed(0)}x${box.height.toFixed(0)}px`);
      }
      if (box.right > baseBox.right + EPS) say('dismiss button hangs outside the alert');
      if (getComputedStyle(dismiss).pointerEvents === 'none') say('dismiss button is not clickable');
    }

    // ── The title sits ABOVE the message, never beside or through it ────────
    const title = sr.querySelector('.alert-title') as HTMLElement | null;
    if (combo.title && !title) say('title missing');
    if (!combo.title && title) say('title rendered without one being set');
    if (title && description) {
      const t = rect(title);
      const d = rect(description);
      if (t.bottom > d.top + EPS) say('title and message are not stacked');
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('alert visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * `size` is documented as a scale. Three separate mounts of the SAME content
 * must produce strictly increasing painted heights; a size token that silently
 * resolved to nothing would leave the DOM tier perfectly green.
 */
test.describe('alert visual matrix: size really scales', () => {
  test('small < medium < large in painted height', async () => {
    const heights: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({
        variant: 'info', size: s, appearance: 'filled', dismissible: true,
      }), size);
      heights.push(await page.evaluate(() =>
        document.getElementById('subject')!.getBoundingClientRect().height));
    }
    expect(heights[0], `heights ${heights.join(' / ')}`).toBeLessThan(heights[1]);
    expect(heights[1], `heights ${heights.join(' / ')}`).toBeLessThan(heights[2]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// three exist because "the variants resolve to different CSS variables" and
// "the variants look different" are different claims, and only pixels can tell
// them apart.

test.describe('alert visual matrix: marquee pixels', () => {
  test('the four variants paint four distinguishable surfaces', async () => {
    const painted: Record<string, RGB> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, size: 'medium', appearance: 'filled', dismissible: false,
      }), variant);
      const [tint] = await capture(
        page, '#subject', `alert-${variant}`,
        `(host) => {
          const box = host.getBoundingClientRect();
          // Near the trailing edge: past the icon and past the text, so the
          // probe reads the alert's own surface rather than glyph pixels.
          return [{ x: box.right - 12, y: box.y + box.height / 2 }];
        }`,
      );
      painted[variant] = tint;
    }
    const distinct = new Set(Object.values(painted).map(p => p.join(',')));
    expect(distinct.size,
      `variants painted ${Object.entries(painted).map(([k, v]) => `${k}=${v.join(',')}`).join(' ')}`)
      .toBe(VARIANTS.length);
  });

  test('the message is readable against the tint it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'error', size: 'medium', appearance: 'filled',
      dismissible: true, message: 'IIIIIIIIIIIIIIII',
    }));
    // A row of probes across the glyph run, plus the alert's own surface well
    // past the end of the text. A single probe would land between glyphs as
    // often as on one; the claim is that SOME painted pixel of the message is
    // readable, so the strongest probe is the one that answers it. WCAG AA body
    // text is 4.5:1; the bar here is 3:1 so antialiasing cannot make the check
    // flap, while a message painted in its own background colour fails hard.
    const pixels = await capture(
      page, '#subject', 'alert-text-contrast',
      `(host) => {
        const el = host.shadowRoot.querySelector('.alert-description');
        const box = el.getBoundingClientRect();
        const y = box.y + box.height / 2;
        const points = [];
        for (let dx = 1; dx < 60; dx += 2) points.push({ x: box.x + dx, y });
        points.push({ x: box.right - 4, y });
        return points;
      }`,
    );
    const tint = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    const best = glyphs.reduce((a, b) => (contrast(b, tint) > contrast(a, tint) ? b : a));

    expect(glyphs.every(p => sameColor(p, tint)),
      `every probe painted ${tint.join(',')} — the message is invisible`).toBe(false);
    expect(contrast(best, tint),
      `best message contrast is ${contrast(best, tint).toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('accent paints a coloured bar against a neutral body', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'success', size: 'large', appearance: 'accent', dismissible: false,
    }));
    // One probe a pixel inside the left edge (the bar) and one well inside the
    // body. The documented accent is "neutral bg + colored left bar", so the
    // two must not paint the same colour.
    const [bar, body] = await capture(
      page, '#subject', 'alert-accent-bar',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + 1, y: box.y + box.height / 2 },
          { x: box.right - 12, y: box.y + box.height / 2 },
        ];
      }`,
    );
    expect(sameColor(bar, body),
      `bar ${bar.join(',')} and body ${body.join(',')} painted the same colour`).toBe(false);
  });
});
