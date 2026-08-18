/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-menu TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/menu, `npm run test:matrix`) owns the
 * structural contract: the trigger/panel/content parts, the ARIA disclosure
 * shell, the panel's placement CLASS, which trigger mode reacts to which
 * synthetic event, and `--menu-distance` on the host. It cannot own the
 * component's actual subject, because a menu IS a rectangle floating beside
 * another rectangle: eight documented `placement` values, a `distance` in
 * pixels, an opaque panel above the page, hover/selected/disabled paint, and
 * a divider line. happy-dom lays out none of that.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the OPEN panel is a real, opaque, on-top rectangle: resolved-token
 *     background (`--menu-bg` → `--snice-color-surface`), a 1px rule in
 *     `--menu-border`, a radius, a shadow, settled opacity 1, and reachable
 *     by a pointer through the popover top layer;
 *   · the panel respects the documented `--menu-min-width: 10rem` floor;
 *   · each placement puts the panel on the SIDE its name says, separated
 *     from the trigger by exactly `distance` px, with the edge alignment its
 *     `-start` / `-end` suffix names, never overlapping the trigger;
 *   · the items stack vertically without overlap inside the panel, each a
 *     left-to-right icon/label/shortcut row whose label nothing occludes;
 *   · a selected item paints the theme's primary-subtle surface and a full
 *     accent bar; a disabled item refuses the pointer (`pointer-events`) and
 *     paints the theme's disabled ink; a divider is a 1px line BETWEEN the
 *     items it separates;
 *   · a closed menu leaves no panel a pointer can reach.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Four captures against the fixture's saturated page block: the selected
 *   accent bar really paints, :hover really paints (only a real pointer can
 *   raise it), the open panel really covers the page it drops onto, and the
 *   divider really draws a line.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/menu/matrix.html';

/** Every documented `placement`, in doc order. */
const PLACEMENTS = [
  'bottom-start', 'bottom-end', 'top-start', 'top-end',
  'right-start', 'right-end', 'left-start', 'left-end',
] as const;
type Placement = typeof PLACEMENTS[number];

interface Combo {
  id: string;
  placement: Placement;
  distance: number;
  /** A deliberately narrow trigger, so the 10rem floor has something to fail against. */
  narrow?: boolean;
  open?: boolean;
  divider?: boolean;
  /** Items carrying `selected` / `disabled`, for the paint contracts. */
  items?: Array<{ value: string; label: string; disabled?: boolean; selected?: boolean }>;
  /** A `VISUAL-MATRIX-menu-N` id when this combo records a divergence. */
  finding?: string;
}

function combo(over: Partial<Combo> & { id: string }): Combo {
  return { placement: 'bottom-start', distance: 4, ...over };
}

const COMBOS: Combo[] = [
  ...PLACEMENTS.map(placement => combo({
    id: placement,
    placement,
  })),
  combo({ id: 'bottom-start/distance=24', distance: 24 }),
  combo({ id: 'bottom-start/narrow-trigger', narrow: true }),
  combo({
    id: 'selected+disabled items',
    items: [
      { value: 'new', label: 'New file', selected: true },
      { value: 'locked', label: 'Locked', disabled: true },
      { value: 'exit', label: 'Exit' },
    ],
  }),
  combo({ id: 'divider between items', divider: true }),
  combo({ id: 'closed', open: false }),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 0.6;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const named = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const triggerWrap = named('trigger');
    const panel = named('panel');
    const content = named('content');
    if (!triggerWrap) { say('no part="trigger" painted'); return problems; }
    if (!panel) { say('no part="panel" painted'); return problems; }
    if (!content) say('no part="content" painted');

    const anchor = rect(triggerWrap);
    if (anchor.width <= 0 || anchor.height <= 0) {
      say(`the trigger renders at ${anchor.width}x${anchor.height}`);
      return problems;
    }

    const panelStyle = getComputedStyle(panel);

    // ── CLOSED: no panel a pointer, or an eye, can reach ─────────────────────
    if (combo.open === false) {
      const reachable = panelStyle.visibility === 'visible'
        && Number(panelStyle.opacity) > 0
        && panelStyle.display !== 'none';
      if (reachable) {
        say(`a closed menu leaves its panel visible (display ${panelStyle.display},`
          + ` visibility ${panelStyle.visibility}, opacity ${panelStyle.opacity})`);
      }
      const hit = document.elementFromPoint(
        anchor.left + anchor.width / 2, anchor.bottom + 20);
      if (hit === host || host.contains(hit as Node)) {
        say('a closed menu still answers a hit-test below its trigger');
      }
      return problems;
    }

    // ── OPEN: a real, opaque, settled, on-top rectangle ──────────────────────
    const box = rect(panel);
    if (box.width <= 0 || box.height <= 0) {
      say(`the open panel renders at ${box.width}x${box.height}`);
      return problems;
    }
    // The panel fades in over 0.15s; these are facts about the SETTLED panel.
    if (Number(panelStyle.opacity) < 1) {
      say(`the settled panel is at opacity ${panelStyle.opacity}`);
    }
    if (panelStyle.pointerEvents !== 'auto') {
      say(`the open panel has pointer-events "${panelStyle.pointerEvents}"`);
    }
    // "--menu-bg: var(--snice-color-surface, white)" — resolved token to paint.
    const bg = token('--snice-color-surface');
    if (panelStyle.backgroundColor !== bg) {
      say(`panel fill "${panelStyle.backgroundColor}", expected --snice-color-surface "${bg}"`);
    }
    // "--menu-border: var(--snice-color-border, #e5e7eb)" as a 1px rule.
    if (parseFloat(panelStyle.borderTopWidth) !== 1) {
      say(`panel rule width ${panelStyle.borderTopWidth}, expected the documented 1px border`);
    }
    const rule = token('--snice-color-border');
    if (panelStyle.borderTopColor !== rule) {
      say(`panel rule colour "${panelStyle.borderTopColor}", expected --snice-color-border "${rule}"`);
    }
    if (parseFloat(panelStyle.borderTopLeftRadius) <= 0) {
      say(`panel corner radius ${panelStyle.borderTopLeftRadius}, expected rounded`);
    }
    if (panelStyle.boxShadow === 'none') {
      say('the panel casts no shadow (--menu-shadow)');
    }

    // On top of the page, through the popover top layer: the fixture's page
    // block is teal, so anything else painted there reports as that element.
    const hit = document.elementFromPoint(box.left + 3, box.top + 3);
    if (hit !== host && !host.contains(hit as Node)) {
      say(`a pointer at the panel's own corner finds`
        + ` <${(hit as HTMLElement | null)?.tagName.toLowerCase() ?? 'nothing'}>, not the menu`);
    }

    // On the screen at all.
    if (box.left < -EPS || box.top < -EPS
      || box.right > window.innerWidth + EPS || box.bottom > window.innerHeight + EPS) {
      say(`the panel (${round(box.left)},${round(box.top)} ${round(box.width)}x${round(box.height)})`
        + ` hangs outside the ${window.innerWidth}x${window.innerHeight} viewport`);
    }

    // ── The documented `--menu-min-width: 10rem` floor ────────────────────────
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (box.width < 10 * rem - EPS) {
      say(`the panel is ${round(box.width)}px wide, under the documented --menu-min-width`
        + ` floor of ${round(10 * rem)}px`);
    }

    // ── THE ANCHORING: side, distance, alignment ─────────────────────────────
    //
    // The vocabulary is the standard one the doc's own list spells out (and
    // the one snice-popover documents in words): the word before the hyphen
    // is the SIDE of the trigger the panel opens on, the word after is which
    // pair of edges line up. `distance` defaults to 4 and is the panel's gap
    // in px — the same contract its popover sibling documents explicitly.
    const [side, align] = combo.placement.split('-');
    const gapFor = (actual: number, what: string) => {
      if (Math.abs(actual - combo.distance) > EPS) {
        say(`${what}: the gap is ${round(actual)}px, expected distance=${combo.distance}px`);
      }
    };
    const flush = (actual: number, expected: number, what: string) => {
      if (Math.abs(actual - expected) > EPS) {
        say(`${what}: ${round(actual)}, expected ${round(expected)}`);
      }
    };

    if (side === 'top') gapFor(anchor.top - box.bottom, 'above the trigger');
    if (side === 'bottom') gapFor(box.top - anchor.bottom, 'below the trigger');
    if (side === 'left') gapFor(anchor.left - box.right, 'left of the trigger');
    if (side === 'right') gapFor(box.left - anchor.right, 'right of the trigger');

    const vertical = side === 'top' || side === 'bottom';
    if (vertical) {
      if (align === 'start') flush(box.left, anchor.left, '"-start" left edges');
      else flush(box.right, anchor.right, '"-end" right edges');
    } else {
      if (align === 'start') flush(box.top, anchor.top, '"-start" top edges');
      else flush(box.bottom, anchor.bottom, '"-end" bottom edges');
    }

    // Whatever the placement, the panel and the trigger share no pixel.
    if (box.left < anchor.right - EPS && anchor.left < box.right - EPS
      && box.top < anchor.bottom - EPS && anchor.top < box.bottom - EPS) {
      say('the panel overlaps its own trigger');
    }

    // The content wrapper stays inside the panel it wraps.
    if (content) {
      const c = rect(content);
      if (c.left < box.left - EPS || c.right > box.right + EPS
        || c.top < box.top - EPS || c.bottom > box.bottom + EPS) {
        say('part="content" escapes part="panel"');
      }
    }

    // ── The items: a vertical stack of left-to-right rows ────────────────────
    //
    // Items are light DOM slotted into the panel; each item's painted box is
    // the div in its OWN shadow root, so that is the box measured here.
    // `any[]` because `selected` / `disabled` are the item element's own
    // documented properties, read back from the DOM it rendered.
    const items = [...host.querySelectorAll('snice-menu-item')] as any[];
    if (items.length === 0) { say('no items to lay out'); return problems; }
    const itemDivs: any[] = items.map((item: any) =>
      item.shadowRoot!.querySelector('.menu-item'));
    if (itemDivs.some((div: any) => !div)) {
      say('an item painted no .menu-item row');
      return problems;
    }

    let previous: DOMRect | null = null;
    for (const [index, div] of itemDivs.entries()) {
      const itemBox = rect(div);
      if (itemBox.width <= 0 || itemBox.height <= 0) {
        say(`item ${index} renders at ${itemBox.width}x${itemBox.height}`);
        continue;
      }
      if (content) {
        const c = rect(content);
        if (itemBox.left < c.left - EPS || itemBox.right > c.right + EPS) {
          say(`item ${index} overflows the panel content`);
        }
      }
      if (previous && itemBox.top < previous.bottom - EPS) {
        say(`item ${index} overlaps item ${index - 1} — a menu is one item per line`);
      }
      previous = itemBox;

      // icon, label, shortcut: left to right, no overlap, inside the item.
      const itemSr = items[index].shadowRoot!;
      const partIn = (name: string) =>
        [...itemSr.querySelectorAll('[part]')].find(node =>
          (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;
      const icon = partIn('icon');
      const label = partIn('label');
      const shortcut = partIn('shortcut');
      if (!label || rect(label).width <= 0) { say(`item ${index} paints no label`); continue; }
      const labelBox = rect(label);
      if (icon && rect(icon).right > labelBox.left + EPS) {
        say(`item ${index}: the icon is not left of the label`);
      }
      if (shortcut && rect(shortcut).left < labelBox.right - EPS) {
        say(`item ${index}: the shortcut overlaps the label`);
      }
      for (const [name, node] of [['label', label], ['shortcut', shortcut]] as Array<[string, HTMLElement | undefined]>) {
        if (!node) continue;
        const nb = rect(node);
        if (nb.left < itemBox.left - EPS || nb.right > itemBox.right + EPS) {
          say(`item ${index}: ${name} escapes its row`);
        }
      }

      // Nothing may paint over the label.
      const lx = labelBox.left + Math.min(labelBox.width / 2, 10);
      const ly = labelBox.top + labelBox.height / 2;
      const outer = document.elementFromPoint(lx, ly);
      if (outer !== items[index] && !(outer === host || host.contains(outer as Node))) {
        say(`item ${index}'s label hit-test finds`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the menu`);
      } else {
        const inner = itemSr.elementFromPoint(lx, ly) as Element | null;
        if (inner !== label && inner !== items[index]
          && !label.contains(inner as Node) && inner !== null) {
          say(`item ${index}'s label is occluded by <${inner.tagName.toLowerCase()}>`);
        }
      }

      // ── selected: the theme's own subtle surface and a full accent bar ────
      const divStyle = getComputedStyle(div);
      if (items[index].selected) {
        const subtle = token('--snice-color-primary-subtle');
        if (divStyle.backgroundColor !== subtle) {
          say(`selected item fill "${divStyle.backgroundColor}",`
            + ` expected --snice-color-primary-subtle "${subtle}"`);
        }
        const before = getComputedStyle(div, '::before').transform;
        const scaleY = before === 'none' ? 1
          : Number((before.match(/matrix\(([^)]+)\)/)?.[1] ?? '').split(', ')[3]);
        if (scaleY !== 1) {
          say(`selected item's accent bar is scaled ${before}, expected fully out (scaleY 1)`);
        }
      } else {
        if (divStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          say(`an unselected item painted a fill "${divStyle.backgroundColor}"`);
        }
        const before = getComputedStyle(div, '::before').transform;
        const scaleY = before === 'none' ? 1
          : Number((before.match(/matrix\(([^)]+)\)/)?.[1] ?? '').split(', ')[3]);
        if (scaleY !== 0) {
          say(`an unselected item shows its accent bar (${before})`);
        }
      }

      // ── disabled: the theme's disabled ink, and a pointer it refuses ──────
      if (items[index].disabled) {
        const ink = token('--snice-color-text-disabled');
        if (divStyle.color !== ink) {
          say(`disabled item ink "${divStyle.color}", expected --snice-color-text-disabled "${ink}"`);
        }
        if (divStyle.cursor !== 'not-allowed') {
          say(`disabled item cursor "${divStyle.cursor}", expected "not-allowed"`);
        }
        // The padding strip is inside the div but clear of every slot: an
        // enabled row claims it, a `pointer-events: none` row does not.
        const px = itemBox.left + 2;
        const py = itemBox.top + itemBox.height / 2;
        const claim = itemSr.elementFromPoint(px, py) as Element | null;
        if (claim === div || div.contains(claim as Node)) {
          say('a disabled item still claims the pointer (pointer-events)');
        }
      }
    }

    // ── The divider: a 1px line BETWEEN the items it separates ───────────────
    if (combo.divider) {
      const dividers = [...host.querySelectorAll('snice-menu-divider')];
      const line = dividers[0]?.shadowRoot?.querySelector('.menu-divider') as HTMLElement | null;
      if (!line) { say('no divider line painted'); }
      else {
        const lineBox = rect(line);
        if (Math.abs(lineBox.height - 1) > EPS) {
          say(`the divider line is ${round(lineBox.height)}px tall, expected the 1px separator`);
        }
        const above = itemDivs[0] ? rect(itemDivs[0]) : null;
        const below = itemDivs[1] ? rect(itemDivs[1]) : null;
        if (above && lineBox.top < above.bottom - EPS) {
          say('the divider overlaps the item above it');
        }
        if (below && lineBox.bottom > below.top + EPS) {
          say('the divider overlaps the item below it');
        }
        if (content) {
          // The separator spans the same column the items span: content's
          // INNER width, minus its own side padding — the line is a sibling
          // of the items inside that padding (snice-menu.css
          // `.menu__content { padding: 0.25rem }`).
          const cStyle = getComputedStyle(content);
          const inner = rect(content).width
            - parseFloat(cStyle.paddingLeft) - parseFloat(cStyle.paddingRight);
          if (lineBox.width < inner - EPS) {
            say(`the divider spans ${round(lineBox.width)}px of ${round(inner)} — a separator that`
              + ' does not separate the full width');
          }
        }
      }
    }

    return problems;
  }, combo as any);
}

/** Mount one combo and open it through the documented method. */
async function mountOpen(combo: Combo): Promise<void> {
  const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  expect(mounted.reflected.placement, `attribute reflection for ${combo.id}`)
    .toBe(combo.placement);
  expect(mounted.reflected.distance, `attribute reflection for ${combo.id}`)
    .toBe(String(combo.distance));
  if (combo.open !== false) {
    const opened = await page.evaluate(() => (window as any).matrix.openMenu());
    expect(opened.open, `openMenu() for ${combo.id}`).toBe(true);
  }
}

test.describe('menu visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    const declare = combo.finding ? test.fail : test;
    declare(combo.finding ? `${combo.finding}: ${combo.id}` : combo.id, async () => {
      await mountOpen(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── Trigger modes and selection, driven by REAL pointers and keys ───────────

test.describe('menu visual matrix: interaction', () => {
  test('a real click on the trigger opens the panel below it, and closes it again', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    const center = await page.evaluate(() => (window as any).matrix.triggerCenter());
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const opened = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const panel = host.shadowRoot!.querySelector('.menu__panel')!;
      const trigger = host.shadowRoot!.querySelector('.menu__trigger')!;
      const p = panel.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      return { open: (host as any).open, gap: p.top - t.bottom, leftAligned: p.left - t.left };
    });
    expect(opened.open, 'a real click on the trigger did not open the panel').toBe(true);
    expect(opened.gap, 'the panel does not sit distance=4 below the trigger')
      .toBeCloseTo(4, 0);
    expect(opened.leftAligned, 'bottom-start does not flush the left edges')
      .toBeCloseTo(0, 0);

    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.el.open),
      'a second real click did not close the panel').toBe(false);
  });

  test('a hover trigger opens on pointer-in and closes when the pointer leaves', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ trigger: 'hover' }));
    const center = await page.evaluate(() => (window as any).matrix.triggerCenter());
    await page.mouse.move(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.el.open),
      'mouseenter on the trigger did not open the panel').toBe(true);

    await page.mouse.move(20, 850);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.el.open),
      'leaving the menu did not close the panel').toBe(false);
  });

  test('a manual trigger ignores real clicks; the documented method still opens it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ trigger: 'manual' }));
    const center = await page.evaluate(() => (window as any).matrix.triggerCenter());
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.el.open),
      'manual mode answered a trigger click').toBe(false);

    const byApi = await page.evaluate(() => (window as any).matrix.openMenu());
    expect(byApi.open, 'openMenu() did not open a manual menu').toBe(true);
  });

  test('close-on-select closes the panel after a real-pointer selection', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const item = await page.evaluate(() => (window as any).matrix.itemCenter(1));
    await page.mouse.click(item.x, item.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const result = await page.evaluate(() => ({
      open: (window as any).matrix.el.open,
      events: (window as any).matrix.recordedEvents(),
    }));
    expect(result.open, 'the default close-on-select did not close the panel').toBe(false);
    expect(result.events.filter((e: any) => e.type === 'menu-item-select').length,
      'the real-pointer click selected nothing').toBe(1);
    expect(result.events.filter((e: any) => e.type === 'menu-close').length,
      'no menu-close dispatched').toBe(1);
  });

  test('close-on-select="false" keeps the panel open after a selection', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ closeOnSelect: false }));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const item = await page.evaluate(() => (window as any).matrix.itemCenter(1));
    await page.mouse.click(item.x, item.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const result = await page.evaluate(() => ({
      open: (window as any).matrix.el.open,
      selected: (window as any).matrix.recordedEvents().filter((e: any) => e.type === 'menu-item-select'),
    }));
    expect(result.selected.length, 'the click did not select').toBe(1);
    expect(result.open, 'close-on-select="false" closed the panel anyway').toBe(true);
  });

  test('a disabled item is unreachable by pointer and selects nothing', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { value: 'new', label: 'New' },
        { value: 'locked', label: 'Locked', disabled: true },
        { value: 'exit', label: 'Exit' },
      ],
    }));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const item = await page.evaluate(() => (window as any).matrix.itemCenter(1));
    await page.mouse.click(item.x, item.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const result = await page.evaluate(() => ({
      open: (window as any).matrix.el.open,
      events: (window as any).matrix.recordedEvents(),
    }));
    expect(result.events.filter((e: any) => e.type === 'menu-item-select').length,
      'a disabled item selected').toBe(0);
    expect(result.events.filter((e: any) => e.type === 'menu-close').length,
      'the menu closed without a selection').toBe(0);
    expect(result.open, 'the menu is no longer open').toBe(true);
  });

  test('ArrowDown opens the menu; Escape closes it and restores trigger focus', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.focusTrigger());
    await page.keyboard.press('ArrowDown');
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.el.open),
      'ArrowDown on the focused trigger did not open the panel').toBe(true);

    await page.keyboard.press('Escape');
    await page.evaluate(() => (window as any).matrix.settle());
    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const active = sr.activeElement as HTMLElement | null;
      return {
        open: (window as any).matrix.el.open,
        focusPart: active?.getAttribute('part') ?? '',
      };
    });
    expect(after.open, 'Escape did not close the panel').toBe(false);
    expect(after.focusPart.includes('trigger'),
      `focus landed on "${after.focusPart || 'nothing'}", not the trigger`).toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Screenshots of the STAGE (the panel floats below the host, outside the
// host's own box), probes resolved in the same evaluate that reads the
// pixels. The fixture's page block is teal, so "covers the page" and "paints
// its own surface" are one sameColor away.

test.describe('menu visual matrix: marquee pixels', () => {
  test('a selected item paints its accent bar and its own subtle fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { value: 'new', label: 'New file', selected: true },
        { value: 'save', label: 'Save', icon: '*', shortcut: 'Ctrl+S' },
        { value: 'exit', label: 'Exit' },
      ],
    }));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const [bar, fill, neighbour] = await capture(
      page, '#stage', 'menu-selected-item',
      `() => {
        const menu = document.getElementById('subject');
        const items = [...menu.querySelectorAll('snice-menu-item')];
        const selected = items[0].shadowRoot.querySelector('.menu-item').getBoundingClientRect();
        const other = items[1].shadowRoot.querySelector('.menu-item').getBoundingClientRect();
        return [
          { x: selected.left + 1.5, y: selected.top + selected.height / 2 },
          { x: selected.left + 8, y: selected.top + selected.height / 2 },
          { x: other.left + 8, y: other.top + other.height / 2 },
        ];
      }`,
    );
    expect(sameColor(bar as RGB, fill as RGB),
      `the accent bar painted ${bar.join(',')} identical to the item fill ${fill.join(',')}`
        + ' — the bar is not painted').toBe(false);
    expect(sameColor(fill as RGB, neighbour as RGB),
      `the selected item fill ${fill.join(',')} is identical to its neighbour's`
        + ` ${neighbour.join(',')} — selection paints nothing`).toBe(false);
  });

  test(':hover paints the hover surface, and only a real pointer can raise it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const hoveredCentre = await page.evaluate(() => (window as any).matrix.itemCenter(0));
    await page.mouse.move(hoveredCentre.x, hoveredCentre.y);
    const [hovered, other] = await capture(
      page, '#stage', 'menu-hover-item',
      `() => {
        const menu = document.getElementById('subject');
        const items = [...menu.querySelectorAll('snice-menu-item')];
        const a = items[0].shadowRoot.querySelector('.menu-item').getBoundingClientRect();
        const b = items[2].shadowRoot.querySelector('.menu-item').getBoundingClientRect();
        return [
          { x: a.left + 8, y: a.top + a.height / 2 },
          { x: b.left + 8, y: b.top + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(hovered as RGB, other as RGB),
      `hovering painted ${hovered.join(',')}, identical to the unhovered row`
        + ` ${other.join(',')}`).toBe(false);
  });

  test('the open panel covers the page it drops onto', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const [inside, page_] = await capture(
      page, '#stage', 'menu-over-page',
      `() => {
        const panel = document.getElementById('subject')
          .shadowRoot.querySelector('.menu__panel').getBoundingClientRect();
        return [
          { x: panel.left + 4, y: panel.top + 4 },
          { x: 80, y: 90 },
        ];
      }`,
    );
    expect(sameColor(inside as RGB, page_ as RGB),
      `the panel interior painted ${inside.join(',')} — identical to the teal page,`
        + ' so nothing was drawn on top').toBe(false);
  });

  test('the divider draws a line distinct from the panel surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ divider: true }));
    await page.evaluate(() => (window as any).matrix.openMenu());
    const probes = await capture(
      page, '#stage', 'menu-divider',
      `() => {
        const menu = document.getElementById('subject');
        const sr = menu.shadowRoot;
        const panel = sr.querySelector('.menu__panel').getBoundingClientRect();
        const line = menu.querySelector('snice-menu-divider')
          .shadowRoot.querySelector('.menu-divider').getBoundingClientRect();
        // A 1px line at a fractional y antialiases over two device rows, and
        // either row alone can blend back to the surface. The claim is about
        // the LINE, so sample every device row its band can touch.
        const band = [-1.5, -0.5, 0.5, 1.5, 2.5].map(dy => (
          { x: line.left + line.width / 2, y: line.top + dy }));
        return [...band, { x: panel.left + panel.width / 2, y: panel.top + 2 }];
      }`,
    );
    const surface = probes[probes.length - 1] as RGB;
    const band = probes.slice(0, -1) as RGB[];
    expect(band.some(p => !sameColor(p, surface)),
      `every row of the divider band painted`
        + ` ${[...new Set(band.map(p => p.join(',')))].join(' | ')} identical to the`
        + ` panel surface ${surface.join(',')} — no line was drawn`).toBe(true);
  });
});
