/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-tag-input TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/tag-input, `npm run test:matrix`) owns
 * structure and value truth: the parts, the chips, the event contracts, the
 * form lifecycle, the capacity rule. It cannot own visual truth, because
 * happy-dom performs no layout and paints nothing.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the label (when authored) sits ABOVE the container, and the container
 *     holds chips + draft field as a wrapping row;
 *   · every chip is a real box in the container's semantic paint — the
 *     primary-subtle fill and primary-hover ink the theme gives a chip — with
 *     its text and its remove glyph, unoccluded;
 *   · the draft field is present and roomy until capacity hides it ("At
 *     capacity … the draft input is hidden");
 *   · the invalid state paints the documented error styling: the container's
 *     border in the danger colour, with aria-invalid marked;
 *   · the suggestions dropdown hangs BELOW the container (the documented
 *     dropdown), with real items, and closes on Escape;
 *   · a remove click through a real browser event emits tag-remove then
 *     tag-change.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A chip that "has a background-color" can still be invisible, and ink that
 *   "has a color" can be unreadable on its own chip. The marquee captures
 *   decode the PNG inside the browser under test and judge the chip's label
 *   against its fill, the chip against the container surface, and the invalid
 *   border against the valid one.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/tag-input/matrix.html';

interface Combo {
  id: string;
  label?: string;
  value?: string[];
  maxTags?: number;
  disabled?: boolean;
  readonly?: boolean;
  allowDuplicates?: boolean;
  suggestions?: string[];
}

const MANY = ['JavaScript', 'TypeScript', 'CSS', 'HTML', 'Rust', 'Go'];

/**
 * The cross: geometry combos label (2) x value (3: empty, one, many) x
 * maxTags (2: unlimited, at-capacity) = 12, plus one combo per state family
 * (disabled, readonly, invalid-duplicate, invalid-over-limit, suggestions
 * open, suggestions highlighted) — 18 combos.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const label of [undefined, 'Skills']) {
    for (const value of [[], ['JavaScript'], MANY] as string[][]) {
      for (const maxTags of [undefined, value.length || 1] as (number | undefined)[]) {
        combos.push({
          id: `${label ? 'labelled' : 'bare'}/${value.length === 0 ? 'empty'
            : value.length === 1 ? 'one' : 'many'}`
            + `/${maxTags !== undefined ? `max${maxTags}` : 'unlimited'}`,
          label, value, maxTags,
        });
      }
    }
  }
  combos.push({ id: 'state/disabled', value: ['A'], disabled: true });
  combos.push({ id: 'state/readonly', value: ['A'], readonly: true });
  combos.push({ id: 'state/invalid-duplicate', value: ['dup', 'dup'] });
  combos.push({ id: 'state/invalid-over-limit', value: ['1', '2', '3'], maxTags: 2 });
  combos.push({ id: 'suggestions/closed', value: [], suggestions: ['Alpha', 'Beta'] });
  combos.push({ id: 'suggestions/open', value: [], suggestions: ['Alpha', 'Beta'] });
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** Does this combo open the suggestion list before the geometry pass? */
const OPENS_SUGGESTIONS = (combo: Combo) => combo.id === 'suggestions/open';

/**
 * LAYER 1. One evaluate per combo, returning every violation at once.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const chips = [...sr.querySelectorAll('[part="tag"]')]
      .filter(n => (n.getAttribute('part') ?? '').split(/\s+/).includes('tag')) as HTMLElement[];
    const container = sr.querySelector('[part="container"]') as HTMLElement | null;
    if (!container) { say('no part="container"'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width <= 0 || containerBox.height <= 0) {
      say(`container renders at ${containerBox.width.toFixed(0)}x${containerBox.height.toFixed(0)}`);
      return problems;
    }
    const containerCs = getComputedStyle(container);
    // "Disabled controls are omitted/barred. Readonly controls remain
    // successful but are barred." — a barred control offers no EDIT
    // affordance anywhere, the per-chip remove button included.
    const barred = !!(combo.disabled || combo.readonly);
    if (!/^(inline-)?flex$/.test(containerCs.display)) {
      say(`container display "${containerCs.display}", expected a flex row`);
    }
    if (containerCs.flexWrap !== 'wrap') {
      say(`container flex-wrap "${containerCs.flexWrap}", expected "wrap"`);
    }
    if (parseFloat(containerCs.borderTopWidth) <= 0) {
      say('container has no border');
    }

    // ── The label sits above the container ──────────────────────────────────
    const label = sr.querySelector('[part="label"]') as HTMLElement | null;
    if (combo.label) {
      if (!label) { say('an authored label rendered no label part'); }
      else {
        const labelBox = rect(label);
        if (labelBox.width <= 0 || labelBox.height <= 0) {
          say(`label renders at ${labelBox.width.toFixed(0)}x${labelBox.height.toFixed(0)}`);
        }
        if ((label.textContent ?? '').trim() !== combo.label) {
          say(`label text "${label.textContent}", expected "${combo.label}"`);
        }
        if (labelBox.bottom > containerBox.top + EPS) {
          say(`label (bottom ${labelBox.bottom.toFixed(0)}) is not above the container`
            + ` (top ${containerBox.top.toFixed(0)})`);
        }
      }
    } else if (label) {
      say('a label part exists with no label authored');
    }

    // ── Chips: the theme's own chip paint, in real boxes ────────────────────
    const value: string[] = combo.value ?? [];
    if (chips.length !== value.length) {
      say(`${chips.length} chips rendered, expected ${value.length}`);
    }
    const chipFill = matrix.token('--snice-color-primary-subtle');
    const chipInk = matrix.token('--snice-color-primary-hover');
    for (const [i, chip] of chips.entries()) {
      const box = rect(chip);
      if (box.width <= 0 || box.height <= 0) {
        say(`chip ${i} renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
        continue;
      }
      if (i > 0) {
        const prev = rect(chips[i - 1]);
        // Wrapping is allowed; overlap is not. Same row: chip starts after
        // the previous ends. New row: chip starts below it.
        const sameRow = box.top < prev.bottom - EPS;
        if (sameRow && box.left < prev.right - EPS) {
          say(`chip ${i} overlaps chip ${i - 1} in a row`);
        }
      }
      if (box.top < containerBox.top - EPS || box.bottom > containerBox.bottom + EPS) {
        say(`chip ${i} escapes the container`);
      }
      const chipCs = getComputedStyle(chip);
      if (chipCs.backgroundColor !== chipFill) {
        say(`chip ${i} fill "${chipCs.backgroundColor}", expected primary-subtle "${chipFill}"`);
      }
      if (chipCs.color !== chipInk) {
        say(`chip ${i} ink "${chipCs.color}", expected primary-hover "${chipInk}"`);
      }
      if (parseFloat(chipCs.borderTopLeftRadius) <= 0) {
        say(`chip ${i} has no corner radius`);
      }

      // The chip's text: present, unoccluded, inside the chip.
      const textEl = chip.querySelector('.tag-text') as HTMLElement | null;
      if (!textEl) { say(`chip ${i} has no text node`); continue; }
      if ((textEl.textContent ?? '').trim() !== value[i]) {
        say(`chip ${i} text "${textEl.textContent}", expected "${value[i]}"`);
      }
      const textBox = rect(textEl);
      if (textBox.width <= 0 || textBox.height <= 0) {
        say(`chip ${i} text renders at ${textBox.width.toFixed(0)}x${textBox.height.toFixed(0)}`);
      }
      const tx = textBox.left + Math.min(textBox.width / 2, 10);
      const ty = textBox.top + textBox.height / 2;
      const outer = document.elementFromPoint(tx, ty);
      if (outer !== host) {
        say(`chip ${i} text hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
      } else {
        const hit = (sr as any).elementFromPoint(tx, ty) as Element | null;
        if (hit !== textEl && !textEl.contains(hit) && hit !== chip) {
          say(`chip ${i} text is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }

      // The remove glyph: a real button, right of the text, reachable — but
      // only while the control can edit. A barred control must offer NO
      // remove affordance at all, not a dead one.
      const remove = chip.querySelector('.tag-remove') as HTMLElement | null;
      if (barred) {
        if (remove) {
          say(`chip ${i} offers a remove button on a ${combo.disabled ? 'disabled' : 'readonly'} control`);
        }
        continue;
      }
      if (!remove) { say(`chip ${i} has no remove button`); continue; }
      const removeBox = rect(remove);
      if (removeBox.width <= 0 || removeBox.height <= 0) {
        say(`chip ${i} remove renders at ${removeBox.width.toFixed(0)}x${removeBox.height.toFixed(0)}`);
      }
      if (removeBox.left < textBox.right - EPS) {
        say(`chip ${i} remove button overlaps the text`);
      }
      if (getComputedStyle(remove).cursor !== 'pointer') {
        say(`chip ${i} remove cursor "${getComputedStyle(remove).cursor}"`);
      }
      const hit = (sr as any).elementFromPoint(
        removeBox.left + removeBox.width / 2,
        removeBox.top + removeBox.height / 2,
      ) as Element | null;
      if (hit !== remove && !remove.contains(hit)) {
        say(`chip ${i} remove is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── The draft field: present until capacity hides it ────────────────────
    const input = sr.querySelector('.tag-input-field') as HTMLInputElement | null;
    const maxTags = combo.maxTags ?? 0;
    const atCapacity = maxTags > 0 && value.length >= maxTags;
    if (atCapacity) {
      if (input) say('the draft input is rendered at capacity — it is documented hidden');
    } else if (combo.disabled || combo.readonly) {
      // Barred controls must not offer an ENABLED draft field.
      if (input && !input.disabled && !input.readOnly) {
        say(`a ${combo.disabled ? 'disabled' : 'readonly'} control offers an enabled draft field`);
      }
    } else if (!input) {
      say('no draft input under capacity');
    } else {
      const inputBox = rect(input);
      if (inputBox.height < 12) say(`draft input is ${inputBox.height.toFixed(0)}px tall`);
      if (inputBox.width < 50) say(`draft input is only ${inputBox.width.toFixed(0)}px wide`);
      if (inputBox.top < containerBox.top - EPS || inputBox.bottom > containerBox.bottom + EPS) {
        say('draft input escapes the container');
      }
      if (value.length === 0 && (input.getAttribute('placeholder') ?? '') === '') {
        say('an empty control carries no placeholder on its draft field');
      }
    }

    // ── The invalid state paints the documented error styling ───────────────
    const dups = !barred && !(combo.allowDuplicates ?? false)
      && new Set(value).size !== value.length;
    const over = !barred && maxTags > 0 && value.length > maxTags;
    const invalid = dups || over;
    if (invalid) {
      const danger = matrix.token('--snice-color-danger');
      if (container.getAttribute('aria-invalid') !== 'true') {
        say('an invalid control does not mark the container aria-invalid');
      }
      if (containerCs.borderTopColor !== danger) {
        say(`invalid border "${containerCs.borderTopColor}", expected danger "${danger}"`);
      }
      if (container.classList.contains('tag-input-container--invalid') === false) {
        say('invalid container carries no invalid styling class');
      }
    } else if (container.getAttribute('aria-invalid') === 'true') {
      say('a valid control is marked aria-invalid');
    }

    // ── The suggestions dropdown ────────────────────────────────────────────
    const dropdown = sr.querySelector('[part="suggestions"]') as HTMLElement | null;
    const items = [...sr.querySelectorAll('.tag-suggestion-item')] as HTMLElement[];
    if (combo.id === 'suggestions/open') {
      if (!dropdown) { say('an open control renders no suggestions part'); }
      else {
        const dropBox = rect(dropdown);
        if (dropBox.top < containerBox.bottom - EPS) {
          say(`dropdown (top ${dropBox.top.toFixed(0)}) is not below the container`
            + ` (bottom ${containerBox.bottom.toFixed(0)})`);
        }
        if (dropBox.width < containerBox.width - 4) {
          say(`dropdown is ${dropBox.width.toFixed(0)}px wide, container is`
            + ` ${containerBox.width.toFixed(0)}px — it should span it`);
        }
        if (items.length === 0) say('the dropdown has no items');
        for (const [i, item] of items.entries()) {
          const b = rect(item);
          if (b.width <= 0 || b.height <= 0) {
            say(`suggestion ${i} renders at ${b.width.toFixed(0)}x${b.height.toFixed(0)}`);
          }
          const hit = (sr as any).elementFromPoint(
            b.left + b.width / 2, b.top + b.height / 2) as Element | null;
          if (hit !== item && !item.contains(hit)) {
            say(`suggestion ${i} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
    } else if (dropdown) {
      say('a closed control renders a suggestions part');
    }

    return problems;
  }, combo as any);
}

test.describe('tag-input visual matrix: layer 1', () => {
  for (const combo of generateCombos()) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.value).toEqual(combo.value ?? []);
      if (OPENS_SUGGESTIONS(combo)) {
        // Open the list by typing a suggestion's own text — the query the
        // list must contain for autocomplete to mean anything.
        const typed = await page.evaluate(() => (window as any).matrix.type('Alpha'));
        expect(typed.typed, 'no draft input to open the list with').toBe(true);
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('tag-input visual matrix: interaction', () => {
  test('the highlighted suggestion paints the highlighted style', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: [], suggestions: ['Alpha', 'Beta'],
    }));
    await page.evaluate(() => (window as any).matrix.type('Alpha'));
    await page.evaluate(() => (window as any).matrix.press('ArrowDown'));
    const highlighted = await page.evaluate(() => {
      const items = [...(window as any).matrix.el.shadowRoot
        .querySelectorAll('.tag-suggestion-item')];
      const index = items.findIndex(item =>
        item.classList.contains('tag-suggestion-item--highlighted'));
      const bg = getComputedStyle(items[0]).backgroundColor;
      return { index, bg };
    });
    expect(highlighted.index, 'ArrowDown highlighted no item').toBe(0);
    expect(highlighted.bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('Escape closes the dropdown', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: [], suggestions: ['Alpha', 'Beta'],
    }));
    await page.evaluate(() => (window as any).matrix.type('Alpha'));
    await page.evaluate(() => (window as any).matrix.press('Escape'));
    const items = await page.evaluate(() =>
      (window as any).matrix.el.shadowRoot
        .querySelectorAll('.tag-suggestion-item').length);
    expect(items).toBe(0);
  });

  test('a real remove click emits tag-remove then tag-change', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ value: ['A', 'B'] }));
    const result = await page.evaluate(() => (window as any).matrix.clickRemove(0));
    expect(result.clicked, 'no remove button to click').toBe(true);
    expect(result.events).toEqual(['tag-remove', 'tag-change']);
    expect(result.value).toEqual(['B']);
    expect(result.sameHost, 'detail carried the tag').toBe(true);
  });

  test('chips wrap: many tags grow the container past one line', async () => {
    const verdict = await page.evaluate(() => {
      const matrix = (window as any).matrix;
      return matrix.mount({ value: [] }).then(() => {
        const container = () => matrix.el.shadowRoot
          .querySelector('[part="container"]').getBoundingClientRect();
        const empty = container().height;
        return matrix.mount({ value: ['JavaScript', 'TypeScript', 'CSS', 'HTML', 'Rust', 'Go'] })
          .then(() => {
            const chips = [...matrix.el.shadowRoot.querySelectorAll('[part="tag"]')]
              .map(chip => chip.getBoundingClientRect());
            const input = matrix.el.shadowRoot
              .querySelector('.tag-input-field').getBoundingClientRect();
            return {
              empty, many: container().height,
              lastChipBottom: Math.max(...chips.map(box => box.bottom)),
              inputTop: input.top,
            };
          });
      });
    });
    // The 520px stage is part of the claim: six tags plus the draft field's
    // 4rem minimum do not fit one line, so the documented wrapping row must
    // break, not overflow. The empty mount cannot seed a ratio — its height
    // is floored by the container's 2.5rem min-height, so even a real second
    // line lands far below empty * 1.8 — so the wrap is asserted directly:
    // the draft field starts BELOW the chip row, and the container grew.
    expect(verdict.inputTop > verdict.lastChipBottom,
      'six tags and the draft field stayed on one line').toBe(true);
    expect(verdict.many, 'six chips did not wrap past one line')
      .toBeGreaterThan(verdict.empty);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive
// than an evaluate, and layer 1 already measured the model the browser built.
// These exist because "the chip has a fill" and "the label is readable on the
// chip" are different claims, and only pixels can tell them apart.

test.describe('tag-input visual matrix: marquee pixels', () => {
  test('a chip paints a fill its own label is readable on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: ['JavaScript'], label: 'Skills',
    }));
    const pixels = await capture(
      page, '#subject', 'tag-input-chip',
      `(host) => {
        const chip = host.shadowRoot.querySelector('[part="tag"]');
        const text = chip.querySelector('.tag-text');
        const c = chip.getBoundingClientRect();
        const t = text.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 10; i++) {
          points.push({ x: t.x + (t.width * i) / 12, y: t.y + t.height / 2 });
        }
        points.push({ x: c.x + 2, y: c.y + c.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1] as RGB;
    const glyphs = pixels.slice(0, -1) as RGB[];
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed label pixel equals the chip ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    expect(best, `best label-vs-chip contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a chip is set off from the container surface it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ value: ['Tag'] }));
    const [chip, surface] = await capture(
      page, '#subject', 'tag-input-chip-vs-surface',
      `(host) => {
        const chip = host.shadowRoot.querySelector('[part="tag"]');
        const container = host.shadowRoot.querySelector('[part="container"]');
        const c = chip.getBoundingClientRect();
        const b = container.getBoundingClientRect();
        return [
          { x: c.x + 2, y: c.y + c.height / 2 },
          { x: b.x + b.width - 8, y: c.y + c.height / 2 },
        ];
      }`,
    );
    expect(sameColor(chip as RGB, surface as RGB),
      `chip painted ${chip.join(',')} identical to the surface ${surface.join(',')}`)
      .toBe(false);
  });

  test('the invalid border really paints red, where the valid one painted grey', async () => {
    const borders: RGB[] = [];
    for (const combo of [{ value: ['A'] }, { value: ['dup', 'dup'] }]) {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      const [border] = await capture(
        page, '#subject', `tag-input-${borders.length === 0 ? 'valid' : 'invalid'}`,
        `(host) => {
          const container = host.shadowRoot.querySelector('[part="container"]');
          const b = container.getBoundingClientRect();
          return [{ x: b.x + b.width / 2, y: b.y + 0.4 }];
        }`,
      );
      borders.push(border as RGB);
    }
    const [valid, invalid] = borders;
    expect(sameColor(valid, invalid),
      `invalid border painted the same colour as the valid one: ${valid.join(',')}`)
      .toBe(false);
    const [r, g, b] = invalid;
    expect(r > g + 30 && r > b + 30,
      `invalid border is not red-dominant: rgb(${r},${g},${b})`).toBe(true);
  });

  test('the dropdown paints its own surface, distinct from the page', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      value: [], suggestions: ['Alpha', 'Beta'],
    }));
    await page.evaluate(() => (window as any).matrix.type('Alpha'));
    // One pixel inside the dropdown's surface and one in the container area
    // above it — a dropdown that paints nothing reads as the page itself.
    const [drop, above] = await capture(
      page, '#stage', 'tag-input-dropdown',
      `() => {
        const host = document.getElementById('subject');
        const drop = host.shadowRoot.querySelector('[part="suggestions"]');
        const container = host.shadowRoot.querySelector('[part="container"]');
        const d = drop.getBoundingClientRect();
        const c = container.getBoundingClientRect();
        return [
          { x: d.x + 6, y: d.y + d.height / 2 },
          { x: c.x + 6, y: c.y + c.height / 2 },
        ];
      }`,
    );
    // Both are surfaces; the claim is that the dropdown paints SOMETHING —
    // a sheet, not a hole in the page — so a flat match is only acceptable
    // if the container itself is unpainted, which the empty-area probe
    // covers. Distinct colours or a shadowed edge both pass.
    expect(sameColor(drop as RGB, above as RGB),
      `dropdown painted exactly the container colour with no sheet of its own`
      + ` (${drop.join(',')} vs ${above.join(',')})`).toBe(false);
  });
});
