/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-accordion TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/accordion, `npm run test:matrix`) owns the
 * state machine: the five documented parts, `aria-expanded` agreeing with
 * `open`, the header/region pairing, unique ids, `activeItems`, every method
 * and both container events. Its own oracle says why it cannot own this tier:
 * "the item's open/closed state is animated with `max-height`, and the height
 * it animates TO is `scrollHeight` — zero in a tier with no layout."
 *
 * This tier owns what only a browser can see:
 *
 *   · a CLOSED panel is really clipped to nothing (`max-height: 0` +
 *     `overflow: hidden` is a paint claim, not a style claim), and an OPEN
 *     panel really reveals the whole of its content;
 *   · `variant` is "a Visual style variant": `bordered` is ONE joined box —
 *     items touching, a 1px rule between them; `elevated` is SEPARATED cards —
 *     a 0.75rem gap, shadows, no rules;
 *   · the header is one left-to-right row — title at the start, the chevron
 *     at the end — and the chevron's ORIENTATION differs between open and
 *     closed (the affordance of a chevron on a "Collapsible section");
 *   · `disabled` means `pointer-events: none` (docs list no disabled styling,
 *     but a disabled trigger the pointer still reaches is not disabled);
 *   · the container's Arrow/Home/End keyboard navigation, which the DOM tier
 *     explicitly cannot exercise: happy-dom does not propagate keydown from a
 *     slotted header through the slot into the container's shadow tree.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The chevron glyph really paints; a real pointer's :hover really repaints
 *   the header; the two variants really paint two different seams.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/accordion/matrix.html';

/** The fixture leaves the root font size at the browser default: 16px/rem. */
const REM = 16;
/** The elevated variant's documented-by-stylesheet rhythm: `gap: 0.75rem`. */
const ELEVATED_GAP_REM = 0.75;

type Variant = 'bordered' | 'elevated';

interface ItemSpec {
  id: string;
  header: string;
  open?: boolean;
  disabled?: boolean;
}

interface Combo {
  id: string;
  variant: Variant;
  multiple: boolean;
  items: ItemSpec[];
  /** Header clicks performed (in order, each settling) before measuring. */
  toggles: number[];
}

const baseItems = (over: Record<number, Partial<ItemSpec>> = {}): ItemSpec[] =>
  [0, 1, 2].map(i => ({
    id: `i${i}`, header: `Section ${i}`, ...over[i],
  }));

/**
 * The cross: variant (2) x multiple (2) x authored-open (none / item 0) x
 * disabled (none / item 1) = 16 combos, each finishing with the same two
 * header clicks [1, 2]. Sized to the component: two container properties, one
 * item state pair, and one interaction path — the clicks are what turns the
 * authored state into the exclusive-open end state the geometry is measured
 * on.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['bordered', 'elevated'] as const) {
    for (const multiple of [false, true]) {
      for (const openAt of [-1, 0]) {
        for (const disabledAt of [-1, 1]) {
          const items = baseItems({
            ...(openAt >= 0 ? { [openAt]: { open: true } } : {}),
            ...(disabledAt >= 0 ? { [disabledAt]: { disabled: true } } : {}),
          });
          combos.push({
            id: `${variant}/${multiple ? 'multiple' : 'single'}`
              + `/authored-open=${openAt < 0 ? 'none' : openAt}`
              + `/disabled=${disabledAt < 0 ? 'none' : disabledAt}`,
            variant, multiple, items, toggles: [1, 2],
          });
        }
      }
    }
  }
  return combos;
}

/**
 * The state the DOCUMENTED container semantics produce for a combo's click
 * schedule — the same semantics the DOM matrix owns. This is an input to the
 * visual oracle (which panel geometry belongs to which state), not an
 * assertion: the state itself is the DOM tier's truth.
 *
 * Mirrors snice-accordion.ts: a disabled header click is inert; opening in
 * single mode closes every other item; clicking the open item closes it.
 */
function expectedOpen(combo: Combo): Set<string> {
  const open = new Set(combo.items.filter(item => item.open).map(item => item.id));
  for (const index of combo.toggles) {
    const item = combo.items[index];
    if (!item || item.disabled) continue;
    if (open.has(item.id)) open.delete(item.id);
    else {
      if (!combo.multiple) open.clear();
      open.add(item.id);
    }
  }
  return open;
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
  const expected = [...expectedOpen(combo)];
  return page.evaluate(({ combo, expected, elevatedGapRem }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const REM = 16;
    const round = (n: number) => n.toFixed(1);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const shell = sr.querySelector('.accordion') as HTMLElement | null;
    if (!shell) { say('the container painted no .accordion shell'); return problems; }

    const items = [...host.querySelectorAll('snice-accordion-item')] as HTMLElement[];
    if (items.length !== combo.items.length) {
      say(`${items.length} items mounted, combo authored ${combo.items.length}`);
      return problems;
    }

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') {
      say(`host computed display "${hostCs.display}", expected "block"`);
    }

    const shellBox = shell.getBoundingClientRect();
    const shellCs = getComputedStyle(shell);
    if (shellBox.width <= 0 || shellBox.height <= 0) {
      say(`the accordion shell renders at ${shellBox.width}x${shellBox.height}`);
      return problems;
    }

    // ── variant: two documented visual styles, two different boxes ──────────
    // "bordered" names a joined box: a 1px rule around the whole accordion and
    // a 1px rule between the sections it joins. "elevated" names separated
    // cards: shadowed, rounded, 0.75rem apart, no rules.
    const elevated = combo.variant === 'elevated';
    if (elevated) {
      if (parseFloat(shellCs.borderTopWidth) !== 0) {
        say(`an elevated accordion still draws the outer rule (${shellCs.borderTopWidth})`);
      }
      if (shellCs.overflow !== 'visible') {
        say(`an elevated accordion clips its cards (overflow ${shellCs.overflow})`);
      }
    } else {
      if (parseFloat(shellCs.borderTopWidth) !== 1) {
        say(`a bordered accordion has a ${shellCs.borderTopWidth} outer rule, expected 1px`);
      }
      if (parseFloat(shellCs.borderTopLeftRadius) <= 0) {
        say('a bordered accordion has no corner radius');
      }
    }

    const boxes = items.map(item => item.getBoundingClientRect());
    for (const [index, item] of items.entries()) {
      const id = combo.items[index].id;
      const box = boxes[index];
      const isOpen = expected.includes(id);
      const disabled = !!combo.items[index].disabled;

      const header = item.shadowRoot!.querySelector('.accordion-item__header') as HTMLElement | null;
      const title = item.shadowRoot!.querySelector('.accordion-item__title') as HTMLElement | null;
      const icon = item.shadowRoot!.querySelector('.accordion-item__icon') as HTMLElement | null;
      const content = item.shadowRoot!.querySelector('.accordion-item__content') as HTMLElement | null;
      const inner = item.shadowRoot!.querySelector('.accordion-item__content-inner') as HTMLElement | null;
      if (!header || !title || !icon || !content || !inner) {
        say(`item ${index} is missing a documented sub-part`);
        continue;
      }

      // ── the header row: title at the start, chevron at the end ────────────
      const headerBox = header.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const iconBox = icon.getBoundingClientRect();
      if (headerBox.width <= 0 || headerBox.height < 30) {
        say(`item ${index}'s header renders at ${round(headerBox.width)}x${round(headerBox.height)}`);
      }
      if (Math.abs(headerBox.width - box.width) > EPS) {
        say(`item ${index}'s header is ${round(headerBox.width)}px of a ${round(box.width)}px item`);
      }
      // The doc calls the title "Span wrapping the header slot": the
      // stylesheet makes that span flex:1, so its box legitimately stretches
      // to exactly MEET the chevron. The documented row claim is order —
      // title at the start, chevron at the end — so the title must start
      // within the header and never reach past the chevron's own box.
      if (titleBox.left < headerBox.left - EPS || titleBox.right > iconBox.right + EPS) {
        say(`item ${index}'s title is not between the header's start and the chevron`);
      }
      if (iconBox.right > headerBox.right + EPS) {
        say(`item ${index}'s chevron escapes its header`);
      }
      // The stylesheet sizes the icon at --accordion-icon-size: 1.25rem. The
      // doc's claim is only "icon - The chevron SVG icon"; a chevron is a
      // square glyph, so squareness is the claim made here.
      if (Math.abs(iconBox.width - iconBox.height) > EPS || iconBox.width < 10) {
        say(`item ${index}'s chevron renders at ${round(iconBox.width)}x${round(iconBox.height)}`);
      }

      // ── the chevron's orientation follows the state ───────────────────────
      // A chevron on a "Collapsible section" points the way you can go; open
      // and closed must therefore differ in orientation, which the stylesheet
      // expresses as rotate(180deg).
      const transform = getComputedStyle(icon).transform;
      if (isOpen && transform === 'none') {
        say(`item ${index} is open but its chevron did not rotate (${transform})`);
      }
      if (!isOpen && transform !== 'none') {
        say(`item ${index} is closed but its chevron carries ${transform}`);
      }

      // ── THE panel geometry: closed clips to nothing, open reveals all ────
      const contentBox = content.getBoundingClientRect();
      const innerBox = inner.getBoundingClientRect();
      if (isOpen) {
        if (contentBox.height < 80) {
          say(`item ${index} is open but its panel is only ${round(contentBox.height)}px tall`);
        }
        // The transition ends with max-height 'none' precisely so the content
        // can never be clipped by a stale pinned height: the inner content
        // must fit inside the panel entirely.
        if (innerBox.bottom > contentBox.bottom + EPS || innerBox.top < contentBox.top - EPS) {
          say(`item ${index}'s open panel (${round(contentBox.top)}..${round(contentBox.bottom)})`
            + ` clips its content (${round(innerBox.top)}..${round(innerBox.bottom)})`);
        }
        // Nothing paints over an open panel's content.
        const x = innerBox.left + Math.min(innerBox.width / 2, 30);
        const y = innerBox.top + Math.min(innerBox.height / 2, 20);
        const hit = document.elementFromPoint(x, y);
        if (hit !== host && !(host.contains(hit as Node))) {
          say(`item ${index}'s open content is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      } else {
        if (contentBox.height > 0.5) {
          say(`item ${index} is closed but its panel is still ${round(contentBox.height)}px tall`
            + ' — max-height 0 + overflow hidden must clip it to nothing');
        }
        if (Math.abs(contentBox.top - headerBox.bottom) > EPS) {
          say(`item ${index}'s closed panel does not sit flush under its header`);
        }
      }

      // ── the seams between items ────────────────────────────────────────────
      const itemCs = getComputedStyle(item);
      if (index < items.length - 1) {
        const next = boxes[index + 1];
        const gap = next.top - box.bottom;
        if (elevated) {
          if (parseFloat(itemCs.borderBottomWidth) !== 0) {
            say(`an elevated item carries a ${itemCs.borderBottomWidth} rule — cards are not ruled`);
          }
          if (getComputedStyle(item).boxShadow === 'none') {
            say(`elevated item ${index} casts no shadow — a separated card with no elevation`);
          }
          // An OPEN elevated card is scaled 1.01 by the stylesheet, so only a
          // seam between two closed cards is the plain flex gap; a seam
          // touching an open card still never closes.
          const bothClosed = !isOpen && !expected.includes(combo.items[index + 1].id);
          if (bothClosed) {
            const want = elevatedGapRem * REM;
            if (Math.abs(gap - want) > EPS) {
              say(`elevated items ${index}-${index + 1} sit ${round(gap)}px apart, expected ${round(want)}px`);
            }
          } else if (gap < 8) {
            say(`elevated items ${index}-${index + 1} nearly touch (${round(gap)}px) — cards must stay separated`);
          }
        } else {
          if (parseFloat(itemCs.borderBottomWidth) !== 1) {
            say(`bordered item ${index} has a ${itemCs.borderBottomWidth} bottom rule, expected the 1px separator`);
          }
          if (Math.abs(gap) > EPS) {
            say(`bordered items ${index}-${index + 1} sit ${round(gap)}px apart — one joined box has no gaps`);
          }
        }
      }

      // ── disabled: a trigger the pointer cannot reach ──────────────────────
      if (disabled) {
        const hostOpacity = Number(itemCs.opacity);
        if (hostOpacity > 0.9) {
          say(`a disabled item paints at opacity ${hostOpacity}`);
        }
        // `pointer-events: none` is the only way a disabled header can refuse
        // the pointer: hit-testing skips the whole item, so the DOCUMENT-level
        // probe must fall through to something outside the item (typically the
        // container). ShadowRoot.elementFromPoint cannot assert this: it
        // retargets a fall-through to an ancestor host instead of null.
        const hit = document.elementFromPoint(
          headerBox.left + headerBox.width / 2,
          headerBox.top + headerBox.height / 2,
        ) as Element | null;
        if (hit === item || item.contains(hit)) {
          say(`a disabled header still claims the pointer (<${hit?.tagName.toLowerCase() ?? 'nothing'}>)`);
        }
      } else {
        const hit = (item.shadowRoot as any).elementFromPoint(
          headerBox.left + headerBox.width / 2,
          headerBox.top + headerBox.height / 2,
        ) as Element | null;
        if (hit !== header && !(header.contains(hit as Node))) {
          say(`item ${index}'s header is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
        if (getComputedStyle(header).cursor !== 'pointer') {
          say(`item ${index}'s header cursor is "${getComputedStyle(header).cursor}"`);
        }
      }
    }

    // ── the shell contains every item, in reading order ─────────────────────
    for (const [index, box] of boxes.entries()) {
      // The elevated stylesheet deliberately scales an OPEN card 1.01 about
      // its center (the same documented-by-stylesheet fact the seam check
      // above already accounts for), so an open card's rect may overshoot
      // each shell edge by half of that 1% growth.
      const slack = elevated && expected.includes(combo.items[index].id)
        ? box.width * 0.005 + EPS
        : EPS;
      if (box.left < shellBox.left - slack || box.right > shellBox.right + slack) {
        say(`item ${index} escapes the accordion shell horizontally`);
      }
      if (index > 0 && box.top < boxes[index - 1].top) {
        say(`item ${index} is above item ${index - 1} — sections read top to bottom`);
      }
    }

    return problems;
  }, { combo, expected, elevatedGapRem: ELEVATED_GAP_REM });
}

const combos = generateCombos();

test.describe('accordion visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The documented keyboard navigation, against a real keyboard ─────────────
//
// The DOM matrix's own oracle records why this is here: "the accordion listens
// for `keydown` on the `<div class="accordion">` INSIDE its shadow root, and
// the items are slotted light-DOM children. happy-dom does not propagate an
// event from a slotted node through the slot into the shadow tree." A real
// browser does — and the doc documents the keys.

test.describe('accordion visual matrix: keyboard navigation', () => {
  /** Which item's header button currently holds focus, or -1. */
  const focusedItem = () => page.evaluate(() => {
    const items = [...document.getElementById('subject')!.querySelectorAll('snice-accordion-item')];
    return items.findIndex(item => {
      const active = item.shadowRoot!.activeElement as HTMLElement | null;
      return !!active && active.classList.contains('accordion-item__header');
    });
  });

  test('ArrowDown moves focus to the next header', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.focusHeader(0));
    expect(await focusedItem(), 'the fixture focused header 0').toBe(0);
    await page.keyboard.press('ArrowDown');
    expect(await focusedItem(), 'ArrowDown did not move focus to item 1').toBe(1);
  });

  test('Home and End reach the first and last headers', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.focusHeader(1));
    await page.keyboard.press('End');
    expect(await focusedItem(), 'End did not focus the last header').toBe(2);
    await page.keyboard.press('Home');
    expect(await focusedItem(), 'Home did not focus the first header').toBe(0);
  });

  test('Enter on the focused header really opens the panel', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    await page.evaluate(() => (window as any).matrix.focusHeader(0));
    await page.keyboard.press('Enter');
    await page.evaluate(() => (window as any).matrix.settle());
    const height = await page.evaluate(() => {
      const item = document.getElementById('subject')!.querySelectorAll('snice-accordion-item')[0];
      return item!.shadowRoot!.querySelector('.accordion-item__content')!.getBoundingClientRect().height;
    });
    expect(height, 'Enter did not open a real panel').toBeGreaterThan(80);
  });
});

test.describe('accordion visual matrix: real pointers', () => {
  test('a real click opens the panel, and a second click closes it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    const panelHeight = () => page.evaluate(() => {
      const item = document.getElementById('subject')!.querySelectorAll('snice-accordion-item')[0];
      return item!.shadowRoot!.querySelector('.accordion-item__content')!.getBoundingClientRect().height;
    });
    expect(await panelHeight()).toBeLessThan(1);

    const center = await page.evaluate(() => (window as any).matrix.headerCenter(0));
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await panelHeight(), 'a real click did not open the panel').toBeGreaterThan(80);

    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await panelHeight(), 'a second real click did not close the panel').toBeLessThan(1);
  });

  test('a real click on a disabled header changes nothing', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      items: [
        { id: 'i0', header: 'Section 0' },
        { id: 'i1', header: 'Section 1', disabled: true },
        { id: 'i2', header: 'Section 2' },
      ],
      toggles: [],
    }));
    const center = await page.evaluate(() => (window as any).matrix.headerCenter(1));
    await page.mouse.click(center.x, center.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const openVector = await page.evaluate(() =>
      [...document.getElementById('subject')!.querySelectorAll('snice-accordion-item')]
        .map(item => (item as any).open));
    expect(openVector, 'a disabled header answered a real click').toEqual([false, false, false]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('accordion visual matrix: marquee pixels', () => {
  test('the chevron glyph is really painted in the header', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    // Three probes along the chevron's left arm (the SVG path M6 9 L12 15
    // crosses 37.5%..50% of the viewBox width at the icon's vertical middle),
    // plus one probe on the header fill beside it.
    const pixels = await capture(
      page, '#stage', 'accordion-chevron',
      `() => {
        const item = document.getElementById('subject').querySelectorAll('snice-accordion-item')[0];
        const header = item.shadowRoot.querySelector('.accordion-item__header');
        const icon = item.shadowRoot.querySelector('.accordion-item__icon');
        const h = header.getBoundingClientRect();
        const i = icon.getBoundingClientRect();
        return [
          { x: i.x + i.width * 0.40, y: i.y + i.height * 0.55 },
          { x: i.x + i.width * 0.45, y: i.y + i.height * 0.60 },
          { x: i.x + i.width * 0.50, y: i.y + i.height * 0.65 },
          { x: h.x + h.width * 0.35, y: h.y + h.height / 2 },
        ];
      }`,
    );
    const fill = pixels[pixels.length - 1] as RGB;
    const glyph = pixels.slice(0, -1) as RGB[];
    expect(glyph.some(p => !sameColor(p, fill)),
      `the chevron probes all equal the header fill ${fill.join(',')}`).toBe(true);
  });

  test('a real pointer hovering a header repaints it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({}));
    // Park the pointer off the accordion first: earlier tests leave the mouse
    // parked on a header, and a "before" captured under an already-active
    // :hover would equal the "after" by construction.
    await page.mouse.move(4, 4);
    const point = await page.evaluate(() => {
      const item = document.getElementById('subject')!.querySelectorAll('snice-accordion-item')[1] as any;
      const h = item.shadowRoot.querySelector('.accordion-item__header').getBoundingClientRect();
      // Inside the header's own left padding strip: fill, never title text.
      return { x: h.x + 8, y: h.y + h.height / 2 };
    });
    const probe = `() => [{ x: ${point.x}, y: ${point.y} }]`;
    const before = (await capture(page, '#stage', 'accordion-hover-before', probe))[0] as RGB;
    await page.mouse.move(point.x, point.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const after = (await capture(page, '#stage', 'accordion-hover-after', probe))[0] as RGB;
    expect(sameColor(before, after),
      `hovering the header painted ${after.join(',')}, identical to the rested ${before.join(',')}`)
      .toBe(false);
  });

  test('bordered and elevated paint two different seams', async () => {
    const seam = async (variant: 'bordered' | 'elevated') => {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, toggles: [],
        items: [
          { id: 'i0', header: 'Section 0' },
          { id: 'i1', header: 'Section 1' },
        ],
      }), variant);
      return capture(
        page, '#stage', `accordion-seam-${variant}`,
        `() => {
          const items = document.getElementById('subject').querySelectorAll('snice-accordion-item');
          const a = items[0].getBoundingClientRect();
          const b = items[1].getBoundingClientRect();
          // Bordered: the 1px rule is the last pixel of item 0's box.
          // Elevated: the middle of the 12px gap between the cards.
          const y = '${variant}' === 'bordered' ? a.bottom - 0.5 : (a.bottom + b.top) / 2;
          return [{ x: a.left + a.width / 2, y }];
        }`,
      );
    };
    const [bordered, elevated] = await Promise.all([seam('bordered'), seam('elevated')]);
    expect(sameColor(bordered[0] as RGB, elevated[0] as RGB),
      `the two variants paint the same seam ${bordered[0].join(',')}`).toBe(false);
  });
});
