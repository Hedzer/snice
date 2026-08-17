/**
 * MATRIX slice — snice-key-value: constraint validation.
 *
 * Dimensions (docs/ai/components/key-value.md, "Validation"):
 *   content shape (6) x required (2) x barrier (4) = 48 combos
 *
 * The clauses, each of which owns one content shape:
 *
 *   · "`valueMissing`: `required` and no meaningful rows."
 *   · "`badInput`: malformed serialized state or meaningful row with
 *     blank/whitespace key."
 *   · "Empty value is valid when key exists."
 *   · "Value-only/description-only row is invalid."
 *   · "`customError`: non-empty `setCustomValidity()`."
 *
 * crossed with the four barriers, because "Disabled/fieldset-disabled: …
 * validation-barred" and "Readonly/view: … validation barred" mean a barred
 * control reports NO flags at all — not "the same flags, ignored".
 *
 * Every assertion is the DOCUMENTED expectation. One divergence is pinned
 * rather than softened:
 *
 *   MATRIX-key-value-2 — `setCustomValidity()` updates `validity`,
 *     `validationMessage` and the inputs' `aria-invalid`, but schedules no
 *     render, so the documented `part="error"` message never appears for a
 *     control that was otherwise valid and stays STALE for one that was not.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product, unmountAll } from '../matrix-utils';
import {
  installInternalsMock, restoreInternalsMock, internalsFor, activeFlags,
} from '../internals-mock';
import {
  mountKeyValue, tick, expectedFlags, errorPart, keyInputs, isMalformedRow,
  canonical, type KeyValueItem,
} from './key-value-support';
import '../../../packages/components/src/key-value/snice-key-value';

/**
 * The content shapes. `serialized` is what the editor is given; `items` is what
 * it then holds, and `parseError` marks the payload the schema rejects.
 */
const SHAPES: Array<{
  id: string; serialized: string; items: KeyValueItem[]; parseError?: boolean;
}> = [
  { id: 'empty', serialized: '[]', items: [] },
  {
    id: 'keyed',
    serialized: '[{"key":"A","value":"1","description":""}]',
    items: [{ key: 'A', value: '1', description: '' }],
  },
  {
    // "Empty value is valid when key exists."
    id: 'key-only',
    serialized: '[{"key":"FLAG","value":"","description":""}]',
    items: [{ key: 'FLAG', value: '', description: '' }],
  },
  {
    // "Value-only … row is invalid."
    id: 'value-only',
    serialized: '[{"key":"","value":"orphan","description":""}]',
    items: [{ key: '', value: 'orphan', description: '' }],
  },
  {
    // "meaningful row with blank/WHITESPACE key".
    id: 'whitespace-key',
    serialized: '[{"key":"   ","value":"x","description":""}]',
    items: [{ key: '   ', value: 'x', description: '' }],
  },
  {
    id: 'malformed',
    serialized: '[{"key":1,"value":"x"}]',
    items: [],
    parseError: true,
  },
];

const BARRIERS = ['none', 'disabled', 'readonly', 'view'] as const;
type Barrier = typeof BARRIERS[number];

function vectorFor(barrier: Barrier) {
  return {
    disabled: barrier === 'disabled',
    readonly: barrier === 'readonly',
    mode: (barrier === 'view' ? 'view' : 'edit') as 'view' | 'edit',
  };
}

const COMBOS = product({ shape: SHAPES, required: [false, true], barrier: BARRIERS });

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

describe(`key-value matrix: validity (${COMBOS.length} combos)`, () => {
  for (const combo of COMBOS) {
    const id = `${combo.shape.id}/${combo.required ? 'required' : 'optional'}/${combo.barrier}`;

    it(id, async () => {
      const el = await mountKeyValue({
        value: combo.shape.serialized,
        required: combo.required,
        ...vectorFor(combo.barrier),
      });
      await tick(el);

      const expected = expectedFlags({
        items: combo.shape.items.map(canonical),
        required: combo.required,
        parseError: !!combo.shape.parseError,
        customMessage: '',
        barred: combo.barrier !== 'none',
      });
      expect(activeFlags(el), `${id} flags`).toEqual(expected);
      expect(el.checkValidity(), `${id} checkValidity`).toBe(expected.length === 0);
      // "Readonly/view: … validation barred" — and a disabled control likewise.
      expect(el.willValidate, `${id} willValidate`).toBe(combo.barrier === 'none');

      // "message uses `part="error"` and `role="alert"`" — and there is no
      // message when there is nothing wrong.
      const error = errorPart(el);
      if (expected.length === 0) {
        expect(error, `${id} rendered an error for a valid editor`).toBeNull();
      } else {
        expect(error, `${id} rendered no error`).not.toBeNull();
        expect(error!.getAttribute('role')).toBe('alert');
        expect(error!.textContent?.trim(), `${id} error text`).not.toBe('');
      }
    });
  }
});

/**
 * "Invalid key gets `aria-invalid`" — the EXACT row, not the whole editor. This
 * is the claim that a multi-row editor tells the user WHICH row to fix.
 */
describe('key-value matrix: the invalid row is the marked row', () => {
  it('marks only the row whose key is blank', async () => {
    const el = await mountKeyValue({
      value: '[{"key":"A","value":"1","description":""},'
        + '{"key":"","value":"orphan","description":""},'
        + '{"key":"C","value":"3","description":""}]',
    });
    await tick(el);

    const marked = keyInputs(el).map(input => input.getAttribute('aria-invalid'));
    // Three data rows plus the trailing editing row, which is empty and
    // therefore not "meaningful" and therefore not invalid.
    expect(marked).toEqual(['false', 'true', 'false', 'false']);
    expect(isMalformedRow({ key: '', value: 'orphan', description: '' })).toBe(true);
  });

  it('names the offending row in the message', async () => {
    const el = await mountKeyValue({
      value: '[{"key":"A","value":"1","description":""},'
        + '{"key":"  ","value":"orphan","description":""}]',
    });
    await tick(el);
    expect(errorPart(el)?.textContent).toContain('Row 2');
  });

  it('marks nothing at all while barred', async () => {
    const el = await mountKeyValue({
      value: '[{"key":"","value":"orphan","description":""}]',
      readonly: true,
    });
    await tick(el);
    // One data row plus the documented trailing editing row; neither marked.
    expect(keyInputs(el).map(input => input.getAttribute('aria-invalid')))
      .toEqual(['false', 'false']);
    expect(errorPart(el)).toBeNull();
  });
});

describe('key-value matrix: custom validity', () => {
  it('setCustomValidity raises customError, its message, and aria-invalid', async () => {
    const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
    await tick(el);
    expect(activeFlags(el)).toEqual([]);

    el.setCustomValidity('That key is reserved');
    await tick(el);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(internalsFor(el).validationMessage).toBe('That key is reserved');
    expect(el.checkValidity()).toBe(false);
    // "Invalid key gets `aria-invalid`" — set imperatively, so it lands.
    expect(keyInputs(el)[0].getAttribute('aria-invalid')).toBe('true');

    el.setCustomValidity('');
    await tick(el);
    expect(activeFlags(el)).toEqual([]);
    expect(keyInputs(el)[0].getAttribute('aria-invalid')).toBe('false');
  });

  it('both flags are raised when a custom rule meets a documented one', async () => {
    const el = await mountKeyValue({ value: '[]', required: true });
    await tick(el);
    expect(activeFlags(el)).toEqual(['valueMissing']);

    el.setCustomValidity('That key is reserved');
    await tick(el);
    expect(activeFlags(el)).toEqual(['customError', 'valueMissing']);
    expect(internalsFor(el).validationMessage).toBe('That key is reserved');
  });

  /**
   * FINDING MATRIX-key-value-2.
   *
   * "`customError`: non-empty `setCustomValidity()`" and "message uses
   * `part="error"` and `role="alert"`" — so an application rule must reach the
   * user, not only `validity`. `setCustomValidity()` updates the internals and
   * the inputs' `aria-invalid` imperatively but schedules no render, so the
   * `part="error"` block never appears for a control that was otherwise valid,
   * and keeps the PREVIOUS message for one that was not. The assertion is not
   * weakened: the documented message must be the one the user can read.
   */
  it.fails(
    'MATRIX-key-value-2: setCustomValidity renders its message in part="error"',
    async () => {
      const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
      await tick(el);
      el.setCustomValidity('That key is reserved');
      await tick(el);
      expect(errorPart(el), 'no part="error" was rendered for the custom rule').not.toBeNull();
      expect(errorPart(el)?.textContent).toContain('That key is reserved');
    },
  );

  it.fails(
    'MATRIX-key-value-2: a custom message replaces the message already shown',
    async () => {
      const el = await mountKeyValue({ value: '[]', required: true });
      await tick(el);
      expect(errorPart(el)?.textContent).toContain('Add at least one');

      el.setCustomValidity('That key is reserved');
      await tick(el);
      expect(errorPart(el)?.textContent,
        'the rendered message is still the one the custom rule replaced')
        .toContain('That key is reserved');
    },
  );

  for (const barrier of ['disabled', 'readonly', 'view'] as const) {
    it(`a custom error is barred by ${barrier} and returns afterwards`, async () => {
      const el = await mountKeyValue({ value: '[{"key":"A","value":"1","description":""}]' });
      el.setCustomValidity('That key is reserved');
      await tick(el);
      expect(activeFlags(el)).toEqual(['customError']);

      if (barrier === 'view') el.mode = 'view'; else el[barrier] = true;
      await tick(el);
      expect(activeFlags(el), `${barrier} did not bar validation`).toEqual([]);
      expect(el.willValidate).toBe(false);

      if (barrier === 'view') el.mode = 'edit'; else el[barrier] = false;
      await tick(el);
      expect(activeFlags(el), `the custom error was lost by ${barrier}`).toEqual(['customError']);
    });
  }

  it('fieldset disabledness bars validation without touching authored disabled', async () => {
    const el = await mountKeyValue({ value: '[]', required: true });
    await tick(el);
    expect(activeFlags(el)).toEqual(['valueMissing']);

    el.formDisabledCallback(true);
    await tick(el);
    expect(activeFlags(el)).toEqual([]);
    expect(el.disabled, "the fieldset wrote the host's disabled property").toBe(false);

    el.formDisabledCallback(false);
    await tick(el);
    expect(activeFlags(el)).toEqual(['valueMissing']);
  });
});
