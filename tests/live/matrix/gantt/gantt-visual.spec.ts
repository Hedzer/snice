/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-gantt TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/gantt, `npm run test:matrix`) owns structural
 * truth: which parts exist, how many bars, which labels, which group headers,
 * and what every documented event carries. It cannot own visual truth, because
 * happy-dom performs no layout — every box there reads 0, `overflow-x` never
 * scrolls anything, and no element can occlude another.
 *
 * A Gantt chart is a component whose ENTIRE point is geometry: a bar means
 * something only through where it starts, how wide it is, and which sidebar row
 * it lines up with. So this tier carries more weight here than for a purely
 * presentational component.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented `base`/`header`/`body`/`task-list`/`timeline` parts have
 *     real boxes, and they sit where the doc says: the header above the body,
 *     "task-list — Left sidebar" genuinely LEFT of "timeline — Right scrollable
 *     timeline area", with no overlap between them;
 *   · the timeline really scrolls — `overflow-x` resolves to a scrolling value
 *     and a timeline wider than its box really has scrollable extent, which is
 *     the only place the word "scrollable" in the docs can be checked;
 *   · bars are ordered and sized by their dates: a task starting later starts
 *     further right, and a task spanning more days is wider. This is the
 *     documented meaning of `start`/`end` and it exists only in pixels;
 *   · bars on different rows never overlap vertically, and a bar's label is
 *     never occluded by anything except its own bar (elementFromPoint through
 *     the shadow root) — the failure a DOM test structurally cannot see;
 *   · `progress` paints a sub-bar whose width really is that fraction of the
 *     bar, and `color` really reaches the painted background;
 *   · the today line resolves to the danger colour and spans the rows;
 *   · the three documented zoom levels really are three different scales, and
 *     the active toggle button really looks different from the inactive ones.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A background that "resolves" to a colour can still paint nothing. The
 *   marquee captures decode the PNG inside the browser under test and assert
 *   that a bar really paints its primary fill, a `color` override really
 *   replaces it, a bar label really contrasts against the bar it sits on, and
 *   the documented "red vertical indicator" really paints red pixels.
 *
 * ── FINDING ────────────────────────────────────────────────────────────────
 *
 * MATRIX-gantt-3  sidebar rows do not line up with their own bars.
 *   combo:    dataset=flat|basic|grouped|mixed, zoom=week (every dataset with
 *             more than one task, at every zoom)
 *   expected: the sidebar row for a task vertically overlaps that task's bar —
 *             the correspondence that makes "task-list — Left sidebar with task
 *             names" readable against "timeline — Right scrollable timeline
 *             area" at all.
 *   actual:   the two columns advance at different pitches. `.gantt-task-name`
 *             declares `height: 2.25rem` under content-box sizing and adds
 *             0.5rem of vertical padding plus a 1px border, so a sidebar row
 *             occupies 53px, while the timeline places each bar on a 2.25rem
 *             (36px) row. Row 0's name is already 24px below its bar and the
 *             gap grows by 17px per row, so by the fourth task the name sits
 *             beside a different task's bar entirely. Group headers add a
 *             second, independent error: the timeline reserves a full 36px row
 *             for each, but `.gantt-group-header` renders 31px tall.
 *   Pinned with `test.fail()` below; every other claim in this file passes.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/gantt/matrix.html';

type Dataset = 'single' | 'basic' | 'grouped' | 'flat' | 'mixed' | 'chained'
  | 'styled' | 'spans' | 'today';
type Zoom = 'day' | 'week' | 'month';

interface Combo {
  id: string;
  dataset: Dataset;
  zoom: Zoom;
  showDependencies: boolean;
}

const DATASETS: Dataset[] = [
  'single', 'basic', 'grouped', 'flat', 'mixed', 'chained', 'styled', 'spans', 'today',
];
const ZOOMS: Zoom[] = ['day', 'week', 'month'];

/**
 * The cross: dataset (9 populated) x zoom (3) = 27 combos, with
 * `showDependencies` rotated across them so neither setting is ever constant
 * for a whole run. The empty dataset paints no bars and is checked once, on its
 * own, at the end — measuring "bars do not overlap" across zero bars is how a
 * geometry suite goes quietly vacuous.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const dataset of DATASETS) {
    for (const zoom of ZOOMS) {
      const showDependencies = n % 2 === 0;
      combos.push({
        id: `${dataset}/${zoom}/${showDependencies ? 'deps' : 'no-deps'}`,
        dataset, zoom, showDependencies,
      });
      n++;
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
  return page.evaluate(async (combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    await (window as any).matrix.mount(combo);
    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The documented parts, and where they sit relative to one another ────
    const partOf = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
    const base = partOf('base');
    const header = partOf('header');
    const body = partOf('body');
    const taskList = partOf('task-list');
    const timeline = partOf('timeline');
    for (const [name, node] of Object.entries({ base, header, body, 'task-list': taskList, timeline })) {
      if (!node) { say(`no [part="${name}"] rendered`); }
    }
    if (!base || !header || !body || !taskList || !timeline) return problems;

    for (const [name, node] of Object.entries({ base, header, body, 'task-list': taskList, timeline })) {
      const box = rect(node);
      if (box.width <= 0 || box.height <= 0) say(`${name} renders at ${box.width}x${box.height}`);
    }

    const headerBox = rect(header);
    const bodyBox = rect(body);
    const listBox = rect(taskList);
    const timelineBox = rect(timeline);

    // "header — Top header bar" sits above "body — Main content area".
    if (headerBox.bottom > bodyBox.top + 1) {
      say(`header bottom ${headerBox.bottom.toFixed(0)} overlaps body top ${bodyBox.top.toFixed(0)}`);
    }
    // "task-list — Left sidebar" / "timeline — Right scrollable timeline area".
    if (listBox.right > timelineBox.left + 1) {
      say(`task-list right ${listBox.right.toFixed(0)} overlaps timeline left ${timelineBox.left.toFixed(0)}`);
    }
    if (listBox.left < bodyBox.left - 1 || timelineBox.right > bodyBox.right + 1) {
      say('task-list/timeline escape the body box');
    }

    // "Right SCROLLABLE timeline area" — the overflow really has to scroll.
    const timelineCs = getComputedStyle(timeline);
    if (!['auto', 'scroll'].includes(timelineCs.overflowX)) {
      say(`timeline overflow-x "${timelineCs.overflowX}" cannot scroll`);
    }
    if (timeline.scrollWidth > timeline.clientWidth + 1) {
      const before = timeline.scrollLeft;
      timeline.scrollLeft = timeline.scrollWidth;
      const moved = timeline.scrollLeft > before;
      timeline.scrollLeft = before;
      if (!moved) say('timeline overflows its box but will not scroll');
    }

    // ── Zoom toggle: the active button must LOOK active ─────────────────────
    const zoomButtons = [...sr.querySelectorAll('.gantt-zoom-btn')] as HTMLElement[];
    if (zoomButtons.length !== 3) {
      say(`${zoomButtons.length} zoom buttons painted, expected 3`);
    } else {
      const want = { day: 'Day', week: 'Week', month: 'Month' }[combo.zoom];
      const active = zoomButtons.find(b => b.textContent!.trim() === want)!;
      const others = zoomButtons.filter(b => b !== active);
      const activeBg = getComputedStyle(active).backgroundColor;
      for (const other of others) {
        if (getComputedStyle(other).backgroundColor === activeBg) {
          say(`zoom "${combo.zoom}" active button paints the same background as "${other.textContent!.trim()}"`);
        }
      }
      for (const button of zoomButtons) {
        const box = rect(button);
        if (box.width <= 0 || box.height <= 0) say(`zoom button "${button.textContent!.trim()}" has no box`);
        if (box.right > headerBox.right + 1) say(`zoom button "${button.textContent!.trim()}" escapes the header`);
      }
    }

    // ── Bars: the geometry that IS the component ────────────────────────────
    const tasks = (host as any).tasks as Array<{
      id: string; name: string; start: string; end: string; progress?: number; color?: string;
    }>;
    const bars = [...sr.querySelectorAll('.gantt-bar')] as HTMLElement[];
    if (bars.length !== tasks.length) {
      say(`${bars.length} bars painted for ${tasks.length} tasks`);
      return problems;
    }

    const DAY = 86400000;
    const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);

    const measured = bars.map((bar, i) => ({ task: tasks[i], bar, box: rect(bar) }));
    for (const { task, box } of measured) {
      if (box.width <= 0 || box.height <= 0) say(`bar "${task.name}" renders at ${box.width}x${box.height}`);
    }

    // A later start paints further right; a longer span paints wider. Both are
    // the documented meaning of `start` and `end`, and both need real pixels.
    for (let i = 0; i < measured.length; i++) {
      for (let j = i + 1; j < measured.length; j++) {
        const a = measured[i];
        const b = measured[j];
        const startDelta = days(a.task.start, b.task.start);
        if (startDelta > 0 && b.box.left <= a.box.left) {
          say(`"${b.task.name}" starts ${startDelta}d after "${a.task.name}" but paints at or left of it`);
        }
        if (startDelta < 0 && b.box.left >= a.box.left) {
          say(`"${b.task.name}" starts ${-startDelta}d before "${a.task.name}" but paints at or right of it`);
        }
        const spanA = days(a.task.start, a.task.end);
        const spanB = days(b.task.start, b.task.end);
        // The component floors very short bars at a minimum width, so only
        // clearly different spans are compared.
        if (spanA >= spanB + 3 && a.box.width <= b.box.width) {
          say(`"${a.task.name}" spans ${spanA}d vs "${b.task.name}" ${spanB}d but is not wider`);
        }
      }
    }

    // Bars on distinct rows must not overlap vertically.
    const rows = new Map<number, string[]>();
    for (const { task, box } of measured) {
      const key = Math.round(box.top);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key)!.push(task.name);
    }
    const tops = [...rows.keys()].sort((a, b) => a - b);
    for (let i = 1; i < tops.length; i++) {
      const height = measured.find(m => Math.round(m.box.top) === tops[i - 1])!.box.height;
      if (tops[i] < tops[i - 1] + height) {
        say(`rows at ${tops[i - 1]} and ${tops[i]} overlap (bar height ${height})`);
      }
    }

    // ── Progress and colour, as painted ─────────────────────────────────────
    for (const { task, bar, box } of measured) {
      const progressEl = bar.querySelector('.gantt-bar-progress') as HTMLElement | null;
      const progress = task.progress ?? 0;
      if (progress > 0) {
        if (!progressEl) {
          say(`"${task.name}" has progress ${progress} but paints no indicator`);
        } else {
          const pBox = rect(progressEl);
          const fraction = pBox.width / box.width;
          if (Math.abs(fraction - progress / 100) > 0.05) {
            say(`"${task.name}" progress paints ${(fraction * 100).toFixed(0)}% of the bar, authored ${progress}%`);
          }
          if (pBox.left < box.left - 1 || pBox.right > box.right + 1) {
            say(`"${task.name}" progress indicator escapes its bar`);
          }
        }
      } else if (progressEl) {
        say(`"${task.name}" has no progress but paints an indicator`);
      }

      if (task.color) {
        const painted = getComputedStyle(bar).backgroundColor;
        // Every authored form resolves to some rgb(); what matters is that it
        // is NOT the default primary the uncoloured bars use.
        const plain = measured.find(m => !m.task.color);
        if (plain && painted === getComputedStyle(plain.bar).backgroundColor) {
          say(`"${task.name}" colour override "${task.color}" paints the same as an uncoloured bar`);
        }
        if (painted === 'rgba(0, 0, 0, 0)') say(`"${task.name}" bar paints no background at all`);
      }
    }

    // ── Occlusion: a bar's label must be reachable on its own bar ───────────
    for (const { task, bar, box } of measured) {
      const labelEl = bar.querySelector('.gantt-bar-label') as HTMLElement | null;
      if (!labelEl) { say(`"${task.name}" paints no label`); continue; }
      const labelBox = rect(labelEl);
      // The stylesheet caps the label at `calc(100% - 1rem)`, so a bar narrower
      // than its own inset genuinely has no room for text. That is a legible
      // consequence of the documented minimum bar width, not a defect — the
      // claim is only that a bar WIDE ENOUGH to hold a label actually shows one.
      const roomForText = box.width > 24;
      if (roomForText && (labelBox.width <= 0 || labelBox.height <= 0)) {
        say(`"${task.name}" label renders at ${labelBox.width}x${labelBox.height} on a ${box.width.toFixed(0)}px bar`);
        continue;
      }
      if (labelBox.width <= 0) continue;
      if (labelBox.left < box.left - 1 || labelBox.right > box.right + 1) {
        say(`"${task.name}" label escapes its bar horizontally`);
      }
      // The label is `pointer-events: none`, so the hit test must land on the
      // bar itself — anything else means something is painting over the bar.
      const probeY = box.top + box.height / 2;
      for (const fraction of [0.25, 0.5, 0.75]) {
        const probeX = box.left + box.width * fraction;
        if (probeX < timelineBox.left || probeX > timelineBox.right) continue;
        if (probeY < timelineBox.top || probeY > timelineBox.bottom) continue;
        const hit = sr.elementFromPoint(probeX, probeY);
        if (hit && !bar.contains(hit) && hit !== bar) {
          const hitClass = (hit as HTMLElement).className || hit.nodeName;
          // The today line is documented to sit ON TOP of the bars, so it is
          // the one legitimate occluder.
          if (!String(hitClass).includes('gantt-today-line')) {
            say(`"${task.name}" is occluded at ${(fraction * 100).toFixed(0)}% by "${hitClass}"`);
          }
        }
      }
    }

    // ── The today line ──────────────────────────────────────────────────────
    const todayLine = sr.querySelector('.gantt-today-line') as HTMLElement | null;
    if (todayLine) {
      const lineBox = rect(todayLine);
      if (lineBox.width <= 0 || lineBox.width > 6) {
        say(`today line is ${lineBox.width}px wide, not a thin vertical indicator`);
      }
      if (lineBox.height <= 0) say('today line has no height');
      const lineColor = getComputedStyle(todayLine).backgroundColor;
      if (lineColor === 'rgba(0, 0, 0, 0)') say('today line paints no colour');
      // "red vertical indicator": the red channel must dominate.
      const rgb = lineColor.match(/\d+/g)?.map(Number) ?? [];
      if (rgb.length >= 3 && !(rgb[0] > rgb[1] + 30 && rgb[0] > rgb[2] + 30)) {
        say(`today line colour ${lineColor} is not red`);
      }
    }

    return problems;
  }, combo);
}

for (const combo of generateCombos()) {
  test(`layer1 ${combo.id}`, async () => {
    expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
  });
}

test('layer1 empty: the shell still paints with no tasks', async () => {
  const problems = await page.evaluate(async () => {
    const out: string[] = [];
    await (window as any).matrix.mount({ dataset: 'empty', zoom: 'week' });
    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const box = host.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) out.push(`host renders at ${box.width}x${box.height}`);
    for (const name of ['base', 'header', 'controls', 'body', 'task-list', 'timeline']) {
      const node = sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
      if (!node) { out.push(`no [part="${name}"]`); continue; }
      const nodeBox = node.getBoundingClientRect();
      if (nodeBox.width <= 0) out.push(`${name} has no width with an empty chart`);
    }
    if (sr.querySelectorAll('.gantt-bar').length !== 0) out.push('bars painted for an empty chart');
    return out;
  });
  expect(problems).toEqual([]);
});

test('layer1 zoom: the three documented levels are three different scales', async () => {
  const widths = await page.evaluate(async () => {
    const out: Record<string, number> = {};
    for (const zoom of ['day', 'week', 'month']) {
      await (window as any).matrix.mount({ dataset: 'basic', zoom });
      const timeline = (window as any).matrix.el.shadowRoot.querySelector('.gantt-timeline');
      out[zoom] = timeline.scrollWidth;
    }
    return out;
  });
  const distinct = new Set(Object.values(widths));
  expect(distinct.size, `zoom scales collapsed: ${JSON.stringify(widths)}`).toBe(3);
});

test('layer1 zoom toggle: clicking a button re-scales the painted timeline', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ dataset: 'basic', zoom: 'week' });
    const el = (window as any).matrix.el;
    const timeline = el.shadowRoot.querySelector('.gantt-timeline');
    const before = timeline.scrollWidth;
    const zoom = await (window as any).matrix.clickZoom('Day');
    const after = el.shadowRoot.querySelector('.gantt-timeline').scrollWidth;
    return { zoom, before, after };
  });
  expect(result.zoom).toBe('day');
  expect(result.after).not.toBe(result.before);
});

test('layer1 scrollToDate really moves the scrollable timeline', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ dataset: 'spans', zoom: 'day' });
    return (window as any).matrix.scrollToDate('2026-10-15');
  });
  // "Scroll timeline to center on a date" — with a timeline far wider than its
  // box, a late date must land somewhere past the start.
  expect(result.max).toBeGreaterThan(0);
  expect(result.after).toBeGreaterThan(result.before);
});

test('layer1 scrollToTask scrolls to that task\'s start', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ dataset: 'spans', zoom: 'day' });
    return (window as any).matrix.scrollToTask('tiny');
  });
  expect(result.max).toBeGreaterThan(0);
  expect(result.after).toBeGreaterThan(result.before);
});

// ── MATRIX-gantt-3 ─────────────────────────────────────────────────────────
// The sidebar/timeline row correspondence. Kept at full strength and pinned.
for (const dataset of ['flat', 'basic', 'grouped', 'mixed'] as Dataset[]) {
  test(`MATRIX-gantt-3 ${dataset}: each sidebar row lines up with its own bar`, async () => {
    test.fail();
    const problems = await page.evaluate(async (dataset) => {
      const out: string[] = [];
      await (window as any).matrix.mount({ dataset, zoom: 'week' });
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const tasks = (host as any).tasks as Array<{ name: string }>;

      const names = [...sr.querySelectorAll('.gantt-task-name')] as HTMLElement[];
      const bars = [...sr.querySelectorAll('.gantt-bar')] as HTMLElement[];
      const barByName = new Map(bars.map(bar => [
        bar.querySelector('.gantt-bar-label')!.textContent!.trim(),
        bar.getBoundingClientRect(),
      ]));

      for (const nameEl of names) {
        const label = nameEl.textContent!.trim();
        const nameBox = nameEl.getBoundingClientRect();
        const barBox = barByName.get(label);
        if (!barBox) { out.push(`no bar found for sidebar row "${label}"`); continue; }
        // The rows must OVERLAP vertically. Nothing tighter is claimed — the
        // doc fixes no row height — but a name whose band misses its bar
        // entirely is naming the wrong bar to the reader.
        const overlap = Math.min(nameBox.bottom, barBox.bottom) - Math.max(nameBox.top, barBox.top);
        if (overlap <= 0) {
          out.push(`"${label}" sidebar row [${nameBox.top.toFixed(0)}, ${nameBox.bottom.toFixed(0)}] `
            + `does not overlap its bar [${barBox.top.toFixed(0)}, ${barBox.bottom.toFixed(0)}]`);
        }
      }
      if (names.length !== tasks.length) out.push(`${names.length} sidebar rows for ${tasks.length} tasks`);
      return out;
    }, dataset);
    expect(problems, `MATRIX-gantt-3 ${dataset}`).toEqual([]);
  });
}

// ── LAYER 2: real screenshots ──────────────────────────────────────────────

/** Probe source: the centre of each painted bar, resolved after the capture. */
const BAR_CENTRES = `(host) => {
  const bars = [...host.shadowRoot.querySelectorAll('.gantt-bar')];
  return bars.map(bar => {
    const box = bar.getBoundingClientRect();
    return { x: box.left + box.width * 0.75, y: box.top + box.height / 2 };
  });
}`;

test('marquee: a bar really paints a visible fill', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ dataset: 'flat', zoom: 'week' }));
  const colors = await capture(page, '#subject', 'gantt-bars-default', BAR_CENTRES);
  expect(colors.length).toBeGreaterThan(0);

  const surface = await page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    return getComputedStyle(host.shadowRoot!.querySelector('[part~="base"]')!).backgroundColor;
  });
  const surfaceRgb = (surface.match(/\d+/g) ?? ['255', '255', '255']).slice(0, 3).map(Number) as RGB;

  for (const color of colors) {
    expect(sameColor(color, surfaceRgb), `bar painted the surface colour ${color}`).toBe(false);
    // A bar the reader can find at all.
    expect(contrast(color, surfaceRgb)).toBeGreaterThan(1.3);
  }
});

test('marquee: a colour override really replaces the painted fill', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ dataset: 'styled', zoom: 'week' }));
  const colors = await capture(page, '#subject', 'gantt-bars-styled', BAR_CENTRES);
  expect(colors).toHaveLength(3);

  // The styled dataset authors three bars: default primary, then an explicit
  // green and an explicit purple. All three must paint differently.
  const [plain, green, purple] = colors;
  expect(sameColor(plain, green), `default ${plain} and green ${green} paint alike`).toBe(false);
  expect(sameColor(plain, purple), `default ${plain} and purple ${purple} paint alike`).toBe(false);
  expect(sameColor(green, purple), `green ${green} and purple ${purple} paint alike`).toBe(false);
  // …and the green really is green, the purple really has red+blue over green.
  expect(green[1]).toBeGreaterThan(green[0]);
  expect(purple[0]).toBeGreaterThan(purple[1]);
  expect(purple[2]).toBeGreaterThan(purple[1]);
});

test('marquee: a bar label is legible against its own bar', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ dataset: 'flat', zoom: 'month' }));
  // Two points inside the first bar: one on the label glyphs, one on the fill.
  const probe = `(host) => {
    const bar = host.shadowRoot.querySelector('.gantt-bar');
    const label = bar.querySelector('.gantt-bar-label');
    const labelBox = label.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    return [
      { x: labelBox.left + 2, y: labelBox.top + labelBox.height / 2 },
      { x: barBox.right - 3, y: barBox.top + barBox.height / 2 },
    ];
  }`;
  const [, fill] = await capture(page, '#subject', 'gantt-bar-label', probe);

  const labelColor = await page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    const label = host.shadowRoot!.querySelector('.gantt-bar-label') as HTMLElement;
    return getComputedStyle(label).color;
  });
  const labelRgb = (labelColor.match(/\d+/g) ?? []).slice(0, 3).map(Number) as RGB;
  // The stylesheet puts inverse text on a primary bar; that pairing has to be
  // readable on the pixels actually painted.
  expect(contrast(labelRgb, fill), `label ${labelColor} on bar ${fill}`).toBeGreaterThan(3);
});

test('marquee: the today line really paints red pixels', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ dataset: 'today', zoom: 'day' }));
  const probe = `(host) => {
    const line = host.shadowRoot.querySelector('.gantt-today-line');
    const box = line.getBoundingClientRect();
    return [
      { x: box.left + box.width / 2, y: box.top + box.height * 0.25 },
      { x: box.left + box.width / 2, y: box.top + box.height * 0.75 },
    ];
  }`;
  const points = await capture(page, '#subject', 'gantt-today-line', probe);
  expect(points).toHaveLength(2);
  for (const [r, g, b] of points) {
    expect(r, `today line pixel rgb(${r} ${g} ${b}) is not red`).toBeGreaterThan(g + 30);
    expect(r, `today line pixel rgb(${r} ${g} ${b}) is not red`).toBeGreaterThan(b + 30);
  }
});
