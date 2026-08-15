/**
 * snice-funnel TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/funnel, 90 combos) owns which text
 * belongs in which stage. It cannot own any of the below, because happy-dom
 * performs no layout: every band, label and tooltip there reads 0x0.
 *
 * LAYER 1 — geometry / computed style / occlusion, for
 *   {vertical, horizontal} x {default, gradient} x {5 datasets}
 *   x {all text on, all text off} = 40 combos.
 * The dataset axis is the interesting one here and is the reason this tier
 * exists at all: a funnel band's height and width are computed from the data,
 * so a steep drop is the combo where a band collapses to nothing, and equal
 * values are the combo where two bands can land on top of each other. Neither
 * is visible to a DOM assertion.
 *
 * LAYER 2 — real screenshots, four pinned combos only. Screenshots are the
 * expensive layer; new feature combinations belong in layer 1.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/funnel/matrix.html';

const ORIENTATIONS = ['vertical', 'horizontal'] as const;
const VARIANTS = ['default', 'gradient'] as const;
const DATASETS = ['canonical', 'single', 'equal', 'steep', 'colored'] as const;
const TEXT_MODES = [true, false];

const STAGE_COUNT: Record<string, number> = {
  canonical: 4, single: 1, equal: 2, steep: 2, colored: 3,
};

interface Combo {
  id: string;
  orientation: typeof ORIENTATIONS[number];
  variant: typeof VARIANTS[number];
  dataset: typeof DATASETS[number];
  showLabels: boolean;
  showValues: boolean;
  showPercentages: boolean;
}

function combos(): Combo[] {
  const out: Combo[] = [];
  for (const orientation of ORIENTATIONS) {
    for (const variant of VARIANTS) {
      for (const dataset of DATASETS) {
        for (const text of TEXT_MODES) {
          out.push({
            id: `${orientation}/${variant}/${dataset}/text-${text ? 'on' : 'off'}`,
            orientation, variant, dataset,
            showLabels: text, showValues: text, showPercentages: text,
          });
        }
      }
    }
  }
  return out;
}

/**
 * The funnel's marks are the `<g class="funnel__stage">` groups. Occlusion is
 * asserted against the painted PATH rather than the group, because a group's
 * box also spans its right-hand text run — a point in that gap legitimately
 * hits nothing, and probing it would report a phantom.
 */
function probeFor(combo: Combo): ChartProbe {
  return {
    surface: '.funnel__svg',
    marks: '.funnel__stage-shape',
    marks_expected: STAGE_COUNT[combo.dataset],
    requireDistinctPositions: true,
    occlusion: true,
    text: combo.showLabels ? '.funnel__label' : undefined,
    // The tooltip is a hover affordance; nothing has hovered, so it must not be
    // sitting over the chart.
    hidden: ['.funnel__tooltip'],
  };
}

test.describe('snice-funnel visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const combo of combos()) {
    test(combo.id, async () => {
      await mount(page, combo);
      expect(await collectChartProblems(page, probeFor(combo)), combo.id).toEqual([]);
    });
  }
});

test.describe('snice-funnel visual matrix (layer 1: interaction paint)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the tooltip paints over the chart only after a hover', async () => {
    await mount(page, { id: 'hover', dataset: 'canonical', orientation: 'vertical' });

    const before = await page.evaluate(() => {
      const tip = document.getElementById('subject')!.shadowRoot!
        .querySelector('.funnel__tooltip') as HTMLElement;
      return { display: getComputedStyle(tip).display };
    });
    expect(before.display).toBe('none');

    expect(await page.evaluate(() => (window as any).matrix.hoverStage(1))).toBe(true);

    const after = await page.evaluate(() => {
      const tip = document.getElementById('subject')!.shadowRoot!
        .querySelector('.funnel__tooltip') as HTMLElement;
      const cs = getComputedStyle(tip);
      const box = tip.getBoundingClientRect();
      return {
        display: cs.display,
        opacity: Number(cs.opacity),
        width: box.width,
        height: box.height,
        text: (tip.textContent ?? '').trim(),
      };
    });
    expect(after.display).not.toBe('none');
    expect(after.opacity).toBeGreaterThan(0);
    expect(after.width).toBeGreaterThan(0);
    expect(after.height).toBeGreaterThan(0);
    expect(after.text).toContain('Leads');
  });

  test('a hovered tooltip does not permanently cover the stages', async () => {
    await mount(page, { id: 'hover-leave', dataset: 'canonical', orientation: 'vertical' });
    await page.evaluate(() => (window as any).matrix.hoverStage(1));
    await page.evaluate(async () => {
      const el = document.getElementById('subject')!;
      el.shadowRoot!.querySelector('.funnel')!
        .dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
      await (window as any).matrix.settle();
    });

    expect(await collectChartProblems(page, {
      surface: '.funnel__svg',
      marks: '.funnel__stage-shape',
      marks_expected: 4,
      occlusion: true,
      hidden: ['.funnel__tooltip'],
    })).toEqual([]);
  });
});

// ── LAYER 2: real pixels, four pinned combos ────────────────────────────────

test.describe('snice-funnel visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /** Probe the centre of every stage band's painted path. */
  const BAND_CENTRES = `(host) => [...host.shadowRoot.querySelectorAll('.funnel__stage-shape')]
    .map((p) => { const b = p.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })`;

  test('default variant paints a distinct colour per band', async () => {
    await mount(page, {
      id: 'px-default', dataset: 'canonical', orientation: 'vertical', variant: 'default',
    });
    const pixels = await capture(page, '#subject', 'funnel-default-vertical', BAND_CENTRES);
    expect(pixels).toHaveLength(4);
    // Adjacent bands must be told apart at a glance, which is the entire point
    // of a per-stage colour.
    for (let i = 1; i < pixels.length; i++) {
      expect(sameColor(pixels[i], pixels[i - 1]), `bands ${i - 1}/${i} paint the same colour`).toBe(false);
    }
  });

  test('gradient variant paints a monotonically lightening ramp', async () => {
    await mount(page, {
      id: 'px-gradient', dataset: 'canonical', orientation: 'vertical', variant: 'gradient',
    });
    const pixels = await capture(page, '#subject', 'funnel-gradient-vertical', BAND_CENTRES);
    expect(pixels).toHaveLength(4);
    for (let i = 1; i < pixels.length; i++) {
      expect(sameColor(pixels[i], pixels[i - 1]), `gradient bands ${i - 1}/${i} are identical`).toBe(false);
    }
  });

  test('explicit stage colours reach the pixels', async () => {
    await mount(page, {
      id: 'px-colored', dataset: 'colored', orientation: 'vertical', variant: 'default',
    });
    const pixels = await capture(page, '#subject', 'funnel-colored-vertical', BAND_CENTRES);
    expect(pixels).toHaveLength(3);
    // #e74c3c / #2e7d32 / #1565c0 — assert the dominant channel of each rather
    // than an exact triple, so antialiasing at a band edge cannot flake this.
    const [red, green, blue] = pixels;
    expect(red[0]).toBeGreaterThan(red[1]);
    expect(red[0]).toBeGreaterThan(red[2]);
    expect(green[1]).toBeGreaterThan(green[0]);
    expect(green[1]).toBeGreaterThan(green[2]);
    expect(blue[2]).toBeGreaterThan(blue[0]);
    expect(blue[2]).toBeGreaterThan(blue[1]);
  });

  test('labels are readable against the page surface', async () => {
    await mount(page, {
      id: 'px-labels', dataset: 'canonical', orientation: 'horizontal', variant: 'default',
    });
    // Sample the label ink and the surface a few pixels below it.
    const probe = `(host) => { const t = host.shadowRoot.querySelector('.funnel__label');
      const b = t.getBoundingClientRect();
      return [{ x: b.left + b.width / 2, y: b.top + b.height / 2 },
              { x: b.left + b.width / 2, y: b.bottom + 6 }]; }`;
    const [ink, ground] = await capture(page, '#subject', 'funnel-labels-horizontal', probe);
    // Antialiased glyph centres rarely hit full ink, so this is a floor on
    // "can a human read it", not a WCAG certification of the text colour.
    expect(contrast(ink, ground)).toBeGreaterThan(1.6);
  });
});
