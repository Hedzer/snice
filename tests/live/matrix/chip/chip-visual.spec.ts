/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-chip TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/chip, `npm run test:matrix`) owns structure and
 * behaviour truth: which parts exist, what `chip-click`/`chip-remove` carry,
 * how `selectable` and `removable` respond to pointer and keyboard, and the
 * five divergences already recorded there (MATRIX-chip-1 … MATRIX-chip-5). It
 * cannot own VISUAL truth, because happy-dom performs no layout — every box
 * reads 0, nothing is painted, and nothing can occlude anything.
 *
 * For a chip that gap covers most of the component. `shape` is nothing but a
 * border-radius; `size` and `variant` are nothing but CSS; and the remove
 * affordance is *deliberately invisible at rest* — the stylesheet reveals it on
 * hover and focus, which is a claim no DOM test can even express.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `part="base"` has a real box, tall enough to hit;
 *   · the three documented shapes really produce three different corners:
 *     `pill` a capsule, `square` no rounding at all, `rounded` in between;
 *   · the label is opaque, readable-sized and inside the chip;
 *   · an icon or avatar sits BEFORE the label and never on top of it, and an
 *     avatar is really round;
 *   · nothing paints over the label (elementFromPoint).
 *
 * ── The remove affordance ──────────────────────────────────────────────────
 *   Hovering a removable chip must actually reveal a remove button with a real,
 *   hittable box that does not cover the label. This is the one test in the
 *   whole chip suite that cannot exist anywhere else.
 *
 * ── Axis comparisons ───────────────────────────────────────────────────────
 *   Six variants must not collapse into one fill; three sizes must really grow;
 *   selected and disabled must each differ from a plain chip.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A chip whose fill matches the page is not a chip, and a label that fails
 *   contrast on its own fill is unreadable however correct the DOM is.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/chip/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type Size = 'small' | 'medium' | 'large';
type Shape = 'pill' | 'rounded' | 'square';
type State = 'plain' | 'selected' | 'removable' | 'disabled';
type Affordance = 'none' | 'icon' | 'avatar';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  shape: Shape;
  state: State;
  affordance: Affordance;
}

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const SHAPES: Shape[] = ['pill', 'rounded', 'square'];
const STATES: State[] = ['plain', 'selected', 'removable', 'disabled'];
const AFFORDANCES: Affordance[] = ['none', 'icon', 'avatar'];

/**
 * The cross: 6 variants x 3 sizes x 3 shapes = 54 combos, with the four states
 * and the three affordances rotated across it.
 *
 * Sized to the component: a chip is one box with an optional leading mark, a
 * label and an optional remove button. The product worth paying for is
 * (which colour) x (how big) x (what corners), and the rest rides along.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const shape of SHAPES) {
        const state = STATES[n % STATES.length];
        const affordance = AFFORDANCES[n % AFFORDANCES.length];
        combos.push({
          id: `${variant}/${size}/${shape}/${state}`
            + `${affordance === 'none' ? '' : `/${affordance}`}`,
          variant, size, shape, state, affordance,
        });
        n++;
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo): Record<string, unknown> {
  return {
    variant: combo.variant,
    size: combo.size,
    shape: combo.shape,
    state: combo.state === 'plain' ? undefined : combo.state,
    affordance: combo.affordance === 'none' ? undefined : combo.affordance,
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  // The remove affordance is revealed on :hover, so every rest-state
  // measurement would become a hover measurement with the pointer on the stage.
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

    const base = part('base');
    if (!base) { say('no part="base" rendered'); return problems; }
    const box = rect(base);
    if (box.width <= 0 || box.height <= 0) {
      say(`the chip renders at ${box.width}x${box.height}`);
      return problems;
    }
    const cs = getComputedStyle(base);
    if (cs.visibility !== 'visible') say(`chip visibility "${cs.visibility}"`);
    if (Number(cs.opacity) <= 0.05) say(`chip opacity "${cs.opacity}"`);
    if (box.height < 16) say(`the chip is only ${box.height.toFixed(1)}px tall`);

    // ── shape: three documented corners ──────────────────────────────────────
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    if (combo.shape === 'pill' && radius < box.height / 2 - 1) {
      say(`shape="pill" gave border-radius ${cs.borderTopLeftRadius} on a`
        + ` ${box.height.toFixed(1)}px chip — not a capsule`);
    }
    if (combo.shape === 'square' && radius > 0.5) {
      say(`shape="square" gave border-radius ${cs.borderTopLeftRadius}`);
    }
    if (combo.shape === 'rounded') {
      if (radius <= 0.5) say('shape="rounded" gave square corners');
      if (radius >= box.height / 2 - 1) {
        say(`shape="rounded" gave a capsule (${cs.borderTopLeftRadius} on`
          + ` ${box.height.toFixed(1)}px) — it is indistinguishable from "pill"`);
      }
    }

    // ── The label ────────────────────────────────────────────────────────────
    const label = sr.querySelector('.chip-label') as HTMLElement | null;
    if (!label) {
      say('the chip rendered no label element');
    } else {
      const lb = rect(label);
      if (lb.width <= 0 || lb.height <= 0) {
        say(`the label renders at ${lb.width}x${lb.height}`);
      } else {
        const lcs = getComputedStyle(label);
        if (parseFloat(lcs.fontSize) < 9) say(`label font-size ${lcs.fontSize}`);
        if (lcs.visibility !== 'visible') say(`label visibility "${lcs.visibility}"`);
        if (lb.left < box.left - EPS || lb.right > box.right + EPS
          || lb.top < box.top - EPS || lb.bottom > box.bottom + EPS) {
          say('the label escapes the chip');
        }
      }
    }

    // ── The leading mark ─────────────────────────────────────────────────────
    const labelBox = label ? rect(label) : null;
    if (combo.affordance === 'icon') {
      const icon = part('icon');
      if (!icon) {
        say('an icon chip rendered no part="icon"');
      } else {
        const ib = rect(icon);
        if (ib.width <= 0 || ib.height <= 0) {
          say(`the icon renders at ${ib.width}x${ib.height}`);
        } else {
          if (labelBox && ib.left > labelBox.left + EPS) {
            say(`the icon (left ${ib.left.toFixed(1)}) is not before the label`
              + ` (left ${labelBox.left.toFixed(1)})`);
          }
          if (labelBox) {
            const overlap = Math.min(ib.right, labelBox.right) - Math.max(ib.left, labelBox.left);
            if (overlap > EPS) say(`the icon overlaps the label by ${overlap.toFixed(1)}px`);
          }
          if (ib.left < box.left - EPS) say('the icon escapes the chip');
        }
      }
    }
    if (combo.affordance === 'avatar') {
      const avatar = sr.querySelector('.chip-avatar') as HTMLElement | null;
      if (!avatar) {
        say('an avatar chip rendered no avatar image');
      } else {
        const ab = rect(avatar);
        if (ab.width <= 0 || ab.height <= 0) {
          say(`the avatar renders at ${ab.width}x${ab.height}`);
        } else {
          if (Math.abs(ab.width - ab.height) > 1) {
            say(`the avatar is ${ab.width.toFixed(1)}x${ab.height.toFixed(1)} — not square`);
          }
          const acs = getComputedStyle(avatar);
          if (parseFloat(acs.borderTopLeftRadius) < ab.height / 2 - 1
            && !acs.borderTopLeftRadius.includes('%')) {
            say(`the avatar's border-radius is ${acs.borderTopLeftRadius} — not round`);
          }
          if (labelBox && ab.right > labelBox.left + EPS) {
            say('the avatar runs into the label');
          }
          if (ab.top < box.top - EPS || ab.bottom > box.bottom + EPS) {
            say('the avatar escapes the chip vertically');
          }
        }
      }
    }

    // ── disabled ─────────────────────────────────────────────────────────────
    if (combo.state === 'disabled' && base.getAttribute('aria-disabled') !== 'true') {
      say(`a disabled chip reports aria-disabled="${base.getAttribute('aria-disabled')}"`);
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    if (labelBox && labelBox.width > 4) {
      for (const fraction of [0.3, 0.6]) {
        const x = labelBox.left + labelBox.width * fraction;
        const y = labelBox.top + labelBox.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`label @${Math.round(fraction * 100)}%: page hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the chip`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (!hit) { say(`label @${Math.round(fraction * 100)}%: shadow hit-test found nothing`); continue; }
        if (hit !== label && hit !== host && !label!.contains(hit) && hit !== base) {
          say(`label @${Math.round(fraction * 100)}% is occluded by <${hit.tagName.toLowerCase()}`
            + `${hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('chip visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      expect(mounted.label, 'the fixture mounted no label').toBeTruthy();
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('chip visual matrix: the remove affordance', () => {
  /**
   * The remove button is deliberately collapsed at rest (`opacity: 0;
   * max-width: 0`) and slides in on hover or focus. Documented API: `removable`
   * plus a `chip-remove` event and an aria-labelled remove button. A DOM test
   * can see the button exists; only a browser can see whether a customer can
   * ever reach it.
   */
  test('hovering a removable chip reveals a hittable remove button', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', shape: 'pill', state: 'removable',
    }));

    const atRest = await page.evaluate(() => {
      const button = document.getElementById('subject')!.shadowRoot!
        .querySelector('.chip-remove') as HTMLElement | null;
      if (!button) return null;
      const b = button.getBoundingClientRect();
      return { width: b.width, opacity: Number(getComputedStyle(button).opacity) };
    });
    expect(atRest, 'a removable chip rendered no remove button at all').not.toBeNull();

    await page.hover('#subject');
    // The reveal is a 180ms transition; wait for the end state, not a timer.
    await page.waitForFunction(() => {
      const button = document.getElementById('subject')!.shadowRoot!
        .querySelector('.chip-remove') as HTMLElement | null;
      return !!button && button.getBoundingClientRect().width > 4
        && Number(getComputedStyle(button).opacity) > 0.3;
    }, undefined, { timeout: 5000 });

    const revealed = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const button = sr.querySelector('.chip-remove') as HTMLElement;
      const label = sr.querySelector('.chip-label') as HTMLElement;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const b = button.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      const c = base.getBoundingClientRect();
      const hit = (sr as any).elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) as Element | null;
      return {
        width: b.width,
        height: b.height,
        opacity: Number(getComputedStyle(button).opacity),
        afterLabel: b.left >= l.right - 1.5,
        insideChip: b.left >= c.left - 1.5 && b.right <= c.right + 1.5,
        overlapsLabel: Math.min(b.right, l.right) - Math.max(b.left, l.left) > 1.5,
        reachable: !!hit && (hit === button || button.contains(hit)),
        ariaLabel: button.getAttribute('aria-label'),
        cursor: getComputedStyle(button).cursor,
      };
    });

    expect(revealed.width, 'the remove button stayed collapsed on hover').toBeGreaterThan(8);
    expect(revealed.height, 'the remove button has no height').toBeGreaterThan(8);
    expect(revealed.opacity, 'the remove button stayed transparent on hover')
      .toBeGreaterThan(0.3);
    expect(revealed.afterLabel, 'the remove button sits before the label it removes').toBe(true);
    expect(revealed.overlapsLabel, 'the remove button covers the chip label').toBe(false);
    expect(revealed.insideChip, 'the remove button hangs outside the chip').toBe(true);
    expect(revealed.reachable, 'the remove button is not the element under its own centre')
      .toBe(true);
    expect(revealed.ariaLabel, 'the remove button carries no accessible name').toBeTruthy();
    expect(revealed.cursor, 'the remove button does not present itself as clickable')
      .toBe('pointer');

    await page.mouse.move(1270, 890);
  });
});

async function rowChips(count: number): Promise<Array<{
  background: string; color: string; borderColor: string; height: number; width: number;
  fontSize: number;
}>> {
  return page.evaluate((count) => {
    const out = [];
    const chips = [...document.querySelectorAll('snice-chip')] as HTMLElement[];
    for (let i = 0; i < count; i++) {
      const base = chips[i].shadowRoot!.querySelector('[part~="base"]') as HTMLElement;
      const cs = getComputedStyle(base);
      const box = base.getBoundingClientRect();
      out.push({
        background: cs.backgroundColor,
        color: cs.color,
        borderColor: cs.borderTopColor,
        height: box.height,
        width: box.width,
        fontSize: parseFloat(cs.fontSize),
      });
    }
    return out;
  }, count);
}

test.describe('chip visual matrix: axis comparisons', () => {
  /**
   * FINDING VISUAL-MATRIX-chip-1.
   *
   * `variant="info"` is pixel-identical to `variant="primary"`. The stylesheet
   * paints `:host([variant="info"]) .chip` with `--snice-color-primary-subtle`
   * and `--snice-color-primary-hover` — the very tokens `primary` uses — and
   * gives the two the same selected fill as well, even though the theme defines
   * its own info tokens. The docs list six variants as six choices; a customer
   * who asks for `info` silently gets `primary`.
   *
   * The assertion is NOT weakened — every other pair must still differ. The one
   * collision is named, and the naming is itself asserted: fix the stylesheet
   * and this waiver fails until it is deleted.
   */
  const KNOWN_COLLISION: [Variant, Variant] = ['primary', 'info'];

  test('the six documented variants do not collapse into one appearance', async () => {
    const row = VARIANTS.map(variant => ({ variant, size: 'medium', shape: 'pill' }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    expect(count).toBe(VARIANTS.length);
    const chips = await rowChips(count);
    const key = (i: number) =>
      `${chips[i].background}|${chips[i].color}|${chips[i].borderColor}`;

    const seen = new Map<string, Variant>();
    for (const [i, variant] of VARIANTS.entries()) {
      if (variant === KNOWN_COLLISION[1]) continue;
      const clash = seen.get(key(i));
      expect(clash, `variant "${variant}" paints exactly like "${clash}" (${key(i)})`)
        .toBeUndefined();
      seen.set(key(i), variant);
    }

    const a = VARIANTS.indexOf(KNOWN_COLLISION[0]);
    const b = VARIANTS.indexOf(KNOWN_COLLISION[1]);
    expect(key(a),
      `VISUAL-MATRIX-chip-1 no longer reproduces: "${KNOWN_COLLISION[1]}" now paints`
      + ` ${key(b)} against "${KNOWN_COLLISION[0]}"'s ${key(a)} — delete the waiver`)
      .toBe(key(b));
  });

  test('the three documented sizes really grow', async () => {
    const row = SIZES.map(size => ({ variant: 'primary', size, shape: 'pill' }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const chips = await rowChips(count);
    for (let i = 1; i < chips.length; i++) {
      expect(chips[i].height,
        `size "${SIZES[i]}" (${chips[i].height.toFixed(1)}px) is not taller than`
        + ` "${SIZES[i - 1]}" (${chips[i - 1].height.toFixed(1)}px)`)
        .toBeGreaterThan(chips[i - 1].height);
      expect(chips[i].width,
        `size "${SIZES[i]}" is not wider than "${SIZES[i - 1]}" for the same label`)
        .toBeGreaterThan(chips[i - 1].width);
    }
  });

  test('a selected chip really looks selected', async () => {
    const row = [
      { variant: 'primary', size: 'medium', shape: 'pill' },
      { variant: 'primary', size: 'medium', shape: 'pill', state: 'selected' },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const chips = await rowChips(count);
    expect(`${chips[1].background}|${chips[1].color}|${chips[1].borderColor}`,
      'a selected chip paints exactly like an unselected one')
      .not.toBe(`${chips[0].background}|${chips[0].color}|${chips[0].borderColor}`);
  });

  test('the three documented shapes really produce three different corners', async () => {
    const radii: number[] = [];
    for (const shape of SHAPES) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant: 'primary', size: 'large', shape } as any);
      radii.push(await page.evaluate(() => {
        const base = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="base"]') as HTMLElement;
        return parseFloat(getComputedStyle(base).borderTopLeftRadius) || 0;
      }));
    }
    const [pill, rounded, square] = radii;
    expect(new Set(radii).size,
      `the three shapes produced radii ${radii.join(', ')}`).toBe(3);
    expect(pill, 'pill is not the roundest shape').toBeGreaterThan(rounded);
    expect(rounded, 'rounded is not rounder than square').toBeGreaterThan(square);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('chip visual matrix: marquee pixels', () => {
  test('a chip paints a fill that stands off the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', shape: 'pill', state: 'selected',
    }));
    const [fill, surface] = await capture(
      page, '#stage', 'chip-fill',
      `() => {
        const base = document.getElementById('subject').shadowRoot
          .querySelector('[part~="base"]');
        const b = base.getBoundingClientRect();
        return [
          { x: b.x + 6, y: b.y + b.height / 2 },
          { x: b.right + 20, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(fill, surface),
      `the chip painted ${fill.join(',')}, identical to the page surface`).toBe(false);
    expect(contrast(fill, surface),
      `chip/surface contrast is ${contrast(fill, surface).toFixed(2)}:1`).toBeGreaterThan(1.2);
  });

  test('a chip label is readable on its own fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', shape: 'pill', state: 'selected',
    }));
    const pixels = await capture(
      page, '#subject', 'chip-label',
      `(host) => {
        const label = host.shadowRoot.querySelector('.chip-label');
        const b = label.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: b.x + (b.width * i) / 13, y: b.y + b.height * 0.55 });
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the label area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
    const sorted = [...pixels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const worst = contrast(sorted[0], sorted[sorted.length - 1]);
    expect(worst, `label/fill contrast is ${worst.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('an avatar chip really paints its avatar', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'large', shape: 'pill', affordance: 'avatar',
    }));
    const [avatar, chip] = await capture(
      page, '#subject', 'chip-avatar',
      `(host) => {
        const sr = host.shadowRoot;
        const img = sr.querySelector('.chip-avatar');
        const base = sr.querySelector('[part~="base"]');
        const a = img.getBoundingClientRect();
        const b = base.getBoundingClientRect();
        return [
          { x: a.x + a.width / 2, y: a.y + a.height / 2 },
          { x: b.right - 2, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(avatar, chip),
      `the avatar painted ${avatar.join(',')}, the chip's own fill — the image never loaded`)
      .toBe(false);
  });
});
