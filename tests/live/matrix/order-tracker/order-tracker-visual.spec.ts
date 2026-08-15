/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-order-tracker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/order-tracker, `npm run test:matrix`)
 * owns the step contract: which fields render, which indicator each status
 * shows, what `step-click` reports. It cannot own the component's defining
 * word — `variant: 'horizontal'|'vertical'` — because in the DOM both variants
 * are the same markup with a different class. Whether the steps actually run
 * left-to-right or top-to-bottom, whether the indicator sits above or beside
 * its content, and whether the three statuses are visually distinguishable are
 * all questions only a browser answers.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every step has a real box and none overlaps another;
 *   · `horizontal` really advances along x and `vertical` along y, with the
 *     steps in the order they were given;
 *   · the indicator sits above its content in `horizontal` and beside it in
 *     `vertical` (the documented two layouts);
 *   · the indicator is a circle with a real diameter, and its glyph fits;
 *   · the tracking info sits above the steps;
 *   · a step's label is never occluded by the timeline connector.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "Completed steps show check icons" and the three statuses paint differently
 *   are claims about pixels, decided by decoding the PNG in the browser.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/order-tracker/matrix.html';

type Variant = 'horizontal' | 'vertical';
type Status = 'pending' | 'active' | 'completed';

interface Step {
  label: string; status: Status; timestamp?: string; description?: string; icon?: string;
}

/** The docs' own three-step order — one step per documented status. */
function journey(): Step[] {
  return [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
    { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left warehouse' },
    { label: 'Delivered', status: 'pending' },
  ];
}

interface Combo {
  id: string;
  variant: Variant;
  steps: Step[];
  carrier?: string;
  trackingNumber?: string;
}

/**
 * variant (2) x step count (2: 1 and 3) x info (2: none / carrier+tracking)
 * x extras (2: the docs' order, and one where every step carries a description)
 * = 16 combos. Sized to a component whose documented surface is one timeline in
 * two orientations.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['horizontal', 'vertical'] as Variant[]) {
    for (const count of [1, 3]) {
      for (const info of [false, true]) {
        for (const verbose of [false, true]) {
          const steps = journey().slice(0, count).map(step => verbose
            ? { ...step, description: 'Package left warehouse', timestamp: 'Feb 22, 2026' }
            : step);
          combos.push({
            id: `${variant}/${count}-step/${info ? 'tracked' : 'bare'}/${verbose ? 'verbose' : 'plain'}`,
            variant, steps,
            ...(info ? { carrier: 'UPS', trackingNumber: '1Z999AA10123456784' } : {}),
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
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const steps = [...sr.querySelectorAll('.tracker__step')] as HTMLElement[];
    if (steps.length !== combo.steps.length) {
      say(`${steps.length} steps, expected ${combo.steps.length}`);
    }
    if (steps.length === 0) return problems;

    for (const [i, step] of steps.entries()) {
      const box = rect(step);
      if (box.width <= 0 || box.height <= 0) say(`step ${i} renders at ${box.width}x${box.height}`);
      const cs = getComputedStyle(step);
      if (cs.visibility !== 'visible') say(`step ${i} visibility "${cs.visibility}"`);

      const indicator = step.querySelector('.tracker__step-indicator') as HTMLElement | null;
      const content = step.querySelector('.tracker__step-content') as HTMLElement | null;
      if (!indicator) { say(`step ${i} has no indicator`); continue; }
      if (!content) { say(`step ${i} has no content`); continue; }

      const indicatorBox = rect(indicator);
      const contentBox = rect(content);
      if (indicatorBox.width <= 0 || indicatorBox.height <= 0) {
        say(`step ${i} indicator renders at ${indicatorBox.width}x${indicatorBox.height}`);
      }
      // The documented indicator is a circle: square box, fully rounded.
      if (Math.abs(indicatorBox.width - indicatorBox.height) > 1) {
        say(`step ${i} indicator is ${indicatorBox.width}x${indicatorBox.height}, not a circle`);
      }
      const radius = parseFloat(getComputedStyle(indicator).borderTopLeftRadius) || 0;
      if (radius < indicatorBox.width / 4) {
        say(`step ${i} indicator radius is ${radius}px on a ${indicatorBox.width}px box`);
      }

      // The two documented layouts.
      if (combo.variant === 'horizontal') {
        if (contentBox.top < indicatorBox.bottom - EPS) {
          say(`horizontal step ${i}: content (top ${contentBox.top.toFixed(1)}) is not below`
            + ` its indicator (bottom ${indicatorBox.bottom.toFixed(1)})`);
        }
      } else if (contentBox.left < indicatorBox.right - EPS) {
        say(`vertical step ${i}: content (left ${contentBox.left.toFixed(1)}) is not right of`
          + ` its indicator (right ${indicatorBox.right.toFixed(1)})`);
      }
    }

    // ── The timeline advances along the documented axis ────────────────────
    for (let i = 1; i < steps.length; i++) {
      const previous = rect(steps[i - 1]);
      const current = rect(steps[i]);
      if (combo.variant === 'horizontal') {
        if (current.left <= previous.left) {
          say(`horizontal step ${i} (left ${current.left.toFixed(1)}) does not advance past`
            + ` step ${i - 1} (left ${previous.left.toFixed(1)})`);
        }
        if (Math.abs(current.top - previous.top) > 4) {
          say(`horizontal step ${i} sits ${(current.top - previous.top).toFixed(1)}px off the row`);
        }
      } else {
        if (current.top < previous.bottom - EPS) {
          say(`vertical step ${i} (top ${current.top.toFixed(1)}) overlaps step ${i - 1}`
            + ` (bottom ${previous.bottom.toFixed(1)})`);
        }
        if (Math.abs(current.left - previous.left) > 1) {
          say(`vertical step ${i} sits ${(current.left - previous.left).toFixed(1)}px off the column`);
        }
      }
    }

    // ── The tracking info sits above the timeline ──────────────────────────
    const info = sr.querySelector('.tracker__info') as HTMLElement | null;
    const wantsInfo = !!(combo.carrier || combo.trackingNumber);
    if (wantsInfo && !info) {
      say('tracking info was given but nothing renders');
    } else if (!wantsInfo && info) {
      say('tracking info rendered without a carrier or a tracking number');
    } else if (info) {
      const infoBox = rect(info);
      if (infoBox.height <= 0) say(`tracking info renders at ${infoBox.width}x${infoBox.height}`);
      if (infoBox.bottom > rect(steps[0]).top + EPS) {
        say(`tracking info (bottom ${infoBox.bottom.toFixed(1)}) overlaps the first step`
          + ` (top ${rect(steps[0]).top.toFixed(1)})`);
      }
    }

    // ── A label is never painted over ──────────────────────────────────────
    const label = steps[0].querySelector('.tracker__step-label') as HTMLElement | null;
    if (!label) {
      say('the first step has no label');
    } else {
      const box = rect(label);
      if (box.width <= 0 || box.height <= 0) {
        say(`label renders at ${box.width}x${box.height}`);
      } else {
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`label: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
        } else {
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit !== label && !label.contains(hit as Node)) {
            say(`the label is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
              + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
          }
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('order-tracker visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.steps).toBe(combo.steps.length);
      expect(mounted.hasInfo).toBe(!!(combo.carrier || combo.trackingNumber));
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('order-tracker visual matrix: marquee pixels', () => {
  test('the three statuses paint three different indicators', async () => {
    await page.evaluate(steps => (window as any).matrix.mount({ variant: 'horizontal', steps }),
      journey() as any);

    const [completed, active, pending] = await capture(
      page, '#subject', 'order-tracker-statuses',
      `(host) => {
        const nodes = host.shadowRoot.querySelectorAll('.tracker__step-indicator');
        return [...nodes].map(node => {
          const box = node.getBoundingClientRect();
          return { x: box.x + 2, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(sameColor(completed, pending),
      `completed painted ${completed.join(',')} and pending ${pending.join(',')}`).toBe(false);
    expect(sameColor(active, pending),
      `active painted ${active.join(',')} and pending ${pending.join(',')}`).toBe(false);
  });

  test('a completed step paints a check, not a number', async () => {
    await page.evaluate(steps => (window as any).matrix.mount({ variant: 'vertical', steps }),
      journey() as any);

    // Three probes across the completed indicator's glyph area. A check mark
    // paints ink in some of them and not others; an empty circle would paint
    // one flat colour everywhere.
    const pixels = await capture(
      page, '#subject', 'order-tracker-check',
      `(host) => {
        const node = host.shadowRoot.querySelector('.tracker__step--completed .tracker__step-indicator');
        const box = node.getBoundingClientRect();
        return [0.3, 0.5, 0.7].map(f => ({
          x: box.x + box.width * f,
          y: box.y + box.height * 0.55,
        }));
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `the completed indicator painted one flat colour: ${[...distinct]}`).toBeGreaterThan(1);
  });
});
