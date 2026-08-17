/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-time-picker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/time-picker, `npm run test:matrix`, 340 tests)
 * owns the value truth: the canonical contract, both display formats, the
 * parsing table, the whole validity table, the live/default lifecycle and the
 * event order. Three categories of this component's documentation are
 * nevertheless invisible to it:
 *
 *  1. THE DROPDOWN AS A THING ON THE SCREEN. It is a native `popover`: it
 *     belongs to the top layer, it is positioned against the input, and it
 *     flips above it when there is no room below. happy-dom has no top layer,
 *     no viewport and no layout, so "opens" there means one attribute changed.
 *
 *  2. THE TWO VARIANTS AS PICTURES. "Inline: selectors stay visible and
 *     interactive; it does not retain a popover attribute and is the external-
 *     label focus target." Every word of that is about what a reader sees and
 *     where the caret goes.
 *
 *  3. THE FORM PLATFORM. `new FormData(form)`, `form.reset()` and
 *     `<fieldset disabled>` are the browser's algorithms; happy-dom implements
 *     none of them for a form-associated custom element, which is why the DOM
 *     tier records `setFormValue` calls through `tests/matrix/internals-mock.ts`
 *     and why that file's header sends the real thing here.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every documented part the combo asks for has a real, visible box, in
 *     reading order — label, input row, dropdown, helper/error;
 *   · the toggle and the clear button sit inside the input row, side by side,
 *     never on top of the text;
 *   · a closed dropdown paints nothing; an open one is anchored to the input,
 *     at least as wide as it, and inside the viewport;
 *   · the selector columns sit side by side in documented order, each option a
 *     real, non-overlapping row inside its own scroller;
 *   · the inline variant's selectors are painted from the start.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A disabled option has to LOOK disabled and a selected one has to LOOK
 *   selected — both are "a class was applied" in the DOM tier and a colour
 *   question here.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/time-picker/matrix.html';

type Format = '12h' | '24h';
type Variant = 'dropdown' | 'inline';
type Size = 'small' | 'medium' | 'large';

interface Box {
  x: number; y: number; width: number; height: number;
  top: number; left: number; right: number; bottom: number;
  display: string; visibility: string; overflowY: string;
}
interface Option {
  label: string; disabled: boolean; selected: boolean;
  x: number; y: number; width: number; height: number;
  top: number; left: number; right: number; bottom: number;
}
type Column = Box & { items: Option[] };

interface Geometry {
  mounted: boolean;
  host: Omit<Box, 'display' | 'visibility' | 'overflowY'>;
  base: Box | null; label: Box | null; input: Box | null; toggle: Box | null;
  clear: Box | null; spinner: Box | null; dropdown: Box | null;
  helper: Box | null; error: Box | null;
  hours: Column | null; minutes: Column | null;
  seconds: Column | null; period: Column | null;
  open: boolean; value: string; inputValue: string | null;
}

interface Combo {
  id: string;
  variant: Variant;
  format: Format;
  size: Size;
  showSeconds: boolean;
  decoration: 'bare' | 'label' | 'helper' | 'error';
  value: string;
  step: number;
  clearable: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const VIEWPORT = { width: 1280, height: 900 };

/**
 * variant (2) x format (2) x size (3) x showSeconds (2) x decoration (4) = 96
 * combos, each measured closed and then — for the dropdown variant — open.
 *
 * Sized to a complex form control: `variant` and `showSeconds` decide which
 * boxes exist, `format` adds a fourth selector column, `size` scales the input
 * row, and `decoration` is the axis that stacks label and helper/error text
 * above and below everything else, which is where a layout runs out of room.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['dropdown', 'inline'] as Variant[]) {
    for (const format of ['24h', '12h'] as Format[]) {
      for (const size of ['small', 'medium', 'large'] as Size[]) {
        for (const showSeconds of [false, true]) {
          for (const decoration of ['bare', 'label', 'helper', 'error'] as const) {
            combos.push({
              id: `${variant}/${format}/${size}${showSeconds ? '/seconds' : ''}/${decoration}`,
              variant, format, size, showSeconds, decoration,
              value: showSeconds ? '14:05:10' : '14:05',
              step: 5,
              clearable: true,
              label: decoration === 'bare' ? undefined : 'Appointment',
              helperText: decoration === 'helper' || decoration === 'error'
                ? 'Office hours only.' : undefined,
              errorText: decoration === 'error' ? 'Pick a time.' : undefined,
            });
          }
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

const painted = (box: Box | null) =>
  !!box && box.display !== 'none' && box.visibility === 'visible'
  && box.width > 0 && box.height > 0;

/** LAYER 1: every documented consequence of one combo's geometry. */
function geometryProblems(combo: Combo, g: Geometry, opened: boolean): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  if (!g.mounted) { say('nothing mounted'); return problems; }

  const inline = combo.variant === 'inline';

  // ── The parts that must be painted, and the ones that must not ──────────
  const expected: Array<[string, Box | null, boolean]> = [
    ['base', g.base, true],
    ['label', g.label, combo.decoration !== 'bare'],
    ['input', g.input, !inline],
    ['toggle', g.toggle, !inline],
    ['helper-text', g.helper, combo.decoration === 'helper'],
    ['error-text', g.error, combo.decoration === 'error'],
  ];
  for (const [name, box, wanted] of expected) {
    if (wanted && !painted(box)) {
      say(`[part="${name}"] paints ${box ? `${box.width}x${box.height} (${box.display})` : 'nothing'}`);
    }
    if (!wanted && painted(box)) say(`[part="${name}"] is painted but not asked for`);
  }
  if (!g.base) return problems;

  const within = (inner: Box | Option, outer: Box, what: string, of: string) => {
    if (inner.left < outer.left - 1 || inner.right > outer.right + 1
      || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
      say(`${what} escapes ${of}`);
    }
  };

  // ── The input row: text, then toggle, then clear, all inside it ─────────
  if (!inline && g.input && g.toggle) {
    if (!(g.input.right >= g.toggle.right - 1)) {
      say(`the clock toggle (right ${g.toggle.right.toFixed(1)}) sits outside the`
        + ` input (right ${g.input.right.toFixed(1)})`);
    }
    if (g.toggle.left < g.input.left) {
      say('the clock toggle is painted left of the input it belongs to');
    }
    if (painted(g.clear) && g.clear!.right > g.toggle.left + 1) {
      say(`the clear button (right ${g.clear!.right.toFixed(1)}) overlaps the`
        + ` toggle (left ${g.toggle.left.toFixed(1)})`);
    }
    if (painted(g.spinner)) within(g.spinner!, g.base, '[part="spinner"]', '[part="base"]');
  }

  // ── Reading order down the control ─────────────────────────────────────
  const stack: Array<[string, Box | null]> = [
    ['label', g.label],
    ['input', inline ? null : g.input],
    ['dropdown', inline ? g.dropdown : null],
    ['helper-text', g.helper],
    ['error-text', g.error],
  ];
  const rows = stack.filter(([, box]) => painted(box)) as Array<[string, Box]>;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1].top < rows[i - 1][1].bottom - 1) {
      say(`[part="${rows[i][0]}"] overlaps [part="${rows[i - 1][0]}"]`);
    }
  }
  for (const [name, box] of rows) within(box, g.base, `[part="${name}"]`, '[part="base"]');

  // ── The dropdown ───────────────────────────────────────────────────────
  if (inline) {
    if (!painted(g.dropdown)) say('the inline variant paints no selectors');
  } else if (!opened) {
    if (painted(g.dropdown)) say('the closed dropdown is painted');
  } else {
    if (!painted(g.dropdown)) say('the opened dropdown paints nothing');
    else {
      const d = g.dropdown!;
      if (d.left < 0 || d.top < 0 || d.right > VIEWPORT.width || d.bottom > VIEWPORT.height) {
        say(`the open dropdown (${d.left.toFixed(0)},${d.top.toFixed(0)},`
          + `${d.right.toFixed(0)},${d.bottom.toFixed(0)}) is not inside the viewport`);
      }
      if (g.input && d.width < g.input.width - 1) {
        say(`the dropdown is ${d.width.toFixed(1)}px wide under a`
          + ` ${g.input.width.toFixed(1)}px input`);
      }
      if (g.input) {
        const anchored = Math.abs(d.top - g.input.bottom) < 24
          || Math.abs(d.bottom - g.input.top) < 24;
        if (!anchored) {
          say(`the dropdown (top ${d.top.toFixed(1)}, bottom ${d.bottom.toFixed(1)}) is`
            + ` anchored to neither edge of the input (top ${g.input.top.toFixed(1)},`
            + ` bottom ${g.input.bottom.toFixed(1)})`);
        }
      }
    }
  }

  // ── The selector columns ───────────────────────────────────────────────
  const columnsVisible = inline || opened;
  const columns: Array<[string, Column | null, boolean]> = [
    ['hours', g.hours, true],
    ['minutes', g.minutes, true],
    ['seconds', g.seconds, combo.showSeconds],
    ['period', g.period, combo.format === '12h'],
  ];
  for (const [name, column, wanted] of columns) {
    if (!wanted) {
      if (columnsVisible && painted(column)) say(`[part="${name}"] is painted but not asked for`);
      continue;
    }
    if (!columnsVisible) continue;
    if (!painted(column)) {
      say(`[part="${name}"] paints ${column ? `${column.width}x${column.height}` : 'nothing'}`);
      continue;
    }
    const items = column!.items;
    if (items.length === 0) say(`[part="${name}"] holds no options`);
    // Options descend inside their own column, without overlapping. The
    // column scrolls, so an option may be clipped OUT of view — what it may
    // not do is sit on the option above it.
    for (let i = 1; i < items.length; i++) {
      if (items[i].top < items[i - 1].bottom - 1) {
        say(`${name} option "${items[i].label}" overlaps "${items[i - 1].label}"`);
      }
    }
    for (const item of items) {
      if (item.width <= 0 || item.height <= 0) {
        say(`${name} option "${item.label}" renders at ${item.width}x${item.height}`);
      }
      if (item.left < column!.left - 1 || item.right > column!.right + 1) {
        say(`${name} option "${item.label}" escapes its column horizontally`);
      }
    }
  }
  // Side by side, in the documented order.
  if (columnsVisible) {
    const order = columns
      .filter(([, column, wanted]) => wanted && painted(column))
      .map(([name, column]) => [name, column!] as [string, Column]);
    for (let i = 1; i < order.length; i++) {
      if (order[i][1].left < order[i - 1][1].right - 1) {
        say(`the ${order[i][0]} column overlaps the ${order[i - 1][0]} column`);
      }
    }
  }

  return problems;
}

const combos = generateCombos();

test.describe('time-picker visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const closed: Geometry = await page.evaluate(c => (window as any).matrix.mount(c),
        combo as any);
      expect(geometryProblems(combo, closed, false), `combo ${combo.id} (closed)`).toEqual([]);

      if (combo.variant === 'dropdown') {
        const open: Geometry = await page.evaluate(() => (window as any).matrix.open());
        expect(open.open, `combo ${combo.id}: the toggle did not open the dropdown`).toBe(true);
        expect(geometryProblems(combo, open, true), `combo ${combo.id} (open)`).toEqual([]);

        // The open dropdown is the topmost thing at its own centre.
        const hit = await page.evaluate(({ x, y }) => {
          const node = document.elementFromPoint(x, y);
          return node ? node.tagName.toLowerCase() : 'nothing';
        }, {
          x: open.dropdown!.left + open.dropdown!.width / 2,
          y: open.dropdown!.top + open.dropdown!.height / 2,
        });
        expect(hit, `combo ${combo.id}: something is painted over the open dropdown`)
          .toBe('snice-time-picker');
      }
    });
  }
});

// ── The dropdown as a popover ───────────────────────────────────────────────

test.describe('time-picker visual matrix: the dropdown', () => {
  const base = { variant: 'dropdown' as Variant, format: '24h' as Format,
    size: 'medium' as Size, showSeconds: false, value: '14:05', step: 5, clearable: true };

  test('it flips above the input when there is no room below', async () => {
    await page.evaluate(() => (window as any).matrix.setStageTop(760));
    const opened: Geometry = await page.evaluate(async (c) => {
      await (window as any).matrix.mount(c);
      (window as any).matrix.setStageTop(760);
      return (window as any).matrix.open();
    }, base as any);

    expect(opened.dropdown!.bottom, 'the dropdown ran off the bottom of the viewport')
      .toBeLessThanOrEqual(900);
    expect(opened.dropdown!.top, 'the dropdown did not flip above the input')
      .toBeLessThan(opened.input!.top);
    await page.evaluate(() => (window as any).matrix.setStageTop(120));
  });

  test('it is in the top layer: an opaque z-index 2147483647 panel cannot cover it', async () => {
    const opened: Geometry = await page.evaluate(async (c) => {
      await (window as any).matrix.mount(c);
      return (window as any).matrix.open();
    }, base as any);
    await page.evaluate(() => (window as any).matrix.showCurtain());
    try {
      const hit = await page.evaluate(({ x, y }) => {
        const node = document.elementFromPoint(x, y);
        return node ? `${node.tagName.toLowerCase()}#${node.id}` : 'nothing';
      }, {
        x: opened.dropdown!.left + opened.dropdown!.width / 2,
        y: opened.dropdown!.top + opened.dropdown!.height / 2,
      });
      expect(hit, 'the curtain covered a popover dropdown').toBe('snice-time-picker#subject');
    } finally {
      await page.evaluate(() => (window as any).matrix.hideCurtain());
    }
  });

  test('Escape puts it away again', async () => {
    await page.evaluate(async (c) => {
      await (window as any).matrix.mount(c);
      await (window as any).matrix.open();
    }, base as any);
    const closed: Geometry = await page.evaluate(() => (window as any).matrix.pressKey('Escape'));
    expect(closed.open, 'Escape left the dropdown open').toBe(false);
    await expect.poll(async () => page.evaluate(() => {
      const box = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part="dropdown"]')!.getBoundingClientRect();
      return box.width * box.height;
    }), { message: 'the dismissed dropdown never stopped occupying a box' }).toBe(0);
  });

  test('picking an option repaints the input and moves the selection', async () => {
    await page.evaluate(async (c) => {
      await (window as any).matrix.mount(c);
      await (window as any).matrix.open();
    }, { ...base, format: '12h' } as any);

    const picked: Geometry = await page.evaluate(() => (window as any).matrix.pick('period', 'PM'));
    expect(picked.inputValue, 'the input did not follow the period selection').toBe('2:05 PM');
    expect(picked.period!.items.filter(item => item.selected).map(item => item.label))
      .toEqual(['PM']);

    const hour: Geometry = await page.evaluate(() => (window as any).matrix.pick('hours', '9'));
    expect(hour.inputValue).toBe('9:05 PM');
    expect(hour.value).toBe('21:05');
  });
});

// ── The two variants, and the documented focus targets ──────────────────────

test.describe('time-picker visual matrix: variants and focus', () => {
  test('focus() lands on the input for a dropdown and on the selectors for inline', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'dropdown', format: '24h', size: 'medium', value: '14:05', step: 5,
    } as any);
    expect(await page.evaluate(() => (window as any).matrix.focusHost())).toBe('input');

    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'inline', format: '24h', size: 'medium', value: '14:05', step: 5,
    } as any);
    expect(await page.evaluate(() => (window as any).matrix.focusHost())).toBe('dropdown');
  });

  test('an external label focuses without opening', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'dropdown', format: '24h', size: 'medium', value: '14:05', step: 5,
    } as any);
    await page.evaluate(() => (window as any).matrix.addExternalLabel('Appointment'));

    const result = await page.evaluate(() => (window as any).matrix.clickExternalLabel());
    expect(result.focused, 'the label did not focus the control').toBe('input');
    expect(result.open, 'the label activation opened the dropdown').toBe(false);
  });

  test('a disabled control is inert to label activation', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'dropdown', format: '24h', size: 'medium', value: '14:05', step: 5,
      disabled: true,
    } as any);
    await page.evaluate(() => (window as any).matrix.addExternalLabel('Appointment'));

    const result = await page.evaluate(() => (window as any).matrix.clickExternalLabel());
    expect(result.focused, 'a disabled control took focus from a label').toBeNull();
    expect(result.open).toBe(false);
  });

  test('the size scale grows the input row', async () => {
    const height = async (size: Size) => {
      const g: Geometry = await page.evaluate(c => (window as any).matrix.mount(c), {
        variant: 'dropdown', format: '24h', size, value: '14:05', step: 5,
      } as any);
      return g.input!.height;
    };
    const small = await height('small');
    const medium = await height('medium');
    const large = await height('large');
    expect(small, `small ${small} vs medium ${medium}`).toBeLessThan(medium);
    expect(medium, `medium ${medium} vs large ${large}`).toBeLessThan(large);
  });
});

// ── The form platform, in a real engine ─────────────────────────────────────

test.describe('time-picker visual matrix: the real form platform', () => {
  const base = { variant: 'dropdown' as Variant, format: '12h' as Format,
    size: 'medium' as Size, showSeconds: true, value: '14:05:10', step: 5,
    minTime: '09:00:00', maxTime: '17:00:00', clearable: true, name: 'appointment' };

  test('the documented example submits 14:05:10 while the user sees 2:05:10 PM', async () => {
    const g: Geometry = await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    expect(g.inputValue, 'the user does not see the documented display').toBe('2:05:10 PM');
    expect(await page.evaluate(() => (window as any).matrix.formEntries('appointment')),
      'the form did not receive the documented canonical value').toEqual(['14:05:10']);
    expect(await page.evaluate(() => (window as any).matrix.formElementsHasSubject()),
      'the control is not listed in form.elements').toBe(true);
  });

  test('malformed text submits nothing rather than the malformed text', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => {
      const input = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part="input"]') as HTMLInputElement;
      input.value = 'lunchtime';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    expect(await page.evaluate(() => (window as any).matrix.formEntries('appointment')))
      .toEqual(['']);
    expect((await page.evaluate(() => (window as any).matrix.formValidity())).form,
      'a form with unparseable time text still validated').toBe(false);
  });

  test('form.reset() restores the default and repaints the input', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => (window as any).matrix.open());
    await page.evaluate(() => (window as any).matrix.pick('hours', '10'));

    const reset: Geometry = await page.evaluate(() => (window as any).matrix.reset());
    expect(reset.value, 'reset did not restore the default').toBe('14:05:10');
    expect(reset.inputValue).toBe('2:05:10 PM');
    expect(await page.evaluate(() => (window as any).matrix.formEntries('appointment')))
      .toEqual(['14:05:10']);
  });

  test('a real <fieldset disabled> omits and bars the control, then gives it back', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    await page.evaluate(() => (window as any).matrix.setFieldsetDisabled(true));

    expect(await page.evaluate(() => (window as any).matrix.formEntries('appointment')),
      'a fieldset-disabled control was still submitted').toEqual([]);
    const barred = await page.evaluate(() => (window as any).matrix.formValidity());
    expect(barred.willValidate, 'a fieldset-disabled control still validates').toBe(false);
    expect(await page.evaluate(() => document.getElementById('subject')!.hasAttribute('disabled')),
      'inherited disabledness wrote the disabled attribute').toBe(false);

    await page.evaluate(() => (window as any).matrix.setFieldsetDisabled(false));
    expect(await page.evaluate(() => (window as any).matrix.formEntries('appointment')))
      .toEqual(['14:05:10']);
  });

  test('a range violation blocks real form validation', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, value: '08:00:00' } as any);
    const validity = await page.evaluate(() => (window as any).matrix.formValidity());
    expect(validity.control, 'a time before min-time reported itself valid').toBe(false);
    expect(validity.form, 'the form validated with an out-of-range time').toBe(false);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('time-picker visual matrix: marquee pixels', () => {
  // The value sits ON the step lattice (15-minute increments) so that one of
  // the rendered minute options really is the selected one — there is nothing
  // to photograph otherwise.
  const base = { variant: 'inline' as Variant, format: '24h' as Format,
    size: 'large' as Size, showSeconds: false, value: '14:15', step: 15,
    minTime: '09:00', maxTime: '17:00' };

  test('the selected option is painted differently from its neighbours', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    const [selected, plain] = await capture(
      page, 'body', 'time-picker-selected-option',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const items = [...sr.querySelectorAll('[part="minutes"] .selector-item')];
        const chosen = items.find(item => item.classList.contains('selector-item--selected'));
        const other = items.find(item => item !== chosen && !item.disabled);
        // The left edge of each row, clear of the digits.
        return [chosen, other].map(item => {
          const box = item.getBoundingClientRect();
          return { x: box.x + 2, y: box.y + box.height / 2 };
        });
      }`,
    );
    expect(sameColor(selected, plain),
      `the selected option painted ${selected.join(',')}, the same as its neighbour`)
      .toBe(false);
    expect(contrast(selected, plain),
      `selected-vs-plain contrast is ${contrast(selected, plain).toFixed(2)}:1`)
      .toBeGreaterThan(1.05);
  });

  test('an out-of-range option is painted as unavailable', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), base as any);
    const pixels = await capture(
      page, 'body', 'time-picker-disabled-option',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const items = [...sr.querySelectorAll('[part="hours"] .selector-item')];
        const off = items.find(item => item.disabled);
        const on = items.find(item => !item.disabled && !item.classList.contains('selector-item--selected'));
        // Walk each item's glyph row every 2px: an item's exact centre falls
        // between the two digits, and whether a lone centre probe lands on a
        // stroke is font-metric luck (WebKit's does not). The row's darkest
        // pixel is the ink the engine really drew.
        const walk = (item) => {
          const box = item.getBoundingClientRect();
          const points = [];
          for (let x = 1; x < box.width; x += 2) {
            points.push({ x: box.x + x, y: box.y + box.height / 2 });
          }
          return points;
        };
        return [...walk(off), ...walk(on)];
      }`,
    );
    const ink = (row: RGB[]) =>
      row.reduce((a, p) => p[0] + p[1] + p[2] < a[0] + a[1] + a[2] ? p : a);
    const half = pixels.length / 2;
    const blocked = ink(pixels.slice(0, half) as RGB[]);
    const available = ink(pixels.slice(half) as RGB[]);
    expect(sameColor(blocked, available),
      `an out-of-range hour painted ${blocked.join(',')}, identical to a selectable one`)
      .toBe(false);
  });
});
