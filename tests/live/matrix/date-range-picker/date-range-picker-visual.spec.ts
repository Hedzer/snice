/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-date-range-picker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/date-range-picker, 331 cases via
 * `npm run test:matrix`) owns everything a string can answer: endpoint
 * parsing, live/default separation, validity flags, the two-field submission
 * shape, parts, naming, and the calendar's day inventory. It cannot own
 * whole clauses of this component's documentation, because happy-dom
 * performs no layout AND implements no form plumbing behind
 * `ElementInternals`:
 *
 *   · "The popup uses `popover="manual"`, stays clamped to the viewport,
 *     scrolls internally when needed, and repositions on page
 *     scroll/resize." Every word of that is geometry plus top-layer paint.
 *   · "disabled ... omitted" from FormData; "An enabled picker with name
 *     `booking` contributes exactly two entries"; "The host is listed in
 *     `form.elements`". `new FormData()` returns nothing for a custom
 *     element under happy-dom, so the DOM tier reads setFormValue payloads
 *     and THIS tier does the real submission.
 *   · `variant`/`size` are paint: which tokens fill the field, and whether
 *     the size axis really changes the box.
 *   · "out-of-range days are disabled" must SHOW for a sighted user.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · CLOSED cross — variant (3) x size (3) x state (4) = 36 combos: the
 *     field paints its variant's own tokens, the toggle is reachable, the
 *     spinner replaces it under loading, error text replaces helper;
 *   · OPEN cross — columns (2) x size (3) x presets (2) = 12 combos: the
 *     panel is shown, viewport-contained, anchored, internally consistent,
 *     its day grid laid out without overlaps, its endpoints/in-range days
 *     painted in the primary tokens, out-of-range days visibly disabled,
 *     and its days/Today/preset controls hit-testable;
 *   · DISPLAY cross — format (4) x shape (2) = 8 combos: the visible text is
 *     the configured format's own spelling.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A day that "has background-color: var(--snice-color-primary)" can still
 *   be invisible. The marquee captures decode the PNG inside the browser
 *   under test and assert the range endpoints, the error state, and the
 *   top-layer popup really paint.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/date-range-picker/matrix.html';

type Variant = 'outlined' | 'filled' | 'underlined';
type Size = 'small' | 'medium' | 'large';

/**
 * The theme token each field variant is made of (snice-date-range-picker.css):
 * outlined paints the recessed input surface with a border rule, filled
 * swaps the border for a container-low fill, underlined keeps only a bottom
 * rule over transparency. The docs commit the component to the theme's
 * semantic tokens; a copy-pasted rule pointing at the wrong surface would
 * break these.
 */
const VARIANT_TOKENS: Record<Variant, {
  fill: string; rule: 'border-token' | 'transparent' | 'bottom-only';
}> = {
  outlined: { fill: '--snice-color-surface-container-lowest', rule: 'border-token' },
  filled: { fill: '--snice-color-surface-container-low', rule: 'transparent' },
  underlined: { fill: 'transparent', rule: 'bottom-only' },
};

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  /** Extra mount options merged into the combo. */
  over: Record<string, unknown>;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** Mount and prove the authored axes reached the element. */
async function mountAndReflect(combo: Combo, extra: Record<string, unknown> = {}) {
  // Merge the payload in Node: page.evaluate runs the arrow in the browser,
  // where closure variables like `extra` do not exist.
  const payload = { variant: combo.variant, size: combo.size, ...combo.over, ...extra };
  const mounted = await page.evaluate(c => (window as any).matrix.mount(c), payload);
  // Authored attributes are always present (docs/ai/properties.md); the
  // closed cross authors them explicitly through the fixture.
  expect(mounted.reflected.variant, `${combo.id}: variant did not reach the attribute`)
    .toBe(combo.variant);
  expect(mounted.reflected.size, `${combo.id}: size did not reach the attribute`)
    .toBe(combo.size);
  return mounted;
}

/**
 * LAYER 1, closed half. One evaluate per combo, every violation at once.
 */
async function closedProblems(combo: Combo): Promise<string[]> {
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

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }
    if (getComputedStyle(host).display !== 'inline-block') {
      say(`host display "${getComputedStyle(host).display}", expected "inline-block"`);
    }

    const input = partNamed('input') as HTMLInputElement | undefined;
    if (!input) { say('no part="input"'); return problems; }
    const inputBox = rect(input);
    if (inputBox.width <= 0 || inputBox.height <= 0) {
      say(`input renders at ${inputBox.width}x${inputBox.height}`);
      return problems;
    }
    const inputCs = getComputedStyle(input);

    // The field must be the thing a pointer lands on, not something under a
    // control that grew over it.
    const hit = (sr as any).elementFromPoint(
      inputBox.left + inputBox.width * 0.3,
      inputBox.top + inputBox.height / 2,
    ) as Element | null;
    if (hit !== input) {
      say(`the input is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    // ── The variant paints its own documented tokens ─────────────────────
    // Two DOCUMENTED overlays outrank the resting variant paint in the
    // cascade (same ruling as the date-picker oracle):
    // · `disabled` and `loading` both block interaction by disabling the
    //   native input — snice-date-range-picker.ts mirrors
    //   interactionDisabled = disabled || loading || formDisabled onto
    //   input.disabled — so `.input:disabled` (surface low, tertiary ink,
    //   not-allowed) wins every variant's FILL
    //   (docs/ai/components/date-range-picker.md: "`readonly` and `loading`
    //   ... Both block interaction and are barred from validation";
    //   "`disabled` ... omitted and barred"). A variant's fill claim holds
    //   for an interaction-enabled field; the blocked surface is asserted
    //   as its own contract in the state half.
    // · `invalid` is "visual presentation only" (same doc): the danger
    //   rule asserted in the state half replaces the resting border
    //   colour, so the outlined/filled RULE claims hold while valid.
    const state = (combo.over as any).stateName ?? 'plain';
    const interactionBlocked = state === 'disabled' || state === 'loading';
    const displayedInvalid = state === 'invalid-error';

    const fill = tokens.fill === 'transparent'
      ? 'rgba(0, 0, 0, 0)'
      : token(tokens.fill);
    if (interactionBlocked) {
      if (inputCs.backgroundColor !== token('--snice-color-surface-container-low')) {
        say(`${state} fill "${inputCs.backgroundColor}", expected the disabled surface token`);
      }
    } else if (inputCs.backgroundColor !== fill) {
      say(`${combo.variant} fill "${inputCs.backgroundColor}", expected ${tokens.fill} "${fill}"`);
    }
    if (tokens.rule === 'border-token') {
      if (!displayedInvalid) {
        const border = token('--snice-color-border');
        if (inputCs.borderTopColor !== border) {
          say(`outlined rule "${inputCs.borderTopColor}", expected the border token "${border}"`);
        }
      }
    } else if (tokens.rule === 'transparent') {
      if (!displayedInvalid && inputCs.borderTopColor !== 'rgba(0, 0, 0, 0)') {
        say(`filled field drew a visible rule "${inputCs.borderTopColor}" instead of pure fill`);
      }
    } else {
      if (parseFloat(inputCs.borderTopWidth) > 0) say('an underlined field drew a top border');
      if (parseFloat(inputCs.borderBottomWidth) <= 0) say('an underlined field has no bottom rule');
    }

    // ── The state half ────────────────────────────────────────────────────
    const toggle = partNamed('calendar-toggle') as HTMLButtonElement | undefined;
    if (!toggle) { say('no part="calendar-toggle"'); return problems; }

    if (interactionBlocked) {
      // Both states disable the native input and paint through
      // `.input:disabled`. That rule also outranks
      // `.input--loading { cursor: wait }`, so a loading field advertises
      // not-allowed exactly like a disabled one (date-picker oracle,
      // same CSS: "matches snice-date-picker exactly").
      if (!input.disabled) say(`a ${state} combo left the field enabled`);
      const disabledInk = token('--snice-color-text-tertiary');
      if (inputCs.color !== disabledInk) {
        say(`${state} ink "${inputCs.color}", expected the text-tertiary token`);
      }
      if (inputCs.cursor !== 'not-allowed') {
        say(`${state} cursor "${inputCs.cursor}", expected "not-allowed"`);
      }
    }

    if (state === 'loading') {
      const spinner = partNamed('spinner');
      if (!spinner) { say('loading rendered no spinner'); }
      else {
        const spinnerBox = rect(spinner);
        if (spinnerBox.width <= 0 || spinnerBox.height <= 0) {
          say(`spinner renders at ${spinnerBox.width}x${spinnerBox.height}`);
        }
      }
      // ".input--loading ~ .calendar-toggle { visibility: hidden }" — the
      // spinner takes the toggle's place.
      const toggleCs = getComputedStyle(toggle);
      if (toggleCs.visibility === 'visible' && inputCs.cursor !== 'wait') {
        say('loading neither hides the toggle nor shows the wait cursor');
      }
    } else if (getComputedStyle(toggle).visibility !== 'visible') {
      say('the calendar toggle is invisible outside loading');
    }

    if (state === 'invalid-error') {
      if (input.getAttribute('aria-invalid') !== 'true') {
        say('an invalid combo did not mirror aria-invalid');
      }
      const dangerRule = token('--snice-color-danger');
      if (inputCs.borderTopColor !== dangerRule) {
        say(`invalid rule "${inputCs.borderTopColor}", expected the danger token`);
      }
      const error = partNamed('error-text');
      if (!error) { say('errorText rendered no error part'); }
      else {
        if (error.getAttribute('role') !== 'alert') say('the error does not announce itself');
        if (getComputedStyle(error).color !== dangerRule) {
          say(`error text ink is not the danger token`);
        }
        if (rect(error).height <= 0) say('the error text renders with no height');
      }
      if (partNamed('helper-text')) say('the helper survived alongside the error');
    }

    if (state === 'plain' && partNamed('error-text')) {
      say('an unauthored combo painted error text');
    }

    // The toggle sits inside the field and is a real hit target.
    const toggleBox = rect(toggle);
    if (toggleBox.width <= 0 || toggleBox.height <= 0) {
      say(`toggle renders at ${toggleBox.width}x${toggleBox.height}`);
    }
    if (toggleBox.right > hostBox.right + EPS || toggleBox.left < hostBox.left - EPS) {
      say('the toggle button sits outside the control');
    }
    const toggleHit = (sr as any).elementFromPoint(
      toggleBox.left + toggleBox.width / 2,
      toggleBox.top + toggleBox.height / 2,
    ) as Element | null;
    if (state !== 'loading' && toggleHit !== toggle && !toggle.contains(toggleHit as Node)) {
      say(`the toggle is occluded by <${toggleHit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    // The clear affordance only exists when something can be cleared.
    const clear = partNamed('clear') as HTMLElement | undefined;
    const clearable = !!(combo.over as any).clearable;
    const holdsValue = !!(combo.over as any).start || !!(combo.over as any).end;
    const clearShown = clear ? getComputedStyle(clear).display !== 'none' : false;
    if (clearShown !== (clearable && holdsValue && state !== 'disabled')) {
      say(`clear affordance shown=${clearShown}, expected ${clearable && holdsValue}`);
    }

    // The calendar is closed until asked for.
    const calendar = partNamed('calendar');
    if (calendar && !calendar.hasAttribute('hidden')) {
      say('the calendar starts open');
    }

    return problems;
  }, { combo, tokens: VARIANT_TOKENS[combo.variant] });
}

/**
 * LAYER 1, open half. Every combo carries a March 2026 range under
 * min/max bounds, so endpoints, in-range days, and disabled days all exist
 * in the open panel.
 */
async function openProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const panel = partNamed('calendar');
    if (!panel) { say('no part="calendar"'); return problems; }
    if (panel.hasAttribute('hidden')) { say('the calendar is hidden after open()'); return problems; }

    const panelBox = rect(panel);
    const panelCs = getComputedStyle(panel);
    if (panelBox.width <= 0 || panelBox.height <= 0) {
      say(`open panel renders at ${panelBox.width}x${panelBox.height}`);
      return problems;
    }
    if (panelCs.visibility !== 'visible') say(`panel visibility "${panelCs.visibility}"`);
    if (Number(panelCs.opacity) <= 0.9) say(`panel opacity "${panelCs.opacity}"`);

    // The popup paints its own surface, not the page behind it.
    if (panelCs.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the popup has a transparent background');
    }

    // ── "stays clamped to the viewport" ────────────────────────────────────
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (panelBox.left < -EPS) say(`popup runs ${(-panelBox.left).toFixed(0)}px off the left edge`);
    if (panelBox.right > vw + EPS) say(`popup runs ${(panelBox.right - vw).toFixed(0)}px off the right edge`);
    if (panelBox.top < -EPS) say(`popup runs ${(-panelBox.top).toFixed(0)}px off the top edge`);
    if (panelBox.bottom > vh + EPS) say(`popup runs ${(panelBox.bottom - vh).toFixed(0)}px off the bottom edge`);

    // ── Anchoring: the popup belongs to its field ──────────────────────────
    const input = partNamed('input')!;
    const inputBox = rect(input);
    const gap = Math.min(
      Math.abs(panelBox.top - inputBox.bottom),
      Math.abs(inputBox.top - panelBox.bottom),
    );
    if (gap > 24) say(`the popup floats ${gap.toFixed(0)}px from its field — it is not anchored`);
    const overlapX = Math.min(panelBox.right, inputBox.right)
      - Math.max(panelBox.left, inputBox.left);
    if (overlapX <= 0) say('the popup shares no horizontal span with its field');

    // ── The month panels ───────────────────────────────────────────────────
    const columns = Number((combo.over as any).columns ?? 1);
    const months = [...sr.querySelectorAll('.month')] as HTMLElement[];
    if (months.length !== columns) {
      say(`${months.length} month panels, expected ${columns}`);
    }
    const labels = [...sr.querySelectorAll('.month-label')].map(n => n.textContent.trim());
    if (labels[0] !== 'March') say(`first panel shows "${labels[0]}", expected March`);
    // The dual layout pairs the start month with its successor
    // (docs/ai/components/date-range-picker.md: "columns ... supported
    // layouts: 1 or 2"; the combo seeds March 2026, so the second panel
    // is April). Every panel's grid must be a COMPLETE grid for the
    // month its own label claims — 31 for March, 30 for April.
    if (columns === 2 && labels[1] !== 'April') {
      say(`the dual layout's second panel shows "${labels[1]}", expected April`);
    }
    const daysInLabelledMonth = (label: string) =>
      new Date(2026, new Date(`${label} 1, 2026`).getMonth() + 1, 0).getDate();

    for (const [index, month] of months.entries()) {
      const headers = month.querySelectorAll('.weekday');
      if (headers.length !== 7) say(`panel ${index} has ${headers.length} weekday headers`);
      for (const header of headers) {
        if (rect(header).width <= 0) say(`panel ${index} has a zero-width weekday header`);
      }
      const days = [...month.querySelectorAll('.day')]
        .filter(day => !day.classList.contains('day--empty')) as HTMLElement[];
      const expectedDays = daysInLabelledMonth(labels[index] ?? '');
      if (days.length !== expectedDays) {
        say(`panel ${index} renders ${days.length} day cells (${labels[index]} has ${expectedDays})`);
      }
      // Days must not overlap each other.
      for (let i = 1; i < days.length; i++) {
        const a = rect(days[i - 1]);
        const b = rect(days[i]);
        if (b.left < a.right - EPS && Math.abs(b.top - a.top) < EPS) {
          say(`panel ${index}: day ${i} overlaps day ${i - 1}`);
          break;
        }
      }
      // The 7-column grid: at most 7 days share a row.
      const firstRowTop = rect(days[0]).top;
      const inFirstRow = days.filter(day => Math.abs(rect(day).top - firstRowTop) < EPS);
      if (inFirstRow.length > 7) say(`panel ${index} lays ${inFirstRow.length} days in one row`);
    }

    // ── Range paint: endpoints, interior, plain, out-of-range ─────────────
    const day = (iso: string) =>
      sr.querySelector(`[data-date="${iso}"]`) as HTMLElement | null;
    const primary = token('--snice-color-primary');
    const inRangeFill = token('--snice-color-primary-subtle-hover');

    const start = day('2026-03-10');
    const end = day('2026-03-20');
    const middle = day('2026-03-15');
    const plain = day('2026-03-05');
    if (!start || !end || !middle || !plain) {
      say('the expected March days are not all rendered');
      return problems;
    }
    if (start.getAttribute('aria-selected') !== 'true') say('the start day is not aria-selected');
    if (end.getAttribute('aria-selected') !== 'true') say('the end day is not aria-selected');
    if (middle.getAttribute('aria-selected') !== 'true') say('the interior day is not aria-selected');
    if (getComputedStyle(start).backgroundColor !== primary) {
      say(`start day fill "${getComputedStyle(start).backgroundColor}", expected the primary token`);
    }
    if (getComputedStyle(end).backgroundColor !== primary) {
      say(`end day fill "${getComputedStyle(end).backgroundColor}", expected the primary token`);
    }
    if (getComputedStyle(middle).backgroundColor !== inRangeFill) {
      say(`in-range fill "${getComputedStyle(middle).backgroundColor}",`
        + ' expected the primary-subtle-hover token');
    }
    const plainFill = getComputedStyle(plain).backgroundColor;
    if (plainFill === primary || plainFill === inRangeFill) {
      say('a plain day paints like a selected one');
    }

    // "out-of-range days are disabled" — and it must show.
    const outOfRange = day('2026-03-02')!;
    if (!(outOfRange as HTMLButtonElement).disabled) {
      say('a day before min is not disabled');
    }
    const inRangeDay = day('2026-03-12')!;
    if ((inRangeDay as HTMLButtonElement).disabled) {
      say('an in-range day is disabled');
    }
    if (getComputedStyle(outOfRange).color === getComputedStyle(inRangeDay).color
      && getComputedStyle(outOfRange).opacity === getComputedStyle(inRangeDay).opacity) {
      say('a disabled day looks exactly like a selectable one');
    }

    // ── Presets, Today, and hit-testing ────────────────────────────────────
    const presets = (combo.over as any).presets as string[] | undefined;
    const presetButtons = [...sr.querySelectorAll('[data-preset]')] as HTMLElement[];
    if (presets) {
      if (presetButtons.length !== presets.length) {
        say(`${presetButtons.length} preset buttons, expected ${presets.length}`);
      }
      for (const button of presetButtons) {
        if (rect(button).width <= 0 || rect(button).height <= 0) {
          say('a preset button renders with no box');
        }
      }
    } else if (presetButtons.length > 0) {
      say('preset buttons rendered without presets');
    }

    const today = sr.querySelector('[data-nav="today"]') as HTMLElement | null;
    if (!today) say('no Today control');
    else if (rect(today).width <= 0 || rect(today).height <= 0) {
      say('the Today control renders with no box');
    }

    // A real pointer at the middle of a mid-month day must land on that day.
    const probeDay = rect(day('2026-03-15')!);
    const hit = (sr as any).elementFromPoint(
      probeDay.left + probeDay.width / 2,
      probeDay.top + probeDay.height / 2,
    ) as Element | null;
    if (hit !== day('2026-03-15')) {
      say(`a probe at 2026-03-15's centre found <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    // Nothing outside the popup may paint over it (in the ordinary case; the
    // rival case is its own test).
    if (!(combo.over as any).rival) {
      const outerHit = document.elementFromPoint(
        panelBox.left + panelBox.width / 2,
        panelBox.top + panelBox.height / 2,
      );
      if (outerHit !== host && !(host.contains(outerHit))) {
        say(`the panel centre is occluded by <${outerHit?.tagName?.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo as any);
}

// ── Layer 1: the closed cross ───────────────────────────────────────────────

const CLOSED_STATES = [
  { name: 'plain', over: {} },
  { name: 'disabled', over: { disabled: true } },
  { name: 'loading', over: { loading: true } },
  { name: 'invalid-error', over: { invalid: true, errorText: 'Range unavailable' } },
] as const;

test.describe('date-range-picker visual matrix: layer 1 — closed', () => {
  for (const variant of ['outlined', 'filled', 'underlined'] as const) {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const state of CLOSED_STATES) {
        const combo: Combo = {
          id: `${variant}/${size}/${state.name}`,
          variant, size,
          over: { stateName: state.name, ...state.over },
        };
        test(combo.id, async () => {
          await mountAndReflect(combo);
          expect(await closedProblems(combo), `combo ${combo.id}`).toEqual([]);
        });
      }
    }
  }
});

// ── Layer 1: the open cross ─────────────────────────────────────────────────

test.describe('date-range-picker visual matrix: layer 1 — open panel', () => {
  for (const columns of [1, 2]) {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const presets of [undefined, ['march', 'marchStrings']]) {
        const combo: Combo = {
          id: `open/columns=${columns}/${size}/${presets ? 'presets' : 'bare'}`,
          variant: 'outlined', size,
          over: {
            columns,
            presets,
            min: '2026-03-05',
            max: '2026-03-25',
            start: '2026-03-10',
            end: '2026-03-20',
            label: 'Stay',
            open: true,
          },
        };
        test(combo.id, async () => {
          await page.evaluate(c => (window as any).matrix.mount({
            variant: c.variant, size: c.size, ...c.over,
          }), combo as any);
          const shown = await page.evaluate(() => (window as any).matrix.el.showCalendar);
          expect(shown, `${combo.id}: the calendar refused to open`).toBe(true);
          expect(await openProblems(combo), `combo ${combo.id}`).toEqual([]);
        });
      }
    }
  }
});

// ── Layer 1: the display cross ──────────────────────────────────────────────

test.describe('date-range-picker visual matrix: layer 1 — display formats', () => {
  const DISPLAYS: Array<{ format: string; start: string; end: string; want: string }> = [
    {
      format: 'mm/dd/yyyy', start: '2026-03-10', end: '2026-03-20',
      want: '03/10/2026  —  03/20/2026',
    },
    {
      format: 'dd/mm/yyyy', start: '2026-03-10', end: '2026-03-20',
      want: '10/03/2026  —  20/03/2026',
    },
    {
      format: 'mmmm dd, yyyy', start: '2026-03-10', end: '2026-03-20',
      want: 'March 10, 2026  —  March 20, 2026',
    },
    {
      format: 'yyyy-mm-dd', start: '2026-03-10', end: '2026-03-20',
      want: '2026-03-10  —  2026-03-20',
    },
  ];

  /** A partial pair (start held, end empty) shows the start alone. */
  const partialWant = (display: typeof DISPLAYS[number]): string => {
    const [month, day, year] = ['03', '10', '2026'];
    switch (display.format) {
      case 'dd/mm/yyyy': return `${day}/${month}/${year}`;
      case 'mmmm dd, yyyy': return `March 10, ${year}`;
      case 'yyyy-mm-dd': return `${year}-${month}-${day}`;
      default: return `${month}/${day}/${year}`;
    }
  };

  for (const display of DISPLAYS) {
    for (const shape of ['complete', 'partial'] as const) {
      test(`display/${display.format}/${shape}`, async () => {
        const visible = await page.evaluate(async ({ display, shape }) => {
          const matrix = (window as any).matrix;
          await matrix.mount({
            format: display.format, label: 'Stay',
            start: display.start,
            end: shape === 'complete' ? display.end : '',
          });
          const host = document.getElementById('subject');
          return (host.shadowRoot.querySelector('.input') as HTMLInputElement).value;
        }, { display, shape });
        expect(visible).toBe(shape === 'complete' ? display.want : partialWant(display));
      });
    }
  }
});

// ── The clauses that need a whole page, not a single combo ──────────────────

test.describe('date-range-picker visual matrix: panel behaviour', () => {
  test('the size axis moves the field: large is taller with larger type', async () => {
    const measured: Record<string, { height: number; fontSize: number }> = {};
    for (const size of ['small', 'medium', 'large']) {
      await page.evaluate(s => (window as any).matrix.mount({ size: s, label: 'Stay' }), size);
      measured[size] = await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        const input = host.shadowRoot!.querySelector('.input')!;
        return {
          height: input.getBoundingClientRect().height,
          fontSize: parseFloat(getComputedStyle(input).fontSize),
        };
      });
    }
    // The axis's documented direction: large grows in both box and type.
    expect(measured.large.height, 'large is not taller than small')
      .toBeGreaterThan(measured.small.height);
    expect(measured.large.fontSize, 'large type is not larger than small type')
      .toBeGreaterThan(measured.small.fontSize);
  });

  test('small is shorter than medium', async () => {
    const heights: number[] = [];
    for (const size of ['small', 'medium']) {
      await page.evaluate(s => (window as any).matrix.mount({ size: s, label: 'Stay' }), size);
      heights.push(await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        return host.shadowRoot!.querySelector('.input')!.getBoundingClientRect().height;
      }));
    }
    expect(heights[0], `small and medium both rendered ${heights[0]}px`)
      .toBeLessThan(heights[1]);
  });

  test('the popup paints over a high-z-index rival', async () => {
    // "popover=manual" — the top layer. A rival block at z-index 9999 that
    // overlaps the popup must sit UNDER it.
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Stay', rival: true, start: '2026-03-10', end: '2026-03-20', open: true,
    }));

    const verdict = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const panel = host.shadowRoot!.querySelector('.calendar') as HTMLElement;
      const box = panel.getBoundingClientRect();
      return [0.25, 0.5, 0.75].map(f => {
        const top = document.elementFromPoint(
          box.left + box.width * f, box.top + box.height * 0.6);
        return top?.id === 'rival' ? 'rival' : (top === host ? 'picker' : (top?.tagName ?? 'nothing'));
      });
    });
    expect(verdict, 'the rival block paints over the popup').toEqual(['picker', 'picker', 'picker']);
  });

  test('the popup stays anchored and in-viewport when the page scrolls', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Stay', start: '2026-03-10', end: '2026-03-20', open: true,
    }));

    const after = await page.evaluate(async () => {
      // Scroll enough to demand a reposition while the field stays in the
      // viewport: "stays clamped to the viewport ... and repositions on
      // page scroll" (docs/ai/components/date-range-picker.md) are clauses
      // that can only hold TOGETHER while the field is on screen — once
      // the anchor scrolls out, the clamp wins by design and the gap is
      // allowed to open. A stale popup that ignored the scroll would sit
      // ~40px from the repositioned one, far past the 24px bar below.
      // scrollPage awaits settle() so the component's capture-phase scroll
      // listener has re-run positionCalendar().
      await (window as any).matrix.scrollPage(40);
      const host = document.getElementById('subject') as HTMLElement;
      const input = host.shadowRoot!.querySelector('.input')!.getBoundingClientRect();
      const panel = host.shadowRoot!.querySelector('.calendar')!.getBoundingClientRect();
      return {
        gap: Math.min(Math.abs(panel.top - input.bottom), Math.abs(input.top - panel.bottom)),
        inViewport: panel.top >= -2
          && panel.bottom <= document.documentElement.clientHeight + 2,
      };
    });

    // "repositions on page scroll/resize": the popup must follow its field.
    expect(after.gap, 'the popup lost its anchor after scrolling').toBeLessThan(24);
    expect(after.inViewport, 'the popup left the viewport after scrolling').toBe(true);

    await page.evaluate(() => (window as any).matrix.scrollPage(0));
  });

  test('a real two-click selection selects, closes, and reports the range', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ label: 'Stay' }));
    await page.evaluate(() => (window as any).matrix.viewOn('2026-03-01'));
    await page.evaluate(() => (window as any).matrix.open());

    // The capture object holds live functions, so the clicks and the log
    // read happen in ONE evaluate the fixture owns.
    const result = await page.evaluate(async () => {
      const matrix = (window as any).matrix;
      const seen = matrix.capture(['daterange-change']);
      await matrix.clickDay('2026-03-05');
      const midState = {
        start: matrix.el.start,
        end: matrix.el.end,
        open: matrix.el.showCalendar,
      };
      await matrix.clickDay('2026-03-12');
      const log = seen.log;
      seen.stop();
      return {
        midState,
        final: { start: matrix.el.start, end: matrix.el.end, open: matrix.el.showCalendar },
        log,
      };
    });

    expect(result.midState.start).toBe('03/05/2026');
    expect(result.midState.end).toBe('');
    expect(result.midState.open, 'the calendar closed mid-selection').toBe(true);
    expect(result.final).toEqual({ start: '03/05/2026', end: '03/12/2026', open: false });
    expect(result.log.length).toBe(1);
    expect(result.log[0]).toMatchObject({ startIso: '2026-03-05', endIso: '2026-03-12' });
  });

  test('the clear affordance is reachable and clears the range', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      clearable: true, start: '2026-03-10', end: '2026-03-20', label: 'Stay',
    }));
    const result = await page.evaluate(async () => {
      const matrix = (window as any).matrix;
      const host = document.getElementById('subject');
      const clear = host.shadowRoot.querySelector('.clear-button');
      const box = clear.getBoundingClientRect();
      const clearCs = getComputedStyle(clear);
      const hit = host.shadowRoot.elementFromPoint(
        box.left + box.width / 2, box.top + box.height / 2);
      const reachable = clearCs.display !== 'none' && (hit === clear || clear.contains(hit));
      const seen = matrix.capture(['daterange-clear', 'daterange-change']);
      await matrix.clickClear();
      const log = seen.log;
      seen.stop();
      return {
        reachable,
        emptied: matrix.el.start === '' && matrix.el.end === '',
        order: log.map(entry => entry.type).slice(0, 2),
      };
    });
    expect(result.reachable, 'the clear button is hidden or occluded').toBe(true);
    expect(result.emptied, 'clicking clear did not empty the range').toBe(true);
    expect(result.order, 'clear must announce daterange-clear before daterange-change')
      .toEqual(['daterange-clear', 'daterange-change']);
  });

  test('Escape from the field closes an open popup', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ open: true }));
    const closed = await page.evaluate(() => (window as any).matrix.escape());
    expect(closed, 'Escape did not close the calendar').toBe(true);
  });
});

// ── The form clauses the DOM tier cannot reach ──────────────────────────────

test.describe('date-range-picker visual matrix: real form participation', () => {
  test('an enabled named picker contributes exactly its two canonical fields', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'booking', format: 'dd/mm/yyyy',
      start: '10/03/2026', end: '20/03/2026',
    }));
    // "independent of the visible format and preserved live string."
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([
      ['booking-start', '2026-03-10'], ['booking-end', '2026-03-20'],
    ]);
  });

  test('the host is listed in form.elements and owns its form', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ name: 'booking' }));
    const owned = await page.evaluate(() => {
      const el = (window as any).matrix.el;
      return {
        inFormElements: [...el.form.elements].includes(el),
        formIsHostForm: el.form === document.getElementById('host-form'),
      };
    });
    expect(owned.inFormElements, 'the host must be listed in form.elements').toBe(true);
    expect(owned.formIsHostForm, 'the host did not adopt its owning form').toBe(true);
  });

  test('a named optional empty picker still contributes both empty fields', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ name: 'optional' }));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([
      ['optional-start', ''], ['optional-end', ''],
    ]);
  });

  test('an unnamed picker contributes nothing', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      start: '2026-03-10', end: '2026-03-20',
    }));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([]);
  });

  test('an impossible endpoint contributes "" without barring its peer', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', start: '2026-02-30', end: '2026-03-20',
    }));
    expect(await page.evaluate(() => (window as any).matrix.formEntries())).toEqual([
      ['stay-start', ''], ['stay-end', '2026-03-20'],
    ]);
  });

  test('a disabled picker is omitted; readonly and loading are not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', start: '2026-03-10', end: '2026-03-20', disabled: true,
    }));
    expect(await page.evaluate(() => (window as any).matrix.formEntries()),
      'a disabled control must contribute nothing').toEqual([]);

    for (const state of ['readonly', 'loading']) {
      await page.evaluate(s => (window as any).matrix.mount({
        name: 'stay', start: '2026-03-10', end: '2026-03-20', [s]: true,
      }), state);
      expect(await page.evaluate(() => (window as any).matrix.formEntries()),
        `${state} dropped its submission`).toEqual([
        ['stay-start', '2026-03-10'], ['stay-end', '2026-03-20'],
      ]);
    }
  });

  test('the real ValidityState follows the documented mapping', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', required: true,
    }));
    const empty = await page.evaluate(() => (window as any).matrix.validity());
    expect(empty.inFormElements).toBe(true);
    expect(empty.valueMissing, 'required + empty is valueMissing').toBe(true);

    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', start: '2026-03-20', end: '2026-03-10',
    }));
    const reversed = await page.evaluate(() => (window as any).matrix.validity());
    expect(reversed.customError, 'a reversed range is customError').toBe(true);
    expect(reversed.valid).toBe(false);

    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', start: '2026-03-01', end: '2026-03-31',
      min: '2026-03-10', max: '2026-03-20',
    }));
    const under = await page.evaluate(() => (window as any).matrix.validity());
    expect(under.rangeUnderflow, 'a start below min is rangeUnderflow').toBe(true);

    await page.evaluate(() => (window as any).matrix.mount({
      name: 'stay', disabled: true, required: true,
    }));
    const barred = await page.evaluate(() => (window as any).matrix.validity());
    expect(barred.willValidate, 'a disabled control is barred from validation').toBe(false);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive
// than an evaluate, and layer 1 already measured the model the browser
// built. These exist because "the start day has background-color:
// var(--snice-color-primary)" and "the selection is VISIBLE" are different
// claims, and only pixels can tell them apart.

test.describe('date-range-picker visual matrix: marquee pixels', () => {
  test('the range endpoints and interior really paint three different fills', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      start: '2026-03-10', end: '2026-03-20', min: '2026-03-05', open: true,
    }));
    // The popup is a fixed-position layer that may extend past the host box,
    // so the capture probes from the body and resolves the day boxes live.
    const [start, middle, plain] = await capture(
      page, 'body', 'drp-range-days',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = iso => sr.querySelector('[data-date="' + iso + '"]').getBoundingClientRect();
        // The fill is the claim under test, not the day's ink: probe just
        // inside the cell's left edge (clear of the centred digits and of
        // the 4px corner radius), the way the error-text marquee probes
        // box.x + 2. A centre probe reads glyph anti-aliasing and makes
        // the contrast a font-metric accident.
        const at = b => ({ x: b.x + 3, y: b.y + b.height / 2 });
        return [at(box('2026-03-10')), at(box('2026-03-15')), at(box('2026-03-22'))];
      }`,
    );
    expect(sameColor(start as RGB, plain as RGB),
      `the start endpoint painted ${start.join(',')}, identical to a plain day`).toBe(false);
    expect(sameColor(middle as RGB, plain as RGB),
      `the range interior painted ${middle.join(',')}, identical to a plain day`).toBe(false);
    const best = Math.max(
      contrast(start as RGB, plain as RGB),
      contrast(middle as RGB, plain as RGB),
    );
    expect(best, `best range-vs-plain contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(1.5);
  });

  test('the error state paints a field its own text is readable on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      invalid: true, errorText: 'Range unavailable', label: 'Stay',
      start: '2026-03-10', end: '2026-03-20',
    }));
    const [errorInk] = await capture(
      page, '#subject', 'drp-error-text',
      `(host) => {
        const node = host.shadowRoot.querySelector('[part="error-text"]');
        const box = node.getBoundingClientRect();
        return [{ x: box.x + 2, y: box.y + box.height / 2 }];
      }`,
    );

    await page.evaluate(() => (window as any).matrix.mount({
      helperText: 'Choose both endpoints', label: 'Stay',
      start: '2026-03-10', end: '2026-03-20',
    }));
    const [helperInk] = await capture(
      page, '#subject', 'drp-helper-text',
      `(host) => {
        const node = host.shadowRoot.querySelector('[part="helper-text"]');
        const box = node.getBoundingClientRect();
        return [{ x: box.x + 2, y: box.y + box.height / 2 }];
      }`,
    );

    // The docs make the error a distinct, alerting state; two texts that
    // paint the same colour are one text with two names.
    expect(sameColor(errorInk as RGB, helperInk as RGB),
      `helper painted ${helperInk.join(',')} and error painted ${errorInk.join(',')}`)
      .toBe(false);
    const [r, g, b] = errorInk as RGB;
    expect(r > g && r > b, `error text painted rgb(${r},${g},${b}), not a danger colour`)
      .toBe(true);
  });

  test('a filled field paints a different surface than an outlined one', async () => {
    const fills: RGB[] = [];
    for (const variant of ['outlined', 'filled']) {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, size: 'large', label: 'Stay',
      }), variant);
      const [fill] = await capture(
        page, '#subject', `drp-${variant}-fill`,
        `(host) => {
          const input = host.shadowRoot.querySelector('.input');
          const box = input.getBoundingClientRect();
          return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
        }`,
      );
      fills.push(fill as RGB);
    }
    // Both surfaces are near-white theme steps; sameColor is the honest
    // judge, not a contrast threshold.
    expect(sameColor(fills[0], fills[1]),
      `outlined and filled both painted ${fills[0].join(',')}`).toBe(false);
  });

  test('the open popup paints its own surface over the rival beneath it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Stay', rival: true, start: '2026-03-10', end: '2026-03-20', open: true,
    }));
    const [inPopup, onRival] = await capture(
      page, 'body', 'drp-popup-surface',
      `() => {
        const panel = document.getElementById('subject').shadowRoot.querySelector('.calendar');
        const box = panel.getBoundingClientRect();
        const rival = document.getElementById('rival').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + 4 },
          { x: rival.x + 4, y: rival.y + rival.height - 4 },
        ];
      }`,
    );
    // The rival is a saturated danger colour; a popup that painted under it
    // would read the rival's pixels instead of its own surface.
    expect(sameColor(inPopup as RGB, onRival as RGB),
      `the popup interior painted ${inPopup.join(',')}, the rival's own colour`).toBe(false);
  });
});
