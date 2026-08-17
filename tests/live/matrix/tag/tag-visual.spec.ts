/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-tag TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/tag, `npm run test:matrix`) owns structure
 * truth: the three documented parts, the slots inside them, the remove button
 * `removable` adds, and `tag-remove -> { tag }`. It cannot own visual truth,
 * because happy-dom performs no layout and paints nothing.
 *
 * snice-tag is a PURELY PRESENTATIONAL token, so per .ai/fuzzing.md its visual
 * matrix is deliberately MINIMAL — 60 layer-1 combos, not the table's hundreds.
 * It is also the tier that matters most for this component, because FOUR of its
 * five documented properties produce NO DOM difference whatsoever:
 *
 *   · `variant` — six words that are six CSS rules; a browser is the only place
 *     "success" and "danger" can be told apart;
 *   · `size` — three words that are three sets of custom-property values;
 *   · `outline` — swaps a fill for a border;
 *   · `pill` — "fully rounded corners", which is a number nothing else sees.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is the documented `inline-flex` and the tag a single centred row
 *     that never wraps;
 *   · each variant paints its OWN semantic theme token — a filled tag takes the
 *     variant's `-subtle` surface and `-hover` ink, an outlined one drops the
 *     fill for a 1px rule in the variant's base colour;
 *   · `pill` rounds the corners to at least half the tag's height, and a
 *     non-pill tag does not;
 *   · the icon, the label and the remove button lay out left to right without
 *     overlapping, all inside the tag's own box;
 *   · the label is never occluded (elementFromPoint through the shadow root).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A variant that "has a background-color" can still paint nothing, and ink
 *   that "has a color" can still be invisible on its own chip. The marquee
 *   captures decode the PNG inside the browser under test and judge the label
 *   against the fill it sits on, and two variants against each other.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/tag/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Size = 'small' | 'medium' | 'large';

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
const SIZES: Size[] = ['small', 'medium', 'large'];

/**
 * The documented semantic token each variant is made of.
 *
 * The docs name the variants but not the tokens; what they DO commit to is that
 * a variant is semantic ("success", "danger"), and the theme publishes exactly
 * one surface/ink pair per semantic. So the expectation is "this variant paints
 * ITS OWN semantic token", which is the claim a variant is for — and which a
 * copy-pasted rule pointing at the wrong semantic would break.
 */
const TOKENS: Record<Variant, { fill: string; ink: string; rule: string }> = {
  default: {
    fill: '--snice-color-surface-container',
    ink: '--snice-color-text',
    rule: '--snice-color-border',
  },
  primary: {
    fill: '--snice-color-primary-subtle',
    ink: '--snice-color-primary-hover',
    rule: '--snice-color-primary',
  },
  success: {
    fill: '--snice-color-success-subtle',
    ink: '--snice-color-success-hover',
    rule: '--snice-color-success',
  },
  warning: {
    fill: '--snice-color-warning-subtle',
    ink: '--snice-color-warning-hover',
    rule: '--snice-color-warning',
  },
  danger: {
    fill: '--snice-color-danger-subtle',
    ink: '--snice-color-danger-hover',
    rule: '--snice-color-danger',
  },
  // `info` is documented as its own variant; the theme has no separate `info`
  // semantic, so it shares the primary one.
  info: {
    fill: '--snice-color-primary-subtle',
    ink: '--snice-color-primary-hover',
    rule: '--snice-color-primary',
  },
};

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  outline: boolean;
  pill: boolean;
  removable: boolean;
  icon: boolean;
}

const base = (over: Partial<Combo>): Combo => ({
  id: '', variant: 'default', size: 'medium',
  outline: false, pill: false, removable: false, icon: false, ...over,
});

/**
 * Two crosses rather than one product.
 *
 * COLOUR: variant (6) x outline (2) x size (3) = 36. Every variant is judged
 * filled AND outlined, at every size, because the outline rules point at a
 * different token than the filled ones and a size changes the box the colour is
 * painted into.
 *
 * GEOMETRY: size (3) x pill (2) x removable (2) x icon (2) = 24. These are the
 * axes that move BOXES, and they are independent of which colour is in them —
 * multiplying them by the six variants would quadruple the suite without
 * reaching one new layout.
 */
function colourCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const outline of [false, true]) {
      for (const size of SIZES) {
        combos.push(base({
          id: `colour/${variant}/${outline ? 'outline' : 'filled'}/${size}`,
          variant, outline, size,
        }));
      }
    }
  }
  return combos;
}

function geometryCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const pill of [false, true]) {
      for (const removable of [false, true]) {
        for (const icon of [false, true]) {
          combos.push(base({
            id: `geometry/${size}/${pill ? 'pill' : 'square'}`
              + `/${removable ? 'removable' : 'fixed'}/${icon ? 'icon' : 'no-icon'}`,
            size, pill, removable, icon,
          }));
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(
  combo: Combo,
  tokens: { fill: string; ink: string; rule: string },
): Promise<string[]> {
  return page.evaluate(({ combo, tokens }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'inline-flex') {
      say(`host computed display "${hostCs.display}", expected "inline-flex"`);
    }

    const tag = partNamed('base');
    if (!tag) { say('no part="base" rendered'); return problems; }
    const tagBox = rect(tag);
    const tagCs = getComputedStyle(tag);
    if (tagBox.width <= 0 || tagBox.height <= 0) {
      say(`tag renders at ${tagBox.width}x${tagBox.height}`);
      return problems;
    }
    // `.tag` is declared `inline-flex`, but it is also the flex ITEM of an
    // `inline-flex` host, and CSS blockifies a flex item's display. Either
    // spelling satisfies the claim being made: the tag is a flex row.
    if (!/^(inline-)?flex$/.test(tagCs.display)) {
      say(`tag display "${tagCs.display}", expected a flex row`);
    }
    if (tagCs.alignItems !== 'center') {
      say(`tag align-items "${tagCs.alignItems}", expected "center"`);
    }
    if (tagCs.whiteSpace !== 'nowrap') {
      say(`tag white-space "${tagCs.whiteSpace}" — a token must not wrap`);
    }

    // ── variant x outline: the documented semantic tokens ───────────────────
    const ink = token(tokens.ink);
    if (tagCs.color !== ink) {
      say(`${combo.variant} ink "${tagCs.color}", expected ${tokens.ink} "${ink}"`);
    }
    if (combo.outline) {
      if (tagCs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        say(`outlined tag painted a fill "${tagCs.backgroundColor}"`);
      }
      if (parseFloat(tagCs.borderTopWidth) <= 0) {
        say(`outlined tag has no rule (border-top-width ${tagCs.borderTopWidth})`);
      }
      const rule = token(tokens.rule);
      if (tagCs.borderTopColor !== rule) {
        say(`${combo.variant} outline rule "${tagCs.borderTopColor}",`
          + ` expected ${tokens.rule} "${rule}"`);
      }
    } else {
      const fill = token(tokens.fill);
      if (tagCs.backgroundColor !== fill) {
        say(`${combo.variant} fill "${tagCs.backgroundColor}", expected ${tokens.fill} "${fill}"`);
      }
      if (parseFloat(tagCs.borderTopWidth) > 0) {
        say(`filled tag drew a border (border-top-width ${tagCs.borderTopWidth})`);
      }
    }

    // ── pill: "fully rounded corners" ───────────────────────────────────────
    const radius = parseFloat(tagCs.borderTopLeftRadius);
    if (combo.pill) {
      if (radius < tagBox.height / 2 - EPS) {
        say(`pill radius ${radius.toFixed(1)}px does not fully round a`
          + ` ${tagBox.height.toFixed(1)}px tall tag`);
      }
    } else if (radius >= tagBox.height / 2 - EPS) {
      say(`a non-pill tag is fully rounded (radius ${radius.toFixed(1)}px on`
        + ` a ${tagBox.height.toFixed(1)}px tall tag)`);
    }

    // ── The row: icon, label, remove button — left to right, no overlaps ────
    const label = partNamed('label');
    if (!label) { say('no part="label"'); return problems; }
    const labelBox = rect(label);
    if (labelBox.width <= 0 || labelBox.height <= 0) {
      say(`label renders at ${labelBox.width}x${labelBox.height}`);
    }
    for (const [name, box] of [['label', labelBox]] as Array<[string, DOMRect]>) {
      if (box.left < tagBox.left - EPS || box.right > tagBox.right + EPS) {
        say(`${name} (${box.left.toFixed(0)}…${box.right.toFixed(0)}) overflows the tag`
          + ` (${tagBox.left.toFixed(0)}…${tagBox.right.toFixed(0)})`);
      }
    }

    const iconChild = host.querySelector('#icon-child') as HTMLElement | null;
    if (combo.icon) {
      if (!iconChild) { say('an icon child was authored but is not in the light DOM'); }
      else {
        const iconBox = rect(iconChild);
        if (iconBox.width <= 0 || iconBox.height <= 0) {
          say(`slotted icon renders at ${iconBox.width}x${iconBox.height} — it was not projected`);
        }
        if (iconBox.right > labelBox.left + EPS) {
          say(`icon (right ${iconBox.right.toFixed(1)}) is not left of the label`
            + ` (left ${labelBox.left.toFixed(1)})`);
        }
        if (iconBox.left < tagBox.left - EPS) {
          say(`icon (left ${iconBox.left.toFixed(1)}) escapes the tag`
            + ` (left ${tagBox.left.toFixed(1)})`);
        }
      }
    }

    const remove = sr.querySelector('.tag-remove') as HTMLElement | null;
    if (combo.removable) {
      if (!remove) { say('removable painted no remove button'); }
      else {
        const removeBox = rect(remove);
        if (removeBox.width <= 0 || removeBox.height <= 0) {
          say(`remove button renders at ${removeBox.width}x${removeBox.height}`);
        }
        if (removeBox.left < labelBox.right - EPS) {
          say(`remove button (left ${removeBox.left.toFixed(1)}) overlaps the label`
            + ` (right ${labelBox.right.toFixed(1)})`);
        }
        if (getComputedStyle(remove).cursor !== 'pointer') {
          say(`remove button cursor "${getComputedStyle(remove).cursor}", expected "pointer"`);
        }
        const svg = remove.querySelector('svg');
        if (!svg) { say('remove button painted no glyph'); }
        else {
          const svgBox = rect(svg);
          if (svgBox.width <= 0 || svgBox.height <= 0) {
            say(`remove glyph renders at ${svgBox.width}x${svgBox.height}`);
          }
        }
        // A button the pointer cannot reach is not a button.
        const hit = (sr as any).elementFromPoint(
          removeBox.left + removeBox.width / 2,
          removeBox.top + removeBox.height / 2,
        ) as Element | null;
        if (hit !== remove && !remove.contains(hit as Node)) {
          say(`remove button is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    } else if (remove) {
      say('a non-removable tag painted a remove button');
    }

    // ── Occlusion: nothing may paint over the label ─────────────────────────
    const x = labelBox.left + Math.min(labelBox.width / 2, 10);
    const y = labelBox.top + labelBox.height / 2;
    const outer = document.elementFromPoint(x, y);
    if (outer !== host) {
      say(`label hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the tag`);
    } else {
      // The label's text is SLOTTED light DOM, so a shadow-root hit-test
      // retargets it back to the host: `host` is the signature of "the label's
      // own content is on top". Anything else on top — the remove button, a
      // decorative pseudo-element's owner — reports as that element instead.
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== label && hit !== host && !label.contains(hit as Node)) {
        say(`label is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, { combo, tokens });
}

async function mountAndCheckReflection(combo: Combo): Promise<void> {
  const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  expect(mounted.variant).toBe(combo.variant);
  expect(mounted.size).toBe(combo.size);
  // Every style rule is `:host([…])`. A property assignment that never reached
  // an attribute renders as the default, so reflection IS the paint here.
  expect(mounted.reflected.variant).toBe(combo.variant === 'default' ? null : combo.variant);
  expect(mounted.reflected.size).toBe(combo.size === 'medium' ? null : combo.size);
  expect(mounted.reflected.outline).toBe(combo.outline);
  expect(mounted.reflected.pill).toBe(combo.pill);
  expect(mounted.reflected.removable).toBe(combo.removable);
}

test.describe('tag visual matrix: layer 1 — variant x outline x size', () => {
  for (const combo of colourCombos()) {
    test(combo.id, async () => {
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo, TOKENS[combo.variant]), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('tag visual matrix: layer 1 — size x pill x removable x icon', () => {
  for (const combo of geometryCombos()) {
    test(combo.id, async () => {
      await mountAndCheckReflection(combo);
      expect(await visualProblems(combo, TOKENS[combo.variant]), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it. Measured
 * once across the three documented sizes.
 */
test.describe('tag visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in both height and type size', async () => {
    const measured: Record<string, { height: number; fontSize: number }> = {};
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({ size: s, label: 'Ready' }), size);
      measured[size] = await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        const tag = host.shadowRoot!.querySelector('[part~="base"]') as HTMLElement;
        return {
          height: tag.getBoundingClientRect().height,
          fontSize: parseFloat(getComputedStyle(tag).fontSize),
        };
      });
    }
    expect(measured.small.height, 'small height < medium').toBeLessThan(measured.medium.height);
    expect(measured.medium.height, 'medium height < large').toBeLessThan(measured.large.height);
    expect(measured.small.fontSize, 'small type < medium').toBeLessThan(measured.medium.fontSize);
    expect(measured.medium.fontSize, 'medium type < large').toBeLessThan(measured.large.fontSize);
  });

  test('the remove button is really clickable, and emits tag-remove -> { tag }', async () => {
    // The DOM matrix dispatches a synthetic MouseEvent at the node. This is the
    // same claim made against a browser's real hit-testing and default action.
    await page.evaluate(() => (window as any).matrix.mount({
      removable: true, variant: 'danger', size: 'large', label: 'Critical',
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickRemove());
    expect(result.clicked, 'no remove button to click').toBe(true);
    expect(result.events, 'tag-remove dispatch count').toBe(1);
    expect(result.sameTag, 'detail.tag is the tag itself').toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the chip has a background-colour" and "the label is readable
// on this chip" are different claims, and only pixels can tell them apart.

test.describe('tag visual matrix: marquee pixels', () => {
  test('a filled danger tag paints a chip its own label is readable on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'danger', size: 'large', label: 'Critical',
    }));
    const pixels = await capture(
      page, '#subject', 'tag-danger-filled',
      `(host) => {
        const tag = host.shadowRoot.querySelector('[part~="base"]');
        const label = host.shadowRoot.querySelector('[part~="label"]');
        const t = tag.getBoundingClientRect();
        const l = label.getBoundingClientRect();
        // Walk the glyph row every 2px rather than 12 fixed fractions: which
        // fractions land on a stroke is font-metric luck, and WebKit (this
        // tier runs it at deviceScaleFactor 2) antialiases every edge until a
        // fraction probe reads a half-blended pixel. The row's darkest pixel
        // is the glyph core — the ink the engine really has.
        const points = [];
        for (let x = 1; x < l.width; x += 2) {
          points.push({ x: l.x + x, y: l.y + l.height / 2 });
        }
        points.push({ x: t.x + 2, y: t.y + t.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed label pixel equals the chip ${chip.join(',')}`).toBe(true);
    const core = glyphs.reduce((a, p) =>
      p[0] + p[1] + p[2] < a[0] + a[1] + a[2] ? p : a);
    const best = contrast(core, chip);
    // Small bold type on a subtle tinted chip. 3:1 is a deliberately low bar
    // for an antialiased glyph core, but "antialiased" is not "invisible".
    expect(best, `label-core-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('two semantic variants paint two different chips', async () => {
    const chips: RGB[] = [];
    for (const variant of ['success', 'danger']) {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, size: 'large', label: 'Status',
      }), variant);
      const [chip] = await capture(
        page, '#subject', `tag-${variant}-chip`,
        `(host) => {
          const tag = host.shadowRoot.querySelector('[part~="base"]');
          const t = tag.getBoundingClientRect();
          return [{ x: t.x + 2, y: t.y + t.height / 2 }];
        }`,
      );
      chips.push(chip);
    }
    expect(sameColor(chips[0], chips[1]),
      `success and danger both painted ${chips[0].join(',')}`).toBe(false);
  });

  test('outline replaces the fill with a rule instead of hiding the tag', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'primary', size: 'large', outline: true, label: 'Outlined',
    }));
    // One pixel in the tag's own LEFT rule and one well inside it (the page
    // showing through the transparent fill). The offsets are chosen to survive
    // the capture's device-pixel rounding: 0.4 lands in column 0, the 1px rule
    // itself, while 6 is unambiguously interior. An outlined tag that painted
    // nothing at all would read the same colour at both points.
    const [edge, inside] = await capture(
      page, '#subject', 'tag-outline',
      `(host) => {
        const tag = host.shadowRoot.querySelector('[part~="base"]');
        const t = tag.getBoundingClientRect();
        return [
          { x: t.x + 0.4, y: t.y + t.height / 2 },
          { x: t.x + 6, y: t.y + t.height / 2 },
        ];
      }`,
    );
    expect(sameColor(edge as RGB, inside as RGB),
      `outline rule painted ${edge.join(',')} and the interior ${inside.join(',')}`).toBe(false);
  });
});
