/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-select TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/select, `npm run test:matrix`) owns the
 * structural truth: which trigger surface a mode renders, the thirteen
 * documented parts, the description precedence, the listbox ARIA, the
 * option list itself. This tier owns what a select IS once laid out:
 *
 *   · a CONTROL BOX whose documented size axis (`--snice-select-min-height`,
 *     "Select minimum height") and three sizes are real heights;
 *   · an ANCHORED LISTBOX — the doc's own component description is
 *     "dropdown selection": when open, the panel hangs below its trigger,
 *     flush with its left edge, as wide as the control, never overlapping
 *     it; when closed, nothing below the trigger answers a pointer;
 *   · option ROWS that ascend without overlapping, stay inside the list,
 *     and each answer their own hit-test;
 *   · the documented maxHeight clamp — "Maximum dropdown height", default
 *     200px — which only a browser can weigh;
 *   · the label above the control and the one description below it, never
 *     crowding either;
 *   · the affordances: the chevron at the trigger's right end, the spinner
 *     while `loading`, the clear button exactly when `clearable` meets a
 *     selection, the tag chips of a multiple selection.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   Built around the DOM matrix's own documented axes: size x mode x
 *   description shape (closed), the state flags x mode (closed, plus the
 *   documented refusal of a barred select to open), clearable x valued, the
 *   open listbox across size x searchable x source x editable, the multiple
 *   tag row, and the list-length/maxHeight clamp.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The open panel can "have a background-color" and still never cover the
 *   page; the closed one can leave a ghost. Three captures: the open panel
 *   visibly covers the stage, a closed select paints a uniform nothing
 *   below its trigger, and the placeholder is readable on the trigger.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/select/matrix.html';

type Size = 'small' | 'medium' | 'large';
const SIZES: Size[] = ['small', 'medium', 'large'];

interface Combo {
  id: string;
  size: Size;
  editable: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  value?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  invalid?: boolean;
  required?: boolean;
  maxHeight?: string;
  optionSet?: 'fruits' | 'extras' | 'many' | 'empty' | 'longlabels';
  source?: 'array' | 'children';
  /** The combo asserts the OPEN listbox (the spec opens it first). */
  open?: boolean;
  /** A barred control must refuse to open — assert it stays closed. */
  tryOpen?: boolean;
  /**
   * A `VISUAL-MATRIX-select-N` id when this combo is a recorded divergence.
   * The assertion stays exactly as correct as every other combo's; the id
   * is what turns the test into `test.fail`, so the tier still exits 0
   * while the divergence stays on the record and starts failing the day it
   * is fixed.
   */
  finding?: string;
}

const base = (over: Partial<Combo> & { id: string }): Combo => ({
  size: 'medium', editable: false, ...over,
});

/**
 * 58 layer-1 combos over the documented axes. The DOM matrix crosses the
 * same axes for structure; here each combo's assertions are the geometry,
 * computed style and occlusion of what that structure lays out.
 */
function closedCross(): Combo[] {
  // size (3) x editable (2) x description shape (5) = 30.
  const shapes = [
    { name: 'bare' },
    { name: 'labelled', label: 'Fruit' },
    { name: 'helper', label: 'Fruit', helperText: 'Pick one' },
    { name: 'error', label: 'Fruit', errorText: 'Required' },
    { name: 'both', label: 'Fruit', helperText: 'Pick one', errorText: 'Required' },
  ];
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const editable of [false, true]) {
      for (const shape of shapes) {
        combos.push(base({
          id: `closed/${size}/${editable ? 'editable' : 'button'}/${shape.name}`,
          size, editable, ...shape,
        }));
      }
    }
  }
  return combos;
}

function stateCross(): Combo[] {
  // The documented state flags x mode = 10. `invalid` carries the
  // documented error pairing; the barred flags must refuse to open.
  const flags: Array<[string, Partial<Combo>]> = [
    ['disabled', { disabled: true, tryOpen: true }],
    ['readonly', { readonly: true, tryOpen: true }],
    ['loading', { loading: true, tryOpen: true }],
    ['invalid', { invalid: true, errorText: 'Pick a valid fruit' }],
    ['required', { required: true }],
  ];
  const combos: Combo[] = [];
  for (const [flag, over] of flags) {
    for (const editable of [false, true]) {
      combos.push(base({
        id: `state/${flag}/${editable ? 'editable' : 'button'}`,
        editable, label: 'Fruit', value: 'apple', ...over,
      }));
    }
  }
  return combos;
}

function clearableCross(): Combo[] {
  // clearable (2) x valued (2) = 4: the clear button exists exactly when
  // "clearable" meets a selection, and never otherwise.
  const combos: Combo[] = [];
  for (const clearable of [false, true]) {
    for (const valued of [false, true]) {
      combos.push(base({
        id: `clearable/${clearable ? 'clearable' : 'plain'}/${valued ? 'valued' : 'empty'}`,
        clearable, value: valued ? 'apple' : undefined, label: 'Fruit',
      }));
    }
  }
  return combos;
}

function openCross(): Combo[] {
  // size (3) x searchable (2) via the documented openDropdown(), plus the
  // editable mode's own documented open path (focus-to-open), plain and
  // with a committed selection = 8 open combos.
  const combos: Combo[] = [];
  for (const size of SIZES) {
    for (const searchable of [false, true]) {
      combos.push(base({
        id: `open/${size}/${searchable ? 'searchable' : 'plain'}`,
        size, searchable, label: 'Fruit', open: true,
      }));
    }
  }
  combos.push(base({
    id: 'open/editable/plain', editable: true, label: 'Fruit', open: true,
  }));
  combos.push(base({
    id: 'open/editable/valued', editable: true, label: 'Fruit', value: 'apple', open: true,
  }));
  return combos;
}

function tagCross(): Combo[] {
  // "comma-separated for multiple": a two-value selection paints tag chips
  // in the trigger, closed and with the listbox open = 2.
  return [
    base({
      id: 'tags/closed', multiple: true, clearable: true,
      value: 'apple,cherry', label: 'Fruit',
    }),
    base({
      id: 'tags/open', multiple: true, value: 'apple,cherry',
      label: 'Fruit', open: true,
    }),
  ];
}

function listCross(): Combo[] {
  return [
    base({
      id: 'list/many/default-200px', optionSet: 'many',
      label: 'Fruit', open: true,
    }),
    base({
      id: 'list/many/max-height=80px',
      optionSet: 'many', maxHeight: '80px', label: 'Fruit', open: true,
    }),
    // A short list must not paint a scroll region it does not need.
    base({ id: 'list/fruits/natural-height', label: 'Fruit', open: true }),
    // An empty option list paints its empty state inside the list box.
    base({ id: 'list/empty', optionSet: 'empty', label: 'Fruit', open: true }),
  ];
}

function longValueCross(): Combo[] {
  // A label wider than the value area: the visible ink clips at the wrapper's
  // edge, and the right-end affordances must still stay clear of it. The
  // clear-visible padding is uniform across sizes, but the icon block's
  // shortfall of the size paddings is not (small is worst), so the size axis
  // is crossed here, not left to medium alone.
  const combos: Combo[] = [];
  for (const size of SIZES) {
    combos.push(base({ id: `long-value/${size}`, size, value: 'apple', label: 'Fruit', optionSet: 'longlabels' }));
    combos.push(base({ id: `long-value/${size}/clearable`, size, clearable: true, value: 'apple', label: 'Fruit', optionSet: 'longlabels' }));
  }
  return combos;
}

const ALL_COMBOS = [
  ...closedCross(),
  ...stateCross(),
  ...clearableCross(),
  ...openCross(),
  ...tagCross(),
  ...listCross(),
  ...longValueCross(),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** Mount, then take the combo's documented path to its open/closed state. */
async function mount(combo: Combo): Promise<void> {
  await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
  if (combo.editable && combo.open) {
    const open = await page.evaluate(() => (window as any).matrix.focusInput());
    if (!open) throw new Error(`editable combo ${combo.id} did not open on focus`);
    return;
  }
  if (combo.open) {
    const open = await page.evaluate(() => (window as any).matrix.openListbox());
    if (!open) throw new Error(`combo ${combo.id} did not open`);
    return;
  }
  if (combo.tryOpen) {
    const open = await page.evaluate(() => (window as any).matrix.openListbox());
    if (open) throw new Error(`barred combo ${combo.id} opened anyway`);
  }
}

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partIs = (el: Element, name: string) =>
      (el.getAttribute('part') ?? '').split(' ').includes(name);
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node => partIs(node, name)) as HTMLElement | undefined;
    const withBox = (el: HTMLElement | undefined) =>
      (el && rect(el).width > 0 && rect(el).height > 0) ? el : undefined;

    // ── the control surface: exactly one, per the mode ──────────────────────
    const trigger = withBox(partNamed('trigger'));
    const input = withBox(partNamed('input'));
    const control = combo.editable ? input : trigger;
    if (!control) {
      say(combo.editable ? 'editable mode paints no input box' : 'no trigger box painted');
      return problems;
    }
    if (combo.editable && trigger) say('editable mode painted a button trigger too');
    if (!combo.editable && input) say('a text input painted outside editable mode');
    const c = rect(control);

    // The documented minimum height, resolved as the browser computes it.
    if (combo.size === 'medium') {
      const minH = parseFloat(matrix.token('--snice-select-min-height', 'minHeight'));
      if (c.height < minH - 1) {
        say(`the medium control is ${round(c.height)}px tall, under the documented --snice-select-min-height ${minH}px`);
      }
    }

    // "Shows invalid state styling" — and danger is the theme's one error
    // semantic, the same derivation every invalid control in this tier uses.
    if (combo.invalid) {
      const danger = matrix.token('--snice-color-danger');
      const border = getComputedStyle(control).borderTopColor;
      if (border !== danger) {
        say(`an invalid select's border is "${border}", expected the danger token "${danger}"`);
      }
    }

    // ── the label: visible when authored, above the control, never on it ───
    const labelPart = partNamed('label');
    if (combo.label) {
      if (!labelPart || !withBox(labelPart)) say('an authored label paints no box');
      else {
        const l = rect(labelPart);
        const hostBox = rect(host);
        if (l.bottom > c.top + EPS) say('the label is not above the control');
        if (l.left < hostBox.left - EPS || l.right > hostBox.right + EPS) say('the label escapes the host');
      }
    } else if (withBox(labelPart)) {
      say('a label box is painted with no label authored');
    }

    // ── exactly one description, below the control; errorText wins ──────────
    const errorPart = partNamed('error-text');
    const helperPart = partNamed('helper-text');
    const description = combo.errorText ? errorPart : helperPart;
    if (combo.errorText && withBox(helperPart)) {
      say('helper text is painted alongside error text — errorText wins');
    }
    if (description && withBox(description)) {
      const d = rect(description);
      if (d.top < c.bottom - EPS) say('the description is not below the control');
    } else if (combo.errorText || combo.helperText) {
      say('an authored description paints no box');
    }
    if (!combo.errorText && !combo.helperText
      && (withBox(errorPart) || withBox(helperPart))) {
      say('a description is painted with neither text authored');
    }

    // ── the trigger's right-end affordances (button mode) ───────────────────
    if (!combo.editable) {
      // `part="value"` is the flex:1 wrapper that stretches the whole trigger
      // track (by design, so the ellipsis has room); the affordances must not
      // overlap the value's CONTENT — the single label, the tag row, or the
      // placeholder — which is what "overlaps the value" has always meant.
      // Measure the ink, not the row containers: `.select-value--single` and
      // `--multiple` are full-width block-level flex boxes that stretch under
      // the absolute icons by construction, so their boxes can never satisfy
      // this check. A clipped long value's visible ink ends at the wrapper's
      // clip edge, so clamp to it.
      const valueWrapper = partNamed('value');
      const singleRow = sr.querySelector('.select-value--single');
      const chips = sr.querySelectorAll('.select-tag');
      const valueInk = (
        (singleRow ? singleRow.querySelector('span:last-child') : null)
        || (chips.length ? chips[chips.length - 1] : null)
        || sr.querySelector('.select-placeholder')
      ) as HTMLElement | null;
      const rawBox = valueInk
        ? rect(valueInk)
        : rect(partNamed('value')!);
      // DOMRect properties are getter-only — copy to a plain object before
      // the clamp below can write to it.
      const valueBox = {
        left: rawBox.left, top: rawBox.top, right: rawBox.right,
        bottom: rawBox.bottom, width: rawBox.width, height: rawBox.height,
      };
      if (valueWrapper) {
        valueBox.right = Math.min(valueBox.right, rect(valueWrapper).right);
      }
      const arrow = sr.querySelector('.select-arrow') as HTMLElement | null;
      if (combo.loading) {
        const spinner = withBox(partNamed('spinner'));
        if (!spinner) say('loading paints no spinner');
        else if (rect(spinner).left < valueBox.right - EPS) say('the spinner is not right of the value');
      } else if (!arrow || !withBox(arrow)) {
        say('the trigger paints no chevron');
      } else {
        const a = rect(arrow);
        if (a.left < valueBox.right - EPS) say('the chevron is not right of the value');
        if (a.right > c.right + EPS || a.top < c.top - EPS || a.bottom > c.bottom + EPS) {
          say('the chevron escapes the trigger');
        }
      }

      // The clear button exists exactly when clearable meets a selection.
      const clear = sr.querySelector('.select-clear') as HTMLElement | null;
      const wantClear = combo.clearable === true && !!combo.value
        && !combo.disabled && !combo.readonly && !combo.loading;
      if (wantClear && !(clear && withBox(clear))) {
        say('clearable + a selection paints no clear button');
      }
      if (!wantClear && clear && withBox(clear)) {
        say('a clear button is painted where it does not belong');
      }
      if (wantClear && clear) {
        const b = rect(clear);
        if (b.left < valueBox.right - EPS) say('the clear button overlaps the value');
        if (b.right > c.right + EPS) say('the clear button escapes the trigger');
        const hit = (sr as any).elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (hit !== clear && !clear.contains(hit)) {
          say(`the clear button is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    } else {
      // Editable mode's own documented arrow part.
      const arrow = withBox(partNamed('arrow'));
      if (!arrow) say('editable mode paints no arrow');
      else if (rect(arrow).left < c.right - 40) say('the editable arrow is not at the input\'s right end');
    }

    // ── multiple tags: chips inside the value area, never overlapping ───────
    if (combo.multiple && combo.value) {
      const tags = [...sr.querySelectorAll('.select-tag')] as HTMLElement[];
      const chips = tags.map(tag => rect(tag));
      if (chips.length < 2) {
        say(`a two-value selection paints ${chips.length} tag chips`);
      }
      for (const [index, chipBox] of chips.entries()) {
        if (chipBox.width <= 0 || chipBox.height <= 0) {
          say(`tag ${index} renders at ${chipBox.width}x${chipBox.height}`);
        }
        if (chipBox.top < c.top - EPS || chipBox.bottom > c.bottom + EPS) {
          say(`tag ${index} escapes the trigger vertically`);
        }
        const remove = tags[index].querySelector('.select-tag-remove') as HTMLElement | null;
        if (!remove || !withBox(remove)) say(`tag ${index} paints no remove button`);
        else {
          const r = rect(remove);
          if (r.right > chipBox.right + EPS || r.left < chipBox.left - EPS) {
            say(`tag ${index}'s remove button escapes its chip`);
          }
        }
      }
      for (const [index] of chips.entries()) {
        if (index > 0 && chips[index].left < chips[index - 1].right - EPS
          && chips[index].top < chips[index - 1].bottom - EPS) {
          say(`tags ${index - 1} and ${index} overlap`);
        }
      }
    }

    // ── the anchored listbox ────────────────────────────────────────────────
    const dropdown = partNamed('dropdown');
    if (!dropdown) { say('no part="dropdown"'); return problems; }
    const ddCs = getComputedStyle(dropdown);

    if (combo.open) {
      if (ddCs.opacity !== '1') say(`the open listbox is at opacity ${ddCs.opacity}`);
      if (ddCs.pointerEvents !== 'auto') say(`the open listbox has pointer-events "${ddCs.pointerEvents}"`);
      const d = rect(dropdown);
      if (d.width <= 0 || d.height <= 0) {
        say(`the open listbox renders at ${d.width}x${d.height}`);
        return problems;
      }
      const gap = d.top - c.bottom;
      if (gap < -EPS || gap > 16) {
        say(`the listbox sits ${round(gap)}px below the control — not the anchored dropdown`);
      }
      const hostBox = rect(host);
      if (Math.abs(d.left - hostBox.left) > EPS + 0.5) {
        say(`the listbox's left edge (${round(d.left)}) is not flush with the select's (${round(hostBox.left)})`);
      }
      if (Math.abs(d.width - c.width) > 2) {
        say(`the listbox is ${round(d.width)}px wide, the control ${round(c.width)}px`);
      }

      // The search field belongs to searchable non-editable selects only.
      const search = partNamed('search');
      const wantSearch = combo.searchable === true && !combo.editable;
      if (wantSearch && !(search && withBox(search))) {
        say('a searchable select paints no search field');
      }
      if (!wantSearch && search && withBox(search)) {
        say('a search field is painted where none belongs');
      }
      const listEl = partNamed('options')!;
      const l = rect(listEl);
      if (wantSearch && search && withBox(search)) {
        if (rect(search).bottom > l.top + EPS) say('the search field is not above the options');
      }

      // The option rows: ascending, disjoint, contained, individually hit.
      const rows = [...sr.querySelectorAll('.select-option')] as HTMLElement[];
      const visible = rows.map(row => rect(row)).filter(box =>
        box.top >= l.top - EPS && box.bottom <= l.bottom + EPS
        && box.left >= l.left - EPS && box.right <= l.right + EPS);
      if (rows.length > 0 && visible.length === 0) {
        say('no option row is inside the visible list');
      }
      for (const [index] of visible.entries()) {
        if (index > 0 && visible[index].top < visible[index - 1].bottom - EPS) {
          say(`visible rows ${index - 1} and ${index} overlap`);
        }
        if (index > 0 && visible[index].top <= visible[index - 1].top) {
          say(`visible row ${index} does not descend after ${index - 1}`);
        }
        if (visible[index].height < 10) say(`row ${index} is only ${round(visible[index].height)}px tall`);
      }
      for (const [index] of visible.slice(0, 6).entries()) {
        const box = visible[index];
        const hit = (sr as any).elementFromPoint(
          box.left + Math.min(box.width / 2, 40), box.top + box.height / 2);
        if (!hit || (!partIs(hit, 'option') && !(hit.closest && hit.closest('.select-option')))) {
          say(`a pointer on visible row ${index} finds <${hit?.tagName.toLowerCase() ?? 'nothing'}>, not an option`);
        }
      }

      // The listbox is above the page.
      const overPage = document.elementFromPoint(
        d.left + d.width / 2, Math.min(d.top + d.height / 2, window.innerHeight - 5));
      if (overPage !== host && !host.contains(overPage as Node)) {
        say(`the open listbox is not on top — a pointer finds <${overPage?.tagName.toLowerCase() ?? 'nothing'}>`);
      }

      // The documented clamp.
      if (combo.maxHeight) {
        const limit = parseFloat(combo.maxHeight);
        if (d.height > limit + 1) {
          say(`the open listbox is ${round(d.height)}px tall, over its documented max-height of ${limit}px`);
        }
      }
      if (combo.optionSet === 'many' && !combo.maxHeight) {
        // The documented default clamp is 200px.
        if (l.height > 201) {
          say(`thirty options paint a ${round(l.height)}px list, over the documented 200px default`);
        }
        if (listEl.scrollHeight <= listEl.clientHeight + 1) {
          say('thirty options do not scroll inside the clamped list');
        }
      }
      if (combo.optionSet === 'empty') {
        const empty = sr.querySelector('.select-no-options') as HTMLElement | null;
        if (!empty || !withBox(empty)) say('an empty option list paints no empty state');
        else {
          const e = rect(empty);
          if (e.top < l.top - EPS || e.bottom > l.bottom + EPS) {
            say('the empty state escapes the options list');
          }
        }
      }
      if (combo.optionSet !== 'many' && combo.optionSet !== 'empty' && !combo.maxHeight) {
        if (d.height >= 200) {
          say(`three options paint a ${round(d.height)}px listbox — a scroll region nothing needs`);
        }
      }
    } else {
      // CLOSED: no panel an eye or a pointer can reach. The probe sits well
      // below the control so it clears a legitimately-rendered description,
      // and inside the band the listbox would occupy were it open.
      if (ddCs.opacity !== '0') {
        say(`a closed select's listbox is at opacity ${ddCs.opacity}`);
      }
      const below = document.elementFromPoint(c.left + c.width / 2, c.bottom + 40);
      if (below === host || host.contains(below as Node)) {
        say('a closed select answers a hit-test below its trigger');
      }
    }

    // ── the control itself is reachable ─────────────────────────────────────
    const onControl = document.elementFromPoint(
      c.left + Math.min(c.width / 2, 30), c.top + c.height / 2);
    if (onControl !== host && !host.contains(onControl as Node)) {
      say(`the control is occluded by <${onControl?.tagName.toLowerCase() ?? 'nothing'}>`);
    }

    return problems;
  }, combo as any);
}

test.describe('select visual matrix: layer 1', () => {
  for (const combo of ALL_COMBOS) {
    const declare = combo.finding ? test.fail : test;
    declare(combo.id, async () => {
      await mount(combo);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * The size axis is an ORDERING claim, and no single combo can make it.
 * Measured once across the three documented sizes, in both modes — the
 * button trigger and the editable input each carry the size classes.
 */
test.describe('select visual matrix: the size axis is an ordering', () => {
  test('small < medium < large in control height, in both modes', async () => {
    for (const editable of [false, true]) {
      const measured: Record<string, number> = {};
      for (const size of SIZES) {
        await mount(base({ id: `axis/${size}`, size, editable, label: 'Fruit' }));
        measured[size] = await page.evaluate((editableMode) => {
          const sr = document.getElementById('subject')!.shadowRoot!;
          const control = editableMode
            ? sr.querySelector('[part~="input"]') as HTMLElement
            : sr.querySelector('[part~="trigger"]') as HTMLElement;
          return control.getBoundingClientRect().height;
        }, editable);
      }
      const mode = editable ? 'editable' : 'button';
      expect(measured.small, `${mode} small < medium`).toBeLessThan(measured.medium);
      expect(measured.medium, `${mode} medium < large`).toBeLessThan(measured.large);
    }
  });
});

/**
 * The one interaction whose VISUAL half is ours: selecting an option closes
 * the single-select's listbox (a closed select must go back to answering
 * nothing below its trigger) and paints the chosen label in the trigger.
 */
test.describe('select visual matrix: selection closes the anchored listbox', () => {
  test('clicking an option closes the listbox and paints the choice', async () => {
    await mount(base({ id: 'interaction/select', label: 'Fruit', open: true }));
    const picked = await page.evaluate(() => (window as any).matrix.clickOption('banana'));
    expect(picked.clicked, 'no option to click').toBe(true);
    expect(picked.value, 'the choice did not commit').toBe('banana');
    expect(picked.valueText, 'the trigger does not show the chosen label').toBe('Banana');
    expect(picked.open, 'a single-select listbox stayed open after choosing').toBe(false);
    const problems = await page.evaluate(() => {
      const host = document.getElementById('subject') as HTMLElement;
      const trigger = host.shadowRoot!.querySelector('[part~="trigger"]') as HTMLElement;
      const t = trigger.getBoundingClientRect();
      const below = document.elementFromPoint(t.left + t.width / 2, t.bottom + 40);
      return below === host || host.contains(below as Node)
        ? ['a just-closed select still answers a hit-test below its trigger']
        : [];
    });
    expect(problems).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 measured the model the browser built; these
// exist because "the dropdown has a background-color" and "the open panel
// visibly covers the page" are different claims, and only pixels can tell
// them apart.

test.describe('select visual matrix: marquee pixels', () => {
  test('the open listbox visibly covers the stage it floats over', async () => {
    await mount(base({ id: 'marquee/open', label: 'Fruit', open: true }));
    const [onPanel, onStage] = await capture(
      page, '#stage', 'select-open-panel',
      `() => {
        const host = document.getElementById('subject');
        const sr = host.shadowRoot;
        const dropdown = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('dropdown'));
        const d = dropdown.getBoundingClientRect();
        const h = host.getBoundingClientRect();
        const y = d.y + d.height / 2;
        return [
          { x: d.x + 3, y },
          { x: h.x + h.width + 60, y },
        ];
      }`,
    );
    expect(sameColor(onPanel, onStage),
      `the panel and the bare stage both painted ${onPanel.join(',')}`).toBe(false);
  });

  test('a closed select paints a uniform nothing below its trigger', async () => {
    await mount(base({ id: 'marquee/closed', label: 'Fruit' }));
    const pixels = await capture(
      page, '#stage', 'select-closed',
      `() => {
        const host = document.getElementById('subject');
        const sr = host.shadowRoot;
        const trigger = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('trigger'));
        const t = trigger.getBoundingClientRect();
        return [16, 60, 104].flatMap(dy => [10, 90, 170].map(dx => ({
          x: t.x + dx, y: t.bottom + dy,
        })));
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size,
      `nine probes below a CLOSED select painted ${distinct.size} different colours`
        + ` (${[...distinct].join(' | ')}) — a panel is showing`).toBe(1);
  });

  test('the placeholder is readable on the trigger', async () => {
    await mount(base({ id: 'marquee/placeholder', label: 'Fruit' }));
    const pixels = await capture(
      page, '#subject', 'select-placeholder',
      `(host) => {
        const sr = host.shadowRoot;
        const trigger = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(' ').includes('trigger'));
        const value = sr.querySelector('.select-placeholder');
        const t = trigger.getBoundingClientRect();
        const v = value.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: v.x + (v.width * i) / 14, y: v.y + v.height / 2 });
        }
        points.push({ x: t.x + 4, y: t.y + t.height / 2 });
        return points;
      }`,
    );
    const chip = pixels[pixels.length - 1];
    const glyphs = pixels.slice(0, -1);
    expect(glyphs.some(p => !sameColor(p, chip)),
      `every probed placeholder pixel equals the trigger ${chip.join(',')}`).toBe(true);
    const best = Math.max(...glyphs.map(p => contrast(p, chip)));
    expect(best, `best placeholder-vs-trigger contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(2.5);
  });
});
