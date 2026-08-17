/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-color-picker TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/color-picker, `npm run test:matrix`) owns the
 * value contract: canonicalization, badInput, the format strings, the parts,
 * the accessible names, and the documented defaults. Its own oracle names
 * this tier's inheritance: "the swatch's painted colour and the native
 * chooser's behaviour" — a swatch that "has a background-color" can still
 * paint nothing, and the FACE half is owned by
 * tests/live/components/forms/form-associated-contract-matrix.spec.ts.
 *
 * What only a browser can see, per the doc:
 *
 *   · the swatch's BOX is the size axis (2rem / 2.5rem / 3rem plus its 2px
 *     rule) and its PAINT is the live value — `.swatch-inner` fills with
 *     `value` exactly, and `setValue` repaints it;
 *   · the control is a COLUMN — label above, swatch beside the text input,
 *     description below — and "error replaces helper": whichever line paints
 *     uses its documented ink (danger / text-secondary);
 *   · "The hidden native color input … is aria-hidden, and has
 *     tabindex=-1": hidden means opacity 0 AND unreachable by a pointer;
 *   · `showInput` / `showPresets` gate real subtrees, and the presets row is
 *     2rem colour chips, 0.5rem apart, that PAINT their own declared colours
 *     and can be chosen with a real pointer;
 *   · `invalid` / calculated errors drive styling: the swatch's rule and the
 *     input's rule turn the theme's danger; `disabled` halves the swatch and
 *     refuses the pointer; `loading` paints part="spinner" OVER the swatch
 *     (asserted as settled geometry only — never a screenshot mid-spin);
 *   · "Label activation focuses the text input when showInput, otherwise the
 *     swatch" — a real-pointer claim about real focus.
 *
 * There is no anchored popup to stage: the swatch delegates to the hidden
 * NATIVE chooser (browser/OS chrome, not shadow DOM), and the presets are an
 * inline row.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/color-picker/matrix.html';

/** The fixture leaves the root font size at the browser default: 16px/rem. */
const REM = 16;
/** The swatch's ring: `border: 2px solid`. */
const BORDER = 2;
/** The stylesheet's swatch box per documented size, plus its ring. */
const SWATCH_PX: Record<'small' | 'medium' | 'large', number> = {
  small: 2 * REM + 2 * BORDER,
  medium: 2.5 * REM + 2 * BORDER,
  large: 3 * REM + 2 * BORDER,
};
/** The preset chip: `width: 2rem` + its own 2px rule. */
const PRESET_PX = 2 * REM + 2 * BORDER;
/** The preset row's gap: `--snice-spacing-xs: 0.5rem`. */
const PRESET_GAP_PX = 0.5 * REM;

type Size = 'small' | 'medium' | 'large';

interface Combo {
  id: string;
  size: Size;
  showInput: boolean;
  showPresets: boolean;
  /** The authored `value` attribute (the reset default). */
  value?: string;
  /** A live property assignment after mount — the dirtying path. */
  liveValue?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
}

const base = (over: Partial<Combo> & { id: string }): Combo => ({
  size: 'medium', showInput: true, showPresets: false, ...over,
});

/**
 * LAYOUT: size (3) x showInput (2) x showPresets (2) = 12 combos, with the
 * swatch's paint rotated across three values and the label across on/off —
 * the two axes that change what surrounds the swatch. State axes (disabled,
 * loading, invalid, the description line) are their own cross so a paint
 * failure cannot hide behind a layout one.
 */
function layoutCombos(): Combo[] {
  const combos: Combo[] = [];
  const values = ['#ff0000', '#00aa33', '#1a2b3c'];
  let n = 0;
  for (const size of ['small', 'medium', 'large'] as const) {
    for (const showInput of [true, false]) {
      for (const showPresets of [false, true]) {
        combos.push(base({
          id: `layout/${size}/input=${showInput}/presets=${showPresets}`,
          size, showInput, showPresets,
          value: values[n % values.length],
          label: n % 2 ? 'Accent' : '',
        }));
        n++;
      }
    }
  }
  return combos;
}

/**
 * STATE: disabled / loading / invalid / the description line, at one fixed
 * layout. `required-empty` is the calculated-error path — "Empty `required`
 * reports valueMissing" and "Calculated errors drive styling".
 */
function stateCombos(): Combo[] {
  return [
    base({ id: 'state/plain', value: '#ff0000' }),
    base({ id: 'state/disabled', value: '#ff0000', disabled: true }),
    base({ id: 'state/loading', value: '#ff0000', loading: true }),
    base({ id: 'state/invalid', value: '#ff0000', invalid: true }),
    base({ id: 'state/invalid+error-text', value: '#ff0000', invalid: true, errorText: 'Pick a real colour' }),
    base({ id: 'state/helper-text', value: '#ff0000', helperText: 'Brand accent colour' }),
    base({ id: 'state/error-text', value: '#ff0000', errorText: 'Not a brand colour' }),
    base({ id: 'state/error-replaces-helper', value: '#ff0000', errorText: 'Not a brand colour', helperText: 'Brand accent colour' }),
    base({ id: 'state/required-empty', required: true, liveValue: '' }),
  ].map(c => ({ ...c, showPresets: true }));
}

/** Parse a computed `rgb(r, g, b)` / `rgba(...)` string into pixel-probe RGB. */
function toRGB(computed: string): RGB {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(computed);
  if (!m) return [-1, -1, -1];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** `#rrggbb` → the RGB a browser computes for it. */
function hexRGB(hex: string): RGB {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB;
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
  return page.evaluate(({ combo, swatchPx, presetPx, presetGapPx }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }
    // The component's own properties, which only exist on the custom element.
    const el = host as any;

    const basePart = sr.querySelector('.color-picker-wrapper') as HTMLElement | null;
    if (!basePart) { say('no part="base" painted'); return problems; }
    const container = sr.querySelector('.picker-container') as HTMLElement | null;
    if (!container) { say('no .picker-container row painted'); return problems; }
    const swatch = sr.querySelector('.color-swatch') as HTMLElement | null;
    const inner = sr.querySelector('.swatch-inner') as HTMLElement | null;
    if (!swatch || !inner) { say('no swatch painted'); return problems; }

    const swatchBox = swatch.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();
    const baseBox = basePart.getBoundingClientRect();

    // ── the size axis: the swatch IS the size ───────────────────────────────
    if (Math.abs(swatchBox.width - swatchPx) > EPS || Math.abs(swatchBox.height - swatchPx) > EPS) {
      say(`the ${combo.size} swatch renders at ${round(swatchBox.width)}x${round(swatchBox.height)}px,`
        + ` expected ${round(swatchPx)}px (size + its 2px rule)`);
    }
    if (Math.abs(swatchBox.width - swatchBox.height) > EPS) {
      say(`the swatch is ${round(swatchBox.width)}x${round(swatchBox.height)} — not square`);
    }

    // ── the swatch paints the live value ────────────────────────────────────
    const value = el.value as string;
    const painted = getComputedStyle(inner).backgroundColor;
    const hex = /^#[0-9A-F]{6}$/i.test(value)
      ? `rgb(${[1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16)).join(', ')})` : null;
    if (hex && painted !== hex) {
      say(`the swatch interior paints "${painted}", expected the live value ${value} "${hex}"`);
    }
    if (parseFloat(getComputedStyle(swatch).borderTopWidth) !== 2) {
      say(`the swatch rule is ${getComputedStyle(swatch).borderTopWidth}, expected the 2px ring`);
    }

    // ── the column: label above, swatch beside the input, text below ───────
    if (combo.label) {
      const label = sr.querySelector('.label') as HTMLElement | null;
      if (!label) say('a label was authored but none painted');
      else {
        const box = label.getBoundingClientRect();
        if (box.width <= 0) say('the painted label has no width');
        if (box.bottom > containerBox.top + EPS) {
          say('the label is not above the picker row');
        }
      }
    } else if (sr.querySelector('.label')) {
      say('a label painted without the label attribute');
    }

    const input = sr.querySelector('.color-input') as HTMLInputElement | null;
    if (combo.showInput) {
      if (!input) { say('show-input is on but no text input painted'); }
      else {
        const box = input.getBoundingClientRect();
        if (box.width <= 0 || box.height < 20) {
          say(`the text input renders at ${round(box.width)}x${round(box.height)}px`);
        }
        if (box.left < swatchBox.right - EPS) {
          say('the text input overlaps the swatch — the row is swatch THEN input');
        }
        if (box.right > baseBox.right + EPS) {
          say('the text input escapes part="base"');
        }
      }
    } else if (input) {
      say('show-input is off but a text input painted');
    }

    // ── the hidden native chooser: opacity 0 and unreachable ────────────────
    // Documented: "The hidden native color input has no name, is aria-hidden,
    // and has tabindex=-1". Hidden is a paint claim: transparent AND no hit.
    const native = sr.querySelector('.native-input') as HTMLInputElement | null;
    if (!native) { say('the native chooser input is missing'); }
    else {
      if (getComputedStyle(native).opacity !== '0') {
        say(`the native chooser paints at opacity ${getComputedStyle(native).opacity}`);
      }
      if (getComputedStyle(native).pointerEvents !== 'none') {
        say(`the native chooser claims the pointer (${getComputedStyle(native).pointerEvents})`);
      }
    }

    // ── the description line: below the row, error replacing helper ────────
    const error = sr.querySelector('.error-text') as HTMLElement | null;
    const helper = sr.querySelector('.helper-text') as HTMLElement | null;
    const paintedLine = error ?? helper;
    if (combo.errorText) {
      if (!error) { say('error-text was authored but no error line painted'); }
      else {
        const ink = token('--snice-color-danger');
        if (getComputedStyle(error).color !== ink) {
          say(`the error line's ink is "${getComputedStyle(error).color}",`
            + ` expected the danger "${ink}"`);
        }
        if (helper && parseFloat(getComputedStyle(helper).width) > 0
          && helper.textContent !== '\u00a0') {
          say('the helper line still paints beside the error — "error replaces helper"');
        }
      }
    } else if (combo.helperText) {
      if (!helper) { say('helper-text was authored but no helper line painted'); }
      else {
        const ink = token('--snice-color-text-secondary');
        if (getComputedStyle(helper).color !== ink) {
          say(`the helper line's ink is "${getComputedStyle(helper).color}",`
            + ` expected text-secondary "${ink}"`);
        }
      }
    }
    if (paintedLine) {
      const box = paintedLine.getBoundingClientRect();
      if (box.top < containerBox.bottom - EPS) {
        say('the description line is not below the picker row');
      }
    }

    // ── the presets row ─────────────────────────────────────────────────────
    const presets = [...sr.querySelectorAll('.preset')] as HTMLElement[];
    if (combo.showPresets) {
      if (presets.length === 0) { say('show-presets is on but no presets painted'); }
      else {
        for (const [index, preset] of presets.entries()) {
          const box = preset.getBoundingClientRect();
          if (Math.abs(box.width - presetPx) > EPS || Math.abs(box.height - presetPx) > EPS) {
            say(`preset ${index} renders at ${round(box.width)}x${round(box.height)}px,`
              + ` expected the ${round(presetPx)}px chip`);
          }
          // Each preset's own declared colour IS its paint — a preset that
          // painted the surface would be invisible choiceless.
          const declared = preset.dataset.color ?? '';
          if (/^#[0-9A-F]{6}$/i.test(declared)) {
            const want = `rgb(${[1, 3, 5].map(i => parseInt(declared.slice(i, i + 2), 16)).join(', ')})`;
            if (getComputedStyle(preset).backgroundColor !== want) {
              say(`preset ${index} ("${declared}") paints`
                + ` "${getComputedStyle(preset).backgroundColor}", expected "${want}"`);
            }
          }
          if (box.top < containerBox.bottom - EPS) {
            say(`preset ${index} is not below the picker row`);
          }
          if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS) {
            say(`preset ${index} escapes part="base"`);
          }
          if (index > 0) {
            const previous = presets[index - 1].getBoundingClientRect();
            const sameRow = Math.abs(box.top - previous.top) <= EPS;
            if (sameRow && Math.abs(box.left - previous.right - presetGapPx) > EPS) {
              say(`preset ${index} sits ${round(box.left - previous.right)}px after ${index - 1},`
                + ` expected ${round(presetGapPx)}px`);
            }
          }
        }
        // "Set <name> to <color>" only means something if a pointer can reach
        // the chip. (A BARRED preset is documented as inert to ACTIVATION —
        // whether it still claims the hit is the DOM tier's behavioural
        // claim, not a paint one, so it is not asserted here.)
        const barred = el.disabled || el.loading;
        if (!barred) {
          for (const [index, preset] of presets.entries()) {
            const box = preset.getBoundingClientRect();
            const hit = (sr as any).elementFromPoint(
              box.left + box.width / 2, box.top + box.height / 2) as Element | null;
            if (hit !== preset && !preset.contains(hit as Node)) {
              say(`preset ${index} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
            }
          }
        }
      }
    } else if (presets.length) {
      say(`show-presets is off but ${presets.length} presets painted`);
    }

    // ── state paint ─────────────────────────────────────────────────────────
    const swatchCs = getComputedStyle(swatch);
    const displayedInvalid = el.invalid
      || sr.querySelector('.color-swatch--invalid') !== null;
    if (displayedInvalid) {
      const danger = token('--snice-color-danger');
      if (swatchCs.borderTopColor !== danger) {
        say(`an invalid swatch's rule is "${swatchCs.borderTopColor}",`
          + ` expected the danger "${danger}"`);
      }
      if (input && getComputedStyle(input).borderTopColor !== danger) {
        say(`an invalid input's rule is "${getComputedStyle(input).borderTopColor}",`
          + ` expected the danger "${danger}"`);
      }
    }
    if (combo.disabled) {
      if (Number(swatchCs.opacity) > 0.6) {
        say(`a disabled swatch paints at opacity ${swatchCs.opacity}`);
      }
      if (swatchCs.cursor !== 'not-allowed') {
        say(`a disabled swatch's cursor is "${swatchCs.cursor}", expected "not-allowed"`);
      }
      // NOTE: "Disabled … controls are inert to … activation" is the doc's
      // claim, and activation is behaviour the DOM tier owns. Whether the
      // barred swatch still claims the hit is not asserted here.
    }
    if (combo.loading) {
      const spinner = sr.querySelector('[part~="spinner"]') as HTMLElement | null;
      if (!spinner) { say('loading painted no part="spinner"'); }
      else {
        const box = spinner.getBoundingClientRect();
        // "loading paints part=spinner OVER the swatch"
        // (docs/ai/components/color-picker.md): the spinner is an absolute
        // inset:0 child of the swatch (snice-color-picker.css), so the overlay
        // IS the swatch's padding box — its full area inside the 2px rule,
        // which stays painted because it carries the invalid/disabled state.
        // Settled geometry only: the spin itself is an animation nobody
        // should screenshot mid-flight.
        const rule = parseFloat(swatchCs.borderTopWidth);
        if (Math.abs(box.width - (swatchBox.width - 2 * rule)) > EPS
          || Math.abs(box.height - (swatchBox.height - 2 * rule)) > EPS) {
          say(`the spinner covers ${round(box.width)}x${round(box.height)}px of the`
            + ` ${round(swatchBox.width)}x${round(swatchBox.height)}px swatch`);
        }
        if (Math.abs(box.left - (swatchBox.left + rule)) > EPS
          || Math.abs(box.top - (swatchBox.top + rule)) > EPS) {
          say('the spinner is not flush over the swatch interior');
        }
        if (swatchCs.cursor !== 'wait') {
          say(`a loading swatch's cursor is "${swatchCs.cursor}", expected "wait"`);
        }
      }
    }

    // ── occlusion: the swatch is reachable, and nothing covers the input ────
    if (!combo.disabled && !combo.loading) {
      const hit = (sr as any).elementFromPoint(
        swatchBox.left + swatchBox.width / 2, swatchBox.top + swatchBox.height / 2);
      if (hit !== swatch && !swatch.contains(hit as Node)) {
        say(`the swatch is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
      if (combo.showInput && input) {
        const box = input.getBoundingClientRect();
        const inputHit = (sr as any).elementFromPoint(
          box.left + 10, box.top + box.height / 2);
        if (inputHit !== input && !(input.contains(inputHit as Node))) {
          say(`the text input is occluded by <${inputHit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, {
    combo,
    swatchPx: SWATCH_PX[combo.size],
    presetPx: PRESET_PX,
    presetGapPx: PRESET_GAP_PX,
  });
}

async function mount(combo: Combo): Promise<void> {
  const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  expect(mounted.size, `attribute reflection for ${combo.id}`).toBe(combo.size);
}

test.describe('color-picker visual matrix: layer 1 — layout', () => {
  for (const combo of layoutCombos()) {
    test(combo.id, async () => {
      await mount(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('color-picker visual matrix: layer 1 — state', () => {
  for (const combo of stateCombos()) {
    test(combo.id, async () => {
      await mount(combo);
      // `liveValue` (state/required-empty) dirties the value AFTER first
      // paint, so the invalid classes land post-render and the swatch's and
      // input's borders transition `all` over the theme's 150ms fast
      // transition (snice-color-picker.css) — a mid-flight computed colour is
      // the transition, not the styling. Measure the settled state, the same
      // way the tree suite waits out its 250ms expand animation.
      await page.waitForTimeout(300);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/** The size axis is an ORDERING claim no single combo can make. */
test.describe('color-picker visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in swatch box height', async () => {
    const heights: Record<Size, number> = { small: 0, medium: 0, large: 0 };
    for (const size of ['small', 'medium', 'large'] as const) {
      await mount(base({ id: `ordering/${size}`, size, value: '#ff0000' }));
      heights[size] = await page.evaluate(() =>
        document.getElementById('subject')!.shadowRoot!
          .querySelector('.color-swatch')!.getBoundingClientRect().height);
    }
    expect(heights.small, 'small < medium').toBeLessThan(heights.medium);
    expect(heights.medium, 'medium < large').toBeLessThan(heights.large);
  });
});

// ── Real pointers ───────────────────────────────────────────────────────────

test.describe('color-picker visual matrix: real pointers', () => {
  test('a real click on a preset commits its colour to the swatch', async () => {
    await mount(base({ id: 'preset-click', value: '#000000', showPresets: true }));
    const target = 4;
    const centre = await page.evaluate(i => (window as any).matrix.presetCenter(i), target);
    expect(centre, 'no preset to click').not.toBeNull();
    await page.mouse.click(centre.x, centre.y);
    await page.evaluate(() => (window as any).matrix.settle());
    const after = await page.evaluate(() => {
      const host = document.getElementById('subject') as any;
      const inner = host.shadowRoot.querySelector('.swatch-inner');
      return { value: host.value, paint: getComputedStyle(inner).backgroundColor };
    });
    const presets = await page.evaluate(() => (window as any).matrix.presetsList());
    expect(after.value, 'the real preset click did not commit').toBe(presets[target]);
    expect(after.paint, 'the committed colour did not repaint the swatch')
      .toBe(`rgb(${hexRGB(presets[target]).join(', ')})`);
  });

  test('setValue repaints the swatch through the live property', async () => {
    await mount(base({ id: 'set-value', value: '#000000' }));
    await page.evaluate(() => (window as any).matrix.setValue('#00cc66'));
    const paint = await page.evaluate(() =>
      getComputedStyle(document.getElementById('subject')!.shadowRoot!
        .querySelector('.swatch-inner')!).backgroundColor);
    expect(paint).toBe('rgb(0, 204, 102)');
  });

  test('label activation focuses the input, or the swatch without one', async () => {
    // Documented: "Label activation focuses the text input when showInput,
    // otherwise the swatch, without activating the native dialog."
    await mount(base({ id: 'label-input', label: 'Accent', value: '#ff0000' }));
    let centre = await page.evaluate(() => (window as any).matrix.labelCenter());
    await page.mouse.click(centre.x, centre.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return sr.activeElement?.className ?? '';
    }), 'the label click did not focus the text input').toContain('color-input');

    await mount(base({ id: 'label-swatch', label: 'Accent', value: '#ff0000', showInput: false }));
    centre = await page.evaluate(() => (window as any).matrix.labelCenter());
    await page.mouse.click(centre.x, centre.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return sr.activeElement?.className ?? '';
    }), 'without show-input the label did not focus the swatch').toContain('color-swatch');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('color-picker visual matrix: marquee pixels', () => {
  test('the swatch paints the live value, and setValue repaints it', async () => {
    await mount(base({ id: 'paint', value: '#ff0000' }));
    const probe = `(host) => {
      const box = host.shadowRoot.querySelector('.color-swatch').getBoundingClientRect();
      return [{ x: box.left + box.width / 2, y: box.top + box.height / 2 }];
    }`;
    const red = (await capture(page, '#subject', 'color-picker-red', probe))[0] as RGB;
    expect([0, 1, 2].every(i => Math.abs(red[i] - hexRGB('#ff0000')[i]) <= 2),
      `the swatch painted rgb(${red.join(',')}), expected #ff0000`).toBe(true);

    await page.evaluate(() => (window as any).matrix.setValue('#00ff00'));
    const green = (await capture(page, '#subject', 'color-picker-green', probe))[0] as RGB;
    expect([0, 1, 2].every(i => Math.abs(green[i] - hexRGB('#00ff00')[i]) <= 2),
      `after setValue the swatch painted rgb(${green.join(',')}), expected #00ff00`).toBe(true);
  });

  test('the presets paint their declared colours on the pixels', async () => {
    await mount(base({ id: 'preset-paint', value: '#000000', showPresets: true }));
    const targets = [2, 6, 9];
    const presets = await page.evaluate(() => (window as any).matrix.presetsList());
    const pixels = await capture(
      page, '#subject', 'color-picker-presets',
      `(host) => {
        const presets = [...host.shadowRoot.querySelectorAll('.preset')];
        return [${targets.join(',')}].map(i => {
          const box = presets[i].getBoundingClientRect();
          return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        });
      }`,
    );
    for (const [n, target] of targets.entries()) {
      const want = hexRGB(presets[target]);
      expect([0, 1, 2].every(i => Math.abs((pixels[n] as RGB)[i] - want[i]) <= 2),
        `preset ${target} ("${presets[target]}") painted rgb(${pixels[n].join(',')}),`
          + ` expected rgb(${want.join(',')})`).toBe(true);
    }
  });

  test('an invalid swatch really paints the danger rule', async () => {
    const rule = async (invalid: boolean) => {
      await mount(base({
        id: `invalid-${invalid}`, value: '#ff0000', invalid,
        errorText: invalid ? 'Wrong' : undefined,
      }));
      return (await capture(
        page, '#subject', `color-picker-rule-${invalid}`,
        `(host) => {
          const box = host.shadowRoot.querySelector('.color-swatch').getBoundingClientRect();
          return [{ x: box.left + 1, y: box.top + box.height / 2 }];
        }`,
      ))[0] as RGB;
    };
    const danger = toRGB(await page.evaluate(
      () => (window as any).matrix.token('--snice-color-danger')));
    const invalidRule = await rule(true);
    expect([0, 1, 2].every(i => Math.abs(invalidRule[i] - danger[i]) <= 3),
      `the invalid swatch's rule painted rgb(${invalidRule.join(',')}),`
        + ` expected the danger rgb(${danger.join(',')})`).toBe(true);
    const validRule = await rule(false);
    expect(sameColor(invalidRule, validRule),
      'the invalid rule is identical to the valid one — invalid paints nothing').toBe(false);
  });
});
