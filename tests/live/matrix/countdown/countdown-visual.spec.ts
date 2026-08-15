/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-countdown TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/countdown, `npm run test:matrix`) owns
 * structure truth: how many segments a format renders, what each one reads, when
 * `.complete` lands, which events fire. It cannot own visual truth, because
 * happy-dom performs no layout — every box reads 0 and nothing is painted.
 *
 * `variant` is the reason this tier exists: simple, flip and circular produce
 * IDENTICAL DOM. Every difference between them is a CSS rule, and a browser is
 * the only place they can be told apart at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · segments run left to right without overlapping, and the separators sit
 *     BETWEEN them (docs: "Colon separator between segments");
 *   · each segment's label sits BELOW its digits (docs, Accessibility: "Each
 *     time segment has a descriptive label below the digits") and is painted,
 *     not collapsed;
 *   · the documented token roles resolve —
 *     label      → `--snice-color-text-secondary`,
 *     separator  → `--snice-color-text-tertiary`,
 *     flip       → `--snice-color-surface-container-high` card + a
 *                  `--snice-color-border` border on the digits,
 *     circular   → a `--snice-color-primary` ring around round digits,
 *     complete   → `--snice-color-success` digits;
 *   · nothing occludes a digit (elementFromPoint through the shadow root).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The digits have a colour" and "the digits are legible on this card" are
 *   different claims. The marquee captures decode the PNG inside the browser
 *   under test: the flip card must paint a surface that differs from the page,
 *   and a finished countdown must paint digits that differ from a running one.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/countdown/matrix.html';

type Format = 'dhms' | 'hms' | 'ms';
type Variant = 'simple' | 'flip' | 'circular';

interface Combo {
  id: string;
  format: Format;
  variant: Variant;
  remainingMs: number;
  complete: boolean;
}

const SEGMENTS: Record<Format, number> = { dhms: 4, hms: 3, ms: 2 };
const RUNNING_MS = 3 * 86400_000 + 4 * 3600_000 + 5 * 60_000 + 6000;

/**
 * The cross: format (3) x variant (3) x {running, finished} = 18 combos. Sized
 * to a component whose render function has one branch per format; the point of
 * this tier is that all three style-only variants and the complete state get a
 * real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const format of ['dhms', 'hms', 'ms'] as Format[]) {
    for (const variant of ['simple', 'flip', 'circular'] as Variant[]) {
      for (const complete of [false, true]) {
        combos.push({
          id: `${format}/${variant}/${complete ? 'finished' : 'running'}`,
          format,
          variant,
          remainingMs: complete ? -60_000 : RUNNING_MS,
          complete,
        });
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const token = (name: string) => (window as any).matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    const base = partsNamed('base')[0];
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`countdown renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }

    const segments = partsNamed('segment');
    const separators = partsNamed('separator');
    const expectedSegments = { dhms: 4, hms: 3, ms: 2 }[combo.format];
    if (segments.length !== expectedSegments) {
      say(`${segments.length} segments, expected ${expectedSegments}`);
    }
    if (separators.length !== expectedSegments - 1) {
      say(`${separators.length} separators, expected ${expectedSegments - 1}`);
    }

    const textSecondary = token('--snice-color-text-secondary');
    const textTertiary = token('--snice-color-text-tertiary');
    const success = token('--snice-color-success');
    const primary = token('--snice-color-primary');
    const surface = token('--snice-color-surface-container-high');
    const border = token('--snice-color-border');

    // ── Segments: left to right, no overlap, inside the container ──────────
    let previousRight = -Infinity;
    for (const [i, segment] of segments.entries()) {
      const box = rect(segment);
      if (box.width <= 0 || box.height <= 0) {
        say(`segment ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.left < previousRight - EPS) {
        say(`segment ${i} (left ${box.left.toFixed(1)}) overlaps segment ${i - 1}`
          + ` (right ${previousRight.toFixed(1)})`);
      }
      previousRight = box.right;
      if (box.top < baseBox.top - EPS || box.bottom > baseBox.bottom + EPS) {
        say(`segment ${i} escapes the countdown container vertically`);
      }

      const value = segment.querySelector('[part~="value"]') as HTMLElement | null;
      const label = segment.querySelector('[part~="label"]') as HTMLElement | null;
      if (!value) { say(`segment ${i} has no part="value"`); continue; }
      if (!label) { say(`segment ${i} has no part="label"`); continue; }

      const valueBox = rect(value);
      const labelBox = rect(label);
      if (valueBox.width <= 0 || valueBox.height <= 0) {
        say(`segment ${i} digits render at ${valueBox.width}x${valueBox.height}`);
      }
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`segment ${i} label renders at ${labelBox.width}x${labelBox.height}`);
      }
      // "…a descriptive label BELOW the digits".
      if (labelBox.top < valueBox.bottom - EPS) {
        say(`segment ${i} label (top ${labelBox.top.toFixed(1)}) is not below its digits`
          + ` (bottom ${valueBox.bottom.toFixed(1)})`);
      }

      const valueCs = getComputedStyle(value);
      const labelCs = getComputedStyle(label);
      if (parseFloat(valueCs.fontSize) < parseFloat(labelCs.fontSize)) {
        say(`segment ${i} digits (${valueCs.fontSize}) are smaller than the label`
          + ` (${labelCs.fontSize})`);
      }
      if (labelCs.color !== textSecondary) {
        say(`segment ${i} label painted "${labelCs.color}",`
          + ` expected --snice-color-text-secondary "${textSecondary}"`);
      }

      // ── The complete state's documented colour ──────────────────────────
      if (combo.complete && valueCs.color !== success) {
        say(`finished countdown digits painted "${valueCs.color}",`
          + ` expected --snice-color-success "${success}"`);
      }
      if (!combo.complete && valueCs.color === success) {
        say(`a running countdown already paints the finished colour "${success}"`);
      }

      // ── variant: the documented token roles ─────────────────────────────
      if (combo.variant === 'flip') {
        if (valueCs.backgroundColor !== surface) {
          say(`flip digits background "${valueCs.backgroundColor}",`
            + ` expected --snice-color-surface-container-high "${surface}"`);
        }
        if (parseFloat(valueCs.borderTopWidth) <= 0) {
          say(`flip digits have no border (border-top-width ${valueCs.borderTopWidth})`);
        }
        if (valueCs.borderTopColor !== border) {
          say(`flip digits border "${valueCs.borderTopColor}",`
            + ` expected --snice-color-border "${border}"`);
        }
      }
      if (combo.variant === 'circular') {
        if (valueCs.borderTopColor !== primary) {
          say(`circular ring "${valueCs.borderTopColor}",`
            + ` expected --snice-color-primary "${primary}"`);
        }
        if (parseFloat(valueCs.borderTopWidth) <= 0) {
          say(`circular digits have no ring (border-top-width ${valueCs.borderTopWidth})`);
        }
        if (Math.abs(valueBox.width - valueBox.height) > 1) {
          say(`circular digits are not round: ${valueBox.width.toFixed(1)}x${valueBox.height.toFixed(1)}`);
        }
        if (parseFloat(valueCs.borderTopLeftRadius) < valueBox.width / 2 - 1) {
          say(`circular digits radius ${valueCs.borderTopLeftRadius} does not round a`
            + ` ${valueBox.width.toFixed(0)}px box`);
        }
      }
    }

    // ── Separators sit BETWEEN the segments they divide ─────────────────────
    for (const [i, separator] of separators.entries()) {
      const box = rect(separator);
      if (box.width <= 0 || box.height <= 0) {
        say(`separator ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      const before = segments[i] ? rect(segments[i]) : null;
      const after = segments[i + 1] ? rect(segments[i + 1]) : null;
      if (before && box.left < before.right - EPS) {
        say(`separator ${i} (left ${box.left.toFixed(1)}) overlaps the segment before it`);
      }
      if (after && box.right > after.left + EPS) {
        say(`separator ${i} (right ${box.right.toFixed(1)}) overlaps the segment after it`);
      }
      const cs = getComputedStyle(separator);
      if (cs.color !== textTertiary) {
        say(`separator ${i} painted "${cs.color}",`
          + ` expected --snice-color-text-tertiary "${textTertiary}"`);
      }
    }

    // ── Occlusion: nothing may paint over the digits ───────────────────────
    const firstValue = segments[0]?.querySelector('[part~="value"]') as HTMLElement | null;
    if (firstValue) {
      const box = rect(firstValue);
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`digits hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the countdown`);
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== firstValue && !firstValue.contains(hit as Node)) {
          say(`the leading digits are occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('countdown visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(mounted.reflected).toBe(combo.variant === 'simple' ? null : combo.variant);
      expect(mounted.complete).toBe(combo.complete);
      expect(mounted.segments).toBe(SEGMENTS[combo.format]);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('countdown visual matrix: marquee pixels', () => {
  test('the flip variant paints a card that differs from the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      format: 'dhms', variant: 'flip', remainingMs: 3 * 86400000 + 4 * 3600000,
    }));
    const [card, surface] = await capture(
      page, 'body', 'countdown-flip-card',
      `() => {
        const host = document.getElementById('subject');
        const value = host.shadowRoot.querySelector('[part~="value"]');
        const b = value.getBoundingClientRect();
        return [
          { x: b.x + 3, y: b.y + b.height - 3 },
          { x: b.x - 30, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(card as RGB, surface as RGB),
      `flip card painted ${card.join(',')} on a page painting ${surface.join(',')}`).toBe(false);
  });

  test('the digits are legible against whatever the variant paints behind them', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      format: 'ms', variant: 'flip', remainingMs: 5 * 60000 + 30000,
    }));
    // Probe a row across the first digit pair plus the card's own corner. Digits
    // rendered in the card colour would read as one flat colour everywhere.
    const pixels = await capture(
      page, '#subject', 'countdown-digits',
      `(host) => {
        const value = host.shadowRoot.querySelector('[part~="value"]');
        const b = value.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 10; i++) {
          points.push({ x: b.x + (b.width * i) / 12, y: b.y + b.height / 2 });
        }
        points.push({ x: b.x + 3, y: b.y + 3 });
        return points;
      }`,
    );
    const background = pixels[pixels.length - 1] as RGB;
    const digits = pixels.slice(0, -1) as RGB[];
    expect(digits.some(p => !sameColor(p, background)),
      `every probed digit pixel equals the card ${background.join(',')}`).toBe(true);
    const best = Math.max(...digits.map(p => contrast(p, background)));
    expect(best, `best digit-vs-card contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a finished countdown paints different digits than a running one', async () => {
    const probe = `(host) => {
      const value = host.shadowRoot.querySelector('[part~="value"]');
      const b = value.getBoundingClientRect();
      return [0.3, 0.45, 0.55, 0.7].map(f => ({ x: b.x + b.width * f, y: b.y + b.height / 2 }));
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      format: 'ms', variant: 'simple', remainingMs: 5 * 60000,
    }));
    const running = await capture(page, '#subject', 'countdown-running', probe);
    await page.evaluate(() => (window as any).matrix.mount({
      format: 'ms', variant: 'simple', remainingMs: -60000,
    }));
    const finished = await capture(page, '#subject', 'countdown-finished', probe);

    // The finished state is documented to recolour the digits; two identical
    // pixel rows would mean it never reached the paint.
    expect(running.some((p, i) => !sameColor(p as RGB, finished[i] as RGB)),
      `running digits ${JSON.stringify(running)} painted the same as finished`
      + ` ${JSON.stringify(finished)}`).toBe(true);
  });
});
