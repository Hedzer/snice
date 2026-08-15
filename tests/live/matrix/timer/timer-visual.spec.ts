/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-timer TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/timer, `npm run test:matrix`) owns
 * behaviour truth: what `start`/`stop`/`reset` do to `getTime()`, which events
 * fire, which control the component renders for a given `running`. It cannot own
 * visual truth, because happy-dom performs no layout — every box reads 0,
 * nothing is painted, and a control rendered UNDER another control looks
 * identical to one rendered beside it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the card has a real box, with the display above the controls (docs:
 *     `display` is the time display, `controls` the button container);
 *   · the display reserves a stable, tabular width, so a ticking clock does not
 *     make the card jump — asserted as "the display box is the same width when
 *     the timer reads 0:00.0 and when it reads a running time";
 *   · every control is a real, round, non-zero button carrying a painted icon;
 *   · the controls do not overlap each other or the display;
 *   · EVERY control is hit-testable at its own centre (elementFromPoint through
 *     the shadow root) — a button that cannot be clicked is exactly the defect a
 *     DOM test cannot see;
 *   · the visible control set matches `running`, and its buttons are painted
 *     with a real (non-transparent) background.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The marquee captures decode the PNG inside the browser under test: the
 *   digits must contrast with the card they sit on, and the start button and the
 *   pause button must not paint the same pixels — otherwise the running state
 *   never reaches the screen.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/timer/matrix.html';

type Mode = 'stopwatch' | 'timer';
type Phase = 'idle' | 'running' | 'paused';

interface Combo {
  id: string;
  mode: Mode;
  initialTime: number;
  phase: Phase;
}

/**
 * The cross: mode (2) x initial-time (2 per mode) x phase (idle, running,
 * paused) = 12 combos. Sized to a component with one render branch (`running`);
 * the point of this tier is that the branch, the layout and the hit-testing all
 * get a real browser.
 *
 * A countdown's initial times are non-zero on purpose: a `timer` authored at 0
 * seconds has already reached 0, so `start()` completes it in the same frame and
 * there is no "running" phase to look at. That behaviour is asserted where it
 * belongs, in the DOM matrix; here it would only produce a combo with no visual
 * question in it.
 */
const INITIAL_TIMES: Record<Mode, number[]> = {
  stopwatch: [0, 60],
  timer: [60, 3725],
};

function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const mode of ['stopwatch', 'timer'] as Mode[]) {
    for (const initialTime of INITIAL_TIMES[mode]) {
      for (const phase of ['idle', 'running', 'paused'] as Phase[]) {
        combos.push({
          id: `${mode}/initial:${initialTime}/${phase}`,
          mode, initialTime, phase,
        });
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
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const base = partNamed('base');
    const display = partNamed('display');
    const controls = partNamed('controls');
    if (!base) { say('no part="base"'); return problems; }
    if (!display) { say('no part="display"'); return problems; }
    if (!controls) { say('no part="controls"'); return problems; }

    const baseBox = rect(base);
    const displayBox = rect(display);
    const controlsBox = rect(controls);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`card renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    if (displayBox.width <= 0 || displayBox.height <= 0) {
      say(`display renders at ${displayBox.width}x${displayBox.height}`);
    }
    if (controlsBox.width <= 0 || controlsBox.height <= 0) {
      say(`controls render at ${controlsBox.width}x${controlsBox.height}`);
    }

    // ── The documented stacking: the time above its buttons ────────────────
    if (controlsBox.top < displayBox.bottom - EPS) {
      say(`controls (top ${controlsBox.top.toFixed(1)}) are not below the display`
        + ` (bottom ${displayBox.bottom.toFixed(1)})`);
    }
    for (const [name, box] of [['display', displayBox], ['controls', controlsBox]] as const) {
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS
        || box.top < baseBox.top - EPS || box.bottom > baseBox.bottom + EPS) {
        say(`${name} escapes the card box`);
      }
    }

    const displayCs = getComputedStyle(display);
    if (parseFloat(displayCs.fontSize) < 16) say(`display font-size ${displayCs.fontSize}`);
    if (displayCs.visibility !== 'visible') say(`display visibility "${displayCs.visibility}"`);
    if (!(display.textContent ?? '').trim()) say('the display is empty');

    // ── The controls ───────────────────────────────────────────────────────
    const buttons = [...controls.querySelectorAll('button')] as HTMLButtonElement[];
    const titles = buttons.map(b => b.getAttribute('title'));
    const wanted = combo.phase === 'running' ? ['Pause', 'Reset'] : ['Start', 'Reset'];
    if (JSON.stringify(titles) !== JSON.stringify(wanted)) {
      say(`controls are ${JSON.stringify(titles)}, expected ${JSON.stringify(wanted)}`);
    }

    let previousRight = -Infinity;
    for (const [i, button] of buttons.entries()) {
      const box = rect(button);
      const cs = getComputedStyle(button);
      const label = button.getAttribute('title') ?? `#${i}`;

      if (box.width <= 0 || box.height <= 0) {
        say(`the ${label} button renders at ${box.width}x${box.height}`);
        continue;
      }
      if (Math.abs(box.width - box.height) > 1) {
        say(`the ${label} button is not round: ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
      }
      if (parseFloat(cs.borderTopLeftRadius) < box.width / 2 - 1) {
        say(`the ${label} button radius ${cs.borderTopLeftRadius} does not round a`
          + ` ${box.width.toFixed(0)}px box`);
      }
      if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
        say(`the ${label} button paints no background`);
      }
      if (cs.cursor !== 'pointer') {
        say(`the ${label} button cursor is "${cs.cursor}", not "pointer"`);
      }
      if (box.left < previousRight - EPS) {
        say(`the ${label} button (left ${box.left.toFixed(1)}) overlaps the one before it`);
      }
      previousRight = box.right;

      const icon = button.querySelector('svg');
      if (!icon) { say(`the ${label} button has no icon`); }
      else {
        const iconBox = rect(icon);
        if (iconBox.width <= 0 || iconBox.height <= 0) {
          say(`the ${label} button icon renders at ${iconBox.width}x${iconBox.height}`);
        }
        if (iconBox.width > box.width + EPS || iconBox.height > box.height + EPS) {
          say(`the ${label} button icon (${iconBox.width.toFixed(0)}x${iconBox.height.toFixed(0)})`
            + ` is larger than its button (${box.width.toFixed(0)}x${box.height.toFixed(0)})`);
        }
      }

      // A control nobody can click is not a control.
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`the ${label} button hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the timer');
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== button && !button.contains(hit as Node)) {
        say(`the ${label} button is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('timer visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mode).toBe(combo.mode);
      expect(mounted.running).toBe(combo.phase === 'running');
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('timer visual matrix: the display does not resize as it ticks', () => {
  test('a running stopwatch keeps the display box it had at rest', async () => {
    // A tabular clock that reflows on every frame makes the whole card jitter.
    // Only layout can see this, and only while the numbers are actually moving.
    const idle = await page.evaluate(async () => {
      await (window as any).matrix.mount({ mode: 'stopwatch', initialTime: 0, phase: 'idle' });
      const host = document.getElementById('subject') as HTMLElement;
      const display = host.shadowRoot!.querySelector('[part~="display"]')!;
      return { width: display.getBoundingClientRect().width, text: display.textContent };
    });
    const running = await page.evaluate(async () => {
      await (window as any).matrix.mount({ mode: 'stopwatch', initialTime: 0, phase: 'running' });
      const host = document.getElementById('subject') as HTMLElement;
      const display = host.shadowRoot!.querySelector('[part~="display"]')!;
      return { width: display.getBoundingClientRect().width, text: display.textContent };
    });

    expect(idle.width, 'the idle display has no box').toBeGreaterThan(0);
    expect(running.width, `display width moved from ${idle.width} to ${running.width}`)
      .toBeCloseTo(idle.width, 0);
    expect(running.text, 'a running stopwatch shows the same text as an idle one')
      .not.toBe(idle.text);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('timer visual matrix: marquee pixels', () => {
  test('the digits are legible on the card they sit on', async () => {
    await page.evaluate(async () => {
      await (window as any).matrix.mount({ mode: 'timer', initialTime: 60, phase: 'idle' });
    });
    const pixels = await capture(
      page, '#subject', 'timer-digits',
      `(host) => {
        const display = host.shadowRoot.querySelector('[part~="display"]');
        const card = host.shadowRoot.querySelector('[part~="base"]');
        const d = display.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        // A dense grid over the display box: the digits are glyph strokes on a
        // wide tabular field, so a single scan line can miss every stem and
        // report an antialiased edge as the best the component paints.
        const points = [];
        for (let ix = 1; ix < 40; ix++) {
          for (const fy of [0.35, 0.5, 0.65]) {
            points.push({ x: d.x + (d.width * ix) / 40, y: d.y + d.height * fy });
          }
        }
        points.push({ x: c.x + 3, y: c.y + 3 });
        return points;
      }`,
    );
    const card = pixels[pixels.length - 1] as RGB;
    const digits = pixels.slice(0, -1) as RGB[];
    expect(digits.some(p => !sameColor(p, card)),
      `every probed digit pixel equals the card ${card.join(',')}`).toBe(true);
    const best = Math.max(...digits.map(p => contrast(p, card)));
    expect(best, `best digit-vs-card contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(4);
  });

  test('the start control and the pause control paint differently', async () => {
    // Probed near the rim rather than dead centre: the middle of the button is
    // the icon glyph, which is the same inverse colour on every control — the
    // question here is what the BUTTON is painted with.
    const probe = `(host) => {
      const button = host.shadowRoot.querySelector('[part~="controls"] button');
      const b = button.getBoundingClientRect();
      return [{ x: b.x + b.width * 0.5, y: b.y + b.height * 0.12 }];
    }`;
    await page.evaluate(async () => {
      await (window as any).matrix.mount({ mode: 'stopwatch', initialTime: 0, phase: 'idle' });
    });
    const [start] = await capture(page, '#subject', 'timer-start-button', probe);
    // NOT frozen: stopping the timer would swap the pause control back to start
    // before the shutter, and the capture would compare start against start.
    await page.evaluate(async () => {
      await (window as any).matrix.mount({ mode: 'stopwatch', initialTime: 0, phase: 'running' });
    });
    const [pause] = await capture(page, '#subject', 'timer-pause-button', probe);

    // The running state swaps the leading control. Identical pixels would mean
    // the swap never reached the screen.
    expect(sameColor(start as RGB, pause as RGB),
      `start painted ${start.join(',')}, pause painted ${pause.join(',')}`).toBe(false);
  });
});
