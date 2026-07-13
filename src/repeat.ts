export const REPEAT_RESULT = Symbol.for('snice:repeat-result');

export interface RepeatOptions<T, K> {
  key: (item: T, index: number) => K;
  render: (item: T, index: number) => unknown;
  empty?: unknown | (() => unknown);
}

export interface RepeatResult<T = unknown, K = unknown> {
  readonly _$repeat$: typeof REPEAT_RESULT;
  readonly items: readonly T[];
  readonly keys: readonly K[];
  readonly values: readonly unknown[];
  readonly empty: unknown;
}

/**
 * Render a keyed collection without adding wrapper elements.
 *
 * Keys are mandatory because repeat() is the explicit identity-preserving list
 * API. Duplicate keys throw before DOM reconciliation rather than silently
 * reusing the wrong row.
 */
export function repeat<T, K>(
  items: Iterable<T> | null | undefined,
  options: RepeatOptions<T, K>
): RepeatResult<T, K> {
  if (!options || typeof options.key !== 'function' || typeof options.render !== 'function') {
    throw new TypeError('snice: repeat() requires { key, render }.');
  }

  const array = items == null ? [] : Array.from(items);
  const keys = array.map(options.key);
  const seen = new Set<K>();
  for (const key of keys) {
    if (seen.has(key)) {
      throw new Error(`snice: repeat() received duplicate key ${String(key)}.`);
    }
    seen.add(key);
  }

  return {
    _$repeat$: REPEAT_RESULT,
    items: array,
    keys,
    values: array.map(options.render),
    empty: array.length === 0
      ? typeof options.empty === 'function'
        ? (options.empty as () => unknown)()
        : options.empty
      : undefined
  };
}

export function isRepeatResult(value: unknown): value is RepeatResult {
  return !!value && (value as RepeatResult)._$repeat$ === REPEAT_RESULT;
}
