/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-weather TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/weather, `npm run test:matrix`) owns value
 * truth: the unit conversion, the rounding, the icon auto-detection, which
 * details and forecast days render for a given `data`. What it cannot own is
 * the meaning of the component's other documented word:
 *
 *     variant: 'compact' | 'full'
 *
 * "Compact" is not a different tree — the DOM is identical. It is a stylesheet
 * that shrinks the temperature and takes the details row and the forecast OFF
 * THE SCREEN with `display: none`. In happy-dom, where no style is resolved and
 * no box is laid out, a compact card and a full card are the same object; only
 * a browser can be asked whether the compact card is actually compact.
 *
 * The forecast is the other geometry claim: "multi-day" means the days are laid
 * out beside each other, in order, and stay inside a card narrower than they
 * are.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host and `[part="base"]` have real, visible boxes;
 *   · in `full`, every part the data asks for is painted, in reading order —
 *     current, then details, then forecast — inside the card;
 *   · in `compact`, `[part="details"]` and `[part="forecast"]` paint NOTHING,
 *     and the card is the shorter for it;
 *   · the icon sits beside the temperature rather than on top of it;
 *   · forecast days run left to right in data order, none of them collapsed,
 *     each with its day name above its temperatures;
 *   · the temperature survives a hit test through the shadow boundary.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The card's documented custom properties are all colour: a background, a
 *   border, and the forecast divider. Each of those can be "applied" and still
 *   paint the same pixels as the page behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/weather/matrix.html';

type Unit = 'celsius' | 'fahrenheit';
type Variant = 'compact' | 'full';
type Details = 'both' | 'humidity-only' | 'none';

const FORECAST = [
  { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
  { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
  { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' },
  { day: 'Thu', high: 19, low: 12, condition: 'Snow' },
  { day: 'Fri', high: 26, low: 20, condition: 'Partly Cloudy' },
];

interface Combo {
  id: string;
  unit: Unit;
  variant: Variant;
  details: Details;
  days: number;
  data: {
    temp: number; condition: string;
    humidity?: number; wind?: number;
    forecast?: typeof FORECAST;
  };
}

/**
 * unit (2) x variant (2) x details (3) x forecast length (3: 0, 1, 5) = 36.
 *
 * `details` and the forecast length decide which optional parts exist to
 * measure; `variant` decides whether they are allowed to paint; `unit` is in
 * the cross because a longer string ("72°F" vs "22°C") is the cheapest way to
 * find a layout that only holds for one of them.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const unit of ['celsius', 'fahrenheit'] as Unit[]) {
    for (const variant of ['full', 'compact'] as Variant[]) {
      for (const details of ['both', 'humidity-only', 'none'] as Details[]) {
        for (const days of [0, 1, 5]) {
          combos.push({
            id: `${variant}/${unit}/${details}/days=${days}`,
            unit, variant, details, days,
            data: {
              temp: 22,
              condition: 'Partly Cloudy',
              ...(details !== 'none' ? { humidity: 65 } : {}),
              ...(details === 'both' ? { wind: 12 } : {}),
              ...(days > 0 ? { forecast: FORECAST.slice(0, days) } : {}),
            },
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
    const partOf = (name: string) => sr.querySelector(`[part="${name}"]`) as HTMLElement | null;
    const hostBox = rect(host);
    if (getComputedStyle(host).display !== 'block') {
      say(`host display "${getComputedStyle(host).display}", expected block`);
    }

    const base = partOf('base');
    if (!base) { say('no [part="base"]'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`[part="base"] renders at ${baseBox.width}x${baseBox.height}`);
    }

    const within = (inner: DOMRect, outer: DOMRect, what: string, of: string) => {
      if (inner.left < outer.left - 1 || inner.right > outer.right + 1
        || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
        say(`${what} (${inner.left.toFixed(0)},${inner.top.toFixed(0)}`
          + `,${inner.right.toFixed(0)},${inner.bottom.toFixed(0)}) escapes ${of}`);
      }
    };
    within(baseBox, hostBox, '[part="base"]', 'the host');

    const current = partOf('current');
    const details = partOf('details');
    const forecast = partOf('forecast');

    if (!current) say('no [part="current"]');

    // ── The compact variant is a claim about what is NOT painted ───────────
    const painted = (node: HTMLElement | null) => {
      if (!node) return false;
      const b = rect(node);
      const cs = getComputedStyle(node);
      return cs.display !== 'none' && b.width > 0 && b.height > 0;
    };
    if (combo.variant === 'compact') {
      if (painted(details)) {
        say(`compact painted [part="details"] at ${rect(details!).width}x${rect(details!).height}`);
      }
      if (painted(forecast)) {
        say(`compact painted [part="forecast"] at ${rect(forecast!).width}x${rect(forecast!).height}`);
      }
    } else {
      if (combo.details !== 'none' && !painted(details)) {
        say('full: the data carries details but [part="details"] paints nothing');
      }
      if (combo.days > 0 && !painted(forecast)) {
        say('full: the data carries a forecast but [part="forecast"] paints nothing');
      }
      if (combo.days === 0 && forecast) {
        say('a forecast section rendered for data with no forecast');
      }
    }

    // ── Reading order: current, then details, then forecast ────────────────
    const stack = [
      ['current', current], ['details', details], ['forecast', forecast],
    ].filter(([, node]) => painted(node as HTMLElement | null)) as [string, HTMLElement][];
    for (const [name, node] of stack) {
      within(rect(node), baseBox, `[part="${name}"]`, '[part="base"]');
    }
    for (let i = 1; i < stack.length; i++) {
      const above = rect(stack[i - 1][1]);
      const below = rect(stack[i][1]);
      if (below.top < above.bottom - 1) {
        say(`[part="${stack[i][0]}"] (top ${below.top.toFixed(1)}) overlaps`
          + ` [part="${stack[i - 1][0]}"] (bottom ${above.bottom.toFixed(1)})`);
      }
    }

    // ── The icon sits beside the temperature, not on it ────────────────────
    const icon = sr.querySelector('.icon') as HTMLElement | null;
    const temp = sr.querySelector('.temp') as HTMLElement | null;
    if (!temp) say('no temperature rendered');
    if (icon && temp) {
      const ib = rect(icon);
      const tb = rect(temp);
      if (ib.width <= 0 || ib.height <= 0) say(`the icon renders at ${ib.width}x${ib.height}`);
      if (!(ib.right <= tb.left + 1)) {
        say(`the icon (right ${ib.right.toFixed(1)}) overlaps the temperature`
          + ` (left ${tb.left.toFixed(1)})`);
      }
    }

    // ── The forecast is multi-DAY: side by side, in order, uncollapsed ─────
    if (painted(forecast)) {
      const days = [...forecast!.querySelectorAll('.forecast-day')] as HTMLElement[];
      if (days.length !== combo.days) {
        say(`${days.length} forecast days painted, expected ${combo.days}`);
      }
      for (const [i, day] of days.entries()) {
        const b = rect(day);
        if (b.width <= 0 || b.height <= 0) say(`forecast day ${i} renders at ${b.width}x${b.height}`);
        if (i > 0 && b.left < rect(days[i - 1]).right - 1) {
          say(`forecast day ${i} (left ${b.left.toFixed(1)}) overlaps day ${i - 1}`
            + ` (right ${rect(days[i - 1]).right.toFixed(1)})`);
        }
        const name = day.querySelector('.forecast-day-name') as HTMLElement | null;
        const temps = day.querySelector('.forecast-temps') as HTMLElement | null;
        if (name && temps && !(rect(name).bottom <= rect(temps).top + 1)) {
          say(`forecast day ${i}: the day name overlaps its temperatures`);
        }
      }
    }

    // ── The card never grows past the stage it was given ───────────────────
    if (Math.round(hostBox.width) !== 420) {
      say(`host is ${hostBox.width.toFixed(1)}px wide; the stage is 420px`);
    }

    // ── The temperature survives a hit test ───────────────────────────────
    if (temp) {
      const b = rect(temp);
      const x = b.left + Math.min(6, b.width / 2);
      const y = b.top + b.height / 2;
      if (document.elementFromPoint(x, y) !== host) {
        say('the temperature is not the topmost element at its own position');
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== temp && !temp.contains(hit as Node)) {
          say(`the temperature is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('weather visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.base, `combo ${combo.id}: no base part`).toBe(true);
      expect(mounted.days, `combo ${combo.id}: forecast day nodes`).toBe(combo.days);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── "Compact" measured against "full", across mounts ────────────────────────

test.describe('weather visual matrix: the compact scale', () => {
  const data = {
    temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, forecast: FORECAST,
  };

  async function measure(variant: Variant) {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant, data } as any);
    return page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const temp = sr.querySelector('.temp') as HTMLElement;
      const icon = sr.querySelector('.icon') as HTMLElement;
      return {
        cardHeight: sr.querySelector('[part="base"]')!.getBoundingClientRect().height,
        tempFontSize: parseFloat(getComputedStyle(temp).fontSize),
        iconFontSize: parseFloat(getComputedStyle(icon).fontSize),
        padding: parseFloat(getComputedStyle(sr.querySelector('[part="base"]')!).paddingTop),
      };
    });
  }

  test('the compact card is shorter, smaller and tighter than the full one', async () => {
    const full = await measure('full');
    const compact = await measure('compact');
    expect(compact.cardHeight, `compact ${compact.cardHeight} vs full ${full.cardHeight}`)
      .toBeLessThan(full.cardHeight);
    expect(compact.tempFontSize, `compact temp ${compact.tempFontSize} vs full ${full.tempFontSize}`)
      .toBeLessThan(full.tempFontSize);
    expect(compact.iconFontSize, `compact icon ${compact.iconFontSize} vs full ${full.iconFontSize}`)
      .toBeLessThan(full.iconFontSize);
    expect(compact.padding, `compact padding ${compact.padding} vs full ${full.padding}`)
      .toBeLessThan(full.padding);
  });

  test('a five-day forecast stays inside the card it is drawn in', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant: 'full', data } as any);
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const card = sr.querySelector('[part="base"]')!.getBoundingClientRect();
      const strip = sr.querySelector('[part="forecast"]')!.getBoundingClientRect();
      const problems: string[] = [];
      if (strip.right > card.right + 1) problems.push('the forecast strip is wider than the card');
      if (strip.left < card.left - 1) problems.push('the forecast strip starts left of the card');
      return problems;
    })).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Every documented custom property on this component is a colour, and layer 1
// cannot tell a colour that DIFFERS from one that differs VISIBLY.

test.describe('weather visual matrix: marquee pixels', () => {
  const data = {
    temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12,
    forecast: FORECAST.slice(0, 3),
  };

  test('the card paints its own surface against the page behind it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant: 'full', data } as any);
    const [card, pageGround] = await capture(
      page, 'body', 'weather-card-surface',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="base"]').getBoundingClientRect();
        return [
          // Just inside the card's padding, clear of every glyph…
          { x: box.right - 6, y: box.bottom - 4 },
          // …and the page well away from it.
          { x: box.right + 120, y: box.top + 20 },
        ];
      }`,
    );
    expect(sameColor(card, pageGround),
      `the card painted ${card.join(',')}, identical to the page ground`).toBe(false);
  });

  test('the forecast divider paints a line between the details and the days', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant: 'full', data } as any);
    // The divider is a 1px border on the forecast section's top edge. Which
    // DEVICE row that lands on is a sub-pixel question the component does not
    // control, so the probe reads the card's own colour well above the edge and
    // then a short band across it: the claim is that a line exists there, not
    // that it sits on a particular scanline.
    const [aboveDivider, ...band] = await capture(
      page, 'body', 'weather-forecast-divider',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const strip = sr.querySelector('[part="forecast"]').getBoundingClientRect();
        const x = strip.x + strip.width / 2;
        return [
          { x, y: strip.top - 6 },
          ...[-1, 0, 1, 2].map(dy => ({ x, y: strip.top + dy })),
        ];
      }`,
    );
    const line = band.find(pixel => !sameColor(pixel, aboveDivider));
    expect(line,
      `no divider found on the forecast's top edge: the band painted`
      + ` ${band.map(p => p.join(',')).join(' | ')} against a card of`
      + ` ${aboveDivider.join(',')}`).toBeDefined();
    expect(contrast(line!, aboveDivider),
      `divider contrast is ${contrast(line!, aboveDivider).toFixed(2)}:1`)
      .toBeGreaterThan(1.02);
  });

  test('compact really does take the forecast off the screen', async () => {
    // Where the FULL card paints a forecast day, in viewport coordinates.
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant: 'full', data } as any);
    const spot = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const day = sr.querySelector('.forecast-day')!.getBoundingClientRect();
      return { x: Math.round(day.x + day.width / 2), y: Math.round(day.bottom - 2) };
    });
    const probeAt = (p: { x: number; y: number }) => `() => [{ x: ${p.x}, y: ${p.y} }]`;
    const [whenFull] = await capture(page, 'body', 'weather-full-strip', probeAt(spot));

    // The same point after switching to compact: the card no longer reaches it,
    // so the page's own ground must be showing through.
    await page.evaluate(c => (window as any).matrix.mount(c),
      { unit: 'celsius', variant: 'compact', data } as any);
    const [whenCompact] = await capture(page, 'body', 'weather-compact-strip', probeAt(spot));
    const [pageGround] = await capture(page, 'body', 'weather-page-ground',
      probeAt({ x: spot.x + 500, y: spot.y }));

    expect(sameColor(whenFull, whenCompact),
      `the compact card still paints ${whenCompact.join(',')} where the full card`
      + ` painted its forecast (${whenFull.join(',')})`).toBe(false);
    expect(sameColor(whenCompact, pageGround),
      `the compact card left ${whenCompact.join(',')} there, which is not the page's`
      + ` own ground (${pageGround.join(',')})`).toBe(true);
  });
});
