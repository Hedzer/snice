/**
 * snice-switch — checkedness lifecycle, activation events, and validation.
 *
 * Environment note: happy-dom implements neither `ElementInternals` nor the
 * native `input` event a real checkbox fires on `.click()`. The component's
 * documented contracts are still fully reachable:
 *   · validity falls back to the shadow checkbox, which is the same native
 *     object the docs describe;
 *   · `formResetCallback` is a public callback, so reset is driven directly;
 *   · customer activation is simulated with the exact event pair a browser
 *     produces — `input` (bubbles, composed) then `change` (bubbles, NOT
 *     composed, which is why the host must re-dispatch it).
 * FormData contribution is the one documented clause this tier cannot observe;
 * it belongs to the browser tier.
 */
import { describe, it, afterEach } from 'vitest';
import {
  product, comboId, mount, settle, captureEvents, expectShape, expectNoProblems,
} from '../matrix-utils';
import { input } from './switch-support';

afterEach(() => { document.body.innerHTML = ''; });

// ── Dirtiness ───────────────────────────────────────────────────────────────
//
// docs: "Any checked assignment/toggle, including the same value, dirties live
// checkedness. Pristine state follows default changes."

type Mutation = 'none' | 'assign-same' | 'assign-different' | 'toggle';

const DIRTYING: Mutation[] = ['assign-same', 'assign-different', 'toggle'];

describe('snice-switch dirtiness matrix', () => {
  const combos = product({
    defaultChecked: [false, true],
    mutation: ['none', 'assign-same', 'assign-different', 'toggle'] as Mutation[],
    laterDefault: [false, true],
  });

  for (const combo of combos) {
    it(comboId(combo), async () => {
      const el: any = await mount('snice-switch', combo.defaultChecked ? { checked: true } : {});

      let expectedChecked = combo.defaultChecked;
      switch (combo.mutation) {
        case 'assign-same':
          el.checked = combo.defaultChecked;
          break;
        case 'assign-different':
          el.checked = !combo.defaultChecked;
          expectedChecked = !combo.defaultChecked;
          break;
        case 'toggle':
          el.toggle();
          expectedChecked = !combo.defaultChecked;
          break;
        case 'none':
          break;
      }
      await settle(el, 5);

      // The default is then changed underneath. A pristine control follows it;
      // a dirtied one keeps its live checkedness.
      el.defaultChecked = combo.laterDefault;
      await settle(el, 5);

      const dirty = DIRTYING.includes(combo.mutation);
      expectShape(
        { checked: el.checked, defaultChecked: el.defaultChecked },
        { checked: dirty ? expectedChecked : combo.laterDefault, defaultChecked: combo.laterDefault },
        comboId(combo),
      );
    });
  }
});

// ── Reset ───────────────────────────────────────────────────────────────────
//
// docs: "Reset silently restores `defaultChecked`" — silently meaning no
// `change`/`switch-change` is dispatched, exactly as a native reset does not.

describe('snice-switch reset matrix', () => {
  const combos = product({
    defaultChecked: [false, true],
    mutation: ['assign-different', 'toggle', 'none'] as Mutation[],
  });

  for (const combo of combos) {
    it(comboId(combo), async () => {
      const el: any = await mount('snice-switch', combo.defaultChecked ? { checked: true } : {});
      if (combo.mutation === 'assign-different') el.checked = !combo.defaultChecked;
      if (combo.mutation === 'toggle') el.toggle();
      await settle(el, 5);

      const captured = captureEvents(el, ['input', 'change', 'switch-change']);
      el.formResetCallback();
      await settle(el, 5);
      captured.stop();

      expectShape(
        {
          checked: el.checked,
          events: captured.types(),
          // Reset clears dirtiness, so the control follows its default again.
          followsDefaultAfterReset: (() => {
            el.defaultChecked = !combo.defaultChecked;
            return el.checked;
          })(),
        },
        {
          checked: combo.defaultChecked,
          events: [],
          followsDefaultAfterReset: !combo.defaultChecked,
        },
        comboId(combo),
      );
    });
  }
});

// ── Activation events ───────────────────────────────────────────────────────
//
// docs: "`input` then `change` bubble and compose for customer activation" and
// "`switch-change` -> `{ checked, switch }`, after the standard events".

describe('snice-switch activation event matrix', () => {
  const combos = product({
    start: [false, true],
    disabled: [false, true],
    loading: [false, true],
  });

  for (const combo of combos) {
    it(comboId(combo), async () => {
      const attrs: Record<string, any> = {};
      if (combo.start) attrs.checked = true;
      if (combo.disabled) attrs.disabled = true;
      if (combo.loading) attrs.loading = true;
      const el: any = await mount('snice-switch', attrs);

      const control = input(el);
      const captured = captureEvents(el, ['input', 'change', 'switch-change']);
      const blocked = combo.disabled || combo.loading;

      // Exactly what a browser produces for a checkbox activation.
      if (!blocked) {
        control.checked = !control.checked;
        control.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        control.dispatchEvent(new Event('change', { bubbles: true, composed: false }));
      } else {
        // A blocked control cannot be activated at all: the shadow checkbox is
        // disabled, so a click never reaches it.
        el.click();
      }
      await settle(el, 5);
      captured.stop();

      const detail = captured.events.find(e => e.type === 'switch-change')?.detail;
      expectShape(
        {
          events: captured.types(),
          checked: el.checked,
          detailChecked: detail?.checked,
          // Identity, not the node — a DOM node cannot go through a structural
          // comparison. The contract is "`switch` is the host that changed".
          detailIsHost: detail ? detail.switch === el : undefined,
        },
        blocked
          ? { events: [], checked: combo.start, detailChecked: undefined, detailIsHost: undefined }
          : {
            events: ['input', 'change', 'switch-change'],
            checked: !combo.start,
            detailChecked: !combo.start,
            detailIsHost: true,
          },
        comboId(combo),
      );
    });
  }
});

// ── Validation ──────────────────────────────────────────────────────────────
//
// docs: "An unchecked enabled `required` switch reports `valueMissing`,
// invalidates its form, and blocks submission. Checked clears it immediately."
// "`setCustomValidity(message)` controls `customError`; pass `''` to clear it."
// "`invalid` is visual/ARIA presentation only."
// "`loading` blocks interaction and bars validation"; "Disabled controls are
// omitted and barred."

describe('snice-switch validation matrix', () => {
  const combos = product({
    required: [false, true],
    checked: [false, true],
    block: ['none', 'disabled', 'loading'] as const,
    custom: ['', 'boom'] as const,
    invalid: [false, true],
  });

  for (const combo of combos) {
    it(comboId(combo), async () => {
      const attrs: Record<string, any> = {};
      if (combo.required) attrs.required = true;
      if (combo.checked) attrs.checked = true;
      if (combo.block === 'disabled') attrs.disabled = true;
      if (combo.block === 'loading') attrs.loading = true;
      if (combo.invalid) attrs.invalid = true;
      const el: any = await mount('snice-switch', attrs);
      if (combo.custom) el.setCustomValidity(combo.custom);
      await settle(el, 5);

      const barred = combo.block !== 'none';
      const calculatedError = !barred && (
        (combo.required && !combo.checked) || combo.custom !== ''
      );

      const problems: string[] = [];
      const say = (m: string) => problems.push(m);

      // Barred controls do not participate: willValidate false, and
      // checkValidity() reports success without any error to satisfy.
      if (el.willValidate !== !barred) {
        say(`willValidate ${el.willValidate}, expected ${!barred}`);
      }
      if (el.checkValidity() !== !calculatedError) {
        say(`checkValidity ${el.checkValidity()}, expected ${!calculatedError}`);
      }
      if (!barred) {
        const wantValueMissing = combo.required && !combo.checked;
        if (el.validity.valueMissing !== wantValueMissing) {
          say(`valueMissing ${el.validity.valueMissing}, expected ${wantValueMissing}`);
        }
        if (el.validity.customError !== (combo.custom !== '')) {
          say(`customError ${el.validity.customError}, expected ${combo.custom !== ''}`);
        }
        if (combo.custom && el.validationMessage !== combo.custom) {
          say(`validationMessage ${JSON.stringify(el.validationMessage)}, expected ${JSON.stringify(combo.custom)}`);
        }
      }

      // `invalid` is presentation: it may only ever move `aria-invalid`.
      const ariaInvalid = input(el).getAttribute('aria-invalid');
      const wantAria = String(combo.invalid || calculatedError);
      if (ariaInvalid !== wantAria) say(`aria-invalid "${ariaInvalid}", expected "${wantAria}"`);
      if (combo.invalid && !combo.required && combo.custom === '' && !el.checkValidity()) {
        say('authored `invalid` made the control constraint-invalid');
      }

      // Clearing a custom error clears it immediately.
      if (combo.custom) {
        el.setCustomValidity('');
        await settle(el, 5);
        const stillCustom = !barred && el.validity.customError;
        if (stillCustom) say('customError survived setCustomValidity("")');
      }
      // Checking clears valueMissing immediately.
      if (!barred && combo.required && !combo.checked) {
        el.checked = true;
        await settle(el, 5);
        if (el.validity.valueMissing) say('valueMissing survived checking the switch');
      }

      expectNoProblems(problems, comboId(combo));
    });
  }
});
