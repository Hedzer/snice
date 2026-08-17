/**
 * Matrix slice DATE-RANGE-PICKER / CHROME — parts, presentation, naming,
 * description.
 *
 * Dimensions: variant (3) x size (3) x state (5) = 45 combos, plus the
 * helper/error cross (4), the reflection pass, and the naming cases.
 *
 * Documented contract:
 *   · CSS parts: `input`, `calendar-toggle`, `clear`, `spinner`, `calendar`,
 *     `helper-text`, `error-text`.
 *   · `variant: 'outlined' | 'filled' | 'underlined'`,
 *     `size: 'small' | 'medium' | 'large'` — presentation dimensions, crossed
 *     here to prove they change nothing structural.
 *   · `clearable` shows the clear affordance, and only when there is something
 *     to clear and the control can be edited.
 *   · `loading` renders the spinner.
 *   · "Required, effective disabledness, loading, and visual `aria-invalid`
 *     state are mirrored to the visible input."
 *   · "Helper/error content is referenced exactly once with
 *     `aria-describedby`; error replaces helper and has `role="alert"`."
 *   · "The popup is a separately named `<accessible name> calendar` group."
 *   · "External labels take precedence; fallback is `label`, then
 *     `Date range`."
 *   · Reflection (docs/ai/properties.md): authored attributes always present;
 *     property assignments reflect unless equal to the documented default.
 *     `size` is the axis the calendar stylesheet selects with
 *     `:host([size=…])`, so a `size` assignment that never reached the
 *     attribute styles nothing.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product, expectShape } from '../matrix-utils';
import {
  VARIANTS, SIZES, PARTS, DEFAULTS,
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  inputOf, toggleOf, expectedShape, readShape, expectedAxes, readAxes,
  type RangeCombo, type DateRangePickerSize, type DateRangePickerVariant,
} from './date-range-picker-support';

const VALUE = { start: '2026-03-01', end: '2026-03-15' };

interface StateSpec {
  name: string;
  flags: Partial<RangeCombo>;
  /** Attr-channel extras applied at mount. */
  attrs?: Record<string, string | boolean>;
  /** Live values applied after mount. */
  live?: { start: string; end: string };
}

const STATES: readonly StateSpec[] = [
  { name: 'plain', flags: {} },
  {
    name: 'clearable-with-range', flags: { clearable: true },
    attrs: VALUE,
  },
  {
    name: 'clearable-empty', flags: { clearable: true },
  },
  {
    name: 'loading', flags: { loading: true },
    attrs: VALUE,
  },
  {
    name: 'readonly-clearable-with-range', flags: { clearable: true, readonly: true },
    attrs: VALUE,
  },
];

const base = (over: Partial<RangeCombo>): RangeCombo => ({
  size: DEFAULTS.size,
  variant: DEFAULTS.variant,
  disabled: false,
  readonly: false,
  loading: false,
  required: false,
  invalid: false,
  clearable: false,
  hasValue: false,
  helperText: '',
  errorText: '',
  channel: 'attr',
  ...over,
});

/** The attribute payload a combo authoring implies, boolean-false dropped. */
function attrsFor(combo: RangeCombo, extra: Record<string, string | boolean> = {}):
    Record<string, string | boolean> {
  const attrs: Record<string, string | boolean> = { ...extra };
  if (combo.channel === 'attr') {
    attrs.size = combo.size;
    attrs.variant = combo.variant;
    for (const key of ['disabled', 'readonly', 'loading', 'required', 'invalid', 'clearable'] as const) {
      if (combo[key]) attrs[key] = true;
    }
  }
  return attrs;
}

describe('date-range-picker matrix: chrome', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  const combos = product({
    variant: VARIANTS,
    size: SIZES,
    state: STATES,
  }).map(c => ({
    ...c,
    combo: base({
      variant: c.variant as DateRangePickerVariant,
      size: c.size as DateRangePickerSize,
      hasValue: !!(c.state.attrs?.start),
      ...c.state.flags,
    }),
  }));

  for (const { variant, size, state, combo } of combos) {
    const id = `${variant}/${size}/${state.name}`;

    it(`${id}: the documented chrome survives every presentation cross`, async () => {
      const el = await mountRange({
        attrs: attrsFor(combo, state.attrs),
        live: state.live,
      });

      expectShape(readShape(el), expectedShape(combo), id);

      // Nothing outside the documented list may claim a part name.
      const declared = new Set<string>(PARTS as readonly string[]);
      const strays = [...el.shadowRoot!.querySelectorAll('[part]')]
        .flatMap(node => (node.getAttribute('part') ?? '').split(/\s+/))
        .filter(name => name && !declared.has(name));
      expect([...new Set(strays)], `${id} undocumented part names`).toEqual([]);

      // The presentation dimensions reach the field as their own classes and
      // do not leak into each other.
      const input = inputOf(el)!;
      expect(input.classList.contains(`input--${variant}`), `${id} variant class`).toBe(true);
      expect(input.classList.contains(`input--${size}`), `${id} size class`).toBe(true);
      for (const other of VARIANTS) {
        if (other !== variant) {
          expect(input.classList.contains(`input--${other}`), `${id} leaked variant ${other}`)
            .toBe(false);
        }
      }
      for (const other of SIZES) {
        if (other !== size) {
          expect(input.classList.contains(`input--${other}`), `${id} leaked size ${other}`)
            .toBe(false);
        }
      }
    });

    it(`${id}: the authored placeholder reaches the visible input`, async () => {
      const el = await mountRange({
        attrs: { ...attrsFor(combo, state.attrs), placeholder: 'Choose travel dates' },
      });
      expect(inputOf(el)!.placeholder, `${id} placeholder`).toBe('Choose travel dates');
    });
  }

  // ── Description: helper, error, and the aria-describedby singleton ────────
  const DESCRIPTIONS = [
    { name: 'neither', helper: '', error: '', shows: 'none' },
    { name: 'helper', helper: 'Both dates are required', error: '', shows: 'helper' },
    { name: 'error', helper: '', error: 'Range unavailable', shows: 'error' },
    { name: 'both', helper: 'Both dates are required', error: 'Range unavailable', shows: 'error' },
  ] as const;

  for (const description of DESCRIPTIONS) {
    it(`description/${description.name}: error replaces helper, described exactly once`,
      async () => {
        const attrs: Record<string, string | boolean> = {};
        if (description.helper) attrs['helper-text'] = description.helper;
        if (description.error) attrs['error-text'] = description.error;
        const el = await mountRange({ attrs });
        const facts = readShape(el);

        expect(facts.helperPart, `description/${description.name} helper rendered`)
          .toBe(description.shows === 'helper');
        expect(facts.errorPart, `description/${description.name} error rendered`)
          .toBe(description.shows === 'error');
        expect(facts.described, 'nothing is described')
          .toBe(description.shows !== 'none');
        expect(facts.describedResolves, 'described id does not resolve exactly once')
          .toBe(description.shows !== 'none');
        expect(facts.errorRole, 'the error does not announce itself')
          .toBe(description.shows === 'error' ? 'alert' : null);

        if (description.shows === 'helper') {
          expect(el.shadowRoot!.querySelector('.helper-text')!.textContent?.trim())
            .toBe(description.helper);
        }
        if (description.shows === 'error') {
          expect(el.shadowRoot!.querySelector('.error-text')!.textContent?.trim())
            .toBe(description.error);
          // "...without establishing constraint invalidity."
          expect((el as any).validity.valid, 'errorText established invalidity').toBe(true);
        }
      });
  }

  it('errorText replaces the helper live, and clearing it brings the helper back', async () => {
    const el = await mountRange({ attrs: { 'helper-text': 'Choose both endpoints.' } });
    expect(readShape(el).helperPart).toBe(true);

    el.errorText = 'The selected range is unavailable.';
    await new Promise(r => setTimeout(r, 30));
    expect(readShape(el).helperPart, 'the helper survived alongside the error').toBe(false);
    expect(readShape(el).errorPart).toBe(true);
    expect(readShape(el).describedResolves).toBe(true);

    el.errorText = '';
    await new Promise(r => setTimeout(r, 30));
    expect(readShape(el).helperPart, 'the helper did not come back').toBe(true);
    expect(readShape(el).describedResolves).toBe(true);
  });

  // ── Naming: "External labels take precedence; fallback is `label`, then
  //    `Date range`. Activation focuses without opening." ────────────────────
  it('the accessible name falls back from external labels to `label` to "Date range"', async () => {
    const bare = await mountRange({});
    expect(inputOf(bare)!.getAttribute('aria-label'), 'the last-resort name')
      .toBe('Date range');

    const labelled = await mountRange({ attrs: { label: 'Booking' } });
    expect(inputOf(labelled)!.getAttribute('aria-label'), 'the `label` property names the field')
      .toBe('Booking');

    // "The popup is a separately named `<accessible name> calendar` group."
    expect(
      labelled.shadowRoot!.querySelector('.calendar')!.getAttribute('aria-label'),
      'the popup is not named "<accessible name> calendar"',
    ).toBe('Booking calendar');

    // External labels take precedence, and several form one name. The labels
    // are inserted AFTER mount because "insertion/removal ... stay
    // synchronized" is itself the documented contract.
    const external = await mountRange({ attrs: { id: 'external-range', label: 'Booking' } });
    const first = document.createElement('label');
    first.htmlFor = 'external-range';
    first.textContent = 'Travel';
    const second = document.createElement('label');
    second.htmlFor = 'external-range';
    second.textContent = 'window';
    document.body.append(first, second);
    await new Promise(r => setTimeout(r, 30));

    expect(inputOf(external)!.getAttribute('aria-label'), 'an external label did not win')
      .toBe('Travel window');
    expect(
      external.shadowRoot!.querySelector('.calendar')!.getAttribute('aria-label'),
    ).toBe('Travel window calendar');
    first.remove();
    second.remove();
  });

  it('label activation focuses the field without opening the calendar', async () => {
    // The doc's activation clause: a LABEL click must focus, not open.
    const el = await mountRange({ attrs: { id: 'activation-range', label: 'Booking' } });
    const label = document.createElement('label');
    label.htmlFor = 'activation-range';
    label.textContent = 'Booking';
    document.body.appendChild(label);
    await new Promise(r => setTimeout(r, 30));

    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(el.showCalendar, 'label activation opened the popup').toBe(false);
    expect(el.shadowRoot!.activeElement === inputOf(el), 'label activation did not focus')
      .toBe(true);
    label.remove();
  });

  it('a required label carries the required marker, and the input mirrors required', async () => {
    const el = await mountRange({ attrs: { label: 'Booking', required: true } });
    const label = el.shadowRoot!.querySelector('.label')!;
    expect(label.textContent?.trim()).toBe('Booking');
    expect(label.classList.contains('label--required')).toBe(true);
    expect(inputOf(el)!.required, '`required` did not mirror onto the field').toBe(true);
  });

  // ── Reflection: the attribute channel the stylesheet keys on ──────────────
  const REFLECT_AXES = product({
    size: SIZES,
    variant: VARIANTS,
    channel: ['prop'] as const,
  });

  for (const { size, variant, channel } of REFLECT_AXES) {
    const combo = base({ size, variant, channel });

    it(`reflection/prop/${size}/${variant}: assignments reach the attributes`, async () => {
      // The PROPERTY channel is the interesting one: `:host([size=…])` and
      // every other `:host([...])` rule cannot see a JS assignment that never
      // reflects. Defaults are exempt (docs/ai/properties.md).
      const el = await mountRange({
        props: {
          size, variant,
          disabled: combo.disabled, readonly: combo.readonly, loading: combo.loading,
          required: combo.required, invalid: combo.invalid, clearable: combo.clearable,
        },
      });
      expectShape(readAxes(el, combo), expectedAxes(combo), `reflection/${size}/${variant}`);
    });
  }

  it('reflection/attr: authored attributes are always present', async () => {
    const axes = {
      size: 'large' as const,
      variant: 'filled' as const,
      disabled: true,
      readonly: true,
      loading: true,
      required: true,
      invalid: true,
      clearable: true,
      defaultStart: '2026-03-01',
      defaultEnd: '2026-03-15',
      channel: 'attr' as const,
    };
    const el = await mountRange({
      attrs: {
        size: 'large', variant: 'filled', disabled: true, readonly: true,
        loading: true, required: true, invalid: true, clearable: true,
        start: '2026-03-01', end: '2026-03-15',
      },
    });
    expectShape(readAxes(el, axes), expectedAxes(axes), 'reflection/attr');
  });

  it('a live start/end assignment never writes the content attributes', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-01', end: '2026-03-15' },
      live: { start: '2026-04-10', end: '2026-04-20' },
    });
    expect(el.getAttribute('start')).toBe('2026-03-01');
    expect(el.getAttribute('end')).toBe('2026-03-15');
    expect(el.defaultStart).toBe('2026-03-01');
    expect(el.defaultEnd).toBe('2026-03-15');
  });

  it('the calendar is hidden until opened, and the toggle opens it', async () => {
    const el = await mountRange({});
    expect(readShape(el).calendarOpen, 'the calendar starts open').toBe(false);
    toggleOf(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(r => setTimeout(r, 30));
    expect(readShape(el).calendarOpen, 'the toggle did not open the calendar').toBe(true);
  });
});
