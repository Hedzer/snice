/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-button TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/button, `npm run test:matrix`) owns structure and
 * behaviour truth: which parts exist, what the label reads, which activation
 * dispatches `button-click`, which `href` the URL policy rejects. It cannot own
 * VISUAL truth, because happy-dom performs no layout — every box reads 0,
 * nothing is painted, and nothing can occlude anything.
 *
 * Almost every remaining documented dimension of a button is a CSS rule:
 * `variant`, `size`, `outline`, `pill`, `circle`, `icon-placement` and
 * `justify-text` produce little or no structural difference, and a browser is
 * the only place they can be verified at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host and `part="base"` have real boxes, and the base stays inside the
 *     host;
 *   · the label is opaque, large enough to read, and inside the base — except
 *     under `loading`, where the documented spinner takes over;
 *   · `icon-placement` really orders the icon before/after the label, and the
 *     two never overlap;
 *   · `pill` really rounds to a capsule and its absence really does not;
 *   · `circle` really renders a circle — equal width and height — and drops the
 *     label;
 *   · `justify-text` really moves the label inside a button wider than it;
 *   · `loading` really paints `part="spinner"` with a real box, and its absence
 *     really paints none;
 *   · nothing paints over the label (elementFromPoint, page level and shadow
 *     level).
 *
 * ── Axis comparisons (one mount each): the enum dimensions ─────────────────
 *   Six variants must not collapse into one fill; three sizes must really grow;
 *   `outline` must really differ from its filled twin; `disabled` must really
 *   look different from its enabled twin. Each mounts a whole ROW so every
 *   value is measured under one identical layout.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A fill that "has a background-color" can still be invisible, and a label
 *   that "has a colour" can still be unreadable on it. The marquee captures
 *   decode the PNG inside the browser under test and assert WCAG contrast on
 *   the pixels that were actually painted.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/button/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'text';
type Size = 'small' | 'medium' | 'large';
type Shape = 'plain' | 'pill' | 'circle';
type State = 'normal' | 'disabled' | 'loading';
type Justify = 'start' | 'center' | 'end';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  outline: boolean;
  pill: boolean;
  circle: boolean;
  icon: boolean;
  iconPlacement: 'start' | 'end';
  justifyText?: Justify;
  disabled: boolean;
  loading: boolean;
}

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'danger', 'text'];
const SIZES: Size[] = ['small', 'medium', 'large'];

/**
 * The cross: 6 variants x 3 sizes x {filled, outline} = 36 combos, with shape,
 * icon, icon placement, justification and state rotated across it so every
 * documented switch is exercised many times without multiplying the product.
 *
 * Sized to a component whose render function is one element plus three optional
 * children — the table's 1152 would be pure repetition here. What matters is
 * that all eleven presentational dimensions get a real browser.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const outline of [false, true]) {
        const shape: Shape = (['plain', 'pill', 'circle'] as Shape[])[n % 3];
        const state: State = (['normal', 'normal', 'disabled', 'loading'] as State[])[n % 4];
        const circle = shape === 'circle';
        // `justify-text` needs a label and a button wider than it, so it never
        // pairs with the label-less circle.
        const justifyText = (!circle && n % 5 === 0)
          ? (['start', 'center', 'end'] as Justify[])[(n / 5 | 0) % 3]
          : undefined;
        const icon = n % 2 === 0;
        const iconPlacement = n % 4 < 2 ? 'start' : 'end';
        combos.push({
          id: `${variant}/${size}/${outline ? 'outline' : 'filled'}/${shape}`
            + `/[${icon ? `icon:${iconPlacement}` : 'no-icon'}`
            + `${justifyText ? `,justify:${justifyText}` : ''}`
            + `${state === 'normal' ? '' : `,${state}`}]`,
          variant, size, outline,
          pill: shape === 'pill',
          circle,
          icon, iconPlacement, justifyText,
          disabled: state === 'disabled',
          loading: state === 'loading',
        });
        n++;
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

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const part = (name: string) =>
      sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display === 'none') say('host computed display is none');
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const base = part('base');
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`base renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    const baseCs = getComputedStyle(base);
    if (baseCs.visibility !== 'visible') say(`base visibility "${baseCs.visibility}"`);

    // The base is the button; it may never escape the element that owns it.
    if (baseBox.left < hostBox.left - EPS || baseBox.right > hostBox.right + EPS
      || baseBox.top < hostBox.top - EPS || baseBox.bottom > hostBox.bottom + EPS) {
      say('base escapes the host box');
    }

    // A button has to be big enough to hit. 24px is the low bar for the
    // smallest documented size, not a design target.
    if (baseBox.height < 24) say(`base is only ${baseBox.height.toFixed(1)}px tall`);

    // ── circle: the documented icon-only shape ───────────────────────────────
    const radius = parseFloat(baseCs.borderTopLeftRadius) || 0;
    if (combo.circle) {
      if (Math.abs(baseBox.width - baseBox.height) > 2) {
        say(`circle button is ${baseBox.width.toFixed(1)}x${baseBox.height.toFixed(1)}`);
      }
      if (radius < baseBox.height / 2 - 1) {
        say(`circle button border-radius ${baseCs.borderTopLeftRadius} on a`
          + ` ${baseBox.height.toFixed(1)}px box`);
      }
    } else if (combo.pill) {
      // ── pill: a capsule, i.e. radius at least half the height ─────────────
      if (radius < baseBox.height / 2 - 1) {
        say(`pill button border-radius ${baseCs.borderTopLeftRadius} on a`
          + ` ${baseBox.height.toFixed(1)}px box — not a capsule`);
      }
    } else if (radius >= baseBox.height / 2 - 1) {
      say(`plain button is already a capsule (radius ${baseCs.borderTopLeftRadius}`
        + ` on ${baseBox.height.toFixed(1)}px) — pill would mean nothing`);
    }

    // ── loading: the documented spinner ──────────────────────────────────────
    const spinner = part('spinner');
    if (combo.loading) {
      if (!spinner) {
        say('loading button rendered no part="spinner"');
      } else {
        const sb = rect(spinner);
        if (sb.width <= 0 || sb.height <= 0) say(`loading spinner renders at ${sb.width}x${sb.height}`);
        const scs = getComputedStyle(spinner);
        if (scs.display === 'none') say('loading spinner computed display is none');
        if (scs.visibility !== 'visible') say(`loading spinner visibility "${scs.visibility}"`);
        if (sb.left < baseBox.left - EPS || sb.right > baseBox.right + EPS) {
          say('loading spinner escapes the base horizontally');
        }
      }
    } else if (spinner && rect(spinner).height > 0 && getComputedStyle(spinner).display !== 'none') {
      say('a button that is not loading still paints a spinner');
    }

    // ── The label ────────────────────────────────────────────────────────────
    const label = part('label');
    const labelBox = label ? rect(label) : null;
    if (!combo.circle) {
      if (!label) {
        say('no part="label" rendered');
      } else if (!labelBox || labelBox.width <= 0 || labelBox.height <= 0) {
        say(`label renders at ${labelBox?.width}x${labelBox?.height}`);
      } else {
        const lcs = getComputedStyle(label);
        if (parseFloat(lcs.fontSize) < 9) say(`label font-size ${lcs.fontSize}`);
        const alpha = lcs.color.startsWith('rgba')
          ? Number(lcs.color.split(',')[3]?.replace(')', '') ?? '1') : 1;
        if (alpha <= 0.05) say(`label text is transparent (${lcs.color})`);
        // A LOADING button deliberately hides its label behind the spinner;
        // every other button must show it.
        if (!combo.loading && lcs.visibility !== 'visible') {
          say(`label visibility "${lcs.visibility}" on a button that is not loading`);
        }
        if (labelBox.left < baseBox.left - EPS || labelBox.right > baseBox.right + EPS) {
          say(`label (${labelBox.left.toFixed(1)}..${labelBox.right.toFixed(1)}) escapes the`
            + ` base (${baseBox.left.toFixed(1)}..${baseBox.right.toFixed(1)})`);
        }
      }
    }

    // ── icon + icon-placement ────────────────────────────────────────────────
    const icon = part('icon');
    if (combo.icon) {
      if (!icon) {
        say('icon button rendered no part="icon"');
      } else {
        const ib = rect(icon);
        if (ib.width <= 0 || ib.height <= 0) say(`icon renders at ${ib.width}x${ib.height}`);
        if (ib.left < baseBox.left - EPS || ib.right > baseBox.right + EPS) {
          say('icon escapes the base horizontally');
        }
        if (labelBox && labelBox.width > 0) {
          if (combo.iconPlacement === 'start' && ib.left > labelBox.left + EPS) {
            say(`icon-placement="start" put the icon at x=${ib.left.toFixed(1)},`
              + ` right of the label at x=${labelBox.left.toFixed(1)}`);
          }
          if (combo.iconPlacement === 'end' && ib.right < labelBox.right - EPS) {
            say(`icon-placement="end" put the icon at x=${ib.right.toFixed(1)},`
              + ` left of the label ending at x=${labelBox.right.toFixed(1)}`);
          }
          // Overlap is an icon painting through the label — invisible to DOM.
          const overlap = Math.min(ib.right, labelBox.right) - Math.max(ib.left, labelBox.left);
          if (overlap > EPS) say(`icon and label overlap by ${overlap.toFixed(1)}px`);
        }
      }
    } else if (icon && rect(icon).width > 0) {
      say('a button with no icon still paints an icon box');
    }

    // ── justify-text ─────────────────────────────────────────────────────────
    // The fixture makes the host 260px wide, so the label has real room to move.
    if (combo.justifyText && labelBox && labelBox.width > 0) {
      const inner = {
        left: baseBox.left + parseFloat(baseCs.paddingLeft) + parseFloat(baseCs.borderLeftWidth),
        right: baseBox.right - parseFloat(baseCs.paddingRight) - parseFloat(baseCs.borderRightWidth),
      };
      const room = inner.right - inner.left;
      // With an icon the leading box is the icon, not the label.
      const contentLeft = combo.icon && icon && combo.iconPlacement === 'start'
        ? rect(icon).left : labelBox.left;
      const contentRight = combo.icon && icon && combo.iconPlacement === 'end'
        ? rect(icon).right : labelBox.right;
      const slack = room - (contentRight - contentLeft);
      if (slack < 8) {
        say(`justify-text="${combo.justifyText}" had only ${slack.toFixed(1)}px of slack —`
          + ' the fixture is too narrow to prove anything');
      } else {
        const leading = contentLeft - inner.left;
        const trailing = inner.right - contentRight;
        const tol = Math.max(2, slack * 0.12);
        if (combo.justifyText === 'start' && leading > tol) {
          say(`justify-text="start" left ${leading.toFixed(1)}px before the content`);
        }
        if (combo.justifyText === 'end' && trailing > tol) {
          say(`justify-text="end" left ${trailing.toFixed(1)}px after the content`);
        }
        if (combo.justifyText === 'center' && Math.abs(leading - trailing) > tol) {
          say(`justify-text="center" split the slack ${leading.toFixed(1)}/${trailing.toFixed(1)}`);
        }
      }
    }

    // ── Occlusion: nothing may paint over the button's own content ───────────
    const probeBox = (!combo.circle && labelBox && labelBox.width > 2 && !combo.loading)
      ? labelBox : baseBox;
    const y = probeBox.top + probeBox.height / 2;
    for (const fraction of [0.25, 0.5, 0.75]) {
      const x = probeBox.left + probeBox.width * fraction;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`@${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the button`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (!hit) { say(`@${Math.round(fraction * 100)}%: shadow hit-test found nothing`); continue; }
      // The label is SLOTTED light DOM, so a hit inside it resolves to the host
      // itself; that is the button's own content, not an occluder. Anything
      // else must be the base or something the base contains.
      if (hit !== base && hit !== host && !base.contains(hit)) {
        say(`@${Math.round(fraction * 100)}% is occluded by <${hit.tagName.toLowerCase()}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('button visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * Read one computed fact per element of a mounted row. Returned as plain data
 * so the expectation lives in the test, where a failure message can name it.
 */
async function rowStyles(count: number): Promise<Array<{
  background: string; color: string; borderWidth: string; borderColor: string;
  opacity: string; height: number; width: number;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const base = host?.shadowRoot?.querySelector('[part~="base"]') as HTMLElement;
      const cs = getComputedStyle(base);
      const box = base.getBoundingClientRect();
      out.push({
        background: cs.backgroundColor,
        color: cs.color,
        borderWidth: cs.borderTopWidth,
        borderColor: cs.borderTopColor,
        // Disabled styling lives on the base; the host contributes its own.
        opacity: String(Number(cs.opacity) * Number(getComputedStyle(host).opacity)),
        height: box.height,
        width: box.width,
      });
    }
    return out;
  }, count);
}

test.describe('button visual matrix: axis comparisons', () => {
  test('the six documented variants do not collapse into one appearance', async () => {
    const row = VARIANTS.map(variant => ({ variant, size: 'medium' }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    expect(count).toBe(VARIANTS.length);
    const styles = await rowStyles(count);
    // Two variants may legitimately share a text colour or a fill, but the
    // (fill, text) PAIR is what the customer distinguishes them by.
    const seen = new Map<string, Variant>();
    for (const [i, s] of styles.entries()) {
      const key = `${s.background}|${s.color}`;
      const clash = seen.get(key);
      expect(clash, `variant "${VARIANTS[i]}" paints exactly like "${clash}" (${key})`)
        .toBeUndefined();
      seen.set(key, VARIANTS[i]);
    }
  });

  test('the three documented sizes really grow', async () => {
    const row = SIZES.map(size => ({ variant: 'primary', size }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowStyles(count);
    for (let i = 1; i < styles.length; i++) {
      expect(styles[i].height,
        `size "${SIZES[i]}" (${styles[i].height.toFixed(1)}px) is not taller than`
        + ` "${SIZES[i - 1]}" (${styles[i - 1].height.toFixed(1)}px)`)
        .toBeGreaterThan(styles[i - 1].height);
      expect(styles[i].width,
        `size "${SIZES[i]}" is not wider than "${SIZES[i - 1]}" for the same label`)
        .toBeGreaterThan(styles[i - 1].width);
    }
  });

  /**
   * FINDING VISUAL-MATRIX-button-1.
   *
   * `outline` is documented as a style modifier of the button, with no variant
   * carve-out (docs/ai/components/button.md, "Styles"). On `variant="text"` it
   * is a complete no-op: the stylesheet has no `.button--outline.button--text`
   * rule, and `.button--text` sets `border-color: transparent`, so the outlined
   * text button paints the same transparent fill, the same text colour and the
   * same invisible border as the plain one. A customer who writes
   * `<snice-button variant="text" outline>` gets nothing.
   *
   * The assertion below is NOT weakened. `text` is excused by name, and the
   * excuse itself is checked: if the component is fixed so that outlined text
   * differs, the waiver assertion fails and must be deleted.
   */
  const OUTLINE_NOOP_VARIANTS: Variant[] = ['text'];

  test('outline really differs from the filled twin, and keeps a visible border', async () => {
    const row = VARIANTS.flatMap(variant => [
      { variant, size: 'medium' },
      { variant, size: 'medium', outline: true },
    ]);
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowStyles(count);

    for (const [i, variant] of VARIANTS.entries()) {
      const filled = styles[i * 2];
      const outlined = styles[i * 2 + 1];
      const identical = `${outlined.background}|${outlined.color}` === `${filled.background}|${filled.color}`;
      const borderVisible = parseFloat(outlined.borderWidth) > 0
        && !/rgba\([^)]*,\s*0\)$/.test(outlined.borderColor);

      if (OUTLINE_NOOP_VARIANTS.includes(variant)) {
        // The finding, asserted as a finding: it must still reproduce.
        expect(identical && !borderVisible,
          `VISUAL-MATRIX-button-1 no longer reproduces for "${variant}"`
          + ` (fill/colour ${outlined.background}|${outlined.color},`
          + ` border ${outlined.borderWidth} ${outlined.borderColor})`
          + ' — delete it from OUTLINE_NOOP_VARIANTS').toBe(true);
        continue;
      }

      expect(identical,
        `outline "${variant}" paints exactly like the filled one`
        + ` (${outlined.background}|${outlined.color})`).toBe(false);
      expect(borderVisible,
        `outline "${variant}" has no visible border`
        + ` (${outlined.borderWidth} ${outlined.borderColor})`).toBe(true);
    }
  });

  test('disabled really looks different from the enabled twin', async () => {
    const row = VARIANTS.flatMap(variant => [
      { variant, size: 'medium' },
      { variant, size: 'medium', disabled: true },
    ]);
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowStyles(count);
    for (const [i, variant] of VARIANTS.entries()) {
      const on = styles[i * 2];
      const off = styles[i * 2 + 1];
      const same = on.background === off.background && on.color === off.color
        && on.opacity === off.opacity;
      expect(same,
        `disabled "${variant}" is indistinguishable from enabled`
        + ` (${off.background}, ${off.color}, opacity ${off.opacity})`).toBe(false);
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the base has a background-color" and "the button is visible"
// are different claims, and only pixels can tell them apart.

test.describe('button visual matrix: marquee pixels', () => {
  test('a primary button paints a fill that stands off the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'primary', size: 'large' }));
    // Captured from the STAGE, not the button: a probe outside the captured
    // element's own box is clamped to its edge, so the page surface can only be
    // read from a capture that actually contains some of it.
    const [fill, surface] = await capture(
      page, '#stage', 'button-primary-fill',
      `() => {
        const button = document.getElementById('subject');
        const box = button.getBoundingClientRect();
        return [
          { x: box.x + 8, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.bottom + 40 },
        ];
      }`,
    );
    expect(sameColor(fill, surface),
      `primary fill painted ${fill.join(',')}, identical to the page surface`).toBe(false);
    expect(contrast(fill, surface),
      `primary fill contrast against the surface is ${contrast(fill, surface).toFixed(2)}:1`)
      .toBeGreaterThan(1.3);
  });

  test('a primary label is readable on its own fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', label: 'OK',
    }));
    // Sample across the glyphs and take the darkest/lightest pair actually
    // painted: anti-aliasing means a single probe can land between strokes.
    const pixels = await capture(
      page, '#subject', 'button-primary-label',
      `(host) => {
        const label = host.shadowRoot.querySelector('[part~="label"]');
        const box = label.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: box.x + (box.width * i) / 13, y: box.y + box.height / 2 });
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the label area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
    // Text on its own button must clear the WCAG large-text bar against the
    // fill it sits on. Judged between the extremes the capture actually found.
    const sorted = [...pixels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const worst = contrast(sorted[0] as RGB, sorted[sorted.length - 1] as RGB);
    expect(worst, `label/fill contrast is ${worst.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a loading button really paints its spinner', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', loading: true,
    }));
    const pixels = await capture(
      page, '#subject', 'button-loading-spinner',
      `(host) => {
        const spinner = host.shadowRoot.querySelector('[part~="spinner"]');
        const box = spinner.getBoundingClientRect();
        return [0.05, 0.5, 0.95].map(f => ({
          x: box.x + box.width * f,
          y: box.y + box.height / 2,
        }));
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `the spinner box painted one flat colour (${[...distinct]}) — nothing is drawn there`)
      .toBeGreaterThan(1);
  });
});
