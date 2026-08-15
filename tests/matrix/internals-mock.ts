/**
 * `ElementInternals` observation for the DOM matrix tier.
 *
 * happy-dom attaches internals but implements none of the form plumbing behind
 * them: `new FormData(form)` returns nothing for a form-associated custom
 * element, and `<fieldset disabled>` never triggers `formDisabledCallback`.
 * That is an ENVIRONMENT limit, not a component defect, so the matrix must not
 * assert through those paths — a failure there would say nothing about the
 * component and a pass would say even less.
 *
 * What the components actually promise is observable one level down: the
 * documented form contract ("checked + enabled + non-empty name contributes
 * [name, value]", "empty required selection reports valueMissing") is
 * implemented as calls to `setFormValue()` and `setValidity()`. This module
 * records those calls, which is the same substitution
 * `tests/components/checkbox.test.ts` makes — deliberately the same shape, so
 * the matrix and the unit suite agree on what "submitted" means.
 *
 * Fieldset disabledness is exercised by invoking `formDisabledCallback`
 * directly, exactly as the browser would; the FIRST-LEGEND exception and real
 * ancestor walking are the browser's own algorithm and belong to the visual
 * tier, where a real engine runs them.
 */
import { vi } from 'vitest';

const VALIDITY_FLAGS = [
  'badInput', 'customError', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow',
  'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch', 'valueMissing',
] as const;

export type ValidityFlag = typeof VALIDITY_FLAGS[number];
export type MockValidity = ValidityState & Record<string, boolean>;

export interface MockInternals {
  /** Last value handed to setFormValue — `null` means "not a successful control". */
  formValue: File | string | FormData | null;
  state: File | string | FormData | null;
  form: HTMLFormElement | null;
  validity: MockValidity;
  validationMessage: string;
  willValidate: boolean;
  labels: NodeList;
  setFormValue: ReturnType<typeof vi.fn>;
  setValidity: ReturnType<typeof vi.fn>;
  checkValidity: ReturnType<typeof vi.fn>;
  reportValidity: ReturnType<typeof vi.fn>;
}

function createValidity(flags: Partial<Record<ValidityFlag, boolean>> = {}): MockValidity {
  const validity = Object.fromEntries(
    VALIDITY_FLAGS.map(flag => [flag, Boolean(flags[flag])]),
  ) as MockValidity;
  validity.valid = VALIDITY_FLAGS.every(flag => !validity[flag]);
  return validity;
}

const internalsByElement = new WeakMap<HTMLElement, MockInternals>();
let originalAttachInternals: (() => ElementInternals) | undefined;

function createMockInternals(): MockInternals {
  const internals: MockInternals = {
    formValue: null,
    state: null,
    form: null,
    validity: createValidity(),
    validationMessage: '',
    willValidate: true,
    labels: document.querySelectorAll('label'),
    setFormValue: vi.fn(),
    setValidity: vi.fn(),
    checkValidity: vi.fn(),
    reportValidity: vi.fn(),
  };
  internals.setFormValue.mockImplementation((value, state = value) => {
    internals.formValue = value;
    internals.state = state;
  });
  internals.setValidity.mockImplementation((flags = {}, message = '') => {
    internals.validity = createValidity(flags);
    internals.validationMessage = internals.validity.valid ? '' : message;
  });
  internals.checkValidity.mockImplementation(() => !internals.willValidate || internals.validity.valid);
  internals.reportValidity.mockImplementation(() => !internals.willValidate || internals.validity.valid);
  return internals;
}

/** Install the recorder. Call from `beforeEach`. */
export function installInternalsMock(): void {
  if (originalAttachInternals === undefined) {
    originalAttachInternals = (HTMLElement.prototype as any).attachInternals;
  }
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      const internals = createMockInternals();
      internalsByElement.set(this, internals);
      return internals;
    },
  });
}

/** Restore the real implementation. Call from `afterEach`. */
export function restoreInternalsMock(): void {
  if (originalAttachInternals) {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
      configurable: true,
      value: originalAttachInternals,
    });
  } else {
    delete (HTMLElement.prototype as any).attachInternals;
  }
}

/** The recorder for one element. */
export function internalsFor(el: HTMLElement): MockInternals {
  const internals = internalsByElement.get(el);
  if (!internals) throw new Error('no mock internals — installInternalsMock() did not run first');
  return internals;
}

/**
 * The `[name, value]` entry this control would contribute to `FormData`, or
 * `null` when it is not a successful control. This is the matrix's stand-in for
 * `new FormData(form)`.
 */
export function submittedEntry(el: HTMLElement & { name?: string }): [string, string] | null {
  const value = internalsFor(el).formValue;
  if (value === null || typeof value !== 'string') return null;
  if (!el.name) return null;
  return [el.name, value];
}

/** The validity flags currently set, as a sorted list of flag names. */
export function activeFlags(el: HTMLElement): string[] {
  const { validity } = internalsFor(el);
  return VALIDITY_FLAGS.filter(flag => validity[flag]).sort();
}
