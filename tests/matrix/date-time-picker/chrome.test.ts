/**
 * Matrix slice DATE-TIME-PICKER / CHROME — the parts around the value.
 *
 * Dimensions: variant (2) x description (4: none / helper / error / both) x
 * label (2) = 16 combos, with `loading`, `clearable` and `invalid` rotated
 * across them; plus the clear-affordance gate crossed against the four states
 * that block interaction (6 more).
 *
 * Documented contract:
 *   · CSS parts: base, label, input, toggle, panel, calendar, time, clear,
 *     spinner, helper-text, error-text.
 *   · "Exactly one helper/error node is connected with `aria-describedby`;
 *     error replaces helper, uses `role="alert"`, and visual `invalid` mirrors
 *     to `aria-invalid` without replacing native validity APIs."
 *   · `clearable`, `loading`, `disabled`, `readonly` — the properties that
 *     decide whether an affordance is offered at all.
 *
 * "Exactly one" is the sharp clause: a control that pointed `aria-describedby`
 * at two ids, or at an id no node carries, would announce its own help twice or
 * not at all. The oracle resolves every id against the shadow tree, so a
 * dangling reference is a failure rather than a pass.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, beforeEach, afterEach } from 'vitest';
import {
  VARIANTS,
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  chromeProblems, expectClean, wait, SETTLE,
  type ChromeSpec,
} from './date-time-picker-support';

/** The four documented description states. */
const DESCRIPTIONS = [
  { name: 'none', helperText: '', errorText: '' },
  { name: 'helper', helperText: 'Local time, please', errorText: '' },
  { name: 'error', helperText: '', errorText: 'That slot is gone' },
  { name: 'both', helperText: 'Local time, please', errorText: 'That slot is gone' },
];

function attrsFor(spec: ChromeSpec): Record<string, any> {
  const attrs: Record<string, any> = { variant: spec.variant };
  if (spec.label) attrs.label = spec.label;
  if (spec.helperText) attrs['helper-text'] = spec.helperText;
  if (spec.errorText) attrs['error-text'] = spec.errorText;
  if (spec.loading) attrs.loading = true;
  if (spec.clearable) attrs.clearable = true;
  if (spec.disabled) attrs.disabled = true;
  if (spec.readonly) attrs.readonly = true;
  if (spec.invalid) attrs.invalid = true;
  return attrs;
}

describe('date-time-picker matrix: chrome', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  let rotation = 0;
  for (const variant of VARIANTS) {
    for (const description of DESCRIPTIONS) {
      for (const label of ['', 'Appointment']) {
        // Rotating the three axes this file does not enumerate keeps the
        // product at 16 while still crossing them against every description
        // state — the interesting interaction is error text next to a spinner,
        // and clearable next to a value.
        const loading = rotation % 2 === 0;
        const clearable = rotation % 3 !== 0;
        const invalid = rotation % 4 === 0;
        rotation++;

        const spec: ChromeSpec = {
          variant, label,
          helperText: description.helperText,
          errorText: description.errorText,
          loading, clearable,
          disabled: false, readonly: false, invalid,
          hasText: true,
        };
        const id = `${variant}/${description.name}/${label ? 'labelled' : 'unlabelled'}`
          + `${loading ? '/loading' : ''}${clearable ? '/clearable' : ''}${invalid ? '/invalid' : ''}`;

        it(`${id}: renders the documented chrome`, async () => {
          const el = await mountPicker({
            attrs: attrsFor(spec),
            liveValue: '2026-03-10T14:05',
          });
          expectClean(chromeProblems(el, spec), id);
        });
      }
    }
  }

  // ── The clear affordance's gate ───────────────────────────────────────────
  // `clearable` offers a clear button, but only when there is something to
  // clear and only when interaction is allowed at all.
  const GATES: Array<{ name: string; spec: Partial<ChromeSpec> }> = [
    { name: 'not-clearable', spec: { clearable: false, hasText: true } },
    { name: 'clearable-empty', spec: { clearable: true, hasText: false } },
    { name: 'clearable-with-value', spec: { clearable: true, hasText: true } },
    { name: 'clearable-disabled', spec: { clearable: true, hasText: true, disabled: true } },
    { name: 'clearable-readonly', spec: { clearable: true, hasText: true, readonly: true } },
    { name: 'clearable-loading', spec: { clearable: true, hasText: true, loading: true } },
  ];

  for (const gate of GATES) {
    const spec: ChromeSpec = {
      variant: 'dropdown', label: '', helperText: '', errorText: '',
      loading: false, clearable: false, disabled: false, readonly: false,
      invalid: false, hasText: false,
      ...gate.spec,
    };

    it(`clear gate ${gate.name}: the affordance is offered exactly when it can act`, async () => {
      const el = await mountPicker({
        attrs: attrsFor(spec),
        liveValue: spec.hasText ? '2026-03-10T14:05' : '',
      });
      await wait(SETTLE);
      expectClean(chromeProblems(el, spec), `clear gate ${gate.name}`);
    });
  }
});
