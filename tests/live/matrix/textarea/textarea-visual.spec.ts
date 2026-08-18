/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-textarea TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/textarea, `npm run test:matrix`) owns
 * structure and logic truth: the dirty-value lifecycle, the constraint rules,
 * the events, the label wiring. It cannot own two things:
 *
 *   1. PAINT — happy-dom performs no layout, so `variant`, `size`, `resize`,
 *      `rows` and `auto-grow` all read as nothing there;
 *   2. THE PLATFORM — happy-dom implements no `attachInternals()` at all, so a
 *      form-associated custom element is invisible to `form.elements`, to
 *      `FormData`, to `willValidate`, and to a real `form.reset()`. Those are
 *      documented promises ("Listed in `form.elements`; supports `FormData`,
 *      explicit `form="id"`, external/wrapping labels, reset, browser
 *      restoration, and disabled fieldsets") and this is the only tier that can
 *      judge them.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the control has a real box, is visible, and fills its container;
 *   · `rows` really sizes the field, and `size` really scales it;
 *   · `resize` resolves to exactly the documented CSS `resize` value;
 *   · the label, field, character count and support text stack without ever
 *     overlapping, and a hit-test inside the field lands in the field;
 *   · `loading` paints a spinner that does not cover the text the customer is
 *     reading, and the field is genuinely non-interactive;
 *   · the support text is opaque and large enough to read.
 *
 * ── Layer 2 (a pinned handful): real screenshots + the platform contract ────
 *   Three captures prove the three variants paint DIFFERENTLY rather than
 *   merely resolving different tokens, and that an error state is visibly an
 *   error. The platform block then drives the form-associated contract through
 *   real `FormData`, a real `form.reset()`, and a real disabled `<fieldset>`.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/textarea/matrix.html';

type Variant = 'outlined' | 'filled' | 'underlined';
type Size = 'small' | 'medium' | 'large';
type Resize = 'none' | 'vertical' | 'horizontal' | 'both';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  resize: Resize;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  rows?: number;
  maxlength?: number;
  loading?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

const VARIANTS: Variant[] = ['outlined', 'filled', 'underlined'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const RESIZES: Resize[] = ['none', 'vertical', 'horizontal', 'both'];

/** The documented CSS `resize` value each documented option must produce. */
const RESIZE_CSS: Record<Resize, string> = {
  none: 'none', vertical: 'vertical', horizontal: 'horizontal', both: 'both',
};

/**
 * The cross: variant x size x resize = 36, with the label / supporting text /
 * character count rotated across it so every stacked element is measured
 * against every appearance, plus 6 state corners whose geometry is the whole
 * reason this tier exists. 42 combos — sized to a control whose appearance is
 * entirely CSS, well under the table's ceiling.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const resize of RESIZES) {
        const label = n % 2 === 0 ? 'Comments' : undefined;
        const helperText = n % 3 === 0 ? 'Keep it short.' : undefined;
        const errorText = n % 5 === 0 ? 'Required field' : undefined;
        const maxlength = n % 4 === 0 ? 120 : undefined;
        combos.push({
          id: `${variant}/${size}/resize:${resize}/[${[
            label ? 'label' : '', helperText ? 'helper' : '',
            errorText ? 'error' : '', maxlength ? 'count' : '',
          ].filter(Boolean).join(',') || 'bare'}]`,
          variant, size, resize, label, helperText, errorText, maxlength,
          placeholder: 'Enter comments',
        });
        n++;
      }
    }
  }
  for (const [suffix, extra] of [
    ['loading', { loading: true, label: 'Comments', helperText: 'Saving…' }],
    ['disabled', { disabled: true, label: 'Comments' }],
    ['invalid', { invalid: true, label: 'Comments', errorText: 'Required field' }],
    ['rows-1', { rows: 1, label: 'Comments' }],
    ['rows-10', { rows: 10, label: 'Comments' }],
    ['everything', {
      loading: true, invalid: true, label: 'Comments',
      errorText: 'Required field', maxlength: 40, rows: 5,
    }],
  ] as const) {
    combos.push({
      id: `state/${suffix}`,
      variant: 'outlined', size: 'medium', resize: 'vertical', ...extra,
    });
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
async function visualProblems(combo: Combo, resizeCss: string): Promise<string[]> {
  return page.evaluate(({ combo, resizeCss }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (hostBox.width < 100) say(`host is ${hostBox.width.toFixed(0)}px wide — it did not lay out`);

    const field = sr.querySelector('[part~="textarea"]') as HTMLTextAreaElement | null;
    if (!field) { say('CSS part "textarea" is missing'); return problems; }
    const fieldBox = rect(field);
    const fieldCs = getComputedStyle(field);

    if (fieldBox.width < 80) say(`field is ${fieldBox.width.toFixed(0)}px wide`);
    if (fieldBox.height < 20) say(`field is ${fieldBox.height.toFixed(0)}px tall`);
    if (fieldBox.width > hostBox.width + EPS) say('field overflows its host horizontally');
    if (Number(fieldCs.opacity) <= 0) say('field is transparent');
    if (parseFloat(fieldCs.fontSize) < 10) say(`field font-size ${fieldCs.fontSize}`);

    // ── `resize` resolves to exactly the documented value ───────────────────
    if (fieldCs.resize !== resizeCss) {
      say(`resize="${combo.resize}" computed as "${fieldCs.resize}", not "${resizeCss}"`);
    }

    // ── `rows` really sizes the field ──────────────────────────────────────
    const lineHeight = parseFloat(fieldCs.lineHeight) || parseFloat(fieldCs.fontSize) * 1.2;
    const rows = combo.rows ?? 3;
    if (Number.isFinite(lineHeight) && fieldBox.height < lineHeight * rows * 0.7) {
      say(`rows=${rows} produced a ${fieldBox.height.toFixed(0)}px field at a`
        + ` ${lineHeight.toFixed(1)}px line height`);
    }

    // ── The stack never overlaps itself ────────────────────────────────────
    const label = sr.querySelector('label.label') as HTMLElement | null;
    const count = sr.querySelector('.character-count') as HTMLElement | null;
    const support = sr.querySelector('[part~="error-text"], [part~="helper-text"]') as HTMLElement | null;

    if (combo.label && !label) say('label missing');
    if (!combo.label && label) say('label rendered without one being set');
    if (combo.maxlength && !count) say('character count missing');
    if (!combo.maxlength && count) say('character count rendered without a maxlength');

    const stack: Array<[string, DOMRect]> = [];
    if (label) stack.push(['label', rect(label)]);
    stack.push(['field', fieldBox]);
    if (count) stack.push(['count', rect(count)]);
    if (support) stack.push(['support', rect(support)]);

    for (let i = 0; i < stack.length - 1; i++) {
      const [an, a] = stack[i];
      const [bn, b] = stack[i + 1];
      if (a.bottom > b.top + EPS) say(`${an} and ${bn} overlap vertically`);
      if (b.top - a.bottom > 60) say(`${an} and ${bn} are ${(b.top - a.bottom).toFixed(0)}px apart`);
    }
    for (const [name, box] of stack) {
      if (box.width < 1 || box.height < 1) say(`${name} has no painted box`);
      if (box.left < hostBox.left - EPS || box.right > hostBox.right + EPS) {
        say(`${name} escapes the host horizontally`);
      }
    }

    // ── Supporting text is actually readable ───────────────────────────────
    if (support) {
      const cs = getComputedStyle(support);
      if (Number(cs.opacity) <= 0) say('supporting text is transparent');
      if (parseFloat(cs.fontSize) < 9) say(`supporting text font-size ${cs.fontSize}`);
      if (!support.textContent?.trim()) say('supporting text is empty');
    }

    // ── Occlusion: the cursor really reaches the field ─────────────────────
    const probe = (sr as any).elementFromPoint
      ? (sr as any).elementFromPoint(fieldBox.x + fieldBox.width / 2, fieldBox.y + fieldBox.height / 2)
      : null;
    if (probe && probe !== field && !field.contains(probe) && probe !== host) {
      say(`the field's centre hit <${String(probe.tagName).toLowerCase()}`
        + `${probe.className ? `.${String(probe.className).split(' ')[0]}` : ''}> instead`);
    }

    // ── `loading`: a spinner that does not cover what is being read ────────
    const spinner = sr.querySelector('[part~="spinner"]') as HTMLElement | null;
    if (combo.loading && !spinner) say('loading renders no spinner part');
    if (!combo.loading && spinner) say('spinner rendered without `loading`');
    if (spinner) {
      const box = rect(spinner);
      if (box.width < 4 || box.height < 4) {
        say(`spinner is ${box.width.toFixed(0)}x${box.height.toFixed(0)}px — invisible`);
      }
      if (box.width > fieldBox.width / 2) say('the spinner covers half the field');
      if (!field.disabled) say('a loading control is not inert');
    }

    // ── `disabled` really looks and behaves disabled ───────────────────────
    if (combo.disabled) {
      if (!field.disabled) say('the disabled control is still editable');
      if (fieldCs.cursor === 'text') say('a disabled field still shows a text cursor');
    }

    return problems;
  }, { combo, resizeCss });
}

const combos = generateCombos();

test.describe('textarea visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      expect(await visualProblems(combo, RESIZE_CSS[combo.resize]), `combo ${combo.id}`)
        .toEqual([]);
    });
  }
});

test.describe('textarea visual matrix: the documented scales are real', () => {
  test('size scales the field: small < medium < large', async () => {
    const heights: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({
        variant: 'outlined', size: s, resize: 'vertical', label: 'Comments',
      }), size);
      heights.push(await page.evaluate(() => {
        const field = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="textarea"]')!;
        return field.getBoundingClientRect().height;
      }));
    }
    expect(heights[0], `heights ${heights.join(' / ')}`).toBeLessThan(heights[1]);
    expect(heights[1], `heights ${heights.join(' / ')}`).toBeLessThan(heights[2]);
  });

  test('rows scales the field: 1 < 3 < 10', async () => {
    const heights: number[] = [];
    for (const rows of [1, 3, 10]) {
      await page.evaluate(r => (window as any).matrix.mount({
        variant: 'outlined', size: 'medium', resize: 'vertical', rows: r,
      }), rows);
      heights.push(await page.evaluate(() => document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="textarea"]')!.getBoundingClientRect().height));
    }
    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });

  test('auto-grow grows the field with its content, and its absence does not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', resize: 'none', rows: 2, autoGrow: true,
    }));
    const short = await page.evaluate(() => (window as any).matrix.type('one line'));
    const long = await page.evaluate(() =>
      (window as any).matrix.type('one\ntwo\nthree\nfour\nfive\nsix\nseven'));
    expect(long, `auto-grow: ${short} -> ${long}`).toBeGreaterThan(short);

    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', resize: 'none', rows: 2,
    }));
    const fixedShort = await page.evaluate(() => (window as any).matrix.type('one line'));
    const fixedLong = await page.evaluate(() =>
      (window as any).matrix.type('one\ntwo\nthree\nfour\nfive\nsix\nseven'));
    expect(fixedLong, 'without auto-grow the field keeps its rows sizing')
      .toBeCloseTo(fixedShort, 0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('textarea visual matrix: marquee pixels', () => {
  /**
   * VISUAL-MATRIX-textarea-2 (fixed).
   *
   * Documented: `variant: 'outlined'|'filled'|'underlined' = 'outlined'`, a
   * first-class appearance property with its own row in the Properties table
   * and its own example in Basic Usage (`<snice-textarea variant="filled">`).
   *
   * The render pass generated the `textarea--outlined` / `textarea--filled` /
   * `textarea--underlined` class faithfully — the DOM matrix asserted that and
   * was green — but snice-textarea.css contained NO rule for any of the three,
   * so all three values resolved to identical computed style (background
   * `rgb(255,255,255)`, a 1px `rgb(209,209,209)` border on all four sides) and
   * painted identical pixels. Fixed: the stylesheet now mirrors snice-input —
   * outlined is a full border, filled a tinted box with a bottom rule,
   * underlined a bottom rule only — and the pin is removed. The assertion stays
   * at full strength.
   */
  test('VISUAL-MATRIX-textarea-2: the three variants paint three distinguishable fields', async () => {
    const painted: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, size: 'medium', resize: 'none', rows: 3,
      }), variant);
      // Three probes: the field's interior (fill), a pixel on its top edge
      // (a full border) and one on its bottom edge (an underline). The three
      // documented variants differ in exactly those places, so the TRIPLE is
      // what separates them — no single probe can.
      const pixels = await capture(
        page, '#subject', `textarea-${variant}`,
        `(host) => {
          const field = host.shadowRoot.querySelector('[part~="textarea"]');
          const box = field.getBoundingClientRect();
          return [
            { x: box.x + box.width / 2, y: box.y + box.height / 2 },
            { x: box.x + box.width / 2, y: box.y + 1 },
            { x: box.x + box.width / 2, y: box.bottom - 1 },
          ];
        }`,
      );
      painted[variant] = pixels.map(p => p.join(',')).join(' | ');
    }
    const distinct = new Set(Object.values(painted));
    expect(distinct.size,
      `variants painted:\n${Object.entries(painted).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`)
      .toBe(VARIANTS.length);
  });

  test('an invalid field paints a visibly different edge from a valid one', async () => {
    // The border is one CSS pixel and its edge is antialiased, so a single
    // probe is a coin flip. Sweep a short vertical strip through the top edge
    // and compare the whole strip: a border colour that changed cannot leave
    // every pixel of the strip identical.
    const read = async (invalid: boolean): Promise<RGB[]> => {
      await page.evaluate(i => (window as any).matrix.mount({
        variant: 'outlined', size: 'medium', resize: 'none', rows: 3, invalid: i,
      }), invalid);
      return capture(
        page, '#subject', `textarea-${invalid ? 'invalid' : 'valid'}`,
        `(host) => {
          const field = host.shadowRoot.querySelector('[part~="textarea"]');
          const box = field.getBoundingClientRect();
          const x = box.x + box.width / 2;
          return [-1, 0, 1, 2].map(dy => ({ x, y: box.y + dy }));
        }`,
      );
    };
    const valid = await read(false);
    const invalid = await read(true);

    const same = valid.every((p, i) => sameColor(p, invalid[i]));
    expect(same,
      `valid [${valid.map(p => p.join(','))}] and invalid [${invalid.map(p => p.join(','))}]`
      + ' painted the same edge').toBe(false);
  });

  test('the error text is readable against the surface behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'outlined', size: 'medium', resize: 'none',
      invalid: true, errorText: 'IIIIIIIIIIII',
    }));
    const pixels = await capture(
      page, '#subject', 'textarea-error-contrast',
      `(host) => {
        const el = host.shadowRoot.querySelector('[part~="error-text"]');
        const box = el.getBoundingClientRect();
        const y = box.y + box.height / 2;
        const points = [];
        for (let dx = 1; dx < 50; dx += 2) points.push({ x: box.x + dx, y });
        points.push({ x: box.right + 40, y });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    const best = glyphs.reduce((a, b) => (contrast(b, surface) > contrast(a, surface) ? b : a));

    expect(glyphs.every(p => sameColor(p, surface)),
      `every probe painted ${surface.join(',')} — the error text is invisible`).toBe(false);
    expect(contrast(best, surface),
      `best error-text contrast is ${contrast(best, surface).toFixed(2)}:1`).toBeGreaterThan(3);
  });
});

// ── The platform contract: only a real browser has ElementInternals ─────────

test.describe('textarea visual matrix: form-associated platform contract', () => {
  test('the control is listed in form.elements and contributes to FormData', async () => {
    await page.evaluate(() => (window as any).matrix.mountInForm({
      name: 'comment', variant: 'outlined', label: 'Comments',
    }));
    const result = await page.evaluate(() => {
      const form = document.getElementById('the-form') as HTMLFormElement;
      const el = document.getElementById('subject') as any;
      el.value = 'customer text';
      return {
        listed: [...form.elements].includes(el),
        owned: el.form === form,
        data: new FormData(form).getAll('comment').map(String),
        willValidate: el.willValidate,
      };
    });

    expect(result.owned, 'the wrapping form owns the control').toBe(true);
    expect(result.listed, 'docs: "Listed in `form.elements`"').toBe(true);
    expect(result.data, 'docs: contributes the EXACT live value').toEqual(['customer text']);
    expect(result.willValidate, 'an enabled control participates in validation').toBe(true);
  });

  test('a disabled control is omitted, and readonly stays successful', async () => {
    const disabled = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', disabled: true });
      const form = document.getElementById('the-form') as HTMLFormElement;
      const el = document.getElementById('subject') as any;
      el.value = 'hidden';
      return { data: new FormData(form).getAll('comment').map(String), willValidate: el.willValidate };
    });
    expect(disabled.data, 'docs: "Disabled controls are omitted"').toEqual([]);
    expect(disabled.willValidate).toBe(false);

    const readonly = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', readonly: true });
      const form = document.getElementById('the-form') as HTMLFormElement;
      const el = document.getElementById('subject') as any;
      el.value = 'shown';
      return { data: new FormData(form).getAll('comment').map(String), willValidate: el.willValidate };
    });
    expect(readonly.data, 'docs: "`readonly` remains successful"').toEqual(['shown']);
    expect(readonly.willValidate, 'docs: "but is barred"').toBe(false);
  });

  test('loading is inert and barred while preserving the successful value', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment' });
      const form = document.getElementById('the-form') as HTMLFormElement;
      const el = document.getElementById('subject') as any;
      el.value = 'preserved';
      el.loading = true;
      await (window as any).matrix.settle();
      return {
        data: new FormData(form).getAll('comment').map(String),
        willValidate: el.willValidate,
        inert: el.shadowRoot.querySelector('textarea').disabled,
      };
    });
    expect(result.inert, 'docs: "`loading` is inert"').toBe(true);
    expect(result.willValidate, 'docs: "and barred"').toBe(false);
    expect(result.data, 'docs: "while preserving the successful value"').toEqual(['preserved']);
  });

  test('a real form.reset() restores the latest default and clears dirtiness', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', defaultValue: 'authored' });
      const form = document.getElementById('the-form') as HTMLFormElement;
      const el = document.getElementById('subject') as any;

      const seeded = el.value;
      el.value = 'customer text';
      el.defaultValue = 'latest';
      await (window as any).matrix.settle();
      const beforeReset = el.value;

      form.reset();
      await (window as any).matrix.settle();
      const afterReset = el.value;

      el.defaultValue = 'after reset';
      await (window as any).matrix.settle();
      return { seeded, beforeReset, afterReset, pristineAgain: el.value };
    });

    expect(result.seeded, 'the authored value seeds the control').toBe('authored');
    expect(result.beforeReset, 'a dirty control ignores default mutations').toBe('customer text');
    expect(result.afterReset, 'reset restores the LATEST default').toBe('latest');
    expect(result.pristineAgain, 'and clears dirtiness').toBe('after reset');
  });

  test('a disabled fieldset bars the control and preserves its value', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', required: true }, { fieldset: true });
      const form = document.getElementById('the-form') as HTMLFormElement;
      const fieldset = document.getElementById('the-fieldset') as HTMLFieldSetElement;
      const el = document.getElementById('subject') as any;
      el.value = 'kept';
      await (window as any).matrix.settle();

      fieldset.disabled = true;
      await (window as any).matrix.settle();
      const barred = {
        value: el.value,
        willValidate: el.willValidate,
        valid: el.checkValidity(),
        data: new FormData(form).getAll('comment').map(String),
      };

      fieldset.disabled = false;
      await (window as any).matrix.settle();
      return { barred, restoredValue: el.value, restoredWillValidate: el.willValidate };
    });

    expect(result.barred.value, 'being barred is not being reset').toBe('kept');
    expect(result.barred.willValidate, 'a disabled fieldset bars validation').toBe(false);
    expect(result.barred.valid, 'and suppresses the calculated error').toBe(true);
    expect(result.barred.data, 'a disabled control is omitted from FormData').toEqual([]);
    expect(result.restoredValue).toBe('kept');
    expect(result.restoredWillValidate, 're-enabling restores participation').toBe(true);
  });

  test('required blocks submission until the control is filled', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', required: true });
      const el = document.getElementById('subject') as any;
      const empty = { valid: el.checkValidity(), missing: el.validity.valueMissing };
      el.value = 'filled';
      await (window as any).matrix.settle();
      return { empty, filled: { valid: el.checkValidity(), missing: el.validity.valueMissing } };
    });

    expect(result.empty.missing, 'docs: "`required` maps to `valueMissing`"').toBe(true);
    expect(result.empty.valid).toBe(false);
    expect(result.filled.missing, 'and clears immediately').toBe(false);
    expect(result.filled.valid).toBe(true);
  });

  test('length constraints apply only after customer editing', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', maxlength: 5 });
      const el = document.getElementById('subject') as any;

      el.value = 'far too long';
      await (window as any).matrix.settle();
      const assigned = { tooLong: el.validity.tooLong, valid: el.checkValidity() };

      const native = el.shadowRoot.querySelector('textarea');
      native.value = 'also far too long';
      native.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await (window as any).matrix.settle();
      return { assigned, typed: { tooLong: el.validity.tooLong, valid: el.checkValidity() } };
    });

    expect(result.assigned.tooLong,
      'docs: "programmatic assignment does not manufacture length errors"').toBe(false);
    expect(result.assigned.valid).toBe(true);
    expect(result.typed.tooLong, 'docs: maps to tooLong after customer editing').toBe(true);
    expect(result.typed.valid).toBe(false);
  });

  test('a wrapping label with no id still names the control and is listed', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment' }, { wrappingLabel: 'Wrapped name' });
      const el = document.getElementById('subject') as any;
      const label = document.getElementById('the-label');
      return {
        listed: [...(el.labels ?? [])].includes(label),
        name: el.shadowRoot.querySelector('textarea').getAttribute('aria-label'),
      };
    });

    expect(result.name, 'docs: "wrapping labels name … the real textarea"').toBe('Wrapped name');
    expect(result.listed, 'docs: `labels` lists the association').toBe(true);
  });

  test('browser restoration dirties the control without an edit', async () => {
    const result = await page.evaluate(async () => {
      await (window as any).matrix.mountInForm({ name: 'comment', defaultValue: 'authored' });
      const el = document.getElementById('subject') as any;
      el.formStateRestoreCallback('restored');
      await (window as any).matrix.settle();
      const restored = el.value;

      el.defaultValue = 'new default';
      await (window as any).matrix.settle();
      return { restored, afterDefaultChange: el.value };
    });

    expect(result.restored).toBe('restored');
    expect(result.afterDefaultChange,
      'docs: "browser restore … dirties it"').toBe('restored');
  });
});
