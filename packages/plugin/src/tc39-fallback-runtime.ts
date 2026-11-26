/**
 * Compact, self-contained TC39 2022-03 decorator runtime served as a virtual
 * module (`\0snice:tc39-decs`) for non-Snice / mixed / unrecognized-class
 * decorator fallback. Works in Vite (including `snice doctor` external probe
 * directories without `node_modules`) and Rollup, emitted at most once per bundle.
 */

export const TC39_VIRTUAL_ID = '\0snice:tc39-decs';
export const TC39_SPECIFIER = 'virtual:snice-tc39-decs';

export const TC39_RUNTIME_CODE = `
const META_KEY = Symbol.metadata || Symbol.for('Symbol.metadata');
const PROPS_KEY = Symbol.for('snice:properties');

export function __tc39Apply(Cls, classDecs, memberSpecs) {
  const parent = Object.getPrototypeOf(Cls);
  const parentMeta = parent && parent[META_KEY] ? parent[META_KEY] : null;
  const metadata = Object.create(parentMeta);
  if (parentMeta && parentMeta[PROPS_KEY]) {
    metadata[PROPS_KEY] = new Map(parentMeta[PROPS_KEY]);
  }

  const instExtra = [];
  const staticExtra = [];
  const classExtra = [];
  const fieldInits = Object.create(null);

  for (let m = 0; m < memberSpecs.length; m++) {
    const spec = memberSpecs[m];
    const kind = spec[0];
    const name = spec[1];
    const isStatic = !!spec[2];
    const decs = spec[3];
    const target = isStatic ? Cls : Cls.prototype;
    const extra = isStatic ? staticExtra : instExtra;

    if (kind === 'field') {
      const inits = [];
      for (let i = decs.length - 1; i >= 0; i--) {
        const ctx = {
          kind: 'field',
          name,
          static: isStatic,
          private: false,
          metadata,
          access: {
            has(obj) { return name in obj; },
            get(obj) { return obj[name]; },
            set(obj, v) { obj[name] = v; },
          },
          addInitializer(fn) { extra.push(fn); },
        };
        const res = decs[i](undefined, ctx);
        if (typeof res === 'function') inits.push(res);
      }
      fieldInits[(isStatic ? 's:' : 'i:') + String(name)] = inits;
    } else if (kind === 'method' || kind === 'getter' || kind === 'setter') {
      const desc = Object.getOwnPropertyDescriptor(target, name) || {
        configurable: true,
        enumerable: false,
        writable: true,
      };
      let val = kind === 'method' ? desc.value : kind === 'getter' ? desc.get : desc.set;
      for (let i = decs.length - 1; i >= 0; i--) {
        const ctx = {
          kind,
          name,
          static: isStatic,
          private: false,
          metadata,
          access: kind === 'method'
            ? { has(obj) { return name in obj; }, get(obj) { return obj[name]; } }
            : kind === 'getter'
              ? { has(obj) { return name in obj; }, get(obj) { return obj[name]; } }
              : { has(obj) { return name in obj; }, set(obj, v) { obj[name] = v; } },
          addInitializer(fn) { extra.push(fn); },
        };
        const next = decs[i](val, ctx);
        if (typeof next === 'function') val = next;
      }
      if (kind === 'method') desc.value = val;
      else if (kind === 'getter') desc.get = val;
      else desc.set = val;
      Object.defineProperty(target, name, desc);
    } else if (kind === 'accessor') {
      const backing = Symbol(String(name));
      let getter = function () { return this[backing]; };
      let setter = function (v) { this[backing] = v; };
      const inits = [];
      for (let i = decs.length - 1; i >= 0; i--) {
        const ctx = {
          kind: 'accessor',
          name,
          static: isStatic,
          private: false,
          metadata,
          access: {
            has(obj) { return name in obj; },
            get(obj) { return obj[name]; },
            set(obj, v) { obj[name] = v; },
          },
          addInitializer(fn) { extra.push(fn); },
        };
        const res = decs[i]({ get: getter, set: setter }, ctx);
        if (res && typeof res === 'object') {
          if (typeof res.get === 'function') getter = res.get;
          if (typeof res.set === 'function') setter = res.set;
          if (typeof res.init === 'function') inits.push(res.init);
        }
      }
      Object.defineProperty(target, name, {
        get: getter,
        set: setter,
        configurable: true,
        enumerable: false,
      });
      fieldInits[(isStatic ? 's:' : 'i:') + String(name)] = inits;
    }
  }

  let ResultCls = Cls;
  for (let i = classDecs.length - 1; i >= 0; i--) {
    const ctx = {
      kind: 'class',
      name: Cls.name,
      metadata,
      addInitializer(fn) { classExtra.push(fn); },
    };
    const next = classDecs[i](ResultCls, ctx);
    if (typeof next === 'function') ResultCls = next;
  }

  try {
    Object.defineProperty(ResultCls, META_KEY, {
      value: metadata,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  } catch {}

  for (let i = 0; i < staticExtra.length; i++) staticExtra[i].call(ResultCls);
  for (let i = 0; i < classExtra.length; i++) classExtra[i].call(ResultCls);

  return {
    c: ResultCls,
    e: instExtra,
    f: fieldInits,
  };
}

export function __tc39RunField(self, inits, initialValue) {
  let val = initialValue;
  if (inits) {
    for (let i = 0; i < inits.length; i++) {
      val = inits[i].call(self, val);
    }
  }
  return val;
}
`;
