/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-booking TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/booking) owns the gates and the four events.
 * What it cannot own is the calendar as a visitor meets it: seven even
 * columns under seven weekday headings, an available day that looks available,
 * a disabled day that looks disabled, and slot buttons that are big enough to
 * tap without hitting the one beside them.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the month grid paints 42 cells in seven columns of six rows, each cell
 *     under its own weekday heading;
 *   · no two day cells overlap, and every one is hit-testable;
 *   · an available day is painted differently from a disabled one;
 *   · the slot buttons form a grid whose rows do not overlap;
 *   · the stepper's active chip is distinguishable from the inactive ones.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the selected day must not paint the same colour as its neighbours, and
 *   MATRIX-booking-2 is confirmed fixed in a real browser: a completed required
 *   form leaves Confirm enabled.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/booking/matrix.html';

interface Combo {
  id: string;
  variant: 'stepper' | 'inline';
  gate: 'open' | 'listed';
  fields: 'none' | 'required';
}

/** variant (2) x gate (2) x form (2) = 8 mounted combos, each measured whole. */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['stepper', 'inline'] as const) {
    for (const gate of ['open', 'listed'] as const) {
      for (const fields of ['none', 'required'] as const) {
        combos.push({ id: `${variant}/${gate}/${fields}-form`, variant, gate, fields });
      }
    }
  }
  return combos;
}

let page: Page;
let future: string[] = [];

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  future = await page.evaluate(() => (window as any).matrix.futureDays(3));
});
test.afterAll(async () => { await page?.close(); });

async function mount(combo: Combo): Promise<{ days: number; slots: number }> {
  return page.evaluate(({ combo, future }) => (window as any).matrix.mount({
    variant: combo.variant,
    availableDates: combo.gate === 'listed' ? future.slice(0, 2) : [],
    availableSlots: future.slice(0, 2).flatMap((date: string) => ([
      { date, time: '09:00', duration: 30 },
      { date, time: '10:00', duration: 30 },
      { date, time: '14:30', duration: 60 },
    ])),
    fields: combo.fields === 'required'
      ? [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
      ]
      : [],
  }), { combo, future });
}

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

    // ── The month grid is seven columns of six rows ─────────────────────────
    const cells = [...sr.querySelectorAll('.booking__day')] as HTMLElement[];
    if (cells.length !== 42) say(`${cells.length} day cells painted`);
    const columns = new Set(cells.map(cell => Math.round(rect(cell).left)));
    const rows = new Set(cells.map(cell => Math.round(rect(cell).top)));
    if (columns.size !== 7) say(`the month grid paints ${columns.size} columns`);
    if (rows.size !== 6) say(`the month grid paints ${rows.size} rows`);

    const weekdays = [...sr.querySelectorAll('.booking__weekday')] as HTMLElement[];
    if (weekdays.length !== 7) say(`${weekdays.length} weekday headings`);
    for (const [i, cell] of cells.slice(0, 7).entries()) {
      const head = rect(weekdays[i]);
      const box = rect(cell);
      const centre = box.left + box.width / 2;
      if (centre < head.left - 2 || centre > head.right + 2) {
        say(`the first week's day ${i} is not under the "${weekdays[i].textContent}" heading`);
      }
    }

    // ── Cells do not overlap, and each is hit-testable ─────────────────────
    for (const [i, cell] of cells.entries()) {
      const box = rect(cell);
      if (box.width <= 0 || box.height <= 0) { say(`day cell ${i} is ${box.width}x${box.height}`); continue; }
      if (i > 0 && i % 7 !== 0) {
        const previous = rect(cells[i - 1]);
        if (box.left < previous.right - EPS) say(`day cell ${i} overlaps the one before it`);
      }
      const hit = (sr as any).elementFromPoint(
        box.left + box.width / 2, box.top + box.height / 2) as Element | null;
      if (hit !== cell && !cell.contains(hit as Node)) {
        say(`day cell ${i} is not the element under its own centre`);
      }
    }

    // ── An open day looks open ─────────────────────────────────────────────
    const face = (cell: HTMLElement) => {
      const style = getComputedStyle(cell);
      return `${style.color}|${style.backgroundColor}|${style.opacity}`;
    };
    const open = cells.find(cell => !cell.disabled);
    const shut = cells.find(cell => cell.disabled
      && !cell.classList.contains('booking__day--other'));
    if (!open) {
      say('every day in the month is disabled');
    } else if (shut && face(open) === face(shut)) {
      say(`a bookable day paints exactly like an unbookable one (${face(open)})`);
    }

    // ── The stepper's active chip stands out ───────────────────────────────
    const chips = [...sr.querySelectorAll('.booking__step')] as HTMLElement[];
    if (combo.variant === 'stepper') {
      if (chips.length !== 3) say(`${chips.length} stepper chips painted`);
      const active = chips.find(chip => chip.classList.contains('booking__step--active'));
      const inactive = chips.find(chip => !chip.classList.contains('booking__step--active'));
      if (!active) {
        say('no stepper chip is active');
      } else if (inactive) {
        const key = (chip: HTMLElement) => {
          const marker = chip.querySelector('.booking__step-number') as HTMLElement;
          const style = getComputedStyle(marker);
          return `${style.color}|${style.backgroundColor}|${style.fontWeight}`;
        };
        if (key(active) === key(inactive)) {
          say(`the active step chip paints exactly like an inactive one (${key(active)})`);
        }
      }
    } else if (chips.length) {
      say(`the inline variant painted ${chips.length} stepper chips`);
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('booking visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await mount(combo);
      expect(mounted.days, 'day cells').toBe(42);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('booking visual matrix: the slots grid', () => {
  for (const variant of ['stepper', 'inline'] as const) {
    test(`variant=${variant}`, async () => {
      await mount({ id: 'slots', variant, gate: 'listed', fields: 'none' });
      expect(await page.evaluate(d => (window as any).matrix.pickDay(d), future[0]),
        'the listed day was selectable').toBe(true);
      if (variant === 'stepper') {
        expect(await page.evaluate(() => (window as any).matrix.pressPrimary()),
          'Next after picking a date').toBe(true);
      }

      const problems = await page.evaluate(() => {
        const out: string[] = [];
        const sr = document.getElementById('subject')!.shadowRoot!;
        const slots = [...sr.querySelectorAll('.booking__slot')] as HTMLElement[];
        if (!slots.length) { out.push('no slots painted for the selected day'); return out; }
        for (const [i, slot] of slots.entries()) {
          const box = slot.getBoundingClientRect();
          if (box.width < 60 || box.height < 32) {
            out.push(`slot ${i} is ${box.width.toFixed(0)}x${box.height.toFixed(0)},`
              + ' too small to tap');
          }
          const hit = (sr as any).elementFromPoint(
            box.left + box.width / 2, box.top + box.height / 2) as Element | null;
          if (hit !== slot && !slot.contains(hit as Node)) {
            out.push(`slot ${i} is not the element under its own centre`);
          }
          for (const other of slots.slice(i + 1)) {
            const b = other.getBoundingClientRect();
            if (box.right > b.left + 1 && b.right > box.left + 1
              && box.bottom > b.top + 1 && b.bottom > box.top + 1) {
              out.push(`slot ${i} overlaps another slot`);
            }
          }
          const time = slot.querySelector('.booking__slot-time') as HTMLElement;
          const duration = slot.querySelector('.booking__slot-duration') as HTMLElement;
          if (!time || !duration) { out.push(`slot ${i} is missing its time or duration`); continue; }
          if (time.getBoundingClientRect().bottom > duration.getBoundingClientRect().top + 1) {
            out.push(`slot ${i}: the duration is not below the time`);
          }
        }
        return out;
      });
      expect(problems, `slots for variant=${variant}`).toEqual([]);
    });
  }
});

// ── MATRIX-booking-2 (fixed), in a real browser ─────────────────────────────
//
// The DOM matrix already unwrapped it; this is the same claim measured where
// the events, the focus and the input handlers are all real, so the fix cannot
// be dismissed as a happy-dom artefact. The assertion is the documented flow
// and is not weakened.

test.describe('booking visual matrix: confirming a booking', () => {
  test('a filled required form enables Confirm [MATRIX-booking-2 (fixed)]', async () => {
    await mount({ id: 'confirm', variant: 'stepper', gate: 'listed', fields: 'required' });
    expect(await page.evaluate(d => (window as any).matrix.pickDay(d), future[0])).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.pressPrimary())).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.pickSlot(0))).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.pressPrimary())).toBe(true);

    const filled = await page.evaluate(() => (window as any).matrix.fillForm());
    expect(filled.inputs, 'the form painted its documented fields').toBe(2);
    expect(filled.confirmDisabled,
      'Confirm is still disabled after every required field was filled').toBe(false);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('booking visual matrix: marquee pixels', () => {
  test('the selected day is painted, not merely flagged', async () => {
    await mount({ id: 'selected', variant: 'inline', gate: 'listed', fields: 'none' });
    expect(await page.evaluate(d => (window as any).matrix.pickDay(d), future[0])).toBe(true);

    const [selected, neighbour] = await capture(
      page, '#subject', 'booking-selected-day',
      `(host) => {
        const sr = host.shadowRoot;
        const cell = sr.querySelector('.booking__day--selected');
        const cells = [...sr.querySelectorAll('.booking__day')];
        const other = cells.find(c => c !== cell && !c.disabled) || cells[cells.length - 1];
        const a = cell.getBoundingClientRect();
        const b = other.getBoundingClientRect();
        return [
          { x: a.x + a.width / 2, y: a.y + a.height / 2 },
          { x: b.x + b.width / 2, y: b.y + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(selected, neighbour),
      `the selected day painted ${selected.join(',')}, the same as an unselected one`)
      .toBe(false);
  });
});
