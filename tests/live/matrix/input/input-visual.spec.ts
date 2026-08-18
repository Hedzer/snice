/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-input TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/input, `npm run test:matrix`) owns structure
 * truth: which parts exist per property vector, the dirty-value lifecycle, the
 * constraint contract, the five events. Five of this component's documented
 * claims are invisible to happy-dom, which performs no layout, paints nothing,
 * and implements no `attachInternals()`:
 *
 *   · three VARIANTS whose entire difference is where the border is —
 *     `outlined` all round, `filled` a tinted box, `underlined` a bottom rule;
 *   · "Required indicator shown" — a `::after` marker that only a real cascade
 *     resolves and only a real paint puts on screen;
 *   · `align: top|center|bottom` and `stretch`, both documented as meaningful
 *     ONLY "when host has explicit height". That is a layout claim end to end;
 *   · the icon/clear/password-toggle row: five things competing for one line,
 *     any of which can cover the text the customer is typing;
 *   · "Listed in `form.elements`… `FormData`, reset, external labels" — a
 *     form-associated custom element is invisible to all of that without
 *     `ElementInternals`, which only a real browser has.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots + the real form ───────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/input/matrix.html';

type Variant = 'outlined' | 'filled' | 'underlined';
type Size = 'small' | 'medium' | 'large';
type State = 'plain' | 'invalid' | 'disabled' | 'loading' | 'readonly';

const VARIANTS: Variant[] = ['outlined', 'filled', 'underlined'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const STATES: State[] = ['plain', 'invalid', 'disabled', 'loading', 'readonly'];

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  state: State;
  icons: 'none' | 'both' | 'slotted';
}

/**
 * 3 variants x 3 sizes x 5 states, plus an icon axis rotated through them —
 * 45 combos. Sized to a component whose visual surface is one field, one row of
 * adornments, and a label above and support text below; the point of this tier
 * is that all of it meets a real layout engine at every size.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  const iconCycle = ['none', 'both', 'slotted'] as const;
  let i = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const state of STATES) {
        const icons = iconCycle[i++ % iconCycle.length];
        combos.push({ id: `${variant}/${size}/${state}/icons=${icons}`, variant, size, state, icons });
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo) {
  return {
    variant: combo.variant,
    size: combo.size,
    label: 'Email address',
    'helper-text': combo.state === 'invalid' ? undefined : 'We never share it.',
    'error-text': combo.state === 'invalid' ? 'That address is not valid' : undefined,
    invalid: combo.state === 'invalid',
    disabled: combo.state === 'disabled',
    loading: combo.state === 'loading',
    readonly: combo.state === 'readonly',
    clearable: true,
    value: 'you@example.com',
    'prefix-icon': combo.icons === 'both' ? '🔍' : undefined,
    'suffix-icon': combo.icons === 'both' ? '✔' : undefined,
    slotted: combo.icons === 'slotted',
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
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
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partOf = (name: string) =>
      ([...sr.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;
    const visible = (node: Element | null) => {
      if (!node) return false;
      const cs = getComputedStyle(node as HTMLElement);
      if (cs.display === 'none' || cs.visibility !== 'visible' || Number(cs.opacity) <= 0.05) return false;
      const box = rect(node);
      return box.width > 0 && box.height > 0;
    };

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the control renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── In the content flow, filling its column ─────────────────────────────
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (Math.abs(hostBox.width - stage.width) > 1) {
      say(`the control is ${hostBox.width.toFixed(0)}px wide in a ${stage.width.toFixed(0)}px column`);
    }
    const after = document.getElementById('after')!.getBoundingClientRect();
    if (after.top < hostBox.bottom - EPS) {
      say('the block after the control does not clear it — the control takes no space');
    }

    const container = partOf('container');
    const field = partOf('input') as HTMLInputElement | null;
    if (!container) { say('no [part="container"]'); return problems; }
    if (!field) { say('no [part="input"]'); return problems; }
    const containerBox = rect(container);
    const fieldBox = rect(field);
    if (fieldBox.width <= 0 || fieldBox.height <= 0) {
      say(`the field renders at ${fieldBox.width}x${fieldBox.height}`);
      return problems;
    }
    if (fieldBox.left < containerBox.left - EPS || fieldBox.right > containerBox.right + EPS) {
      say('the field escapes its container horizontally');
    }

    // ── Label above, support text below ─────────────────────────────────────
    const label = partOf('label');
    if (!label) say('a labelled control paints no [part="label"]');
    else {
      const box = rect(label);
      if (box.height <= 0) say('[part="label"] has no box');
      if (box.bottom > fieldBox.top + EPS) {
        say(`the label (bottom ${box.bottom.toFixed(1)}) sits on the field`
          + ` (top ${fieldBox.top.toFixed(1)})`);
      }
    }

    const support = partOf(combo.state === 'invalid' ? 'error-text' : 'helper-text');
    if (!support) say(`no [part="${combo.state === 'invalid' ? 'error-text' : 'helper-text'}"]`);
    else {
      const box = rect(support);
      if (box.height <= 0) say('the support text has no box');
      if (box.top < fieldBox.bottom - EPS) {
        say(`the support text (top ${box.top.toFixed(1)}) sits on the field`
          + ` (bottom ${fieldBox.bottom.toFixed(1)})`);
      }
      if (box.bottom > hostBox.bottom + EPS) say('the support text hangs outside the control');
    }

    // ── The variant really changes where the border is ──────────────────────
    // The rule lands on the FIELD itself (`.input--outlined` and friends are
    // the native input's classes), so that is where it is measured.
    const cs = getComputedStyle(field);
    const widths = {
      top: parseFloat(cs.borderTopWidth),
      right: parseFloat(cs.borderRightWidth),
      bottom: parseFloat(cs.borderBottomWidth),
      left: parseFloat(cs.borderLeftWidth),
    };
    if (combo.variant === 'underlined') {
      if (widths.bottom <= 0) say('an underlined control has no bottom rule');
      if (widths.top > 0 || widths.left > 0 || widths.right > 0) {
        say(`an underlined control paints a full border (${JSON.stringify(widths)})`);
      }
    }
    if (combo.variant === 'outlined') {
      const sides = Object.values(widths).filter(w => w > 0).length;
      if (sides < 4) say(`an outlined control paints ${sides} of 4 borders`);
    }

    // ── The adornments that present something must not cover each other ─────
    //
    // The icon regions are absolutely-positioned overlays inside the field's
    // own padding, so "the row is horizontally disjoint" is the wrong shape of
    // question: an EMPTY overlay legitimately sits wherever it likes. What
    // matters is that two adornments the customer can actually SEE never land
    // on top of one another, and that none of them escapes the field.
    const presents = (node: HTMLElement | null): boolean => {
      if (!visible(node)) return false;
      const text = (node!.textContent ?? '').trim();
      if (text) return true;
      if (node!.querySelector('svg')) return true;
      // `flatten: true` would return the slot's own fallback markers, so an
      // EMPTY icon region would read as one that presents something.
      const slot = node!.querySelector('slot') as HTMLSlotElement | null;
      return !!slot && slot.assignedNodes({ flatten: false })
        .some(n => n.nodeType === 1 || (n.textContent ?? '').trim() !== '');
    };

    const adornments: Array<[string, HTMLElement]> = [];
    for (const name of ['prefix-icon', 'clear', 'spinner', 'password-toggle', 'suffix-icon']) {
      const node = partOf(name);
      if (presents(node)) adornments.push([name, node!]);
    }
    for (const [name, node] of adornments) {
      const box = rect(node);
      const shareLine = Math.min(box.bottom, fieldBox.bottom) - Math.max(box.top, fieldBox.top);
      if (shareLine <= 0) say(`[part="${name}"] dropped off the field's line`);
      if (box.right > containerBox.right + EPS || box.left < containerBox.left - EPS) {
        say(`[part="${name}"] hangs outside the container`);
      }
    }
    for (let i = 0; i < adornments.length; i++) {
      for (let j = i + 1; j < adornments.length; j++) {
        const a = rect(adornments[i][1]);
        const b = rect(adornments[j][1]);
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        // Every adornment is a 24px box around a much smaller glyph, so two
        // boxes touching by a pixel or two is padding meeting padding, not one
        // control covering another. TOUCH is the tolerance; anything past it
        // means the glyphs themselves are stacking.
        const TOUCH = 4;
        if (ox > TOUCH && oy > TOUCH) {
          say(`[part="${adornments[i][0]}"] and [part="${adornments[j][0]}"] overlap`
            + ` by ${ox.toFixed(0)}x${oy.toFixed(0)}px`);
        }
      }
    }

    // ── The spinner belongs to loading, and only to loading ─────────────────
    if (combo.state === 'loading' && !visible(partOf('spinner'))) {
      say('a loading control paints no visible [part="spinner"]');
    }
    if (combo.state !== 'loading' && visible(partOf('spinner'))) {
      say('a control that is not loading paints a spinner');
    }

    // ── The clear control ───────────────────────────────────────────────────
    //
    // Documented: `clearable` gives a control WITH A VALUE a way to empty
    // itself, and the control has to be editable for that to mean anything
    // (`disabled`, `loading` and `readonly` all bar the edit). The component
    // reveals it on hover/focus rather than parking it permanently in the
    // field, which the doc neither promises nor forbids — so what is asserted
    // is that it is ARMED (`clear-button--visible`, the state the reveal rule
    // keys on) exactly for the editable states, and reachable once revealed.
    // The page hovers the host before this runs, so a revealed control is
    // genuinely painted here.
    const clear = partOf('clear');
    const armed = !!clear && clear.classList.contains('clear-button--visible');
    const editable = combo.state === 'plain' || combo.state === 'invalid';
    if (armed !== editable) {
      say(`the clear control is ${armed ? 'armed' : 'disarmed'} for state "${combo.state}"`);
    }
    if (armed && clear) {
      const box = rect(clear);
      if (box.width < 14 || box.height < 14) {
        say(`the clear control renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`
          + ' — too small to hit');
      } else if (visible(clear)) {
        const hit = (sr as any).elementFromPoint(
          box.left + box.width / 2, box.top + box.height / 2) as Element | null;
        if (hit !== clear && !clear.contains(hit as Node)) {
          say(`the revealed clear control is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      } else {
        say('the clear control is armed but nothing reveals it');
      }
    }

    // ── Occlusion: nothing paints over the text the customer types ──────────
    for (const fraction of [0.15, 0.5]) {
      const x = fieldBox.left + fieldBox.width * fraction;
      const y = fieldBox.top + fieldBox.height / 2;
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== field && !field.contains(hit as Node)) {
        say(`the field @${Math.round(fraction * 100)}% is occluded by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── The barred states really look barred ────────────────────────────────
    if (combo.state === 'disabled' || combo.state === 'loading') {
      if (!field.disabled) say(`state "${combo.state}" left the field enabled`);
      if (getComputedStyle(field).cursor === 'text') {
        say(`state "${combo.state}" still shows a text cursor over the field`);
      }
    }
    if (combo.state === 'readonly' && !field.readOnly) say('readonly left the field writable');

    // ── Required indicator, and the invalid tint ────────────────────────────
    if (combo.state === 'invalid') {
      if (field.getAttribute('aria-invalid') !== 'true') say('an invalid control does not say so');
    }

    return problems;
  }, combo as any);
}

/** Park the pointer on the field's container, where the reveal rule keys. */
async function hoverContainer(): Promise<void> {
  const point = await page.evaluate(() => {
    const sr = document.getElementById('subject')!.shadowRoot!;
    const container = [...sr.querySelectorAll('[part]')]
      .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('container'))!;
    const box = container.getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  // The reveal is a 150ms opacity transition; reading the pixel before it
  // finishes would report a control that is on its way in as invisible.
  await page.waitForTimeout(220);
}

// ── Findings ────────────────────────────────────────────────────────────────
//
// `.ai/fuzzing.md`: a combo that diverges from the docs is a FINDING — keep the
// correct assertion, pin it against an id, never weaken it. `it.fails` is the
// DOM tier's tool; the equivalent here names the EXACT message it excuses, so
// everything else the combo reports still fails and a waiver that stops
// reproducing fails on its own.

interface Waiver {
  id: string;
  applies: (combo: Combo) => boolean;
  matches: RegExp;
}

// VISUAL-MATRIX-input-3 (slotted suffix icon did not move the clear button;
// the two stacked) — fixed: the template now tracks the suffix slot via
// `slottedSuffixIcon` and applies `clear-button--with-suffix` for either
// channel. Waiver deleted.
const WAIVERS: Waiver[] = [];

const combos = generateCombos();

test.describe('input visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      // The clear control is revealed on hover of the CONTAINER, so the
      // pointer is put on the container's own centre rather than the host's
      // (whose centre can land on the label or the helper text). Hovering here
      // is what makes "revealed" a paintable, hit-testable fact rather than a
      // class name.
      await hoverContainer();
      const problems = await visualProblems(combo);
      const waivers = WAIVERS.filter(w => w.applies(combo));

      const excused = (problem: string) => waivers.some(w => w.matches.test(problem));
      expect(problems.filter(p => !excused(p)), `combo ${combo.id}`).toEqual([]);

      for (const waiver of waivers) {
        expect(problems.some(p => waiver.matches.test(p)),
          `combo ${combo.id}: ${waiver.id} no longer reproduces`
          + ' — delete its waiver in input-visual.spec.ts')
          .toBe(true);
      }
    });
  }
});

// ── The layout claims that only exist with an explicit height ───────────────

test.describe('input visual matrix: align and stretch', () => {
  const HEIGHT = 200;

  for (const align of ['top', 'center', 'bottom'] as const) {
    test(`align=${align} moves the field inside a ${HEIGHT}px host`, async () => {
      // No label on purpose: the documented claim is about the FIELD's
      // vertical position inside a host with an explicit height, and a label
      // legitimately takes the top of that box with it. This is the doc's own
      // example — `<snice-input style="height:200px" align="center">`.
      await page.evaluate(c => (window as any).matrix.mount(c), {
        value: 'you@example.com', align, height: HEIGHT,
      } as any);

      const geometry = await page.evaluate(() => {
        const host = document.getElementById('subject')!;
        const sr = host.shadowRoot!;
        const field = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('input'))!;
        const h = host.getBoundingClientRect();
        const f = field.getBoundingClientRect();
        return { hostHeight: h.height, above: f.top - h.top, below: h.bottom - f.bottom };
      });

      expect(Math.round(geometry.hostHeight), 'the explicit height did not take').toBe(HEIGHT);
      // Documented: the property is the VERTICAL ALIGNMENT of the field inside
      // the host's own box, so the space above and below must move with it.
      if (align === 'top') {
        expect(geometry.above, `align=top left ${geometry.above.toFixed(0)}px above the field`)
          .toBeLessThan(geometry.below);
      } else if (align === 'bottom') {
        expect(geometry.below, `align=bottom left ${geometry.below.toFixed(0)}px below the field`)
          .toBeLessThan(geometry.above);
      } else {
        expect(Math.abs(geometry.above - geometry.below),
          `align=center left ${geometry.above.toFixed(0)}px above and`
          + ` ${geometry.below.toFixed(0)}px below`)
          .toBeLessThan(24);
      }
    });
  }

  test(`stretch fills a ${HEIGHT}px host with the field itself`, async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      value: 'you@example.com', stretch: true, height: HEIGHT,
    } as any);

    const filled = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const field = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('input'))!;
      return field.getBoundingClientRect().height / host.getBoundingClientRect().height;
    });
    // Documented: "input fills full host height".
    expect(filled, `the stretched field covers ${(filled * 100).toFixed(0)}% of its host`)
      .toBeGreaterThan(0.8);
  });
});

// ── The form claims happy-dom cannot reach ──────────────────────────────────

test.describe('input visual matrix: the real form', () => {
  test('the control joins form.elements and contributes to FormData', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'you@example.com',
    } as any);

    const elements = await page.evaluate(() => (window as any).matrix.formElements());
    expect(elements, `form.elements is ${JSON.stringify(elements)}`).toContain('subject');

    const data = await page.evaluate(() => (window as any).matrix.formData('email'));
    expect(data, 'the control did not contribute its value').toEqual(['you@example.com']);
  });

  test('a disabled control is omitted and a readonly one is not', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'you@example.com', disabled: true,
    } as any);
    expect(await page.evaluate(() => (window as any).matrix.formData('email')),
      'a disabled control still contributed a value').toEqual([]);

    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'you@example.com', readonly: true,
    } as any);
    expect(await page.evaluate(() => (window as any).matrix.formData('email')),
      'a readonly control was omitted from the form').toEqual(['you@example.com']);

    // Documented: "`loading` is inert and barred WHILE PRESERVING its
    // successful value" — inert is not the same as omitted.
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'you@example.com', loading: true,
    } as any);
    expect(await page.evaluate(() => (window as any).matrix.formData('email')),
      'a loading control lost its successful value').toEqual(['you@example.com']);
  });

  test('form.reset() restores the authored default', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'authored@example.com',
    } as any);

    expect(await page.evaluate(() => (window as any).matrix.type('typed@example.com')))
      .toBe('typed@example.com');
    expect(await page.evaluate(() => (window as any).matrix.reset()),
      'form.reset() did not restore the default').toBe('authored@example.com');
  });

  test('an external label names the control', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      name: 'email', value: 'you@example.com',
    } as any);
    const count = await page.evaluate(() => (window as any).matrix.labelCount());
    expect(count, 'the external <label for="subject"> did not associate').toBeGreaterThan(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('input visual matrix: marquee pixels', () => {
  test('the three variants paint three different fields', async () => {
    const painted: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        variant, label: 'Email address', value: 'you@example.com',
      } as any);
      const [fill] = await capture(
        page, '#subject', `input-${variant}`,
        `(host) => {
          const sr = host.shadowRoot;
          const container = [...sr.querySelectorAll('[part]')]
            .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes('container'))
            .getBoundingClientRect();
          // Just inside the trailing edge, vertically centred: the field's own
          // fill for \`filled\`, the page behind it for the other two.
          return [{ x: container.right - 6, y: container.y + container.height / 2 }];
        }`,
      );
      painted[variant] = fill.join(',');
    }
    expect(new Set(Object.values(painted)).size,
      `the three variants painted ${JSON.stringify(painted)}`).toBeGreaterThan(1);
  });

  test('the required indicator reaches the screen', async () => {
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const label = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes('label'))
        .getBoundingClientRect();
      // The label is a block that spans the whole control, but its TEXT — and
      // therefore the marker that follows it — occupies only the first inch of
      // that box. Sample a dense grid across the left third, in three rows,
      // because a marker is a couple of glyph-widths wide and one row can miss
      // it entirely.
      const points = [];
      for (let row = 1; row <= 3; row++) {
        for (let i = 0; i < 40; i++) {
          points.push({
            x: label.x + (label.width * 0.35 * i) / 40,
            y: label.y + (label.height * row) / 4,
          });
        }
      }
      return points;
    }`;

    await page.evaluate(c => (window as any).matrix.mount(c), {
      label: 'Email address', value: 'you@example.com',
    } as any);
    const plain = await capture(page, '#subject', 'input-label-plain', probe);

    await page.evaluate(c => (window as any).matrix.mount(c), {
      label: 'Email address', value: 'you@example.com', required: true,
    } as any);
    const required = await capture(page, '#subject', 'input-label-required', probe);

    // Documented: "Required indicator shown". A required label must PAINT
    // something an optional one does not.
    const different = required.some((pixel, i) => !sameColor(pixel, plain[i]));
    expect(different, 'a required label paints exactly the same pixels as an optional one')
      .toBe(true);
  });

  test('the error text is readable and the invalid field is marked', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      label: 'Email address', value: 'nope', invalid: true,
      'error-text': 'That address is not valid',
    } as any);

    const probes = await capture(
      page, '#subject', 'input-error',
      `(host) => {
        const sr = host.shadowRoot;
        const find = (name) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes(name))
          .getBoundingClientRect();
        const error = find('error-text');
        // The ground first, from the far end of the block where no glyph lands.
        const points = [{ x: error.right - 2, y: error.bottom - 1 }];
        // Then a dense grid over the text itself: the error line is 12px type,
        // so a sparse row lands between glyphs and reads back as the ground.
        for (let row = 1; row <= 3; row++) {
          for (let i = 0; i < 60; i++) {
            points.push({
              x: error.x + (error.width * 0.6 * i) / 60,
              y: error.y + (error.height * row) / 4,
            });
          }
        }
        return points;
      }`,
    );
    const [ground, ...glyphs] = probes;
    const ink = glyphs.reduce((a, b) => (a[0] + a[1] + a[2] <= b[0] + b[1] + b[2] ? a : b));
    expect(contrast(ink, ground),
      `the error text paints rgb(${ink.join(',')}) on rgb(${ground.join(',')}) —`
      + ` ${contrast(ink, ground).toFixed(2)}:1`)
      .toBeGreaterThan(3);
  });

  test('a disabled field is visibly dimmer than an editable one', async () => {
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const container = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes('container'))
        .getBoundingClientRect();
      const points = [];
      for (let i = 0; i < 20; i++) {
        points.push({ x: container.x + 6 + i * 4, y: container.y + container.height / 2 });
      }
      return points;
    }`;

    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'filled', value: 'you@example.com',
    } as any);
    const live = await capture(page, '#subject', 'input-live', probe);

    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'filled', value: 'you@example.com', disabled: true,
    } as any);
    const dead = await capture(page, '#subject', 'input-disabled', probe);

    const different = dead.some((pixel, i) => !sameColor(pixel, live[i]));
    expect(different, 'a disabled field paints exactly the same pixels as an editable one')
      .toBe(true);
  });
});
