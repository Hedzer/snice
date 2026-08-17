/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-date-picker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/date-picker, 6 files) owns everything a string
 * can answer: the value/default/display split, all seven formats, parsing and
 * sanitising, the validity mapping, form participation, the eight events, the
 * parts list, and the aria surface. Its own header says what it deliberately
 * leaves here: "pixel geometry, the popup's top-layer paint, and anything
 * about how the calendar LOOKS".
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the three `variant` words are three paints: outlined draws the border
 *     token on the lowest surface, filled swaps it for the low surface with a
 *     transparent rule, underlined drops everything but a bottom rule;
 *   · the field is really a box the pointer reaches, the calendar toggle sits
 *     inside it and is really hit-testable, and the clear button only paints
 *     for `clearable` + a value;
 *   · `loading` paints the spinner part and hides the toggle; `disabled`
 *     paints the disabled surface, ink and cursor;
 *   · an OPEN panel (`show()`, the documented `popover="manual"`) is in the
 *     top layer, anchored to its input by the stylesheet's own anchor rules,
 *     paints its own surface token, and lays the month out as a seven-column
 *     grid whose weekday header starts at the documented `first-day-of-week`
 *     origin;
 *   · "out-of-range calendar days are disabled" shows: the disabled day
 *     paints the disabled ink and the not-allowed cursor, the selected day
 *     paints the primary token with inverse ink.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A selected day that "has a background-color" can still be invisible. The
 *   marquee captures decode the PNG inside the browser under test and judge
 *   the selection, the disabled state, the panel's own surface, and the
 *   helper/error ink really paint.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/date-picker/matrix.html';

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

type Variant = 'outlined' | 'filled' | 'underlined';
type Size = 'small' | 'medium' | 'large';

const VARIANTS: Variant[] = ['outlined', 'filled', 'underlined'];
const SIZES: Size[] = ['small', 'medium', 'large'];

/** The stylesheet's own day-cell size per size attribute. */
const DAY_PX: Record<Size, number> = { small: 28, medium: 32, large: 36 };

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  open: boolean;
  /** The open cross seeds a value + inclusive min/max so selected/disabled
   * days exist in the same grid. */
  value?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  invalid?: boolean;
  errorText?: string;
  helperText?: string;
  firstDayOfWeek?: number;
}

/**
 * variant (3) x size (3) x open (2) = 18 combos; every open combo carries the
 * seeded March-2026 constraints, so the whole panel contract runs on every
 * variant/size cell of the cross. The switch combos below add the one-flag
 * states the cross does not reach.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const open of [false, true]) {
        combos.push({
          id: `${variant}/${size}/${open ? 'open' : 'closed'}`,
          variant, size, open,
          ...(open ? { value: '2026-03-15', min: '2026-03-10', max: '2026-03-20' } : {}),
        });
      }
    }
  }
  const switches: Combo[] = [
    { id: 'switch/clearable-with-value', variant: 'outlined', size: 'medium', open: false, clearable: true, value: '2026-03-15' },
    { id: 'switch/clearable-without-value', variant: 'outlined', size: 'medium', open: false, clearable: true },
    { id: 'switch/loading', variant: 'outlined', size: 'medium', open: false, loading: true },
    { id: 'switch/disabled', variant: 'outlined', size: 'medium', open: false, disabled: true },
    { id: 'switch/readonly', variant: 'outlined', size: 'medium', open: false, readonly: true, value: '2026-03-15' },
    { id: 'switch/invalid-with-error-text', variant: 'outlined', size: 'medium', open: false, invalid: true, errorText: 'That date is gone' },
    { id: 'switch/helper-text', variant: 'outlined', size: 'medium', open: false, helperText: 'Arrival, local time' },
  ];
  return [...combos, ...switches];
}

const mountArgs = (combo: Combo) => ({
  variant: combo.variant, size: combo.size, label: 'Arrival date',
  value: combo.value, min: combo.min, max: combo.max,
  clearable: combo.clearable, loading: combo.loading, disabled: combo.disabled,
  readonly: combo.readonly, invalid: combo.invalid, errorText: combo.errorText,
  helperText: combo.helperText, firstDayOfWeek: combo.firstDayOfWeek ?? 0,
});

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
    const say = (message: string) => problems.push(message);
    const EPS = 1.5;
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const label = sr.querySelector('.label') as HTMLElement | null;
    if (!label) { say('no label rendered'); return problems; }

    const input = partNamed('input') as HTMLInputElement | null;
    const toggle = partNamed('calendar-toggle');
    if (!input) { say('no [part="input"] rendered'); return problems; }
    if (!toggle) { say('no [part="calendar-toggle"] rendered'); return problems; }
    const inputBox = rect(input);

    // ── The label sits above the field, inside the control ────────────────
    const labelBox = rect(label);
    if (labelBox.bottom > inputBox.top + EPS) say('the label is not above the input');
    if (labelBox.left < hostBox.left - EPS || labelBox.right > hostBox.right + EPS) {
      say('the label escapes the control');
    }

    // ── The field is a real box a pointer reaches ─────────────────────────
    if (inputBox.width <= 0 || inputBox.height < 40) {
      say(`the input renders at ${inputBox.width}x${inputBox.height} (min-height 2.5rem)`);
    }
    const inputCs = getComputedStyle(input);
    const inputHit = (sr as any).elementFromPoint(
      inputBox.left + inputBox.width * 0.3, inputBox.top + inputBox.height / 2) as Element | null;
    if (inputHit !== input) {
      say(`the input is occluded by <${inputHit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    // ── The variant is a paint, not a word ────────────────────────────────
    // `loading` "blocks interaction" by disabling the native input
    // (snice-date-picker.ts mirrors interactionDisabled = disabled ||
    // formDisabled || loading onto input.disabled), so `.input:disabled`
    // (surface low, tertiary ink, not-allowed) outranks every variant fill
    // in the cascade. A variant's BACKGROUND claim therefore only holds for
    // an interaction-enabled field; its border/radius claims always hold.
    const interactionBlocked = !!(combo.disabled || combo.loading);
    if (combo.variant === 'outlined') {
      if (parseFloat(inputCs.borderTopWidth) !== 1) say(`outlined border-top-width "${inputCs.borderTopWidth}", expected 1px`);
      if (!interactionBlocked && inputCs.backgroundColor !== token('--snice-color-surface-container-lowest')) {
        say(`outlined background "${inputCs.backgroundColor}", expected the lowest surface token`);
      }
      if (parseFloat(inputCs.borderTopLeftRadius) <= 0) say('outlined input has no radius');
    } else if (combo.variant === 'filled') {
      if (!interactionBlocked && inputCs.backgroundColor !== token('--snice-color-surface-container-low')) {
        say(`filled background "${inputCs.backgroundColor}", expected the low surface token`);
      }
      if (inputCs.borderTopColor !== 'rgba(0, 0, 0, 0)') {
        say(`filled input keeps a visible rule ("${inputCs.borderTopColor}")`);
      }
    } else {
      if (parseFloat(inputCs.borderTopWidth) !== 0) say(`underlined input has a top border "${inputCs.borderTopWidth}"`);
      if (parseFloat(inputCs.borderBottomWidth) !== 1) say(`underlined bottom border "${inputCs.borderBottomWidth}", expected 1px`);
      if (parseFloat(inputCs.borderTopLeftRadius) !== 0) say('underlined input is rounded');
      if (!interactionBlocked && inputCs.backgroundColor !== 'rgba(0, 0, 0, 0)') say('underlined input paints a background');
    }

    // ── State ink: disabled / readonly / loading ──────────────────────────
    if (interactionBlocked) {
      // Both states paint through `.input:disabled` (docs/ai/components/
      // date-picker.md: "loading: blocks interaction"; "disabled … barred").
      // The same rule also outranks `.input--loading { cursor: wait }`, so
      // a loading field advertises not-allowed like a disabled one.
      const state = combo.disabled ? 'disabled' : 'loading';
      if (inputCs.backgroundColor !== token('--snice-color-surface-container-low')) {
        say(`${state} background "${inputCs.backgroundColor}", expected the low surface token`);
      }
      if (inputCs.color !== token('--snice-color-text-tertiary')) {
        say(`${state} ink "${inputCs.color}", expected the tertiary text token`);
      }
      if (inputCs.cursor !== 'not-allowed') say(`${state} cursor "${inputCs.cursor}", expected "not-allowed"`);
    } else if (combo.readonly) {
      if (inputCs.cursor === 'pointer') say('a readonly field advertises the pointer cursor');
    } else if (inputCs.cursor !== 'pointer') {
      say(`enabled input cursor "${inputCs.cursor}", expected "pointer"`);
    }

    // ── The toggle: inside the field, reachable ───────────────────────────
    const toggleBox = rect(toggle);
    if (combo.loading) {
      // ".input--loading ~ .calendar-toggle { visibility: hidden }"
      if (getComputedStyle(toggle).visibility !== 'hidden') say('the calendar toggle is still visible while loading');
      const spinner = partNamed('spinner');
      if (!spinner) say('loading paints no [part="spinner"]');
      else if (rect(spinner).width <= 0) say('the spinner renders at no size');
    } else {
      if (getComputedStyle(toggle).visibility === 'hidden') say('the calendar toggle is hidden without loading');
      if (toggleBox.width <= 0 || toggleBox.height <= 0) {
        say(`the toggle renders at ${toggleBox.width}x${toggleBox.height}`);
      } else {
        if (toggleBox.right > hostBox.right + EPS || toggleBox.left < hostBox.left - EPS) {
          say('the toggle button sits outside the control');
        }
        if (toggleBox.top < inputBox.top - EPS || toggleBox.bottom > inputBox.bottom + EPS) {
          say('the toggle button escapes the field vertically');
        }
        const hit = (sr as any).elementFromPoint(
          toggleBox.left + toggleBox.width / 2, toggleBox.top + toggleBox.height / 2) as Element | null;
        if (hit !== toggle && !toggle.contains(hit)) {
          say(`the toggle is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    // ── The clear button only paints for clearable + a value ──────────────
    const clear = partNamed('clear');
    if (!clear) { say('no [part="clear"] rendered'); }
    else {
      const visible = getComputedStyle(clear).display !== 'none';
      const wantVisible = !!combo.clearable && !!combo.value && !combo.disabled;
      if (visible !== wantVisible) {
        say(`the clear button is ${visible ? 'visible' : 'hidden'}`
          + ` for clearable=${!!combo.clearable}, value=${combo.value ? 'set' : 'empty'}`);
      }
      if (visible) {
        const clearBox = rect(clear);
        if (clearBox.right > toggleBox.left - EPS) say('the clear button overlaps the calendar toggle');
      }
    }

    // ── Helper / error ink ────────────────────────────────────────────────
    const helper = partNamed('helper-text');
    const error = partNamed('error-text');
    if (combo.errorText) {
      if (!error) say('error-text paints no [part="error-text"]');
      else {
        if (getComputedStyle(error).color !== token('--snice-color-danger')) {
          say(`error text ink "${getComputedStyle(error).color}", expected the danger token`);
        }
        if (rect(error).top < inputBox.bottom - EPS) say('the error text is not below the field');
      }
      if (helper) say('an error text and a helper text both rendered');
    } else if (combo.helperText) {
      if (!helper) say('helper-text paints no [part="helper-text"]');
      else if (getComputedStyle(helper).color !== token('--snice-color-text-secondary')) {
        say(`helper text ink "${getComputedStyle(helper).color}", expected the secondary text token`);
      }
    }

    // ── A closed picker shows no panel ────────────────────────────────────
    const panel = partNamed('calendar');
    if (!panel) { say('no [part="calendar"] rendered'); return problems; }
    if (!combo.open) {
      if (!panel.hasAttribute('hidden')) say('a closed picker still shows its calendar');
      if (rect(panel).width > 0 && getComputedStyle(panel).display !== 'none') {
        say('a closed picker still lays its calendar out');
      }
      return problems;
    }

    // ── The open panel: top layer, anchored, painted ──────────────────────
    if (panel.hasAttribute('hidden')) { say('show() left the calendar hidden'); return problems; }
    if (!(panel as any).matches?.(':popover-open')) {
      say('the open calendar is not :popover-open — the documented popover="manual" never engaged');
    }
    const panelBox = rect(panel);
    if (panelBox.width <= 0 || panelBox.height <= 0) {
      say(`the open calendar renders at ${panelBox.width}x${panelBox.height}`);
      return problems;
    }
    if (getComputedStyle(panel).backgroundColor !== token('--snice-color-surface-container-high')) {
      say(`the calendar surface "${getComputedStyle(panel).backgroundColor}",`
        + ' expected the high container token — it would be unreadable over arbitrary pages');
    }
    if (parseFloat(getComputedStyle(panel).borderTopWidth) < 1) say('the open calendar has no rule');

    // The stylesheet's own anchor contract (Chromium anchor positioning):
    // top = anchor(bottom) + 4px, left = anchor(left), min-width floored
    // at anchor-size(width) — a floor, not a width.
    const containerBox = rect(sr.querySelector('.input-container')!);
    if (Math.abs(panelBox.top - (containerBox.bottom + 4)) > 2) {
      say(`the calendar opens at top ${panelBox.top.toFixed(1)}, not 4px under its field`
        + ` (field bottom ${containerBox.bottom.toFixed(1)})`);
    }
    if (Math.abs(panelBox.left - containerBox.left) > 2) {
      say(`the calendar's left edge (${panelBox.left.toFixed(1)}) does not track its field's (${containerBox.left.toFixed(1)})`);
    }
    // The width clause of that contract is a FLOOR, never an equality:
    // `min-width: anchor-size(width)` can only LIFT the base `.calendar`
    // floor (a 36px-cell month legitimately outgrows a 320px field at
    // size=large), and an engine that ships anchor() but drops
    // anchor-size() keeps the base 280px floor instead (281.9px beside a
    // 320px field at size=small, headless chromium). The JS-fallback path
    // writes the field width as the same kind of inline floor. The claim
    // that holds on every path is therefore: the panel is never narrower
    // than the stylesheet's own base floor, keeps its left edge on the
    // field, and contains its seven-column grid (asserted below).
    if (panelBox.width < 280 - EPS) {
      say(`the calendar is only ${panelBox.width.toFixed(1)}px wide`
        + ' — under the stylesheet\'s own 280px min-width floor');
    }

    // ── The month grid: seven columns, the documented order ───────────────
    const view = { year: 2026, month: 2 }; // March 2026, from the seeded value
    const weekdays = [...sr.querySelectorAll('.calendar-weekdays .weekday')] as HTMLElement[];
    if (weekdays.length !== 7) say(`${weekdays.length} weekday headers, expected 7`);
    const firstDayOfWeek = combo.firstDayOfWeek ?? 0;
    // "firstDayOfWeek: number = 0; // 0=Sunday" — the origin is documented.
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const expectedFirst = dayNames[firstDayOfWeek];
    if (weekdays.length === 7 && weekdays[0].textContent?.trim() !== expectedFirst) {
      say(`the weekday header starts at "${weekdays[0].textContent?.trim()}",`
        + ` expected "${expectedFirst}" for first-day-of-week=${firstDayOfWeek}`);
    }

    const days = [...sr.querySelectorAll('.calendar-days .day')] as HTMLElement[];
    const empties = days.filter(day => day.classList.contains('day--empty'));
    const real = days.filter(day => !day.classList.contains('day--empty'));
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    // The leading empties are the documented rotation of the month's first
    // weekday against first-day-of-week.
    const wantEmpties = (new Date(view.year, view.month, 1).getDay() - firstDayOfWeek + 7) % 7;
    if (real.length !== daysInMonth) {
      say(`${real.length} day cells for a ${daysInMonth}-day month`);
    }
    if (empties.length !== wantEmpties) {
      say(`${empties.length} leading empty cells, expected ${wantEmpties}`);
    }
    if (real[0]?.textContent?.trim() !== '1' || real[real.length - 1]?.textContent?.trim() !== String(daysInMonth)) {
      say('the day cells do not run 1…end of month');
    }

    const columns = [...new Set(real.map(day => Math.round(rect(day).left)))].sort((a, b) => a - b);
    if (columns.length !== 7) say(`the days occupy ${columns.length} columns, expected 7`);
    const weekdayColumns = [...new Set(weekdays.map(day => Math.round(rect(day).left)))].sort((a, b) => a - b);
    if (weekdayColumns.length === 7 && columns.join() !== weekdayColumns.join()) {
      say('the day columns do not line up under their weekday headers');
    }
    for (let i = 1; i < real.length; i++) {
      const a = rect(real[i - 1]);
      const b = rect(real[i]);
      if (b.left < a.right - EPS && Math.abs(b.top - a.top) < EPS) {
        say(`day ${i + 1} overlaps day ${i}`);
        break;
      }
      if (b.top < a.top - EPS) { say(`day ${i + 1} is above day ${i}`); break; }
    }
    for (const day of real) {
      const box = rect(day);
      if (box.left < panelBox.left - EPS || box.right > panelBox.right + EPS
        || box.top < panelBox.top - EPS || box.bottom > panelBox.bottom + EPS) {
        say('a day cell escapes the panel');
        break;
      }
    }

    // The stylesheet's own day-cell size per size attribute.
    const expectedDay = ({ small: 28, medium: 32, large: 36 } as Record<string, number>)[combo.size];
    const plain = real.find(day => day.dataset.date === '2026-03-16');
    if (plain) {
      const width = rect(plain).width;
      if (Math.abs(width - expectedDay) > EPS) {
        say(`size=${combo.size} day cells are ${width.toFixed(1)}px, the stylesheet says ${expectedDay}px`);
      }
    }

    // ── "out-of-range calendar days are disabled" — and it shows ──────────
    const selected = real.find(day => day.dataset.date === '2026-03-15');
    const disabledDay = real.find(day => day.dataset.date === '2026-03-01');
    const inRange = real.find(day => day.dataset.date === '2026-03-11');
    if (!selected || !disabledDay || !inRange) {
      say('the seeded March grid is missing its selected/disabled/plain days');
    } else {
      const selectedCs = getComputedStyle(selected);
      if (!selected.classList.contains('day--selected')) say('the seeded value paints no day--selected');
      if (selectedCs.backgroundColor !== token('--snice-color-primary')) {
        say(`the selected day paints "${selectedCs.backgroundColor}", expected the primary token`);
      }
      if (selectedCs.color !== token('--snice-color-text-inverse')) {
        say(`the selected day's ink "${selectedCs.color}", expected inverse text`);
      }
      if (!disabledDay.classList.contains('day--disabled')) say('a day before min is not disabled');
      else {
        const disabledCs = getComputedStyle(disabledDay);
        if (disabledCs.color !== token('--snice-color-text-disabled')) {
          say(`a disabled day paints "${disabledCs.color}", expected the disabled ink token`);
        }
        if (disabledCs.cursor !== 'not-allowed') {
          say(`a disabled day's cursor "${disabledCs.cursor}", expected "not-allowed"`);
        }
        if (disabledCs.color === getComputedStyle(inRange).color) {
          say('a disabled day paints the same ink as a selectable one');
        }
      }
      const today = new Date();
      const isViewingCurrentMonth = today.getFullYear() === view.year && today.getMonth() === view.month;
      const todayCells = real.filter(day => day.classList.contains('day--today'));
      if (isViewingCurrentMonth && todayCells.length !== 1) {
        say('the current month does not mark exactly one today');
      } else if (isViewingCurrentMonth
        && getComputedStyle(todayCells[0]).backgroundColor !== token('--snice-color-primary-subtle')) {
        say('the today cell does not paint the primary-subtle token');
      } else if (!isViewingCurrentMonth && todayCells.length > 0) {
        say('a month that is not this one marked a today');
      }
    }

    // ── The footer's Today affordance has a box ───────────────────────────
    const footer = sr.querySelector('.calendar-footer') as HTMLElement | null;
    if (!footer) say('the open calendar has no footer');
    else if (rect(footer).width <= 0) say('the calendar footer renders at no size');

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('date-picker visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      if (combo.open) {
        expect(await page.evaluate(() => (window as any).matrix.open()),
          'show() opened nothing').toBe(true);
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The clauses that need real pointers, keys, and navigation ───────────────

test.describe('date-picker visual matrix: interaction', () => {
  test.beforeEach(async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', min: '2026-03-10', max: '2026-03-20',
    }));
  });

  test('a real pointer click on a painted day selects it', async () => {
    expect(await page.evaluate(() => (window as any).matrix.open()), 'the panel did not open').toBe(true);
    const target = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const day = host.shadowRoot!.querySelector('.day[data-date="2026-03-18"]') as HTMLElement;
      const box = day.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(260);

    const after = await page.evaluate(() => {
      const host = document.getElementById('subject') as any;
      const selected = host.shadowRoot.querySelector('.day--selected');
      return {
        value: host.value,
        text: host.shadowRoot.querySelector('[part~="input"]').value,
        selectedDate: selected?.getAttribute('data-date') ?? null,
      };
    });
    // Selecting is documented; here the claim is that the PAINTED button a
    // pointer actually hit is the one that selects.
    expect(after.selectedDate).toBe('2026-03-18');
    expect(after.value).toBe('2026-03-18');
    expect(after.text).toBe('03/18/2026');
  });

  test('month navigation keeps the grid contract', async () => {
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.clickNav('next-month'))).toBe(true);

    const verdict = await page.evaluate(() => {
      const sr = (document.getElementById('subject') as any).shadowRoot;
      const label = sr.querySelector('.month-label')?.textContent?.trim() ?? '';
      const days = [...sr.querySelectorAll('.calendar-days .day:not(.day--empty)')];
      const columns = [...new Set(days.map(d => Math.round(d.getBoundingClientRect().left)))].sort((a, b) => a - b);
      return { label, days: days.length, columns: columns.length, first: days[0]?.textContent?.trim() };
    });
    // March 2026 + next = April 2026: 30 days, still seven columns.
    expect(verdict.label).toBe('April');
    expect(verdict.days).toBe(30);
    expect(verdict.columns).toBe(7);
    expect(verdict.first).toBe('1');
  });

  test('the Today button jumps to the real current month', async () => {
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.clickNav('today'))).toBe(true);
    const label = await page.evaluate(() =>
      (document.getElementById('subject') as any).shadowRoot.querySelector('.month-label')?.textContent?.trim());
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    expect(label).toBe(monthNames[now.getMonth()]);
  });

  test('first-day-of-week=1 rotates the header and the leading empties', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', firstDayOfWeek: 1,
    }));
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);
    const verdict = await page.evaluate(() => {
      const sr = (document.getElementById('subject') as any).shadowRoot;
      const weekdays = [...sr.querySelectorAll('.calendar-weekdays .weekday')];
      const empties = sr.querySelectorAll('.calendar-days .day--empty').length;
      return { first: weekdays[0]?.textContent?.trim(), empties };
    });
    // March 1st 2026 is a Sunday, so a Monday-first week needs 6 empties.
    expect(verdict.first).toBe('Mon');
    expect(verdict.empties).toBe(6);
  });

  test('Enter opens and Escape closes the panel from the input', async () => {
    // "Enter/Space on the input opens; Escape on the input closes."
    await page.evaluate(() => (window as any).matrix.el.focus());
    await page.keyboard.press('Enter');
    await page.waitForTimeout(260);
    expect(await page.evaluate(() =>
      !(document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="calendar"]').hasAttribute('hidden')),
      'Enter on the input did not open the calendar').toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(260);
    expect(await page.evaluate(() =>
      (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="calendar"]').hasAttribute('hidden')),
      'Escape on the input did not close the calendar').toBe(true);
  });

  test('a real click on the painted clear button empties the field', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', clearable: true,
    }));
    const target = await page.evaluate(() => {
      const clear = (document.getElementById('subject') as any).shadowRoot
        .querySelector('[part~="clear"]') as HTMLElement;
      const box = clear.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(120);
    const after = await page.evaluate(() => {
      const host = document.getElementById('subject') as any;
      return {
        value: host.value,
        text: host.shadowRoot.querySelector('[part~="input"]').value,
        clearVisible: getComputedStyle(host.shadowRoot.querySelector('[part~="clear"]')).display !== 'none',
      };
    });
    expect(after.value).toBe('');
    expect(after.text).toBe('');
    expect(after.clearVisible, 'the clear button stayed visible with nothing to clear').toBe(false);
  });

  test('the open calendar paints over a high-z-index rival', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', rival: true,
    }));
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);
    // "Calendar uses popover=manual" — the top layer. A z-index 9999 block
    // under the popup must not intercept a single probe inside the panel.
    const verdict = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const panel = host.shadowRoot!.querySelector('[part~="calendar"]') as HTMLElement;
      const box = panel.getBoundingClientRect();
      return [0.25, 0.5, 0.75].map(f => {
        const top = document.elementFromPoint(box.left + box.width * f, box.top + box.height * 0.6);
        return top?.id === 'rival' ? 'rival' : top === host ? 'picker' : (top?.tagName ?? 'nothing');
      });
    });
    expect(verdict, 'the rival block paints over the calendar').toEqual(['picker', 'picker', 'picker']);
  });

  test('the size axis really changes the field and its day cells', async () => {
    const heights: Record<string, number> = {};
    const dayWidths: Record<string, number> = {};
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({
        variant: 'outlined', size: s, label: 'Arrival date', value: '2026-03-15',
      }), size);
      heights[size] = await page.evaluate(() =>
        (document.getElementById('subject') as any).shadowRoot
          .querySelector('[part~="input"]').getBoundingClientRect().height);
      expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);
      dayWidths[size] = await page.evaluate(() =>
        (document.getElementById('subject') as any).shadowRoot
          .querySelector('.day[data-date="2026-03-16"]').getBoundingClientRect().width);
      await page.evaluate(() => (window as any).matrix.close());
    }
    // The docs name three sizes; the stylesheet gives large a taller field
    // and every size its own day cell.
    expect(heights.large, `field heights ${JSON.stringify(heights)}`).toBeGreaterThan(heights.small);
    for (const size of SIZES) {
      expect(Math.abs(dayWidths[size] - DAY_PX[size]),
        `size=${size} day width ${dayWidths[size]}px`).toBeLessThanOrEqual(1.5);
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive
// than an evaluate, and layer 1 already measured the model the browser built.
// These exist because "has a background-color" and "is visible" are different
// claims.

test.describe('date-picker visual matrix: marquee pixels', () => {
  test('the selected day paints differently from its neighbour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', min: '2026-03-10', max: '2026-03-20',
    }));
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);

    // The panel is a top-layer popover and extends beyond its host's box, so
    // the capture is of the page, with probe points resolved next to it.
    const [selected, plain] = await capture(
      page, 'body', 'date-picker-selected-day',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const a = sr.querySelector('.day[data-date="2026-03-15"]').getBoundingClientRect();
        const b = sr.querySelector('.day[data-date="2026-03-16"]').getBoundingClientRect();
        return [
          { x: a.x + a.width / 2, y: a.y + a.height * 0.25 },
          { x: b.x + b.width / 2, y: b.y + b.height * 0.25 },
        ];
      }`,
    );
    expect(sameColor(selected as RGB, plain as RGB),
      `the selected day painted ${selected.join(',')}, identical to its neighbour`).toBe(false);
    expect(contrast(selected as RGB, plain as RGB),
      `selection contrast is only ${contrast(selected as RGB, plain as RGB).toFixed(2)}:1`)
      .toBeGreaterThan(1.2);
  });

  test('the open calendar paints its own surface, not the page under it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      value: '2026-03-15', rival: true,
    }));
    expect(await page.evaluate(() => (window as any).matrix.open())).toBe(true);

    const [inPanel, onRival] = await capture(
      page, 'body', 'date-picker-panel-surface',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const panel = sr.querySelector('[part~="calendar"]').getBoundingClientRect();
        const rival = document.getElementById('rival').getBoundingClientRect();
        return [
          { x: panel.x + 4, y: panel.y + panel.height / 2 },
          { x: rival.x + 4, y: rival.y + rival.height - 4 },
        ];
      }`,
    );
    // The rival is a saturated danger block; a popup painting under it would
    // read the rival's pixels instead of its own surface.
    expect(sameColor(inPanel as RGB, onRival as RGB),
      `the panel interior painted ${inPanel.join(',')}, the rival's own colour`).toBe(false);
  });

  test('error ink and helper ink are two different paints', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      helperText: 'Arrival, local time',
    }));
    const helperRow = await capture(
      page, '#subject', 'date-picker-helper',
      ROW_WALK('[part~="helper-text"]'),
    );
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', label: 'Arrival date',
      errorText: 'That date is gone',
    }));
    const errorRow = await capture(
      page, '#subject', 'date-picker-error',
      ROW_WALK('[part~="error-text"]'),
    );
    // The ink each engine really draws is the DARKEST pixel of a dense walk
    // of the text's mid row — one probe 3px into the box lands on a glyph
    // stroke only by font-metric luck, which is how Chromium alone passed.
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
});
