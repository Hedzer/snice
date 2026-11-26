/**
 * Compact, zero-dependency runtime helpers emitted by the Snice bundler plugin's
 * build-time decorator lowering pass (`snice/vite`, `snice/rollup`).
 *
 * Strictly a leaf module — never imports optional core subsystems so BS-02
 * tree-shaking remains 100% intact.
 */

const METADATA_KEY: symbol = /*#__PURE__*/ (() =>
  (Symbol as any).metadata ?? Symbol.for('Symbol.metadata'))();
const PROPERTIES_KEY: symbol = /*#__PURE__*/ Symbol.for('snice:properties');

/**
 * Create a class metadata object inheriting from the superclass's metadata
 * (cloning inherited PROPERTIES maps so child `@property` entries never mutate
 * the parent's metadata map) and attach it to `Cls[Symbol.metadata]`.
 */
export function __sniceMeta(Cls: any): Record<PropertyKey, any> {
  const parent = Object.getPrototypeOf(Cls);
  const parentMeta = parent && parent[METADATA_KEY] ? parent[METADATA_KEY] : null;
  const meta = Object.create(parentMeta);
  if (parentMeta && parentMeta[PROPERTIES_KEY]) {
    meta[PROPERTIES_KEY] = new Map(parentMeta[PROPERTIES_KEY]);
  }
  Cls[METADATA_KEY] = meta;
  return meta;
}

/**
 * Apply a Snice field decorator (`@property`, `@state`, `@query`, `@queryAll`,
 * `@contextProperty`) at class definition time and return its per-instance
 * initializer function.
 */
export function __sniceField(
  decorator: (value: undefined, context: any) => ((this: any, initialValue: any) => any) | void,
  name: string,
  metadata: Record<PropertyKey, any>
): (this: any, initialValue: any) => any {
  const init = decorator(undefined, { kind: 'field', name, metadata });
  return typeof init === 'function' ? init : (v: any) => v;
}

/**
 * Apply one or more Snice method decorators (bottom-to-top, matching TC39 Stage 3
 * composition order) to `proto[name]`, collecting `context.addInitializer`
 * callbacks into `inits`.
 */
export function __sniceMethod(
  proto: any,
  name: string,
  decorators: Array<(method: any, context: any) => any>,
  inits: Array<(this: any) => void>,
  metadata: Record<PropertyKey, any>
): void {
  let method = proto[name];
  const ctx = {
    kind: 'method' as const,
    name,
    metadata,
    addInitializer(fn: (this: any) => void) {
      inits.push(fn);
    },
  };
  for (let i = decorators.length - 1; i >= 0; i--) {
    const next = decorators[i](method, ctx);
    if (typeof next === 'function') method = next;
  }
  proto[name] = method;
}
