/**
 * Matrix slice DATE-PICKER / CHROME — parts, presentation, naming, description.
 *
 * Dimensions: variant (3) x size (3) x state (5) = 45 combos, plus the
 * helper/error cross (4) and the naming cases.
 *
 * Documented contract:
 *   · CSS parts: `input`, `calendar-toggle`, `clear`, `spinner`, `calendar`,
 *     `helper-text`, `error-text`.
 *   · `variant: 'outlined' | 'filled' | 'underlined'`,
 *     `size: 'small' | 'medium' | 'large'` — the visual dimensions, present
 *     here only to prove they are crossed without breaking anything structural.
 *   · `clearable` shows the clear affordance, and only when there is something
 *     to clear and the control can be edited.
 *   · `loading` renders the spinner.
 *   · "`helperText` or `errorText` is referenced exactly once with
 *     `aria-describedby`. Error replaces helper, has `role=\"alert\"`, and
 *     `invalid` mirrors to `aria-invalid` without establishing native
 *     invalidity."
 *   · "External labels override the naming fallback: `label`, then `Date`."
 *   · "`labels` is live and returned in document order."
 *   · "The popup is separately named `<accessible name> calendar`."
 *
 * it.fails policy: no finding is pinned in this file. (MATRIX-date-picker-2,
 * the unnamed calendar popup, was fixed and its rows run unpinned as the
 * regression guard.)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SIZES, VARIANTS, PARTS,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  readFacts, part, Problems, expectClean, wait, SETTLE,
} from './date-picker-support';

const STATES = [
  { name: 'plain', attrs: {}, spinner: false },
  { name: 'clearable-with-value', attrs: { clearable: true }, value: '2026-03-15', clear: true, spinner: false },
  { name: 'clearable-empty', attrs: { clearable: true }, clear: false, spinner: false },
  { name: 'loading', attrs: { loading: true }, spinner: true },
  { name: 'disabled-clearable', attrs: { clearable: true, disabled: true }, value: '2026-03-15', clear: false, spinner: false },
] as const;

describe('date-picker matrix: chrome', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const state of STATES) {
        const id = `${variant}/${size}/${state.name}`;

        it(`${id}: the documented chrome survives every presentation cross`, async () => {
          const el = await mountPicker({
            attrs: { variant, size, ...state.attrs },
            liveValue: (state as any).value ?? '',
          });
          const facts = readFacts(el);
          const problems = new Problems();

          // The four parts that exist unconditionally.
          for (const name of ['input', 'calendar-toggle', 'clear', 'calendar'] as const) {
            problems.ok(facts.presentParts.includes(name), `part="${name}" is missing`);
          }
          // "`spinner`" is conditional on `loading`.
          problems.eq('part="spinner" is rendered', facts.presentParts.includes('spinner'),
            state.spinner);
          // Neither description part is asked for here.
          problems.eq('no helper-text without helperText',
            facts.presentParts.includes('helper-text'), false);
          problems.eq('no error-text without errorText',
            facts.presentParts.includes('error-text'), false);
          // Nothing outside the documented list may claim a part name.
          const declared = new Set<string>(PARTS as readonly string[]);
          const strays = [...el.shadowRoot!.querySelectorAll('[part]')]
            .flatMap(node => (node.getAttribute('part') ?? '').split(/\s+/))
            .filter(name => name && !declared.has(name));
          problems.eq('undocumented part names', [...new Set(strays)], []);

          // The presentation dimensions reach the field the docs describe them
          // on, and do not leak into each other.
          const input = facts.presentParts.includes('input') ? part(el, 'input')! : null;
          problems.ok(!!input?.classList.contains(`input--${variant}`),
            `the field does not carry the "${variant}" variant`);
          problems.ok(!!input?.classList.contains(`input--${size}`),
            `the field does not carry the "${size}" size`);
          for (const other of VARIANTS.filter(v => v !== variant)) {
            problems.ok(!input?.classList.contains(`input--${other}`),
              `the field also carries the "${other}" variant`);
          }
          for (const other of SIZES.filter(s => s !== size)) {
            problems.ok(!input?.classList.contains(`input--${other}`),
              `the field also carries the "${other}" size`);
          }

          // The clear affordance: shown only when `clearable`, there is text,
          // and the control can actually be edited.
          problems.eq('the clear affordance is shown', facts.clearVisible,
            (state as any).clear ?? false);

          // The calendar is closed until asked for.
          problems.eq('the calendar starts closed', facts.calendarOpen, false);

          expectClean(problems, id);
        });
      }
    }
  }

  // ── Description: helper, error, and the aria-describedby singleton ────────
  //
  // "`helperText` or `errorText` is referenced exactly once with
  // `aria-describedby`. Error replaces helper, has `role="alert"`."
  const DESCRIPTIONS = [
    { name: 'neither', helper: '', error: '', shows: 'none' },
    { name: 'helper', helper: 'Pick your arrival day', error: '', shows: 'helper' },
    { name: 'error', helper: '', error: 'That day is taken', shows: 'error' },
    { name: 'both', helper: 'Pick your arrival day', error: 'That day is taken', shows: 'error' },
  ] as const;

  for (const description of DESCRIPTIONS) {
    it(`description/${description.name}: error replaces helper, described exactly once`,
      async () => {
        const attrs: Record<string, any> = {};
        if (description.helper) attrs['helper-text'] = description.helper;
        if (description.error) attrs['error-text'] = description.error;
        const el = await mountPicker({ attrs });
        const facts = readFacts(el);
        const problems = new Problems();

        problems.eq('helper-text is rendered',
          facts.presentParts.includes('helper-text'), description.shows === 'helper');
        problems.eq('error-text is rendered',
          facts.presentParts.includes('error-text'), description.shows === 'error');

        if (description.shows === 'none') {
          problems.eq('nothing is described', facts.ariaDescribedby, null);
        } else {
          problems.ok(!!facts.ariaDescribedby, 'the field describes nothing');
          // "referenced exactly once" — one id, and it resolves.
          problems.eq('described-by id count',
            (facts.ariaDescribedby ?? '').split(/\s+/).filter(Boolean).length, 1);
          problems.eq('the described id resolves', facts.describedNodeIds.length, 1);
        }

        if (description.shows === 'error') {
          problems.eq('the error announces itself', facts.errorRole, 'alert');
          problems.eq('the error text', facts.errorText, description.error);
        }
        if (description.shows === 'helper') {
          problems.eq('the helper does not announce itself', facts.helperRole, null);
          problems.eq('the helper text', facts.helperText, description.helper);
        }

        // "...without establishing native invalidity."
        problems.eq('errorText did not make the control invalid', facts.flags, []);

        expectClean(problems, `description/${description.name}`);
      });
  }

  it('errorText replaces the helper live, and giving it up brings the helper back',
    async () => {
      const el = await mountPicker({ attrs: { 'helper-text': 'Pick a day' } });
      expect(readFacts(el).helperText).toBe('Pick a day');
      el.errorText = 'That day is taken';
      await wait(SETTLE);
      let facts = readFacts(el);
      expect(facts.presentParts.includes('helper-text'),
        'the helper survived alongside the error').toBe(false);
      expect(facts.errorText).toBe('That day is taken');
      expect(facts.describedNodeIds.length, 'the description is not singular').toBe(1);
      el.errorText = '';
      await wait(SETTLE);
      facts = readFacts(el);
      expect(facts.helperText, 'the helper did not come back').toBe('Pick a day');
      expect(facts.describedNodeIds.length).toBe(1);
    });

  // ── Naming ────────────────────────────────────────────────────────────────
  //
  // "External labels override the naming fallback: `label`, then `Date`."
  it('the accessible name falls back from an external label to `label` to "Date"',
    async () => {
      const bare = await mountPicker({});
      expect(readFacts(bare).inputName, 'the last-resort name').toBe('Date');

      const labelled = await mountPicker({ attrs: { label: 'Arrival' } });
      expect(readFacts(labelled).inputName, 'the `label` property names the field')
        .toBe('Arrival');

      const external = await mountPicker({
        attrs: { id: 'arrival-picker', label: 'Arrival' },
        wrapper: (picker) => {
          const holder = document.createElement('div');
          const label = document.createElement('label');
          label.setAttribute('for', 'arrival-picker');
          label.textContent = 'When are you arriving?';
          holder.append(label, picker);
          return holder;
        },
      });
      await wait(SETTLE);
      expect(readFacts(external).inputName,
        'an external <label for> did not override the `label` property')
        .toBe('When are you arriving?');
    });

  it('labels is live and in document order', async () => {
    // "`labels` is live and returned in document order; label text, `for`, host
    // `id`, insertion/removal, DOM moves, and reconnect update the name."
    let holder!: HTMLElement;
    const el = await mountPicker({
      attrs: { id: 'arrival-picker' },
      wrapper: (picker) => {
        holder = document.createElement('div');
        const first = document.createElement('label');
        first.setAttribute('for', 'arrival-picker');
        first.textContent = 'First';
        holder.append(first, picker);
        return holder;
      },
    });
    await wait(SETTLE);
    expect([...(el.labels ?? [])].map(node => (node as HTMLElement).textContent))
      .toEqual(['First']);

    const second = document.createElement('label');
    second.setAttribute('for', 'arrival-picker');
    second.textContent = 'Second';
    holder.appendChild(second);
    await wait(SETTLE);
    expect([...(el.labels ?? [])].map(node => (node as HTMLElement).textContent),
      '`labels` is not live, or not in document order').toEqual(['First', 'Second']);

    second.remove();
    await wait(SETTLE);
    expect([...(el.labels ?? [])].map(node => (node as HTMLElement).textContent))
      .toEqual(['First']);
  });

  // ── MATRIX-date-picker-2 (fixed) ──────────────────────────────────────────
  //
  // "The popup is separately named `<accessible name> calendar`." The calendar
  // used to render with no `aria-label` and no `role`, so a screen reader
  // entering the popup announced nothing at all. Fixed the way the sibling
  // `snice-date-time-picker` names its panel; these run unpinned as the
  // regression guard.
  it(
    'MATRIX-date-picker-2 (fixed): the calendar popup is named "<accessible name> calendar"',
    async () => {
      const el = await mountPicker({ attrs: { label: 'Arrival', open: true } });
      await wait(SETTLE);
      expect(readFacts(el).calendarName,
        'the calendar popup carries no accessible name').toBe('Arrival calendar');
    });

  it(
    'MATRIX-date-picker-2 (fixed): an unlabelled picker names its popup "Date calendar"',
    async () => {
      const el = await mountPicker({ attrs: { open: true } });
      await wait(SETTLE);
      expect(readFacts(el).calendarName).toBe('Date calendar');
    });

  it('the field itself is named, described and flagged for assistive tech', async () => {
    // The half that IS in place, asserted so the finding above stays narrow.
    const el = await mountPicker({
      attrs: { label: 'Arrival', 'error-text': 'Taken', invalid: true, required: true },
    });
    const facts = readFacts(el);
    expect(facts.inputName).toBe('Arrival');
    expect(facts.ariaInvalid).toBe('true');
    expect(facts.inputRequired, '`required` did not mirror onto the field').toBe(true);
    expect(facts.describedNodeIds.length).toBe(1);
  });
});
