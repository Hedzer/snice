const validityKeys = [
  'badInput',
  'customError',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valueMissing'
] as const;

/** Copy the actionable flags from a native ValidityState. */
export function validityFlagsFrom(
  validity: ValidityState,
  overrides: ValidityStateFlags = {}
): ValidityStateFlags {
  const flags: ValidityStateFlags = {};
  for (const key of validityKeys) flags[key] = validity[key];
  return Object.assign(flags, overrides);
}

export function hasValidityError(flags: ValidityStateFlags): boolean {
  return validityKeys.some(key => Boolean(flags[key]));
}

type ElementInternalsFormValue = File | string | FormData | null;

/** Keep ElementInternals form-value updates safe in partial DOM implementations. */
export function applyElementInternalsFormValue(
  internals: ElementInternals | undefined,
  value: ElementInternalsFormValue,
  state?: ElementInternalsFormValue
): void {
  // jsdom and other DOM test implementations can expose the ARIA portion of
  // ElementInternals without the form-associated custom-element methods.
  if (!internals || typeof internals.setFormValue !== 'function') return;
  if (state === undefined) internals.setFormValue(value);
  else internals.setFormValue(value, state);
}

/** Keep ElementInternals validity updates identical across form controls. */
export function applyElementInternalsValidity(
  internals: ElementInternals | undefined,
  flags: ValidityStateFlags,
  message: string,
  anchor?: HTMLElement
): void {
  // Some DOM test implementations expose a partial ElementInternals object.
  // Keep the component's native-input/proxy fallback usable in that case.
  if (!internals || typeof internals.setValidity !== 'function') return;
  if (!hasValidityError(flags)) {
    internals.setValidity({});
  } else if (anchor) {
    internals.setValidity(flags, message, anchor);
  } else {
    internals.setValidity(flags, message);
  }
}

/**
 * ElementInternals.form is authoritative. The fallback keeps DOM test
 * implementations and older partial implementations useful without changing
 * browser ownership semantics.
 */
export function findFormOwner(
  host: HTMLElement,
  internals?: ElementInternals
): HTMLFormElement | null {
  if (internals?.form) return internals.form;
  const explicitOwner = host.getAttribute('form');
  if (explicitOwner !== null) {
    const root = host.getRootNode();
    if (!('querySelectorAll' in root)) return null;
    return Array.from((root as ParentNode).querySelectorAll('form[id]'))
      .find((candidate): candidate is HTMLFormElement =>
        candidate instanceof HTMLFormElement && candidate.id === explicitOwner
      ) ?? null;
  }
  return host.closest('form');
}

/**
 * Normalize a finite numeric value to the same min-based step lattice used by
 * native range controls. The nearest in-range step wins; midpoint ties move in
 * the positive direction. Invalid/reversed ranges collapse to their minimum.
 */
export function normalizeSteppedValue(
  value: number,
  min: number,
  max: number,
  step: number
): number {
  const lower = Number.isFinite(min) ? min : -Infinity;
  const configuredUpper = Number.isFinite(max) ? max : Infinity;
  const upper = configuredUpper < lower ? lower : configuredUpper;
  const effectiveStep = Number.isFinite(step) && step > 0 ? step : 1;
  const base = Number.isFinite(lower) ? lower : 0;
  const clamped = Math.max(lower, Math.min(upper, value));

  let normalized = base + Math.round((clamped - base) / effectiveStep) * effectiveStep;
  if (normalized > upper) {
    normalized = base + Math.floor((upper - base) / effectiveStep) * effectiveStep;
  }
  if (normalized < lower) {
    normalized = base + Math.ceil((lower - base) / effectiveStep) * effectiveStep;
  }

  normalized = Math.max(lower, Math.min(upper, normalized));
  // Extremely large finite inputs can overflow intermediate step arithmetic.
  // Preserve the finite clamped value instead of exposing Infinity/NaN.
  if (!Number.isFinite(normalized)) return clamped;
  return Number(normalized.toPrecision(15));
}
