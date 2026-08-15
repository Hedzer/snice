/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-empty-state TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/empty-state, `npm run test:matrix`)
 * owns structure truth: which parts exist, what they read, which event fires.
 * It cannot own visual truth — happy-dom performs no layout, and it does not
 * even implement slot assignment correctly (it assigns a `slot="icon"` child to
 * the default slot as well), so the ONE thing the docs call an override can
 * only be verified here.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented vertical order really is icon → title → description →
 *     action → extra content, with no two boxes overlapping;
 *   · everything is horizontally centred inside the container, which is the
 *     whole visual point of an empty state;
 *   · `size` really scales — small < medium < large in icon size and padding —
 *     and does so monotonically;
 *   · a SLOTTED icon replaces the property glyph: the slotted box is painted at
 *     its own size and the property's emoji occupies no box at all;
 *   · the action is a real hit target (non-zero box, reachable by
 *     elementFromPoint through the shadow root) rather than a node that exists
 *     but cannot be clicked;
 *   · the documented event still fires when the click comes from a real browser
 *     hit test, and a link action's click is not cancelled.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The title, the description and the action must be legible against the
 *   surface they sit on. The marquee captures decode the PNG inside the browser
 *   and assert real contrast, and that an image icon paints its own pixels.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/empty-state/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Action = 'none' | 'button' | 'link';
type IconMode = 'default' | 'emoji' | 'image' | 'slot';

interface Combo {
  id: string;
  size: Size;
  action: Action;
  iconMode: IconMode;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  extra: boolean;
}

/**
 * The cross: size x action-shape x icon-source = 3 * 3 * 4 = 36, the same
 * shape as the DOM matrix so a divergence between the tiers is a real
 * divergence and not a difference in what was asked for. `description` and
 * extra slot content rotate across it.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const size of ['small', 'medium', 'large'] as Size[]) {
    for (const action of ['none', 'button', 'link'] as Action[]) {
      for (const iconMode of ['default', 'emoji', 'image', 'slot'] as IconMode[]) {
        const description = n % 2 === 0 ? '' : 'Try adjusting your search terms';
        const extra = n % 4 === 1;
        combos.push({
          id: `${size}/${action}/icon:${iconMode}`
            + `/[${description ? 'description' : 'no-description'}${extra ? ',extra' : ''}]`,
          size, action, iconMode,
          title: n % 3 === 2 ? 'No results found' : 'No data',
          description,
          actionText: action === 'none' ? '' : 'Clear Search',
          actionHref: action === 'link' ? '/home' : '',
          extra,
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
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const container = partsNamed('container')[0];
    if (!container) { say('no part="container"'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width <= 0 || containerBox.height <= 0) {
      say(`container renders at ${containerBox.width}x${containerBox.height}`);
      return problems;
    }

    const iconWrapper = [...container.children].find(child =>
      (child.getAttribute('part') ?? '').split(/\s+/).includes('icon')) as HTMLElement | undefined;
    const title = partsNamed('title')[0];
    const description = partsNamed('description')[0];
    const action = partsNamed('action')[0];

    // ── The documented vertical order, with no overlaps ──────────────────────
    const stack: Array<[string, HTMLElement]> = [];
    if (iconWrapper) stack.push(['icon', iconWrapper]);
    if (title) stack.push(['title', title]);
    if (description) stack.push(['description', description]);
    if (action) stack.push(['action', action]);
    for (let i = 1; i < stack.length; i++) {
      const [prevName, prev] = stack[i - 1];
      const [name, node] = stack[i];
      const a = rect(prev);
      const b = rect(node);
      if (b.top < a.bottom - EPS) {
        say(`${name} (top ${b.top.toFixed(1)}) overlaps ${prevName}`
          + ` (bottom ${a.bottom.toFixed(1)})`);
      }
    }

    // ── Everything is centred, which is the component's whole visual job ─────
    const centre = containerBox.left + containerBox.width / 2;
    for (const [name, node] of stack) {
      const b = rect(node);
      if (b.width <= 0 || b.height <= 0) {
        say(`${name} renders at ${b.width}x${b.height}`);
        continue;
      }
      const nodeCentre = b.left + b.width / 2;
      if (Math.abs(nodeCentre - centre) > 2) {
        say(`${name} centre is ${nodeCentre.toFixed(1)}, container centre is`
          + ` ${centre.toFixed(1)} — it is not centred`);
      }
      if (b.left < containerBox.left - EPS || b.right > containerBox.right + EPS) {
        say(`${name} spills outside the container`);
      }
      const cs = getComputedStyle(node);
      if (cs.visibility !== 'visible' || Number(cs.opacity) <= 0.01) {
        say(`${name} is not visible (visibility ${cs.visibility}, opacity ${cs.opacity})`);
      }
    }

    // ── The icon: the slot really overrides the property ─────────────────────
    if (iconWrapper) {
      const slot = iconWrapper.querySelector('slot[name="icon"]') as HTMLSlotElement | null;
      const assigned = slot ? slot.assignedElements() : [];
      if (combo.iconMode === 'slot') {
        if (assigned.length !== 1) {
          say(`a [slot="icon"] child was authored but the slot assigns`
            + ` ${assigned.length} elements`);
        } else {
          const slotted = rect(assigned[0]);
          // The fixture's slotted icon is a 40px square with a known colour.
          if (Math.abs(slotted.width - 40) > 1 || Math.abs(slotted.height - 40) > 1) {
            say(`the slotted icon renders at ${slotted.width.toFixed(1)}x`
              + `${slotted.height.toFixed(1)}, authored as 40x40`);
          }
          // "overrides the `icon` property": the property's glyph is the slot's
          // FALLBACK, so with the slot filled it must occupy no box at all.
          const fallback = [...(slot?.children ?? [])] as HTMLElement[];
          for (const node of fallback) {
            const b = rect(node);
            if (b.width > 0 || b.height > 0) {
              say(`the icon property's glyph still occupies ${b.width.toFixed(1)}x`
                + `${b.height.toFixed(1)} beside the slotted icon — the slot did not override it`);
            }
          }
        }
      } else {
        if (assigned.length !== 0) {
          say(`no [slot="icon"] child was authored, yet the slot assigns ${assigned.length}`);
        }
        const glyph = iconWrapper.querySelector('img, span');
        if (!glyph) {
          say('the icon property rendered no glyph at all');
        } else {
          const b = rect(glyph);
          if (b.width <= 0 || b.height <= 0) {
            say(`the icon glyph renders at ${b.width}x${b.height}`);
          }
          if (combo.iconMode === 'image') {
            const img = glyph as HTMLImageElement;
            if (img.tagName !== 'IMG') say('a URL icon did not render as an <img>');
            else if (!img.complete || img.naturalWidth === 0) {
              say('the icon image never decoded');
            }
          }
        }
      }
    }

    // ── The default slot: content really lands BELOW the action ──────────────
    const defaultSlot = sr.querySelector('slot:not([name])') as HTMLSlotElement | null;
    const extras = defaultSlot ? defaultSlot.assignedElements() : [];
    if (combo.extra) {
      if (extras.length !== 1) {
        say(`extra content was authored but the default slot assigns ${extras.length}`);
      } else {
        const extraBox = rect(extras[0]);
        if (extraBox.width <= 0 || extraBox.height <= 0) {
          say(`the slotted extra content renders at ${extraBox.width}x${extraBox.height}`);
        }
        const last = stack.length ? rect(stack[stack.length - 1][1]) : null;
        if (last && extraBox.top < last.bottom - EPS) {
          say('slotted extra content overlaps the component\'s own content —'
            + ' it is documented as sitting below the action button');
        }
      }
    } else if (extras.length !== 0) {
      // The browser's own slotting algorithm: a `slot="icon"` child must NOT
      // land here. happy-dom gets this wrong, which is why the claim is made
      // in this tier.
      say(`nothing was authored for the default slot, yet it assigns`
        + ` ${extras.map(e => e.tagName.toLowerCase()).join(', ')}`);
    }

    // ── The action is a real hit target ──────────────────────────────────────
    if (action) {
      const b = rect(action);
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`the action's centre hit-tests to <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the empty state');
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== action && !action.contains(hit as Node)) {
          say(`the action is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
      const cs = getComputedStyle(action);
      if (cs.pointerEvents === 'none') say('the action has pointer-events: none');
      if (b.height < 16) say(`the action is only ${b.height.toFixed(1)}px tall`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('empty-state visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('empty-state visual matrix: size really scales', () => {
  // `size` has no `:host([size])` rules — it is the `empty-state--<size>` class
  // on the container. The DOM tier proves the class is applied; only a browser
  // can prove the class does anything, and that the three sizes are ordered.
  const measure = async (size: Size) => {
    await page.evaluate(s => (window as any).matrix.mount({
      size: s, iconMode: 'default', action: 'button',
      actionText: 'Clear Search', description: 'Try adjusting your search terms',
    }), size);
    return page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const container = sr.querySelector('[part~="container"]') as HTMLElement;
      const glyph = sr.querySelector('[part~="icon"] span, [part~="icon"] img') as HTMLElement;
      const cs = getComputedStyle(container);
      return {
        padding: parseFloat(cs.paddingTop),
        icon: glyph ? glyph.getBoundingClientRect().height : 0,
        height: container.getBoundingClientRect().height,
      };
    });
  };

  test('padding and overall height grow with size', async () => {
    const small = await measure('small');
    const medium = await measure('medium');
    const large = await measure('large');
    expect(small.padding).toBeLessThan(medium.padding);
    expect(medium.padding).toBeLessThan(large.padding);
    expect(small.height).toBeLessThan(large.height);
  });

  // MATRIX-empty-state-1: `size="large"` renders a SMALLER icon than
  // `size="medium"`, and exactly the same icon as `size="small"`.
  // snice-empty-state.css sizes the large icon from
  // `var(--snice-font-size-3xl, 5rem)` — the same token the SMALL rule uses
  // (`var(--snice-font-size-3xl, 3rem)`), with only the unused fallback
  // changed — while medium uses `--snice-font-size-4xl`. Whenever the theme
  // defines `--snice-font-size-3xl` (it does), large and small resolve
  // identically and the documented small/medium/large scale inverts at its top
  // end. Measured here: 30px / 36px / 30px. The assertion below stays correct.
  test('MATRIX-empty-state-1: the icon grows with size', async () => {
    test.fail();
    const small = await measure('small');
    const medium = await measure('medium');
    const large = await measure('large');
    const trace = `icon heights: ${small.icon} / ${medium.icon} / ${large.icon}`;
    expect(small.icon, trace).toBeLessThan(medium.icon);
    expect(medium.icon, trace).toBeLessThan(large.icon);
  });
});

test.describe('empty-state visual matrix: the action really works in a browser', () => {
  test('a real click on the button action fires empty-state-action once', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'medium', iconMode: 'default', action: 'button', actionText: 'Clear Search',
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickAction());
    expect(result.clicked).toBe(true);
    expect(result.events).toBe(1);
    expect(result.detailIsHost).toBe(true);
    // A button action has nowhere to navigate, so its click is cancelled.
    expect(result.cancelledByComponent).toBe(true);
  });

  test('a link action fires the event and keeps its navigation', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'medium', iconMode: 'default', action: 'link',
      actionText: 'Go Home', actionHref: '/home',
    }));
    const result = await page.evaluate(() => (window as any).matrix.clickAction());
    expect(result.events).toBe(1);
    // A link is documented as a link: the component must leave its default
    // action alone so the href is followed.
    expect(result.cancelledByComponent).toBe(false);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose: layer 1 already measured the model the browser built. These
// exist because "the title has a color" and "the title is readable" are
// different claims.

test.describe('empty-state visual matrix: marquee pixels', () => {
  test('the title and description are legible against the surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', iconMode: 'default',
      title: 'No results found', description: 'Try adjusting your search terms',
    }));
    // Text is sampled as a STRIP, not a single pixel: the centre of a heading's
    // box frequently lands in the gap between two letters, and a single probe
    // there would measure the background and call the title invisible. The
    // claim under test is "some ink was laid down that stands out from the
    // surface", so the strongest pixel in the strip is the one that answers it.
    const pixels = await capture(
      page, '#subject', 'empty-state-text',
      `(host) => {
        const sr = host.shadowRoot;
        const strip = (box, n) => Array.from({ length: n }, (_, i) => ({
          x: box.x + box.width * ((i + 0.5) / n),
          y: box.y + box.height / 2,
        }));
        const title = sr.querySelector('[part~="title"]').getBoundingClientRect();
        const description = sr.querySelector('[part~="description"]').getBoundingClientRect();
        const box = host.getBoundingClientRect();
        return [
          ...strip(title, 24),
          ...strip(description, 24),
          { x: box.x + 4, y: box.y + 4 },
        ];
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const best = (from: number, to: number) =>
      Math.max(...pixels.slice(from, to).map(p => contrast(p, surface)));
    const titleContrast = best(0, 24);
    const descriptionContrast = best(24, 48);

    // A heading nobody can read is not a heading. The bar is WCAG's large-text
    // minimum for the title and a deliberately gentler one for the secondary
    // description, which is designed to recede.
    expect(titleContrast, `title contrast ${titleContrast.toFixed(2)}:1`).toBeGreaterThan(3);
    expect(descriptionContrast,
      `description contrast ${descriptionContrast.toFixed(2)}:1`).toBeGreaterThan(2);
  });

  test('an image icon paints its own pixels', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', iconMode: 'image',
    }));
    const pixels = await capture(
      page, '#subject', 'empty-state-icon-image',
      `(host) => {
        const img = host.shadowRoot.querySelector('[part~="icon"] img').getBoundingClientRect();
        return [
          { x: img.x + img.width * 0.25, y: img.y + img.height * 0.25 },
          { x: img.x + img.width * 0.75, y: img.y + img.height * 0.75 },
        ];
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the icon area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
  });

  test('the action is visibly distinct from the surface it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', iconMode: 'default', action: 'button', actionText: 'Clear Search',
    }));
    const [chrome, surface] = await capture(
      page, '#subject', 'empty-state-action',
      `(host) => {
        const action = host.shadowRoot.querySelector('[part~="action"]').getBoundingClientRect();
        const box = host.getBoundingClientRect();
        return [
          { x: action.x + 3, y: action.y + action.height / 2 },
          { x: box.x + 4, y: box.y + 4 },
        ];
      }`,
    );
    expect(contrast(chrome, surface),
      `the action's own chrome contrasts ${contrast(chrome, surface).toFixed(2)}:1`
      + ' with the surface — it does not read as a control')
      .toBeGreaterThan(1.1);
  });
});
