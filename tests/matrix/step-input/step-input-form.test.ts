/**
 * MATRIX slice — snice-step-input as a form-associated custom element.
 *
 * Dimensions (docs/ai/components/step-input.md, "Value and form lifecycle"):
 *   dirtying source (3) x default-follow (2) = 6, plus reset/reconnect (5),
 *   plus the submission cross name (2) x barrier (3) = 6, plus custom validity
 *   under each barrier (3), plus restore (3).
 *
 * ── How this slice observes the form contract ──────────────────────────────
 *
 * Through `tests/matrix/internals-mock.ts`, the shared recorder this tier
 * already uses for every other form-associated component. happy-dom attaches
 * `ElementInternals` but implements none of the plumbing behind it:
 * `new FormData(form)` returns nothing for a custom element, `form.elements`
 * never lists one, `form.reset()` never reaches `formResetCallback`, and
 * `<fieldset disabled>` never reaches `formDisabledCallback`. Those are
 * ENVIRONMENT limits, so asserting through them would grade happy-dom.
 *
 * What the component actually promises is one level down and fully observable:
 * "contributes one normalized numeric string to `FormData`" is implemented as a
 * `setFormValue()` call, and the reset/disable callbacks are invoked directly,
 * exactly as a browser invokes them. The real `FormData`, the real
 * `form.elements`, and the real fieldset ancestor walk are asserted in the
 * visual tier (tests/live/matrix/step-input), where a real engine runs them.
 *
 * ── The clauses graded here ────────────────────────────────────────────────
 *
 *   · "`value` is live normalized state; `defaultValue` reflects the `value`
 *     attribute."
 *   · "Pristine state follows default mutations. Input, increment/decrement,
 *     restore, or any live assignment dirties it."
 *   · "Reset silently restores the latest default under current min/max/step
 *     constraints."  Silently = no `value-change`; under current constraints =
 *     through the lattice, not around it.
 *   · "Repeated reset, reconnect, form moves, and fieldset disabledness do not
 *     rewrite authored state."
 *   · "A named host … contributes one normalized numeric string to `FormData`";
 *     "Disabled controls are omitted/barred. Readonly controls remain
 *     successful but are barred."
 *   · "Use `setCustomValidity()` … it drives `customError`, styling,
 *     `aria-invalid` … Custom errors survive temporary barred states."
 *   · "Browser restore accepts strings only; non-string state ignored
 *     atomically."
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, wait } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, submittedEntry, activeFlags,
} from '../internals-mock';
import { mountStepInput, tick, recordValueChange, inputPart } from './step-input-support';
import '../../../packages/components/src/step-input/snice-step-input';

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

/** Put a control inside a real form, the way a page author would. */
async function inForm(attrs: Record<string, string>): Promise<{ form: HTMLFormElement; el: any }> {
  const form = document.createElement('form');
  const spelled = Object.entries(attrs)
    .map(([name, value]) => (value === '' ? name : `${name}="${value}"`))
    .join(' ');
  form.innerHTML = `<snice-step-input ${spelled}></snice-step-input>`;
  document.body.appendChild(form);
  const el = form.querySelector('snice-step-input') as any;
  await el.ready;
  await tick(el);
  return { form, el };
}

describe('step-input matrix: the value attribute is the default, not the value', () => {
  it('`value="5"` authors defaultValue, and a pristine control shows it', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    expect(el.defaultValue).toBe(5);
    expect(el.value).toBe(5);
  });

  it('assigning `value` does not rewrite the authored default', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.value = 8;
    await tick(el);
    expect(el.value).toBe(8);
    expect(el.defaultValue, 'the authored default moved').toBe(5);
  });

  it('a pristine control follows a changing default', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.defaultValue = 7;
    await tick(el);
    expect(el.value, 'pristine state does not follow the default').toBe(7);
  });

  for (const source of ['assignment', 'increment', 'input'] as const) {
    it(`after ${source} the control is dirty and stops following the default`, async () => {
      const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10, step: 1 });
      switch (source) {
        case 'assignment': el.value = 3; break;
        case 'increment': el.increment(); break;
        case 'input': {
          const input = inputPart(el)!;
          input.value = '3';
          input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          break;
        }
      }
      await tick(el);
      const dirtied = el.value as number;

      el.defaultValue = 9;
      await tick(el);
      expect(el.value, `${source} did not dirty the control`).toBe(dirtied);
      expect(el.defaultValue).toBe(9);
    });
  }
});

describe('step-input matrix: reset restores the latest default, silently', () => {
  it('reset returns a dirty control to its default without an event', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.value = 9;
    await tick(el);
    const seen = recordValueChange(el);

    el.formResetCallback();
    await tick(el);
    expect(el.value).toBe(5);
    expect(seen, 'reset dispatched value-change').toEqual([]);
  });

  it('reset restores the LATEST default, not the originally authored one', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.value = 9;
    await tick(el);
    el.defaultValue = 2;
    await tick(el);
    expect(el.value, 'a dirty control followed the default').toBe(9);

    el.formResetCallback();
    await tick(el);
    expect(el.value).toBe(2);
  });

  it('reset restores under the CURRENT constraints, through the lattice', async () => {
    const el = await mountStepInput({ defaultValue: 7, min: 0, max: 10, step: 1 });
    el.value = 9;
    await tick(el);
    // The constraints move after the default was authored; the restore has to
    // land on the new lattice, not on the old number.
    el.step = 5;
    await tick(el);

    el.formResetCallback();
    await tick(el);
    expect(el.value, 'reset ignored the current step lattice').toBe(5);
  });

  it('repeated reset does not rewrite the authored state', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    for (let i = 0; i < 3; i++) {
      el.value = 9;
      await tick(el);
      el.formResetCallback();
      await tick(el);
      expect(el.value, `reset #${i + 1}`).toBe(5);
      expect(el.defaultValue, `default after reset #${i + 1}`).toBe(5);
    }
  });

  it('a reconnect does not rewrite the authored state', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.value = 8;
    await tick(el);
    const parent = el.parentElement!;
    el.remove();
    await wait(5);
    parent.appendChild(el);
    await tick(el);
    expect(el.value, 'a reconnect rewrote the live value').toBe(8);
    expect(el.defaultValue).toBe(5);
  });

  it('a form move does not rewrite the authored state', async () => {
    const { form, el } = await inForm({ name: 'qty', value: '5', min: '0', max: '10' });
    el.value = 8;
    await tick(el);
    const other = document.createElement('form');
    document.body.appendChild(other);
    other.appendChild(el);
    await tick(el);

    expect(el.value, 'a form move rewrote the live value').toBe(8);
    expect(el.form, 'the control did not follow its new owner').toBe(other);
    expect(form.contains(el)).toBe(false);
  });
});

describe('step-input matrix: form participation', () => {
  it('a named control contributes its normalized number', async () => {
    const el = await mountStepInput({ name: 'qty', defaultValue: 5, min: 0, max: 10 });
    expect(el.type).toBe('number');
    expect(submittedEntry(el)).toEqual(['qty', '5']);

    el.value = 8;
    await tick(el);
    expect(submittedEntry(el)).toEqual(['qty', '8']);
  });

  it('the submitted number is the NORMALIZED one, never the assigned one', async () => {
    const el = await mountStepInput({ name: 'qty', defaultValue: 0, min: 0, max: 10, step: 5 });
    el.value = 7;
    await tick(el);
    expect(el.value).toBe(5);
    expect(submittedEntry(el)).toEqual(['qty', '5']);
  });

  it('an unnamed control contributes nothing', async () => {
    const el = await mountStepInput({ defaultValue: 5 });
    expect(submittedEntry(el)).toBeNull();
  });

  it('a control inside a form finds its owner', async () => {
    const { form, el } = await inForm({ name: 'qty', value: '5' });
    expect(el.form).toBe(form);
  });

  it('an explicit form="id" associates across the tree', async () => {
    const form = document.createElement('form');
    form.id = 'outer';
    document.body.appendChild(form);
    const el = document.createElement('snice-step-input') as any;
    el.setAttribute('name', 'qty');
    el.setAttribute('value', '4');
    el.setAttribute('form', 'outer');
    document.body.appendChild(el);
    await el.ready;
    await tick(el);

    expect(el.form, 'form="id" did not associate').toBe(form);
    expect(submittedEntry(el)).toEqual(['qty', '4']);
  });

  for (const barrier of ['disabled', 'readonly'] as const) {
    it(`a ${barrier} control is barred from validation`, async () => {
      const el = await mountStepInput({ name: 'qty', defaultValue: 5, [barrier]: true });
      expect(el[barrier]).toBe(true);
      expect(el.willValidate, `a ${barrier} control still validates`).toBe(false);
    });
  }

  it('a readonly control remains successful', async () => {
    // "Readonly controls remain successful but are barred" — successful means
    // it still submits; barred means it is not validated.
    const el = await mountStepInput({ name: 'qty', defaultValue: 5, readonly: true });
    expect(submittedEntry(el), 'a readonly control stopped submitting').toEqual(['qty', '5']);
  });

  it('fieldset disabledness bars the control without rewriting its authored state', async () => {
    const el = await mountStepInput({ name: 'qty', defaultValue: 5, min: 0, max: 10 });
    el.value = 8;
    await tick(el);

    // Exactly what a browser does when the control's fieldset is disabled.
    el.formDisabledCallback(true);
    await tick(el);
    expect(el.value, 'a disabled fieldset rewrote the value').toBe(8);
    // The host's OWN `disabled` is untouched — the bar comes from the fieldset.
    expect(el.disabled, "the fieldset wrote the host's disabled property").toBe(false);
    expect(el.willValidate, 'a fieldset-disabled control still validates').toBe(false);

    el.formDisabledCallback(false);
    await tick(el);
    expect(el.value).toBe(8);
    expect(el.willValidate).toBe(true);
  });
});

describe('step-input matrix: custom validity', () => {
  it('setCustomValidity drives customError, the message, and aria-invalid', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    expect(activeFlags(el)).toEqual([]);
    expect(el.checkValidity()).toBe(true);

    el.setCustomValidity('Pick another quantity');
    await tick(el);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(internalsFor(el).validationMessage).toBe('Pick another quantity');
    expect(el.checkValidity()).toBe(false);
    expect(inputPart(el)?.getAttribute('aria-invalid')).toBe('true');

    el.setCustomValidity('');
    await tick(el);
    expect(activeFlags(el)).toEqual([]);
    expect(el.checkValidity()).toBe(true);
    expect(inputPart(el)?.getAttribute('aria-invalid')).toBe('false');
  });

  for (const barrier of ['disabled', 'readonly'] as const) {
    it(`a custom error survives a temporary ${barrier} state`, async () => {
      const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
      el.setCustomValidity('Pick another quantity');
      await tick(el);
      expect(activeFlags(el)).toEqual(['customError']);

      el[barrier] = true;
      await tick(el);
      expect(el.willValidate, `${barrier} still validates`).toBe(false);

      el[barrier] = false;
      await tick(el);
      // The application's own rule is still there afterwards.
      expect(activeFlags(el), `the custom error was lost by ${barrier}`).toEqual(['customError']);
      expect(internalsFor(el).validationMessage).toBe('Pick another quantity');
    });
  }

  it('a custom error survives a temporary fieldset bar', async () => {
    const el = await mountStepInput({ defaultValue: 5 });
    el.setCustomValidity('Pick another quantity');
    await tick(el);
    el.formDisabledCallback(true);
    await tick(el);
    el.formDisabledCallback(false);
    await tick(el);
    expect(activeFlags(el)).toEqual(['customError']);
  });
});

describe('step-input matrix: browser state restore', () => {
  it('a restored string becomes the live value and dirties the control', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10, step: 1 });
    el.formStateRestoreCallback('8');
    await tick(el);
    expect(el.value).toBe(8);

    // "restore … dirties it" — so a later default change no longer follows.
    el.defaultValue = 2;
    await tick(el);
    expect(el.value, 'restore did not dirty the control').toBe(8);
  });

  it('a restored string is normalized like every other value', async () => {
    const el = await mountStepInput({ defaultValue: 0, min: 0, max: 10, step: 5 });
    el.formStateRestoreCallback('7');
    await tick(el);
    expect(el.value).toBe(5);
  });

  for (const state of [null, 'not-a-number'] as const) {
    it(`a restore of ${JSON.stringify(state)} is ignored atomically`, async () => {
      const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
      el.formStateRestoreCallback(state as any);
      await tick(el);
      expect(el.value, 'an unusable restore changed the value').toBe(5);
    });
  }

  it('a non-string restore is ignored atomically', async () => {
    const el = await mountStepInput({ defaultValue: 5, min: 0, max: 10 });
    el.formStateRestoreCallback(new FormData());
    await tick(el);
    expect(el.value, 'a non-string restore changed the value').toBe(5);
  });
});
