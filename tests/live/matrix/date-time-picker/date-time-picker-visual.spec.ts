/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-date-time-picker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/date-time-picker, 275 cases via
 * `npm run test:matrix`) owns everything a string can answer: display formats,
 * parsing, the validity mapping, parts, naming, live-vs-default. It cannot own
 * two whole clauses of this component's documentation, because happy-dom
 * performs no layout AND implements no form plumbing behind `ElementInternals`:
 *
 *   · "Popup is top-layer when available, viewport-clamped, internally
 *     scrollable, and responsive." Every word of that is geometry.
 *   · "`disabled`/disabled fieldset: … omitted from FormData"; "an enabled
 *     picker … contributes"; the first-`<legend>` exception. `new FormData()`
 *     returns nothing for a custom element under happy-dom, so the DOM tier
 *     deliberately declines to assert it and this tier does it for real.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion + FormData ──
 *   · the control has a real box, the input is reachable, and the `size` axis
 *     really changes its height;
 *   · an open popup stays inside the viewport on every edge it is pushed to,
 *     and stays anchored to its input;
 *   · a popup taller than the space available scrolls INTERNALLY rather than
 *     growing off-screen;
 *   · nothing in the page paints over the popup — checked against a deliberate
 *     high-z-index rival, which is what "top-layer when available" buys;
 *   · the calendar's selected day and a disabled day are visually distinct from
 *     an ordinary one (computed style), because "out-of-range days are
 *     disabled" means nothing if it does not show;
 *   · the real engine's `FormData` and `ValidityState` agree with the docs.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A selected day that "has a different background-color" can still be
 *   invisible. The marquee captures decode the PNG inside the browser under
 *   test and assert the selection and the error text really paint.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/date-time-picker/matrix.html';

/**
 * Probe source: every 2px along the mid-height row of the first element
 * matching `selector`, so text assertions read the row the glyphs sit in
 * instead of one phase-lucky coordinate.
 */
const ROW_WALK = (selector: string) => `(host) => {
  const node = host.shadowRoot.querySelector('${selector}');
  const box = node.getBoundingClientRect();
  const points = [];
  for (let x = 1; x < box.width; x += 2) {
    points.push({ x: box.x + x, y: box.y + box.height / 2 });
  }
  return points;
}`;

type Corner = '' | 'bottom-right' | 'top-right';

interface Combo {
  id: string;
  variant: 'dropdown' | 'inline';
  size: 'small' | 'medium' | 'large';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  corner: Corner;
  open: boolean;
}

/**
 * The cross: variant (2) x size (3) x timeFormat (2) x showSeconds (2) = 24
 * combos, with `dateFormat` and the stage corner rotated across them. Sized to
 * the component's VISUAL surface rather than its API surface — the seven date
 * formats are a string question the DOM tier already answers 28 ways, while the
 * popup's corner behaviour is a browser question that only exists here.
 */
function generateCombos(): Combo[] {
  const formats = ['yyyy-mm-dd', 'mm/dd/yyyy', 'dd/mm/yyyy', 'mmmm dd, yyyy'];
  const corners: Corner[] = ['', 'bottom-right', 'top-right'];
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of ['dropdown', 'inline'] as const) {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const timeFormat of ['24h', '12h'] as const) {
        for (const showSeconds of [false, true]) {
          const dateFormat = formats[n % formats.length];
          const corner = corners[n % corners.length];
          combos.push({
            id: `${variant}/${size}/${timeFormat}/${showSeconds ? 'seconds' : 'minutes'}`
              + `/[${dateFormat}${corner ? `,${corner}` : ''}]`,
            variant, size, timeFormat, showSeconds, dateFormat, corner,
            open: variant === 'dropdown',
          });
          n++;
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
      sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The editable field (dropdown only — inline is a composite panel) ────
    if (combo.variant === 'dropdown') {
      const input = partNamed('input');
      if (!input) { say('no [part="input"] rendered'); return problems; }
      const inputBox = rect(input);
      if (inputBox.width <= 0 || inputBox.height <= 0) {
        say(`input renders at ${inputBox.width}x${inputBox.height}`);
      }
      // The input must be the thing a pointer lands on, not something under a
      // toggle button that grew over it.
      const hit = (sr as any).elementFromPoint(
        inputBox.left + inputBox.width * 0.3,
        inputBox.top + inputBox.height / 2,
      ) as Element | null;
      if (hit !== input) {
        say(`the input is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }

      // The toggle must be inside the field and clickable.
      const toggle = partNamed('toggle');
      if (!toggle) say('no [part="toggle"] rendered');
      else {
        const toggleBox = rect(toggle);
        if (toggleBox.width <= 0 || toggleBox.height <= 0) {
          say(`toggle renders at ${toggleBox.width}x${toggleBox.height}`);
        }
        if (toggleBox.right > hostBox.right + EPS || toggleBox.left < hostBox.left - EPS) {
          say('the toggle button sits outside the control');
        }
      }
      // Record the height so the size axis can be compared across combos.
      (window as any).__lastInputHeight = inputBox.height;
    }

    // ── The panel ───────────────────────────────────────────────────────────
    const panel = partNamed('panel');
    if (!panel) { say('no [part="panel"] rendered'); return problems; }

    const shown = !panel.hasAttribute('hidden');
    if (combo.variant === 'inline' && !shown) say('an inline panel is hidden');
    if (!shown) return problems;

    const panelBox = rect(panel);
    const panelCs = getComputedStyle(panel);
    if (panelBox.width <= 0 || panelBox.height <= 0) {
      say(`open panel renders at ${panelBox.width}x${panelBox.height}`);
      return problems;
    }
    if (panelCs.visibility !== 'visible') say(`panel visibility "${panelCs.visibility}"`);
    if (Number(panelCs.opacity) <= 0) say(`panel opacity "${panelCs.opacity}"`);
    // A popup that borrows the page background is unreadable over content.
    if (combo.variant === 'dropdown' && panelCs.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the popup has a transparent background');
    }

    // ── "viewport-clamped" ─────────────────────────────────────────────────
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (panelBox.left < -EPS) say(`popup runs ${(-panelBox.left).toFixed(0)}px off the left edge`);
    if (panelBox.right > vw + EPS) say(`popup runs ${(panelBox.right - vw).toFixed(0)}px off the right edge`);
    if (panelBox.top < -EPS) say(`popup runs ${(-panelBox.top).toFixed(0)}px off the top edge`);
    if (panelBox.bottom > vh + EPS) {
      say(`popup runs ${(panelBox.bottom - vh).toFixed(0)}px off the bottom edge`);
    }

    // ── "internally scrollable" ────────────────────────────────────────────
    // A popup taller than the viewport must scroll inside itself rather than
    // spill; the clamp above already proved it does not spill, so the only
    // acceptable way to hold its content is an internal scroller.
    const scrollers = [panel, ...panel.querySelectorAll('*')].filter(node => {
      const cs = getComputedStyle(node as Element);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });
    if (panel.scrollHeight > panelBox.height + 2 && scrollers.length === 0) {
      say(`the popup holds ${panel.scrollHeight}px of content in a`
        + ` ${panelBox.height.toFixed(0)}px box with nothing scrollable`);
    }

    // ── Anchoring: the popup belongs to its input ──────────────────────────
    if (combo.variant === 'dropdown') {
      const input = partNamed('input')!;
      const inputBox = rect(input);
      const gap = Math.min(
        Math.abs(panelBox.top - inputBox.bottom),
        Math.abs(inputBox.top - panelBox.bottom),
      );
      if (gap > 24) {
        say(`the popup floats ${gap.toFixed(0)}px from its input — it is not anchored`);
      }
      const overlapX = Math.min(panelBox.right, inputBox.right)
        - Math.max(panelBox.left, inputBox.left);
      if (overlapX <= 0) say('the popup shares no horizontal span with its input');
    }

    // ── The calendar grid ──────────────────────────────────────────────────
    const days = [...sr.querySelectorAll('.calendar-days .day')]
      .filter(day => !day.classList.contains('day--empty')) as HTMLElement[];
    if (days.length < 28) say(`${days.length} day cells — no month is that short`);
    for (const [i, day] of days.entries()) {
      const box = rect(day);
      if (box.width <= 0 || box.height <= 0) {
        say(`day cell ${i + 1} renders at ${box.width}x${box.height}`);
        break;
      }
    }
    // Days must not overlap each other — a grid that collapses is unusable.
    if (days.length >= 2) {
      const a = rect(days[0]);
      const b = rect(days[1]);
      if (b.left < a.right - EPS && Math.abs(b.top - a.top) < EPS) {
        say(`day 1 (right ${a.right.toFixed(1)}) overlaps day 2 (left ${b.left.toFixed(1)})`);
      }
    }

    // ── The time columns ───────────────────────────────────────────────────
    const columns = [...sr.querySelectorAll('[data-time-unit]')] as HTMLElement[];
    const wantColumns = 2 + (combo.showSeconds ? 1 : 0) + (combo.timeFormat === '12h' ? 1 : 0);
    if (columns.length !== wantColumns) {
      say(`${columns.length} time columns, expected ${wantColumns}`);
    }
    for (const column of columns) {
      const box = rect(column);
      if (box.width <= 0 || box.height <= 0) {
        say(`the ${column.dataset.timeUnit} column renders at ${box.width}x${box.height}`);
        continue;
      }
      // A time column is a long list in a short box: it has to scroll.
      const list = column.querySelector('.time-list') as HTMLElement | null;
      if (list && list.scrollHeight > list.clientHeight + 2) {
        const cs = getComputedStyle(list);
        if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') {
          say(`the ${column.dataset.timeUnit} list overflows without scrolling`);
        }
      }
    }
    // Columns must not overlap.
    for (let i = 1; i < columns.length; i++) {
      const previous = rect(columns[i - 1]);
      const box = rect(columns[i]);
      if (box.left < previous.right - EPS && Math.abs(box.top - previous.top) < EPS) {
        say(`time column ${i} overlaps column ${i - 1}`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('date-time-picker visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount({
        ...c, value: '2026-03-10T14:05', label: 'Appointment',
      }), combo as any);
      if (combo.open) {
        expect(await page.evaluate(() => (window as any).matrix.open()),
          'the dropdown refused to open').toBe(true);
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The clauses that need a whole page, not a single combo ──────────────────

test.describe('date-time-picker visual matrix: popup behaviour', () => {
  test('the popup paints over a high-z-index rival', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-10T14:05', label: 'Appointment', rival: true,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const verdict = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const panel = host.shadowRoot!.querySelector('[part~="panel"]') as HTMLElement;
      const box = panel.getBoundingClientRect();
      const points = [0.25, 0.5, 0.75].map(f => ({
        x: box.left + box.width * f,
        y: box.top + box.height * 0.6,
      }));
      return points.map(p => {
        const top = document.elementFromPoint(p.x, p.y);
        return top?.id === 'rival' ? 'rival' : (top === host ? 'picker' : (top?.tagName ?? 'nothing'));
      });
    });

    // Every probe inside the popup must reach the picker, never the block that
    // sits above it in the normal stacking order.
    expect(verdict, 'the rival block paints over the popup').toEqual(['picker', 'picker', 'picker']);
  });

  test('the popup stays anchored when the page scrolls', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-10T14:05', label: 'Appointment',
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const before = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const input = host.shadowRoot!.querySelector('[part~="input"]')!.getBoundingClientRect();
      const panel = host.shadowRoot!.querySelector('[part~="panel"]')!.getBoundingClientRect();
      return { gap: Math.abs(panel.top - input.bottom), panelTop: panel.top };
    });

    await page.evaluate(() => (window as any).matrix.scrollPage(180));

    const after = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const input = host.shadowRoot!.querySelector('[part~="input"]')!.getBoundingClientRect();
      const panel = host.shadowRoot!.querySelector('[part~="panel"]')!.getBoundingClientRect();
      return {
        gap: Math.min(Math.abs(panel.top - input.bottom), Math.abs(input.top - panel.bottom)),
        panelTop: panel.top,
        inViewport: panel.top >= -2 && panel.bottom <= document.documentElement.clientHeight + 2,
      };
    });

    // "responsive … repositions on page scroll": the popup must follow its
    // input rather than stay pinned to the coordinates it opened at.
    expect(after.panelTop, 'the popup did not move with the page').not.toBeCloseTo(before.panelTop, 0);
    expect(after.gap, 'the popup lost its anchor after scrolling').toBeLessThan(24);
    expect(after.inViewport, 'the popup left the viewport after scrolling').toBe(true);

    await page.evaluate(() => (window as any).matrix.scrollPage(0));
  });

  test('the three sizes really produce three different field heights', async () => {
    const heights: number[] = [];
    for (const size of ['small', 'medium', 'large']) {
      await page.evaluate(s => (window as any).matrix.mount({ size: s, label: 'Appointment' }), size);
      heights.push(await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        return host.shadowRoot!.querySelector('[part~="input"]')!.getBoundingClientRect().height;
      }));
    }
    expect(new Set(heights).size, `sizes rendered heights ${heights.join('/')}`).toBe(3);
    expect(heights[0], 'small is not smaller than medium').toBeLessThan(heights[1]);
    expect(heights[1], 'medium is not smaller than large').toBeLessThan(heights[2]);
  });

  test('an out-of-range day is disabled and visibly different', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-11T10:00', min: '2026-03-10', max: '2026-03-12', label: 'Appointment',
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const verdict = await page.evaluate(() => {
      const sr = (document.getElementById('subject') as HTMLElement).shadowRoot!;
      const days = [...sr.querySelectorAll('.calendar-days .day')]
        .filter(d => !d.classList.contains('day--empty')) as HTMLButtonElement[];
      const inRange = days[10]; // the 11th
      const outOfRange = days[0]; // the 1st
      return {
        inRangeDisabled: inRange.disabled,
        outOfRangeDisabled: outOfRange.disabled,
        sameColor: getComputedStyle(inRange).color === getComputedStyle(outOfRange).color,
        sameOpacity: getComputedStyle(inRange).opacity === getComputedStyle(outOfRange).opacity,
        outOfRangeCursor: getComputedStyle(outOfRange).cursor,
      };
    });

    expect(verdict.inRangeDisabled, 'an in-range day must be selectable').toBe(false);
    expect(verdict.outOfRangeDisabled, 'an out-of-range day must be disabled').toBe(true);
    // "out-of-range days are disabled" is only true for a sighted user if it
    // shows: colour or opacity has to differ.
    expect(verdict.sameColor && verdict.sameOpacity,
      'a disabled day looks exactly like a selectable one').toBe(false);
  });

  test('the selected day is visually distinct from its neighbours', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-11T10:00', label: 'Appointment',
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const verdict = await page.evaluate(() => {
      const sr = (document.getElementById('subject') as HTMLElement).shadowRoot!;
      const days = [...sr.querySelectorAll('.calendar-days .day')]
        .filter(d => !d.classList.contains('day--empty')) as HTMLElement[];
      const selected = getComputedStyle(days[10]);
      const plain = getComputedStyle(days[11]);
      return {
        ariaSelected: days[10].getAttribute('aria-selected'),
        sameBackground: selected.backgroundColor === plain.backgroundColor,
        sameColor: selected.color === plain.color,
      };
    });

    expect(verdict.ariaSelected).toBe('true');
    expect(verdict.sameBackground && verdict.sameColor,
      'the selected day paints identically to an unselected one').toBe(false);
  });
});

// ── The form clauses the DOM tier cannot reach ──────────────────────────────

test.describe('date-time-picker visual matrix: real form participation', () => {
  test('an enabled named picker contributes its canonical value', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', value: '2026-03-10T14:05', dateFormat: 'dd/mm/yyyy',
    }));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    // Documented: the submission is canonical local ISO, whatever the display
    // format shows.
    expect(entries).toEqual([['appointment', '2026-03-10T14:05']]);
  });

  test('a disabled picker is omitted from FormData', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', value: '2026-03-10T14:05', disabled: true,
    }));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries, 'a disabled control must contribute nothing').toEqual([]);
  });

  test('a readonly picker is still submitted', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', value: '2026-03-10T14:05', readonly: true,
    }));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries).toEqual([['appointment', '2026-03-10T14:05']]);
  });

  test('a loading picker is still submitted', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', value: '2026-03-10T14:05', loading: true,
    }));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    expect(entries).toEqual([['appointment', '2026-03-10T14:05']]);
  });

  test('an unnamed picker contributes nothing', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ value: '2026-03-10T14:05' }));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([]);
  });

  test('an empty malformed value contributes an empty field', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', value: '2026-02-30T10:00',
    }));
    const entries = await page.evaluate(() => (window as any).matrix.formEntries());
    // "Malformed/partial/impossible text … contributes an empty form value."
    expect(entries).toEqual([['appointment', '']]);
  });

  test('the real ValidityState follows the documented mapping', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', required: true,
    }));
    const empty = await page.evaluate(() => (window as any).matrix.validity());
    expect(empty.inFormElements, 'the host must be listed in form.elements').toBe(true);
    expect(empty.willValidate).toBe(true);
    expect(empty.valueMissing, 'required + empty is valueMissing').toBe(true);

    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', required: true, value: '2026-03-10T14:05',
      min: '2026-03-15T00:00',
    }));
    const under = await page.evaluate(() => (window as any).matrix.validity());
    expect(under.rangeUnderflow, 'a value before min is rangeUnderflow').toBe(true);
    expect(under.valid).toBe(false);

    await page.evaluate(() => (window as any).matrix.mount({
      name: 'appointment', disabled: true, required: true,
    }));
    const disabled = await page.evaluate(() => (window as any).matrix.validity());
    expect(disabled.willValidate, 'a disabled control is barred from validation').toBe(false);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the selected day has a different background-color" and "the
// selection is visible" are different claims.

test.describe('date-time-picker visual matrix: marquee pixels', () => {
  test('the selected day paints differently from its neighbour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-11T10:00', label: 'Appointment', variant: 'inline',
    }));

    const [selected, plain] = await capture(
      page, '#subject', 'dtp-selected-day',
      `(host) => {
        const days = [...host.shadowRoot.querySelectorAll('.calendar-days .day')]
          .filter(d => !d.classList.contains('day--empty'));
        const a = days[10].getBoundingClientRect();
        const b = days[11].getBoundingClientRect();
        return [
          { x: a.x + a.width / 2, y: a.y + a.height * 0.2 },
          { x: b.x + b.width / 2, y: b.y + b.height * 0.2 },
        ];
      }`,
    );

    expect(sameColor(selected, plain),
      `the selected day painted ${selected.join(',')}, identical to its neighbour`).toBe(false);
    expect(contrast(selected, plain),
      `selection contrast is only ${contrast(selected, plain).toFixed(2)}:1`)
      .toBeGreaterThan(1.2);
  });

  test('the error text paints, and paints differently from helper text', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Appointment', helperText: 'Local time, please', variant: 'inline',
    }));
    const helperRow = await capture(
      page, '#subject', 'dtp-helper-text',
      ROW_WALK('[part~="helper-text"]'),
    );

    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Appointment', errorText: 'That slot is gone', variant: 'inline',
    }));
    const errorRow = await capture(
      page, '#subject', 'dtp-error-text',
      ROW_WALK('[part~="error-text"]'),
    );

    // The docs make the error a distinct, alerting state; two texts that paint
    // the same colour are one text with two names. The ink each engine really
    // draws is the DARKEST pixel of a dense walk of the text's mid row — a
    // single probe 2px into the box lands on a glyph stroke only by
    // font-metric luck, which is exactly how Chromium passes and Firefox and
    // WebKit read the white background instead.
    const ink = (row: RGB[]) =>
      row.reduce((a, p) => p[0] + p[1] + p[2] < a[0] + a[1] + a[2] ? p : a);
    const helper = ink(helperRow as RGB[]);
    const error = ink(errorRow as RGB[]);
    expect(errorRow.some(p => p[0] + p[1] + p[2] < 255 * 3 - 15),
      'no ink at all on the error text row — the text did not paint').toBe(true);
    expect(sameColor(helper, error),
      `helper painted ${helper.join(',')} and error painted ${error.join(',')}`).toBe(false);
    const [r, g, b] = error;
    expect(r > g && r > b, `error text painted rgb(${r},${g},${b}), not a danger colour`).toBe(true);
  });

  test('the open popup paints a surface of its own, not the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: '2026-03-10T14:05', label: 'Appointment', rival: true,
    }));
    await page.evaluate(() => (window as any).matrix.open());

    const [inPopup, onRival] = await capture(
      page, 'body', 'dtp-popup-surface',
      `() => {
        const host = document.getElementById('subject');
        const panel = host.shadowRoot.querySelector('[part~="panel"]');
        const box = panel.getBoundingClientRect();
        const rival = document.getElementById('rival').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + 4 },
          { x: rival.x + 4, y: rival.y + rival.height - 4 },
        ];
      }`,
    );

    // The rival block is a saturated danger colour; a popup that paints under
    // it would read the rival's pixels instead of its own surface.
    expect(sameColor(inPopup, onRival),
      `the popup interior painted ${inPopup.join(',')}, the rival's own colour`).toBe(false);
  });
});
