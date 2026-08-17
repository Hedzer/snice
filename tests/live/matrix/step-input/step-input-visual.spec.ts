/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-step-input TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/step-input, `npm run test:matrix`) owns value
 * truth: the min-based lattice, the boundary cue, `wrap`, the `value-change`
 * contract, and the form lifecycle as seen through `ElementInternals`.
 *
 * Two whole categories of claim it CANNOT own:
 *
 *   1. LAYOUT. "Numeric stepper control with visible +/- buttons FLANKING an
 *      input field" is a sentence about boxes. happy-dom measures every box as
 *      zero, so a control that rendered its buttons on top of the field, or
 *      collapsed the field to nothing, passes the whole DOM tier.
 *   2. THE REAL FORM. happy-dom implements none of `FormData`, `form.elements`,
 *      `form.reset()`, `<label for>` association, or `<fieldset disabled>` for a
 *      form-associated custom element — the DOM tier deliberately observes those
 *      through a recorder instead. Only here does the browser's own form
 *      plumbing actually run, and with it the browser's own `ValidityState`,
 *      whose step base is the `min` attribute (which is exactly the claim
 *      "normalization leaves no residual min/max/step mismatch" makes).
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is `inline-block` and the field a single bordered `inline-flex`
 *     row;
 *   · minus, field, plus run LEFT TO RIGHT without overlapping, all inside the
 *     frame, all on one line, and the two buttons are the same size;
 *   · the field's box grows with `size`, and the buttons with it;
 *   · a disabled button is dimmed and shows the "no" cursor; a disabled CONTROL
 *     dims the whole frame;
 *   · every control is hit-testable where the user would click it — a button
 *     that the frame's `overflow: hidden` had clipped away would fail here.
 *
 * ── Layer 2 (a pinned handful): the real browser's own plumbing ────────────
 *   Native `FormData`/`form.elements`/`form.reset()`/`<label for>`/fieldset,
 *   native `ValidityState`, a real click on a real button, and a screenshot
 *   asserting the field's number is legible on the surface it sits on.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/step-input/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Position = 'at-min' | 'middle' | 'at-max';

const SIZES: Size[] = ['small', 'medium', 'large'];
const POSITIONS: Record<Position, number> = { 'at-min': 0, middle: 4, 'at-max': 10 };

interface Combo {
  id: string;
  size: Size;
  position: Position;
  value: number;
  wrap: boolean;
  disabled: boolean;
  readonly: boolean;
  /** The documented boundary cue, computed from `wrap` and the position. */
  decrementDisabled: boolean;
  incrementDisabled: boolean;
}

/**
 * The cross: size (3) x boundary position (3) x wrap (2) x state (3: enabled,
 * disabled, readonly) = 54 combos.
 *
 * Boundary position and `wrap` are here because they change which buttons are
 * disabled, and a disabled button is a different PAINT (dimmed, "not-allowed")
 * as well as a different flag. `size` is here because it is the axis with no
 * DOM consequence at all. The three states are crossed rather than sampled
 * because "disabled" and "readonly" are documented as different things, and the
 * difference is visible: one dims the frame and one does not.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const position of Object.keys(POSITIONS) as Position[]) {
      for (const wrap of [false, true]) {
        for (const state of ['enabled', 'disabled', 'readonly'] as const) {
          const value = POSITIONS[position];
          const disabled = state === 'disabled';
          combos.push({
            id: `${size}/${position}/${wrap ? 'wrap' : 'clamp'}/${state}`,
            size,
            position,
            value,
            wrap,
            disabled,
            readonly: state === 'readonly',
            decrementDisabled: disabled || (!wrap && value <= 0),
            incrementDisabled: disabled || (!wrap && value >= 10),
          });
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

async function mount(combo: Partial<Combo> & Record<string, unknown>): Promise<any> {
  return page.evaluate(c => (window as any).matrix.mount(c), {
    min: 0, max: 10, step: 2, ...combo,
  } as any);
}

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const token = (name: string) => (window as any).matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'inline-block') {
      say(`host computed display "${hostCs.display}", expected "inline-block"`);
    }

    const frame = partNamed('base');
    if (!frame) { say('no part="base" rendered'); return problems; }
    const frameBox = rect(frame);
    const frameCs = getComputedStyle(frame);
    if (frameBox.width <= 0 || frameBox.height <= 0) {
      say(`frame renders at ${frameBox.width}x${frameBox.height}`);
      return problems;
    }
    if (!/^(inline-)?flex$/.test(frameCs.display)) {
      say(`frame display "${frameCs.display}", expected a flex row`);
    }
    if (frameCs.alignItems !== 'center') {
      say(`frame align-items "${frameCs.alignItems}", expected "center"`);
    }
    // The documented framing: a real border in the theme's own border colour.
    const border = token('--snice-color-border');
    if (parseFloat(frameCs.borderTopWidth) <= 0) {
      say(`frame has no border (border-top-width ${frameCs.borderTopWidth})`);
    }
    if (frameCs.borderTopColor !== border) {
      say(`frame border "${frameCs.borderTopColor}", expected --snice-color-border "${border}"`);
    }

    // A disabled CONTROL dims the whole frame; readonly does not.
    if (combo.disabled) {
      if (Number(frameCs.opacity) >= 1) {
        say(`a disabled control painted its frame at full opacity ${frameCs.opacity}`);
      }
    } else if (Number(frameCs.opacity) !== 1) {
      say(`a ${combo.readonly ? 'readonly' : 'enabled'} control dimmed its frame`
        + ` to opacity ${frameCs.opacity}`);
    }

    const minus = partNamed('decrement-button');
    const field = partNamed('input') as HTMLInputElement | null;
    const plus = partNamed('increment-button');
    if (!minus || !field || !plus) {
      say(`missing parts: ${[!minus && 'decrement-button', !field && 'input',
        !plus && 'increment-button'].filter(Boolean).join(', ')}`);
      return problems;
    }

    const minusBox = rect(minus);
    const fieldBox = rect(field);
    const plusBox = rect(plus);

    // ── "visible +/- buttons FLANKING an input field" ───────────────────────
    for (const [name, box] of [['minus', minusBox], ['field', fieldBox], ['plus', plusBox]] as
      Array<[string, DOMRect]>) {
      if (box.width <= 0 || box.height <= 0) {
        say(`${name} renders at ${box.width}x${box.height}`);
      }
      if (box.left < frameBox.left - EPS || box.right > frameBox.right + EPS
        || box.top < frameBox.top - EPS || box.bottom > frameBox.bottom + EPS) {
        say(`${name} (${box.left.toFixed(0)}…${box.right.toFixed(0)}) escapes the frame`
          + ` (${frameBox.left.toFixed(0)}…${frameBox.right.toFixed(0)})`);
      }
    }
    if (fieldBox.left < minusBox.right - EPS) {
      say(`the field (left ${fieldBox.left.toFixed(1)}) overlaps the minus button`
        + ` (right ${minusBox.right.toFixed(1)})`);
    }
    if (plusBox.left < fieldBox.right - EPS) {
      say(`the plus button (left ${plusBox.left.toFixed(1)}) overlaps the field`
        + ` (right ${fieldBox.right.toFixed(1)})`);
    }
    // One line: every centre on the same horizontal axis.
    const centres = [minusBox, fieldBox, plusBox].map(b => b.top + b.height / 2);
    if (Math.max(...centres) - Math.min(...centres) > 2) {
      say(`the three controls are not on one line (centres ${centres.map(c => c.toFixed(1))})`);
    }
    // Symmetric flanks: the two buttons are the same control at the same size.
    if (Math.abs(minusBox.width - plusBox.width) > 1
      || Math.abs(minusBox.height - plusBox.height) > 1) {
      say(`the flanking buttons differ in size: minus ${minusBox.width.toFixed(1)}x`
        + `${minusBox.height.toFixed(1)}, plus ${plusBox.width.toFixed(1)}x`
        + `${plusBox.height.toFixed(1)}`);
    }

    // ── The boundary cue, as a paint and not only as a flag ────────────────
    for (const [name, button, wanted] of [
      ['decrement', minus as HTMLButtonElement, combo.decrementDisabled],
      ['increment', plus as HTMLButtonElement, combo.incrementDisabled],
    ] as Array<[string, HTMLButtonElement, boolean]>) {
      if (button.disabled !== wanted) {
        say(`${name} button disabled=${button.disabled}, expected ${wanted}`);
      }
      const cs = getComputedStyle(button);
      if (wanted) {
        if (Number(cs.opacity) >= 1) {
          say(`a disabled ${name} button painted at full opacity ${cs.opacity}`);
        }
        if (cs.cursor !== 'not-allowed') {
          say(`a disabled ${name} button shows cursor "${cs.cursor}"`);
        }
      } else {
        if (Number(cs.opacity) !== 1) {
          say(`an enabled ${name} button is dimmed to opacity ${cs.opacity}`);
        }
        if (cs.cursor !== 'pointer') {
          say(`an enabled ${name} button shows cursor "${cs.cursor}"`);
        }
        // An enabled button the pointer cannot reach is not enabled.
        const hit = (sr as any).elementFromPoint(
          rect(button).left + rect(button).width / 2,
          rect(button).top + rect(button).height / 2,
        ) as Element | null;
        if (hit !== button && !button.contains(hit as Node)) {
          say(`the ${name} button is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
      // The glyph inside it is painted, whatever the state.
      const svg = button.querySelector('svg');
      if (!svg) { say(`${name} button painted no glyph`); }
      else {
        const svgBox = rect(svg);
        if (svgBox.width <= 0 || svgBox.height <= 0) {
          say(`${name} glyph renders at ${svgBox.width}x${svgBox.height}`);
        }
      }
    }

    // ── The field itself ───────────────────────────────────────────────────
    const fieldCs = getComputedStyle(field);
    if (fieldCs.textAlign !== 'center') {
      say(`the field's text-align is "${fieldCs.textAlign}", expected "center"`);
    }
    if (field.value !== String(combo.value)) {
      say(`the field shows "${field.value}", expected "${combo.value}"`);
    }
    if (field.disabled !== combo.disabled) {
      say(`field disabled=${field.disabled}, expected ${combo.disabled}`);
    }
    if (field.readOnly !== combo.readonly) {
      say(`field readOnly=${field.readOnly}, expected ${combo.readonly}`);
    }
    // Native spinners are suppressed on purpose — the component draws its own.
    // A field showing both would be two steppers in one control.
    if (!combo.disabled) {
      const hit = (sr as any).elementFromPoint(
        fieldBox.left + fieldBox.width / 2, fieldBox.top + fieldBox.height / 2,
      ) as Element | null;
      if (hit !== field && !field.contains(hit as Node)) {
        say(`the field is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('step-input visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await mount(combo);
      expect(mounted.value, `authored default for ${combo.id}`).toBe(combo.value);
      // The fixture AUTHORS `size` as an attribute, the way the docs spell it
      // (`<snice-step-input size="small">`), so it is present for every value
      // including the default — the framework only declines to reflect a
      // default it was never told about.
      expect(mounted.reflectedSize).toBe(combo.size);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it.
 */
test.describe('step-input visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in frame height, button size and type size', async () => {
    const measured: Record<string, { height: number; button: number; fontSize: number }> = {};
    for (const size of SIZES) {
      await mount({ size, value: 4, id: `size/${size}` });
      measured[size] = await page.evaluate(() => {
        const host = document.getElementById('subject') as HTMLElement;
        const sr = host.shadowRoot!;
        const frame = sr.querySelector('[part~="base"]')!;
        const button = sr.querySelector('[part~="increment-button"]')!;
        const field = sr.querySelector('[part~="input"]')!;
        return {
          height: frame.getBoundingClientRect().height,
          button: button.getBoundingClientRect().width,
          fontSize: parseFloat(getComputedStyle(field).fontSize),
        };
      });
    }
    for (const key of ['height', 'button', 'fontSize'] as const) {
      expect(measured.small[key], `small ${key} < medium`).toBeLessThan(measured.medium[key]);
      expect(measured.medium[key], `medium ${key} < large`).toBeLessThan(measured.large[key]);
    }
  });
});

// ── LAYER 2: the plumbing only a real browser has ───────────────────────────

test.describe('step-input visual matrix: the real form', () => {
  test('a named control is in form.elements, in FormData, and labelled', async () => {
    const mounted = await mount({ size: 'medium', value: 4, name: 'qty' });
    expect(mounted.inForm, 'el.form is not the enclosing form').toBe(true);
    expect(mounted.listed, 'the control is not listed in form.elements').toBe(true);
    expect(mounted.submitted, 'FormData carries the wrong value').toBe('4');
    expect(mounted.labelled, '<label for> did not associate').toBe(true);
    expect(mounted.willValidate).toBe(true);
  });

  test('the submitted number is the NORMALIZED one', async () => {
    await mount({ size: 'medium', value: 7, min: 0, max: 10, step: 5, name: 'qty' });
    const after = await page.evaluate(() => ({
      value: (window as any).matrix.el.value,
      submitted: new FormData(document.getElementById('host-form') as HTMLFormElement).get('qty'),
    }));
    // 7 is between the lattice points 5 and 10; the tie-free nearest is 5.
    expect(after.value).toBe(5);
    expect(after.submitted).toBe('5');
  });

  test('a real form.reset() silently restores the authored default', async () => {
    await mount({ size: 'medium', value: 4, name: 'qty' });
    const typed = await page.evaluate(() => (window as any).matrix.type('8'));
    expect(typed.value).toBe(8);

    const reset = await page.evaluate(() => (window as any).matrix.reset());
    expect(reset.value, 'form.reset() did not restore the default').toBe(4);
    expect(reset.events, 'form.reset() dispatched value-change').toEqual([]);
  });

  test('a disabled fieldset bars the control and omits it from the submission', async () => {
    const mounted = await mount({
      size: 'medium', value: 4, name: 'qty', fieldsetDisabled: true,
    });
    expect(mounted.willValidate, 'a fieldset-disabled control still validates').toBe(false);
    expect(mounted.submitted, 'a fieldset-disabled control submitted a value').toBeNull();
    // The authored state is untouched — the bar comes from the fieldset.
    expect(mounted.value).toBe(4);
    expect(mounted.defaultValue).toBe(4);
  });

  test('a disabled control is omitted; a readonly one remains successful', async () => {
    const disabled = await mount({ size: 'medium', value: 4, name: 'qty', disabled: true });
    expect(disabled.submitted, 'a disabled control submitted a value').toBeNull();

    const readonly = await mount({ size: 'medium', value: 4, name: 'qty', readonly: true });
    expect(readonly.submitted, 'a readonly control stopped submitting').toBe('4');
    expect(readonly.willValidate, 'a readonly control still validates').toBe(false);
  });
});

test.describe('step-input visual matrix: the real ValidityState', () => {
  /**
   * "Normalization leaves no residual min/max/step mismatch." The DOM tier
   * grades this against the lattice because happy-dom's `ValidityState` gets
   * HTML's step base wrong; here the browser computes it, with `min` as the
   * base exactly as the spec says.
   */
  const RANGES = [
    { id: '0..10/1', min: 0, max: 10, step: 1 },
    { id: '1..12/5', min: 1, max: 12, step: 5 },
    { id: '-7..7/5', min: -7, max: 7, step: 5 },
    { id: '0..2/0.25', min: 0, max: 2, step: 0.25 },
  ];

  for (const range of RANGES) {
    test(`${range.id} leaves no native mismatch behind`, async () => {
      for (const assigned of [-9, 0, 3, 7.4, 12, 100]) {
        await mount({ size: 'medium', value: assigned, ...range, name: 'qty' });
        const validity = await page.evaluate(() => (window as any).matrix.validity());
        expect(validity, `${range.id} after ${assigned}`).toMatchObject({
          stepMismatch: false,
          rangeOverflow: false,
          rangeUnderflow: false,
          badInput: false,
          hostValid: true,
        });
      }
    });
  }

  test('setCustomValidity drives the message, aria-invalid, and validity', async () => {
    await mount({ size: 'medium', value: 4, name: 'qty' });
    const invalid = await page.evaluate(() =>
      (window as any).matrix.setCustomValidity('Pick another quantity'));
    expect(invalid.valid).toBe(false);
    expect(invalid.message).toBe('Pick another quantity');
    expect(invalid.ariaInvalid).toBe('true');

    const cleared = await page.evaluate(() => (window as any).matrix.setCustomValidity(''));
    expect(cleared.valid).toBe(true);
    expect(cleared.ariaInvalid).toBe('false');
  });
});

test.describe('step-input visual matrix: real clicks on real buttons', () => {
  test('pressing + steps up until the boundary disables it', async () => {
    await mount({ size: 'large', value: 0, min: 0, max: 10, step: 5, wrap: false });
    const first = await page.evaluate(() => (window as any).matrix.press('up'));
    expect(first!.value).toBe(5);
    expect(first!.events).toEqual([{ value: 5, oldValue: 0, isComponent: true }]);

    const second = await page.evaluate(() => (window as any).matrix.press('up'));
    expect(second!.value).toBe(10);

    // At the maximum the button is disabled, so a real pointer cannot press it.
    const blocked = await page.evaluate(() => (window as any).matrix.press('up'));
    expect(blocked!.disabled, 'the increment button is still enabled at max').toBe(true);
    expect(blocked!.value).toBe(10);
    expect(blocked!.events).toEqual([]);
  });

  test('with wrap, the same button laps instead of stopping', async () => {
    await mount({ size: 'large', value: 10, min: 0, max: 10, step: 5, wrap: true });
    const lapped = await page.evaluate(() => (window as any).matrix.press('up'));
    expect(lapped!.disabled, 'wrap left the button disabled').toBe(false);
    expect(lapped!.value).toBe(0);
    expect(lapped!.events).toEqual([{ value: 0, oldValue: 10, isComponent: true }]);
  });

  test('a disabled control cannot be stepped by a real click', async () => {
    await mount({ size: 'medium', value: 4, disabled: true });
    const blocked = await page.evaluate(() => (window as any).matrix.press('up'));
    expect(blocked!.value).toBe(4);
    expect(blocked!.events).toEqual([]);
  });
});

// ── The pinned marquee capture ──────────────────────────────────────────────

test.describe('step-input visual matrix: marquee pixels', () => {
  test('the number is legible on the field it sits in', async () => {
    await mount({ size: 'large', value: 8, min: 0, max: 10, step: 2 });
    // Probe a run of points across the digit's own line plus one point in the
    // field's own padding. A field painting its text in its own background
    // reads flat here.
    const pixels = await capture(
      page, '#subject', 'step-input-field',
      `(host) => {
        const field = host.shadowRoot.querySelector('[part~="input"]');
        const b = field.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 10; i++) {
          points.push({ x: b.x + b.width / 2 - 5 + i, y: b.y + b.height / 2 });
        }
        points.push({ x: b.x + 3, y: b.y + 3 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, surface)),
      `every probed digit pixel equals the field surface ${surface.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, surface)));
    expect(best, `best digit-vs-field contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(4.5);
  });

  test('a disabled button paints differently from an enabled one', async () => {
    // At the minimum, minus is disabled and plus is not — the two buttons are
    // the same markup in two documented states, side by side in one capture.
    await mount({ size: 'large', value: 0, min: 0, max: 10, step: 2, wrap: false });
    const pixels = await capture(
      page, '#subject', 'step-input-buttons',
      `(host) => {
        const sr = host.shadowRoot;
        const points = [];
        for (const name of ['decrement-button', 'increment-button']) {
          const b = sr.querySelector('[part~="' + name + '"]').getBoundingClientRect();
          for (let i = 0; i < 6; i++) {
            points.push({ x: b.x + b.width / 2 - 3 + i, y: b.y + b.height / 2 });
          }
        }
        return points;
      }`,
    );
    const darkest = (samples: RGB[]) =>
      samples.reduce((best, p) => (p[0] + p[1] + p[2] < best[0] + best[1] + best[2] ? p : best));
    const disabled = darkest(pixels.slice(0, 6) as RGB[]);
    const enabled = darkest(pixels.slice(6) as RGB[]);
    expect(sameColor(disabled, enabled),
      `the disabled glyph painted ${disabled.join(',')} and the enabled one ${enabled.join(',')}`)
      .toBe(false);
  });
});
