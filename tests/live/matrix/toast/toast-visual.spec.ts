/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-toast / snice-toast-container TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/toast, `npm run test:matrix`) owns the
 * structural truth: which toasts exist and in what order, which type,
 * message, chrome and ARIA each carries, the ids the API hands back, that
 * the auto-dismiss timer fires (or, at duration 0, never does). Its own
 * header draws the line: happy-dom runs no animations, so a toast it has
 * TOLD to leave stays in the tree forever. This tier owns what only a real
 * browser can see:
 *
 *   · a container really sits at its named screen position — "Position on
 *     screen" is a claim about the viewport, and `top-left` … `bottom-right`
 *     are six different rectangles;
 *   · the four types really paint four distinguishable chips — a type is a
 *     semantic ("success", "error"), and the theme publishes exactly one
 *     surface per semantic, so each type must paint ITS OWN token;
 *   · a dismissed toast actually LEAVES the screen;
 *   · the icon / message / close row lays out left to right inside the
 *     chip, and the chip answers a hit-test — a notification a pointer
 *     cannot reach cannot be closed.
 *
 * Every combo shows its toast with `duration: 0` — the documented sticky
 * option ("0 = no auto-dismiss") — so nothing vanishes under a timer
 * mid-assertion. Departure is driven by the documented `hide()`.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots — a chip can "have a
 *   background-color" and still be unreadable under its own message; the
 *   captures judge the message against the chip it sits on, warning's dark
 *   ink against its yellow, and success against error.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/toast/matrix.html';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

const TYPES: ToastType[] = ['success', 'error', 'warning', 'info'];
const POSITIONS: ToastPosition[] = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

/**
 * The documented semantic surface each type paints.
 *
 * The docs name the types but not the tokens; what they DO commit to is
 * that a type is a semantic, and the theme publishes exactly one surface
 * per semantic. So the expectation is "this type paints ITS OWN semantic
 * token" — the claim a type exists to make. `info` shares the primary
 * semantic (the theme has no separate info one); `warning` is documented in
 * the theme as the raw yellow-400 triplet, which is the expression the
 * resolver is asked to compute.
 */
const TYPE_SURFACE: Record<ToastType, string> = {
  success: '--snice-color-success',
  error: '--snice-color-danger',
  warning: 'hsl(var(--snice-color-yellow-400))',
  info: '--snice-color-primary',
};

interface Combo {
  id: string;
  position: ToastPosition;
  type: ToastType;
  message?: string;
  closable?: boolean;
  icon?: boolean;
}

/**
 * 34 combos, three crosses:
 *
 *   POSITION x TYPE (6 x 4 = 24). A position is only meaningful with
 *   something painted in it, and a type is only meaningful somewhere on
 *   screen; the full product is the component's whole surface and no bigger.
 *
 *   CHROME (4 x 2 = 8). icon=false and closable=false, one per type: the
 *   row must shrink honestly — no ghost boxes where the chrome was.
 *
 *   STACK (2). Three toasts in one container, top- and bottom-anchored: a
 *   notification system stacks without its chips colliding.
 */
function positionTypeCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const position of POSITIONS) {
    for (const type of TYPES) {
      combos.push({ id: `${position}/${type}`, position, type });
    }
  }
  return combos;
}

function chromeCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const type of TYPES) {
    combos.push({ id: `chrome/${type}/no-icon`, position: 'bottom-center', type, icon: false });
    combos.push({ id: `chrome/${type}/no-close`, position: 'bottom-center', type, closable: false });
  }
  return combos;
}

const STACK_COMBOS: Combo[] = [
  { id: 'stack/top-center', position: 'top-center', type: 'info' },
  { id: 'stack/bottom-right', position: 'bottom-right', type: 'success' },
];

const ALL_COMBOS = [...positionTypeCombos(), ...chromeCombos()];

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
  const surface = TYPE_SURFACE[combo.type];

  return page.evaluate(({ combo, surface }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;

    // ── the container sits where its name says, against the viewport ────────
    const containers = [...document.body.querySelectorAll('snice-toast-container')];
    if (containers.length !== 1) {
      say(`${containers.length} containers on screen, expected exactly 1`);
      return problems;
    }
    const host = containers[0];
    const box = host.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const position = combo.position;
    if (getComputedStyle(host).position !== 'fixed') {
      say(`the container computes position "${getComputedStyle(host).position}", not fixed`);
    }
    if (position.startsWith('top') && Math.abs(box.top) > EPS) {
      say(`a "${position}" container sits ${round(box.top)}px from the top edge`);
    }
    if (position.startsWith('bottom') && Math.abs(box.bottom - vh) > EPS) {
      say(`a "${position}" container ends ${round(vh - box.bottom)}px short of the bottom edge`);
    }
    if (position.endsWith('left') && Math.abs(box.left) > EPS) {
      say(`a "${position}" container sits ${round(box.left)}px from the left edge`);
    }
    if (position.endsWith('right') && Math.abs(box.right - vw) > EPS) {
      say(`a "${position}" container ends ${round(vw - box.right)}px short of the right edge`);
    }
    if (position.endsWith('center') && Math.abs(box.left + box.width / 2 - vw / 2) > 2) {
      say(`a "${position}" container's centre is ${round(box.left + box.width / 2 - vw / 2)}px off screen centre`);
    }

    // ── the chip ────────────────────────────────────────────────────────────
    const toast = host.shadowRoot!.querySelector('snice-toast');
    if (!toast) { say('no toast rendered'); return problems; }
    const sr = toast.shadowRoot!;
    const partIs = (el: Element, name: string) =>
      (el.getAttribute('part') ?? '').split(' ').includes(name);
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node => partIs(node, name)) as HTMLElement | undefined;

    const base = partNamed('base');
    if (!base) { say('no part="base"'); return problems; }
    const chip = base.getBoundingClientRect();
    if (chip.width <= 0 || chip.height <= 0) {
      say(`the chip renders at ${chip.width}x${chip.height}`);
      return problems;
    }
    if (chip.left < -EPS || chip.top < -EPS || chip.right > vw + EPS || chip.bottom > vh + EPS) {
      say(`the chip (${round(chip.left)},${round(chip.top)} ${round(chip.width)}x${round(chip.height)}) hangs off the ${vw}x${vh} viewport`);
    }

    // ── the type paints its own semantic token ──────────────────────────────
    const want = matrix.token(surface);
    const chipCs = getComputedStyle(base);
    if (chipCs.backgroundColor !== want) {
      say(`a ${combo.type} chip paints "${chipCs.backgroundColor}", expected ${surface} "${want}"`);
    }

    // ── the row: icon, message, close — left to right, inside the chip ──────
    const content = partNamed('content');
    if (!content) { say('no part="content"'); return problems; }
    const c = content.getBoundingClientRect();
    if (c.width <= 0 || c.height <= 0) say(`the message renders at ${c.width}x${c.height}`);
    if (!(content.textContent ?? '').trim()) say('the message is empty');

    const icon = partNamed('icon');
    if (combo.icon === false) {
      if (icon && icon.getBoundingClientRect().width > 0) {
        say('icon=false still paints an icon box');
      }
    } else if (!icon) {
      say('no part="icon" painted');
    } else {
      const i = icon.getBoundingClientRect();
      if (i.width <= 0 || i.height <= 0) say(`the icon renders at ${i.width}x${i.height}`);
      if (i.right > c.left + EPS) say('the icon is not left of the message');
      if (i.left < chip.left - EPS) say('the icon escapes the chip');
    }

    const close = sr.querySelector('.toast-close') as HTMLElement | null;
    if (combo.closable === false) {
      if (close && close.getBoundingClientRect().width > 0) {
        say('closable=false still paints a close box');
      }
    } else if (!close) {
      say('no close button painted');
    } else {
      const b = close.getBoundingClientRect();
      if (b.width <= 0 || b.height <= 0) say(`the close button renders at ${b.width}x${b.height}`);
      if (b.left < c.right - EPS) say('the close button overlaps the message');
      if (b.right > chip.right + EPS) say('the close button escapes the chip');
      if (getComputedStyle(close).cursor !== 'pointer') {
        say(`the close button answers the pointer with cursor "${getComputedStyle(close).cursor}"`);
      }
    }

    // ── the chip is on top of the page, reachable by a pointer ──────────────
    // The chip sits two shadow roots deep (container -> toast), so
    // document.elementFromPoint can never name it: its hit retargets to the
    // outermost tree element, i.e. always the container host. Walk the hit
    // down through each open shadow root — the tag exemplar's
    // sr.elementFromPoint technique, one level per boundary — and require
    // the walk to END inside the toast's own tree: anything else occludes.
    const px = chip.left + chip.width / 2, py = chip.top + chip.height / 2;
    let hit = document.elementFromPoint(px, py);
    while (hit && hit.shadowRoot) hit = hit.shadowRoot.elementFromPoint(px, py);
    if (!hit || !sr.contains(hit)) {
      say(`the chip is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    return problems;
  }, { combo, surface } as any);
}

async function mount(combo: Combo): Promise<void> {
  await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
}

test.describe('toast visual matrix: layer 1 — position x type', () => {
  for (const combo of ALL_COMBOS) {
    test(combo.id, async () => {
      await mount(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('toast visual matrix: layer 1 — the stack', () => {
  for (const combo of STACK_COMBOS) {
    test(combo.id, async () => {
      await mount(combo);
      await page.evaluate(() => (window as any).matrix.stack(['Second notice', 'Third notice']));
      const problems = await page.evaluate(() => {
        const problems: string[] = [];
        const say = (m: string) => problems.push(m);
        const container = document.body.querySelector('snice-toast-container')!;
        const wrapper = container.shadowRoot!.querySelector('.toast-wrapper') as HTMLElement;
        const w = wrapper.getBoundingClientRect();
        const toasts = [...container.shadowRoot!.querySelectorAll('snice-toast')];
        if (toasts.length !== 3) {
          say(`3 toasts were shown, ${toasts.length} are rendered`);
          return problems;
        }
        const boxes = toasts.map(toast => {
          const base = toast.shadowRoot!.querySelector('[part~="base"]') as HTMLElement;
          return base.getBoundingClientRect();
        });
        for (const box of boxes) {
          if (box.left < w.left - 1 || box.right > w.right + 1
            || box.top < w.top - 1 || box.bottom > w.bottom + 1) {
            say('a stacked chip escapes the container');
          }
        }
        for (const [index] of boxes.entries()) {
          if (index > 0) {
            const gap = boxes[index].top - boxes[index - 1].bottom;
            if (gap < -1) say(`chips ${index - 1} and ${index} overlap by ${(-gap).toFixed(1)}px`);
            if (gap > 40) say(`chips ${index - 1} and ${index} are ${gap.toFixed(1)}px apart — not a stack`);
          }
        }
        return problems;
      });
      expect(problems, `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * Departure — the thing the DOM tier CANNOT see. There, a dismissed toast
 * stays in the tree wearing its hiding mark forever, because no animation
 * ever ends. Here, the documented exits must actually leave the screen.
 */
test.describe('toast visual matrix: departure', () => {
  test('hide(id) takes the toast off the screen', async () => {
    await mount({ id: 'departure/hide', position: 'bottom-center', type: 'info' });
    const before = await page.evaluate(() => {
      const toast = document.body.querySelector('snice-toast-container')!
        .shadowRoot!.querySelector('snice-toast') as HTMLElement;
      const chip = toast.shadowRoot!.querySelector('[part~="base"]') as HTMLElement;
      const box = chip.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
    const gone = await page.evaluate(() => (window as any).matrix.dismiss());
    expect(gone.stillRendered, 'the dismissed toast is still rendered').toBe(0);
    expect(gone.stillConnected, 'the dismissed toast is still in the DOM').toBe(false);
    const hit = await page.evaluate(({ x, y }) => {
      const found = document.elementFromPoint(x, y);
      return found ? found.tagName.toLowerCase() : 'nothing';
    }, before);
    expect(hit, 'the place the chip occupied still answers to the toast').not.toBe('snice-toast');
  });

  test('the close button emits close-toast -> { id } and leaves the screen', async () => {
    await mount({ id: 'departure/close', position: 'top-right', type: 'error', message: 'Failed to load' });
    const clicked = await page.evaluate(() => (window as any).matrix.clickClose());
    expect(clicked.clicked, 'no close button to click').toBe(true);
    expect(clicked.events, 'close-toast dispatch count').toBe(1);
    expect(clicked.id, 'detail.id').toBe(await page.evaluate(() => (window as any).matrix.toastId));
    // clickClose already settles past the 300ms slide-out, so by the time
    // this reads the DOM the departure must be complete.
    const remaining = await page.evaluate(() =>
      document.body.querySelector('snice-toast-container')!.shadowRoot!
        .querySelectorAll('snice-toast').length);
    expect(remaining, 'the closed toast is still rendered').toBe(0);
  });

  test('clear() empties a stack', async () => {
    await mount({ id: 'departure/clear', position: 'bottom-left', type: 'warning' });
    await page.evaluate(() => (window as any).matrix.stack(['Two', 'Three']));
    const remaining = await page.evaluate(async () => {
      const container = document.body.querySelector('snice-toast-container') as any;
      container.clear();
      await (window as any).matrix.settle();
      return container.shadowRoot.querySelectorAll('snice-toast').length;
    });
    expect(remaining, 'toasts left after clear()').toBe(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A chip that "has the success background-color" can still
// wash its own message out; only pixels can tell "coloured" from "readable".

test.describe('toast visual matrix: marquee pixels', () => {
  test('a success toast carries a message readable on its chip', async () => {
    await mount({ id: 'marquee/success', position: 'bottom-center', type: 'success' });
    const pixels = await capture(
      page, 'snice-toast-container', 'toast-success-readable',
      // The toast lives in the container's shadow root; capture resolves the
      // selector with document.querySelector, which does not pierce shadows,
      // so the probe takes the CONTAINER and walks in itself.
      `(container) => {
        const toast = container.shadowRoot.querySelector('snice-toast');
        const base = toast.shadowRoot.querySelector('[part~="base"]');
        const content = toast.shadowRoot.querySelector('[part~="content"]');
        const b = base.getBoundingClientRect();
        const c = content.getBoundingClientRect();
        const points = [];
        // A fixed 12-point grid can land on antialiased glyph edges only
        // and under-report ink that is really there; scan a strip of rows
        // across the whole message so a painted stroke is actually hit.
        for (const fy of [0.35, 0.5, 0.65]) {
          for (let x = c.x + 2; x < c.x + c.width - 2; x += 2) {
            points.push({ x, y: c.y + c.height * fy });
          }
        }
        points.push({ x: b.x + 4, y: b.y + b.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed message pixel equals the chip ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    expect(best, `best message-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a warning toast keeps its dark ink readable on the yellow', async () => {
    await mount({ id: 'marquee/warning', position: 'bottom-center', type: 'warning', message: 'Low disk space remaining' });
    const pixels = await capture(
      page, 'snice-toast-container', 'toast-warning-readable',
      `(container) => {
        const toast = container.shadowRoot.querySelector('snice-toast');
        const base = toast.shadowRoot.querySelector('[part~="base"]');
        const content = toast.shadowRoot.querySelector('[part~="content"]');
        const b = base.getBoundingClientRect();
        const c = content.getBoundingClientRect();
        const points = [];
        // Same strip scan as the success marquee: full-stroke pixels, not
        // whatever a sparse grid happens to graze.
        for (const fy of [0.35, 0.5, 0.65]) {
          for (let x = c.x + 2; x < c.x + c.width - 2; x += 2) {
            points.push({ x, y: c.y + c.height * fy });
          }
        }
        points.push({ x: b.x + 4, y: b.y + b.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed message pixel equals the chip ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    // Dark ink on saturated yellow is the design's whole trick; hold it to
    // the same readability bar as inverse ink.
    expect(best, `best message-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('success and error paint two different chips', async () => {
    const chips = [];
    for (const type of ['success', 'error'] as ToastType[]) {
      await mount({ id: `marquee/${type}`, position: 'bottom-center', type });
      const [chip] = await capture(
        page, 'snice-toast-container', `toast-${type}-chip`,
        `(container) => {
          const toast = container.shadowRoot.querySelector('snice-toast');
          const base = toast.shadowRoot.querySelector('[part~="base"]');
          const b = base.getBoundingClientRect();
          return [{ x: b.x + 4, y: b.y + b.height / 2 }];
        }`,
      );
      chips.push(chip);
    }
    expect(sameColor(chips[0], chips[1]),
      `success and error both painted ${chips[0].join(',')}`).toBe(false);
  });
});
