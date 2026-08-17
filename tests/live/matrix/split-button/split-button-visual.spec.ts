/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-split-button TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/split-button, `npm run test:matrix`) owns value
 * truth: which actions render, which events `primary-click` and `action-click`
 * carry, that a disabled action is inert, that the menu closes on action click,
 * outside click and Escape. What it cannot own is everything the component's
 * name is about:
 *
 *     "Primary action button with dropdown menu of alternative actions."
 *
 * A split button is two buttons that must sit side by side with a divider
 * between them, and a menu that must open BELOW them, aligned to their right
 * edge, wide enough to cover them — and, because the menu is a native
 * `popover`, painted in the TOP LAYER, above content that outranks it in every
 * z-index in the document. happy-dom lays nothing out and has no top layer, so
 * in the DOM tier a menu rendered underneath the page is indistinguishable
 * from a correct one.
 *
 * ── Layer 1 (every combo, closed and then open): geometry + style + occlusion ─
 *   · primary, divider and toggle sit in that order, left to right, each with a
 *     real box, all three inside `[part="base"]`;
 *   · the closed menu paints nothing;
 *   · the open menu is below the base, right-aligned to it, at least as wide;
 *   · every action is a real row, rows descend without overlapping, and each
 *     one stays inside `[part="menu-items"]`;
 *   · the open menu is the topmost thing at its own centre.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Five documented variants and an `outline` flag are six colour claims, and
 *   `loading`/`disabled` are two more. Only decoded pixels can say whether any
 *   of them changed what a reader sees.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/split-button/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'small' | 'medium' | 'large';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  outline: boolean;
  pill: boolean;
}

/**
 * variant (5) x size (3) x outline (2) x pill (2) = 60 combos, each measured
 * twice — closed, then opened through the documented toggle.
 *
 * Every axis is a stylesheet axis: variant and outline decide colour, size
 * decides the box, and pill decides the corner. Crossing them is the point —
 * `outline` + `pill` + `small` is exactly the combination where a component
 * that composes its classes carelessly loses one of them.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['default', 'primary', 'success', 'warning', 'danger'] as Variant[]) {
    for (const size of ['small', 'medium', 'large'] as Size[]) {
      for (const outline of [false, true]) {
        for (const pill of [false, true]) {
          combos.push({
            id: `${variant}/${size}/outline=${outline}/pill=${pill}`,
            variant, size, outline, pill,
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

/**
 * LAYER 1. One evaluate per state, returning every violation at once.
 * `open` says which half of the contract is being measured.
 */
async function visualProblems(combo: Combo, open: boolean): Promise<string[]> {
  return page.evaluate(({ combo, open }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partOf = (name: string) => sr.querySelector(`[part="${name}"]`) as HTMLElement | null;
    const painted = (node: Element | null) => {
      if (!node) return false;
      const b = rect(node);
      return getComputedStyle(node).display !== 'none' && b.width > 0 && b.height > 0;
    };

    const base = partOf('base');
    const primary = partOf('primary');
    const divider = partOf('divider');
    const toggle = partOf('toggle');
    const menu = partOf('menu');
    const items = partOf('menu-items');
    if (!base || !primary || !divider || !toggle || !menu) {
      say('the split button is missing one of base/primary/divider/toggle/menu');
      return problems;
    }

    const baseBox = rect(base);
    const primaryBox = rect(primary);
    const dividerBox = rect(divider);
    const toggleBox = rect(toggle);

    // ── Two buttons and a divider, in that order, all inside the base ──────
    for (const [name, box] of [['primary', primaryBox], ['divider', dividerBox],
      ['toggle', toggleBox]] as [string, DOMRect][]) {
      if (box.width <= 0 || box.height <= 0) {
        say(`[part="${name}"] renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
      }
      if (box.left < baseBox.left - 1 || box.right > baseBox.right + 1
        || box.top < baseBox.top - 1 || box.bottom > baseBox.bottom + 1) {
        say(`[part="${name}"] escapes [part="base"]`);
      }
    }
    if (!(primaryBox.right <= dividerBox.left + 1)) {
      say(`the primary button (right ${primaryBox.right.toFixed(1)}) overlaps the divider`
        + ` (left ${dividerBox.left.toFixed(1)})`);
    }
    if (!(dividerBox.right <= toggleBox.left + 1)) {
      say(`the divider (right ${dividerBox.right.toFixed(1)}) overlaps the toggle`
        + ` (left ${toggleBox.left.toFixed(1)})`);
    }
    // The two buttons are one control: they share a baseline and a height.
    if (Math.abs(primaryBox.height - toggleBox.height) > 1) {
      say(`the primary button is ${primaryBox.height.toFixed(1)}px tall and the toggle`
        + ` ${toggleBox.height.toFixed(1)}px`);
    }
    if (Math.abs(primaryBox.top - toggleBox.top) > 1) {
      say('the primary button and the toggle do not share a top edge');
    }

    // ── The label is inside the primary button and is not clipped away ─────
    const label = sr.querySelector('.split-button__label') as HTMLElement | null;
    if (!label || !painted(label)) say('the primary button paints no label');
    else if (rect(label).right > primaryBox.right + 1 || rect(label).left < primaryBox.left - 1) {
      say('the label escapes the primary button');
    }

    // ── The toggle carries its arrow ──────────────────────────────────────
    const arrow = sr.querySelector('.split-button__arrow') as HTMLElement | null;
    if (!painted(arrow)) say('the toggle paints no arrow');
    else if (rect(arrow!).right > toggleBox.right + 1) say('the arrow escapes the toggle');

    // ── The menu ──────────────────────────────────────────────────────────
    if (!open) {
      if (painted(menu)) {
        say(`the closed menu paints ${rect(menu).width.toFixed(1)}x${rect(menu).height.toFixed(1)}`);
      }
      return problems;
    }

    if (!painted(menu)) {
      say(`the open menu paints ${rect(menu).width.toFixed(1)}x${rect(menu).height.toFixed(1)}`);
      return problems;
    }
    const menuBox = rect(menu);
    if (!(menuBox.top >= baseBox.bottom - 1)) {
      say(`the menu (top ${menuBox.top.toFixed(1)}) does not open below the button`
        + ` (bottom ${baseBox.bottom.toFixed(1)})`);
    }
    if (Math.abs(menuBox.right - baseBox.right) > 2) {
      say(`the menu's right edge is ${menuBox.right.toFixed(1)} against the button's`
        + ` ${baseBox.right.toFixed(1)}`);
    }
    if (menuBox.width < baseBox.width - 1) {
      say(`the menu is ${menuBox.width.toFixed(1)}px wide under a`
        + ` ${baseBox.width.toFixed(1)}px button`);
    }

    // ── Every action is a row, and the rows descend inside the wrapper ─────
    const actions = [...sr.querySelectorAll('[part="action"]')] as HTMLElement[];
    if (actions.length === 0) say('the open menu holds no actions');
    const itemsBox = items ? rect(items) : menuBox;
    for (const [i, action] of actions.entries()) {
      const b = rect(action);
      if (b.width <= 0 || b.height <= 0) {
        say(`action ${i} renders at ${b.width.toFixed(1)}x${b.height.toFixed(1)}`);
      }
      if (b.left < itemsBox.left - 1 || b.right > itemsBox.right + 1) {
        say(`action ${i} escapes [part="menu-items"] horizontally`);
      }
      if (i > 0 && b.top < rect(actions[i - 1]).bottom - 1) {
        say(`action ${i} overlaps action ${i - 1}`);
      }
    }

    // ── The open menu is the topmost thing at its own centre ───────────────
    const cx = menuBox.left + menuBox.width / 2;
    const cy = menuBox.top + menuBox.height / 2;
    const outer = document.elementFromPoint(cx, cy);
    if (outer !== host) {
      say(`the menu's centre hit-tests to <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
    } else {
      const hit = (sr as any).elementFromPoint(cx, cy) as Element | null;
      if (hit && !menu.contains(hit) && hit !== menu) {
        say(`the menu is occluded by <${hit.tagName.toLowerCase()}`
          + `${hit.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, { combo, open } as any);
}

const combos = generateCombos();

test.describe('split-button visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted, `combo ${combo.id}`).toBe(true);
      expect(await visualProblems(combo, false), `combo ${combo.id} (closed)`).toEqual([]);

      const opened = await page.evaluate(() => (window as any).matrix.open());
      expect(opened.open, `combo ${combo.id}: the toggle did not open the menu`).toBe(true);
      expect(opened.actions, `combo ${combo.id}: rendered actions`).toBe(3);
      expect(await visualProblems(combo, true), `combo ${combo.id} (open)`).toEqual([]);
    });
  }
});

// ── Documented behaviours that need a browser to be asked about ─────────────

test.describe('split-button visual matrix: live behaviour', () => {
  const plain = { variant: 'primary' as Variant, size: 'medium' as Size };

  test('the size scale really does grow the control', async () => {
    const height = async (size: Size) => {
      await page.evaluate(c => (window as any).matrix.mount(c), { ...plain, size } as any);
      return page.evaluate(() => document.getElementById('subject')!.shadowRoot!
        .querySelector('[part="base"]')!.getBoundingClientRect().height);
    };
    const small = await height('small');
    const medium = await height('medium');
    const large = await height('large');
    expect(small, `small ${small} vs medium ${medium}`).toBeLessThan(medium);
    expect(medium, `medium ${medium} vs large ${large}`).toBeLessThan(large);
  });

  test('pill rounds the control further than the default corner', async () => {
    const radius = async (pill: boolean) => {
      await page.evaluate(c => (window as any).matrix.mount(c), { ...plain, pill } as any);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        return parseFloat(getComputedStyle(sr.querySelector('[part="primary"]')!)
          .borderTopLeftRadius);
      });
    };
    const square = await radius(false);
    const pill = await radius(true);
    expect(pill, `pill radius ${pill} vs default ${square}`).toBeGreaterThan(square);
  });

  test('the icon sits before the label at start and after it at end', async () => {
    const sides = async (iconPlacement: 'start' | 'end') => {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { ...plain, icon: '★', iconPlacement } as any);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const icon = sr.querySelector('.split-button__icon') as HTMLElement;
        const label = sr.querySelector('.split-button__label') as HTMLElement;
        return { icon: icon.getBoundingClientRect(), label: label.getBoundingClientRect() };
      });
    };
    const start = await sides('start');
    expect(start.icon.right, 'icon-placement="start" did not put the icon first')
      .toBeLessThanOrEqual(start.label.left + 1);
    const end = await sides('end');
    expect(end.icon.left, 'icon-placement="end" did not put the icon last')
      .toBeGreaterThanOrEqual(end.label.right - 1);
  });

  test('loading paints a spinner in place of the icon and freezes both buttons', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...plain, icon: '★', loading: true } as any);
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const spinner = sr.querySelector('[part="spinner"]');
      const box = spinner?.getBoundingClientRect();
      return {
        spinner: !!spinner && !!box && box.width > 0 && box.height > 0,
        icon: !!sr.querySelector('.split-button__icon'),
        primaryDisabled: (sr.querySelector('[part="primary"]') as HTMLButtonElement).disabled,
        toggleDisabled: (sr.querySelector('[part="toggle"]') as HTMLButtonElement).disabled,
      };
    })).toEqual({ spinner: true, icon: false, primaryDisabled: true, toggleDisabled: true });
  });

  test('a disabled split button will not open its menu', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), { ...plain, disabled: true } as any);
    const state = await page.evaluate(() => (window as any).matrix.open());
    expect(state.open, 'a disabled split button opened its menu').toBe(false);
  });

  test('the menu is in the top layer: an opaque z-index 2147483647 panel cannot cover it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), plain as any);
    await page.evaluate(() => (window as any).matrix.open());
    await page.evaluate(() => (window as any).matrix.showCurtain());
    try {
      const hit = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const box = sr.querySelector('[part="menu"]')!.getBoundingClientRect();
        const node = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return node ? `${node.tagName.toLowerCase()}#${node.id}` : 'nothing';
      });
      expect(hit, 'the curtain covered a popover menu, so the menu is not in the top layer')
        .toBe('snice-split-button#subject');
    } finally {
      await page.evaluate(() => (window as any).matrix.hideCurtain());
    }
  });

  // FINDING VISUAL-MATRIX-split-button-1 — in WebKit a dismissed menu never
  // stops occupying a box. The menu closes by the book (`hidePopover()`; the
  // element leaves the top layer, `:popover-open` goes false, opacity and
  // transform transitions run), but the stylesheet's
  // `transition: display … allow-discrete` keeps `display: block` and WebKit
  // never applies the UA sheet's closed-popover `display: none` — seconds
  // later the invisible menu still paints a 52x84 box with
  // pointer-events: none. Chromium flips to none. The assertions stay; the
  // pin must fail and be deleted the day WebKit's discrete display
  // transition lands.
  test('Escape closes the open menu', async ({ browserName }) => {
    test.fail(browserName === 'webkit',
      'closed popover keeps display:block — see VISUAL-MATRIX-split-button-1');
    await page.evaluate(c => (window as any).matrix.mount(c), plain as any);
    expect((await page.evaluate(() => (window as any).matrix.open())).open).toBe(true);
    const closed = await page.evaluate(() => (window as any).matrix.pressEscape());
    expect(closed.open, 'Escape left the menu open').toBe(false);
    // The menu leaves on a CSS transition, so the box survives the class change
    // by an animation frame or two; what matters is that it goes, not that it
    // goes synchronously.
    await expect.poll(async () => page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const box = sr.querySelector('[part="menu"]')!.getBoundingClientRect();
      return box.width * box.height;
    }), { message: 'the dismissed menu never stopped occupying a box' }).toBe(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('split-button visual matrix: marquee pixels', () => {
  /** The fill a variant paints, read just inside the primary button's corner. */
  async function fillOf(over: Record<string, unknown>, name: string) {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { size: 'large', label: 'Save', ...over } as any);
    const [pixel] = await capture(
      page, 'body', `split-button-${name}`,
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="primary"]').getBoundingClientRect();
        // Two pixels inside the top-left corner: past any border, clear of the
        // label's glyphs.
        return [{ x: box.x + 3, y: box.y + 3 }];
      }`,
    );
    return pixel;
  }

  test('the five documented variants paint five different fills', async () => {
    const seen = new Map<string, string>();
    for (const variant of ['default', 'primary', 'success', 'warning', 'danger'] as Variant[]) {
      const pixel = await fillOf({ variant }, `variant-${variant}`);
      const key = pixel.join(',');
      const clash = seen.get(key);
      expect(clash, `variant "${variant}" paints ${key}, the same fill as "${clash}"`)
        .toBeUndefined();
      seen.set(key, variant);
    }
  });

  test('outline replaces the filled surface instead of tinting it', async () => {
    const filled = await fillOf({ variant: 'primary' }, 'primary-filled');
    const outlined = await fillOf({ variant: 'primary', outline: true }, 'primary-outline');
    expect(sameColor(filled, outlined),
      `outline painted ${outlined.join(',')}, identical to the filled button`).toBe(false);
    expect(contrast(filled, outlined),
      `outline contrast against the filled button is`
      + ` ${contrast(filled, outlined).toFixed(2)}:1`).toBeGreaterThan(1.2);
  });

  test('a disabled button is visibly quieter than an enabled one', async () => {
    const enabled = await fillOf({ variant: 'primary' }, 'enabled');
    const disabled = await fillOf({ variant: 'primary', disabled: true }, 'disabled');
    expect(sameColor(enabled, disabled),
      `the disabled button painted ${disabled.join(',')}, identical to the enabled one`)
      .toBe(false);
  });

  test('the open menu paints its own surface over the page', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { variant: 'primary', size: 'large' } as any);
    await page.evaluate(() => (window as any).matrix.open());
    const [inMenu, onPage] = await capture(
      page, 'body', 'split-button-menu',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="menu"]').getBoundingClientRect();
        return [
          { x: box.x + 4, y: box.y + 4 },
          { x: box.x - 60, y: box.y + 4 },
        ];
      }`,
    );
    expect(sameColor(inMenu, onPage),
      `the menu painted ${inMenu.join(',')}, the same as the page beside it`).toBe(false);
  });
});
