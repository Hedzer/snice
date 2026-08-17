/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-link TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/link, `npm run test:matrix`) owns the URL policy
 * in full: which values are accepted, which are rejected, what `hash` prefixes,
 * what `external` sets on `rel`/`target`, and when `navigate` fires. It cannot
 * own VISUAL truth, because happy-dom performs no layout — every box reads 0,
 * nothing is painted, and nothing can occlude anything.
 *
 * Two documented promises are visual and nothing else:
 *
 *   · "Rejected values ... render with muted non-link styling" — the whole
 *     point of which is that the customer SEES a dead link;
 *   · `underline`, which this component draws as a background gradient rule
 *     rather than `text-decoration`, so "is it underlined" cannot be answered
 *     from the DOM at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `part="link"` has a real box, and the slotted label is inside it;
 *   · `underline` really draws a full-width rule at rest, and its absence
 *     really draws none;
 *   · `external` really paints `part="external-icon"` AFTER the label, without
 *     overlapping it;
 *   · a `disabled` link really carries the disabled colour and a not-allowed
 *     cursor, and a REJECTED href really renders muted and non-clickable;
 *   · nothing paints over the label (elementFromPoint).
 *
 * ── Axis comparisons ───────────────────────────────────────────────────────
 *   The four documented variants must not collapse into one colour; disabled
 *   and rejected must each differ from a live link.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A "1px rule at 100% width" is a computed style, not a drawn line, and link
 *   text that fails contrast is still perfectly valid CSS. Only pixels decide.
 *
 * NOTE ON HOVER: the underline animates on `:hover`, so every rest-state
 * measurement here would become a hover measurement if the pointer sat over the
 * stage. The specs never move the mouse, and the fixture puts the stage away
 * from the viewport origin where Playwright parks it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/link/matrix.html';

type Variant = 'default' | 'primary' | 'secondary' | 'muted';
type State = 'live' | 'disabled' | 'rejected';

interface Combo {
  id: string;
  variant: Variant;
  underline: boolean;
  external: boolean;
  state: State;
}

const VARIANTS: Variant[] = ['default', 'primary', 'secondary', 'muted'];
const STATES: State[] = ['live', 'disabled', 'rejected'];

/**
 * The cross: 4 variants x {plain, underline} x {internal, external} x 3 states
 * = 48 combos.
 *
 * Sized to the component: a link is one anchor, one optional icon and one
 * underline rule. The product worth paying for is (which colour role) x (is it
 * underlined) x (does it carry the external mark) x (is it live, disabled, or
 * refused by the URL policy).
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const underline of [false, true]) {
      for (const external of [false, true]) {
        for (const state of STATES) {
          combos.push({
            id: `${variant}/${underline ? 'underline' : 'plain'}`
              + `/${external ? 'external' : 'internal'}/${state}`,
            variant, underline, external, state,
          });
        }
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo): Record<string, unknown> {
  return {
    variant: combo.variant,
    underline: combo.underline,
    external: combo.external,
    disabled: combo.state === 'disabled',
    rejected: combo.state === 'rejected',
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  // Park the pointer off the stage for the whole run: the underline is a hover
  // animation, and a hovering mouse would silently turn every rest-state
  // measurement into a hover measurement.
  await page.mouse.move(1270, 890);
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1: one evaluate per combo; every violation reported at once. */
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
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const anchor = part('link');
    if (!anchor) { say('no part="link" rendered'); return problems; }
    const box = rect(anchor);
    if (box.width <= 0 || box.height <= 0) {
      say(`the link renders at ${box.width}x${box.height}`);
      return problems;
    }
    const cs = getComputedStyle(anchor);
    if (cs.visibility !== 'visible') say(`link visibility "${cs.visibility}"`);
    if (parseFloat(cs.fontSize) < 9) say(`link font-size ${cs.fontSize}`);
    const alpha = cs.color.startsWith('rgba')
      ? Number(cs.color.split(',')[3]?.replace(')', '') ?? '1') : 1;
    if (alpha <= 0.05) say(`link text is transparent (${cs.color})`);

    // ── underline: the documented rule, drawn as a background gradient ───────
    // `background-size: <width> 1px`, 100% when underlined and 0% at rest.
    const width = cs.backgroundSize.split(' ')[0];
    const drawn = !(width === '0%' || width === '0px' || width === 'auto');
    if (combo.state === 'rejected') {
      // "Rejected values ... render with muted non-link styling." A drawn
      // underline is link styling, so a refused destination must not have one
      // even when `underline` was asked for.
      if (drawn) {
        say(`a rejected href still draws a link underline (background-size "${cs.backgroundSize}")`);
      }
    } else {
      if (combo.underline && !drawn) {
        say(`underline drew no rule (background-size "${cs.backgroundSize}")`);
      }
      if (!combo.underline && drawn) {
        say(`a link without underline already draws one (background-size "${cs.backgroundSize}")`);
      }
    }

    // ── external: the documented arrow ───────────────────────────────────────
    const icon = part('external-icon');
    const label = [...anchor.childNodes]
      .find(n => n.nodeName === 'SLOT') as HTMLSlotElement | null;
    const labelBox = label
      ? label.assignedNodes({ flatten: true })
        .map(n => n.nodeType === 1
          ? (n as Element).getBoundingClientRect()
          : (() => {
            const range = document.createRange();
            range.selectNodeContents(n);
            return range.getBoundingClientRect();
          })())
        .reduce((a: DOMRect | null, b) => (!a ? b as DOMRect
          : new DOMRect(Math.min(a.x, b.x), Math.min(a.y, b.y),
            Math.max(a.right, b.right) - Math.min(a.x, b.x),
            Math.max(a.bottom, b.bottom) - Math.min(a.y, b.y))), null)
      : null;

    if (combo.external) {
      if (!icon) {
        say('an external link rendered no part="external-icon"');
      } else {
        const ib = rect(icon);
        if (ib.width <= 0 || ib.height <= 0) {
          say(`the external icon renders at ${ib.width}x${ib.height}`);
        } else {
          if (ib.left < box.left - EPS || ib.right > box.right + EPS) {
            say('the external icon escapes the link box');
          }
          if (labelBox && labelBox.width > 0) {
            if (ib.left < labelBox.right - EPS) {
              say(`the external icon (left ${ib.left.toFixed(1)}) sits before the label ends`
                + ` (right ${labelBox.right.toFixed(1)})`);
            }
            const overlap = Math.min(ib.right, labelBox.right) - Math.max(ib.left, labelBox.left);
            if (overlap > EPS) say(`the external icon overlaps the label by ${overlap.toFixed(1)}px`);
          }
        }
      }
    } else if (icon && rect(icon).width > 0) {
      say('a link that is not external still paints the external icon');
    }

    // ── The label lives inside the link ──────────────────────────────────────
    if (labelBox) {
      if (labelBox.width <= 0 || labelBox.height <= 0) {
        say(`the slotted label renders at ${labelBox.width}x${labelBox.height}`);
      } else if (labelBox.left < box.left - EPS || labelBox.right > box.right + EPS) {
        say('the slotted label escapes the link box');
      }
    }

    // ── disabled / rejected: the documented dead states ──────────────────────
    if (combo.state === 'disabled') {
      if (cs.cursor !== 'not-allowed') {
        say(`a disabled link's cursor is "${cs.cursor}", not "not-allowed"`);
      }
      // "disabled prevents pointer activation" — the painted mechanism is a
      // pointer-transparent anchor, which is exactly what a hit test can see.
      if (cs.pointerEvents !== 'none') {
        say(`a disabled link is still hit-testable (pointer-events "${cs.pointerEvents}")`);
      }
    }
    if (combo.state === 'rejected') {
      // "Rejected values remove the internal anchor's href ... and render with
      // muted non-link styling."
      if (anchor.hasAttribute('href')) {
        say(`a rejected href left the anchor addressable ("${anchor.getAttribute('href')}")`);
      }
      if (cs.cursor === 'pointer') {
        say('a rejected link still presents a pointer cursor — it looks clickable');
      }
    }
    if (combo.state === 'live' && cs.cursor !== 'pointer') {
      say(`a live link's cursor is "${cs.cursor}", not "pointer"`);
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    // The page-level probe runs for every combo: it proves nothing outside
    // the host paints over the link. The shadow-root probe is skipped for a
    // pointer-transparent anchor (the disabled state above): Firefox honours
    // `pointer-events: none` in ShadowRoot.elementFromPoint and returns null,
    // while Chromium's still reports the anchor — an engine fact, not a
    // contract, and the pointer-transparency itself is asserted above.
    const hitTestable = cs.pointerEvents !== 'none';
    for (const fraction of [0.25, 0.5]) {
      const x = box.left + box.width * fraction;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`@${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the link`);
        continue;
      }
      if (!hitTestable) continue;
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (!hit) { say(`@${Math.round(fraction * 100)}%: shadow hit-test found nothing`); continue; }
      if (hit !== anchor && hit !== host && !anchor.contains(hit)) {
        say(`@${Math.round(fraction * 100)}% is occluded by <${hit.tagName.toLowerCase()}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('link visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

async function rowLinks(count: number): Promise<Array<{
  color: string; cursor: string; backgroundSize: string; fontWeight: string;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const anchor = host.shadowRoot!.querySelector('[part~="link"]') as HTMLElement;
      const cs = getComputedStyle(anchor);
      out.push({
        color: cs.color,
        cursor: cs.cursor,
        backgroundSize: cs.backgroundSize,
        fontWeight: cs.fontWeight,
      });
    }
    return out;
  }, count);
}

test.describe('link visual matrix: axis comparisons', () => {
  test('the four documented variants do not collapse into one appearance', async () => {
    const row = VARIANTS.map(variant => ({ variant }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    expect(count).toBe(VARIANTS.length);
    const links = await rowLinks(count);
    // `default` and `primary` deliberately share the primary colour and differ
    // by weight, so the identity a customer distinguishes them by is the
    // (colour, weight) PAIR — which is what has to stay unique.
    const seen = new Map<string, Variant>();
    for (const [i, variant] of VARIANTS.entries()) {
      const key = `${links[i].color}|${links[i].fontWeight}`;
      const clash = seen.get(key);
      expect(clash, `variant "${variant}" paints exactly like "${clash}" (${key})`)
        .toBeUndefined();
      seen.set(key, variant);
    }
  });

  test('disabled and rejected each really look different from a live link', async () => {
    const row = [
      { variant: 'primary' },
      { variant: 'primary', disabled: true },
      { variant: 'primary', rejected: true },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const links = await rowLinks(count);
    expect(links[1].color,
      `a disabled link paints the live colour (${links[1].color})`).not.toBe(links[0].color);
    expect(links[2].color,
      `a link whose href the URL policy rejected paints the live colour (${links[2].color})`)
      .not.toBe(links[0].color);
    expect(links[0].cursor, 'a live link is not pointer-cursored').toBe('pointer');
    expect(links[1].cursor, 'a disabled link invites a click').not.toBe('pointer');
    expect(links[2].cursor, 'a rejected link invites a click').not.toBe('pointer');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('link visual matrix: marquee pixels', () => {
  const underlineProbe = `() => {
    const host = document.getElementById('subject');
    const anchor = host.shadowRoot.querySelector('[part~="link"]');
    const b = anchor.getBoundingClientRect();
    const points = [];
    // Probes along the bottom EDGE of the link box, where a 1px rule is drawn.
    // Two rows, because a 1px line plus device-pixel rounding can land on
    // either side of a single sampled row.
    for (const dy of [0.5, 1.5]) {
      for (let i = 1; i <= 8; i++) {
        points.push({ x: b.x + (b.width * i) / 9, y: b.bottom - dy });
      }
    }
    points.push({ x: b.x + b.width / 2, y: b.bottom + 40 });
    return points;
  }`;

  test('underline really draws a rule, and a plain link really draws none', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'primary' }));
    const plain = await capture(page, '#stage', 'link-plain', underlineProbe);
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'primary', underline: true }));
    const ruled = await capture(page, '#stage', 'link-underline', underlineProbe);

    const surface = plain[plain.length - 1];
    const plainRow = plain.slice(0, -1);
    const ruledRow = ruled.slice(0, -1);

    expect(ruledRow.some(p => !sameColor(p, surface)),
      `every probe along an underlined link's baseline painted the surface colour`
      + ` ${surface.join(',')} — no rule was drawn`).toBe(true);
    expect(ruledRow.map(p => p.join(',')).join(' '),
      'an underlined link and a plain one paint the same baseline').not.toBe(
      plainRow.map(p => p.join(',')).join(' '));
  });

  test('link text is readable on the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'primary' }));
    const pixels = await capture(
      page, '#stage', 'link-text',
      `() => {
        const host = document.getElementById('subject');
        const anchor = host.shadowRoot.querySelector('[part~="link"]');
        const b = anchor.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 14; i++) {
          points.push({ x: b.x + (b.width * i) / 15, y: b.y + b.height * 0.45 });
        }
        points.push({ x: b.x + b.width / 2, y: b.bottom + 40 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    const boldest = [...glyphs].sort((a, b) =>
      contrast(b, surface) - contrast(a, surface))[0];
    expect(sameColor(boldest, surface),
      'the link text area painted only the surface colour — no glyphs').toBe(false);
    // The painted-pixel figure is a FLOOR: 18px anti-aliased glyphs blend
    // toward the surface, so even a compliant pair reads a few tenths low here.
    const ratio = contrast(boldest, surface);
    expect(ratio, `link text pixel contrast against the surface is ${ratio.toFixed(2)}:1`)
      .toBeGreaterThan(3);

    // The AA judgement belongs on the token pair the component actually chose,
    // which is exact and does not depend on where the probe landed inside a
    // glyph. Body-sized link text is normal text: the bar is 4.5:1.
    const tokens = await page.evaluate(() => {
      const anchor = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="link"]') as HTMLElement;
      const parse = (value: string) =>
        value.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number];
      return {
        text: parse(getComputedStyle(anchor).color),
        surface: parse(getComputedStyle(document.body).backgroundColor),
      };
    });
    const tokenRatio = contrast(tokens.text, tokens.surface);
    expect(tokenRatio,
      `the link's token pair (${tokens.text.join(',')} on ${tokens.surface.join(',')})`
      + ` measures ${tokenRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  test('the external mark is actually painted', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', external: true,
    }));
    const pixels = await capture(
      page, '#subject', 'link-external-icon',
      `(host) => {
        const icon = host.shadowRoot.querySelector('[part~="external-icon"]');
        const b = icon.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 4; i++) {
          for (let j = 1; j <= 4; j++) {
            points.push({ x: b.x + (b.width * i) / 5, y: b.y + (b.height * j) / 5 });
          }
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `the external icon's box painted one flat colour (${[...distinct]}) — no arrow is drawn`)
      .toBeGreaterThan(1);
  });
});
