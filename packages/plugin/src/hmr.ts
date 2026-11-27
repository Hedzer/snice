import MagicString from 'magic-string';

export const HMR_SPECIFIER = 'virtual:snice-hmr';
export const HMR_VIRTUAL_ID = '\0snice:hmr-runtime';

/**
 * Lightweight dev-only HMR client runtime (0 bytes in production builds).
 *
 * Intercepts `customElements.define` on hot module re-execution so `@element`
 * classes update live mounted instances in place (patching prototype methods,
 * `@render`, `@styles`, and static `styles`) while preserving element instance state.
 */
export const HMR_RUNTIME_CODE = `
const SYM = (name) => Symbol.for('snice:' + name);
const RENDER_METHOD = SYM('render-method');
const RENDER_OPTIONS = SYM('render-options');
const STYLES_METHOD = SYM('styles-method');
const STYLES_APPLIED = SYM('styles-applied');
const PARENT_STYLES_METHODS = SYM('parent-styles-methods');
const CSS_RESULT = SYM('css-result');

function collectLiveElements(root, tagName, out) {
  if (!root || !root.querySelectorAll) return;
  const matches = root.querySelectorAll(tagName);
  for (let i = 0; i < matches.length; i++) out.push(matches[i]);
  const all = root.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].shadowRoot) {
      collectLiveElements(all[i].shadowRoot, tagName, out);
    }
  }
}

function collectCssResults(el, ctor) {
  const results = [];
  const ctors = [];
  let cur = ctor;
  while (cur && cur !== HTMLElement && cur !== Function.prototype) {
    ctors.unshift(cur);
    cur = Object.getPrototypeOf(cur);
  }
  for (const c of ctors) {
    if (!Object.prototype.hasOwnProperty.call(c, 'styles')) continue;
    const val = c.styles;
    const list = Array.isArray(val) ? val : [val];
    for (const r of list) {
      if (r && r._$litType$ === CSS_RESULT) results.push(r);
    }
  }
  const parents = el[PARENT_STYLES_METHODS];
  if (Array.isArray(parents)) {
    for (const fn of parents) {
      const r = fn.call(el);
      if (r && r._$litType$ === CSS_RESULT) results.push(r);
    }
  }
  const stylesFn = el[STYLES_METHOD];
  if (typeof stylesFn === 'function') {
    const r = stylesFn.call(el);
    if (r && r._$litType$ === CSS_RESULT) results.push(r);
  }
  return results;
}

function reapplyStyles(el, ctor) {
  const root = el.shadowRoot || el;
  const results = collectCssResults(el, ctor);
  el[STYLES_APPLIED] = true;

  const existing = Array.from(root.childNodes || []).filter(
    (n) => n.nodeType === 1 && n.tagName === 'STYLE' && n.hasAttribute('data-snice-style')
  );
  for (const s of existing) s.remove();

  if (results.length === 0) {
    if (root instanceof ShadowRoot && 'adoptedStyleSheets' in root) {
      try { root.adoptedStyleSheets = []; } catch {}
    }
    return;
  }

  if (root instanceof ShadowRoot && results.every((r) => !!r.styleSheet) && 'adoptedStyleSheets' in root) {
    try {
      root.adoptedStyleSheets = results.map((r) => r.styleSheet);
      return;
    } catch {}
  }

  for (const r of results) {
    const style = document.createElement('style');
    style.setAttribute('data-snice-style', '');
    style.textContent = r.cssText;
    root.appendChild(style);
  }
}

function patchPrototypeAndStatics(origCtor, newCtor) {
  const protoDescs = Object.getOwnPropertyDescriptors(newCtor.prototype);
  for (const key of Reflect.ownKeys(protoDescs)) {
    if (key === 'constructor') continue;
    try {
      Object.defineProperty(origCtor.prototype, key, protoDescs[key]);
    } catch {}
  }
  const staticDescs = Object.getOwnPropertyDescriptors(newCtor);
  for (const key of Reflect.ownKeys(staticDescs)) {
    if (key === 'prototype' || key === 'length' || key === 'name') continue;
    try {
      Object.defineProperty(origCtor, key, staticDescs[key]);
    } catch {}
  }
}

function extractInitializerState(newCtor) {
  const inits = newCtor.__sniceHmrInits;
  if (!Array.isArray(inits) || inits.length === 0) return null;
  const probe = Object.create(newCtor.prototype);
  for (let i = 0; i < inits.length; i++) {
    try { inits[i].call(probe); } catch {}
  }
  return probe;
}

function findRenderInvokerKey(proto, renderFn) {
  if (renderFn && typeof renderFn.name === 'string' && renderFn.name && typeof proto[renderFn.name] === 'function') {
    return renderFn.name;
  }
  if (typeof proto.render === 'function') return 'render';
  return null;
}

function hotPatchExistingElement(tagName, existing, ctor) {
  const key = String(tagName).toLowerCase();
  patchPrototypeAndStatics(existing, ctor);
  const probe = extractInitializerState(ctor);
  const newRenderMethod = probe ? probe[RENDER_METHOD] : ctor.prototype[RENDER_METHOD];
  const newRenderOptions = probe ? probe[RENDER_OPTIONS] : ctor.prototype[RENDER_OPTIONS];
  const newStylesMethod = probe ? probe[STYLES_METHOD] : ctor.prototype[STYLES_METHOD];
  const newParentStyles = probe ? probe[PARENT_STYLES_METHODS] : ctor.prototype[PARENT_STYLES_METHODS];
  const renderKey = findRenderInvokerKey(existing.prototype, newRenderMethod);

  if (typeof document !== 'undefined') {
    const live = [];
    collectLiveElements(document, key, live);
    for (let i = 0; i < live.length; i++) {
      const el = live[i];
      if (newRenderMethod !== undefined) el[RENDER_METHOD] = newRenderMethod;
      if (newRenderOptions !== undefined) el[RENDER_OPTIONS] = newRenderOptions;
      if (newStylesMethod !== undefined) el[STYLES_METHOD] = newStylesMethod;
      if (newParentStyles !== undefined) el[PARENT_STYLES_METHODS] = newParentStyles;
      reapplyStyles(el, existing);
      if (renderKey && typeof el[renderKey] === 'function') {
        try {
          el[renderKey]();
        } catch (err) {
          console.error('[snice hmr] Failed to re-render <' + key + '>:', err);
        }
      }
    }
  }
}

export function __sniceHmrUpdate(tagName, ctor) {
  if (typeof customElements === 'undefined') return;
  const key = String(tagName).toLowerCase();
  const existing = customElements.get(key);
  if (existing && existing !== ctor) {
    hotPatchExistingElement(key, existing, ctor);
  }
}

export function __sniceHmrInstall() {
  if (typeof customElements === 'undefined' || globalThis.__sniceHmrState) return;
  const origDefine = customElements.define.bind(customElements);
  const registry = new Map();
  const state = { origDefine, registry };
  globalThis.__sniceHmrState = state;

  customElements.define = function sniceHmrDefine(tagName, ctor, options) {
    const key = String(tagName).toLowerCase();
    const existing = registry.get(key) || customElements.get(key);
    if (!existing) {
      registry.set(key, ctor);
      return origDefine(tagName, ctor, options);
    }
    if (existing !== ctor) {
      hotPatchExistingElement(key, existing, ctor);
    }
  };
}
`;

export interface HmrTransformResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
}

/**
 * Dev-only transform injecting Snice `@element` HMR support for Vite serve mode.
 * Never called in production builds or Rollup builds (0 bytes in production).
 */
export function transformHmr(code: string, id: string): HmrTransformResult | null {
  // Fast check: only instrument modules that define a Snice custom element
  const hasLoweredElement = /__sniceMeta\s*\(/.test(code) && /\belement\s*\(/.test(code);
  const hasRawElement = /@\s*element\s*\(/.test(code) || /\bapplyElementFunctionality\s*\(/.test(code);
  if (!hasLoweredElement && !hasRawElement) return null;

  const s = new MagicString(code);

  // Expose lowered method initializer arrays (`__si0`, `__si1`, ...) on each class constructor
  // right after `const __siN = [];` so HMR can extract updated `@render()` / `@styles()` methods.
  const metaPattern = /const __sm(\d+) = __sniceMeta\(([A-Za-z_$][\w$]*)\);/g;
  let m: RegExpExecArray | null;
  while ((m = metaPattern.exec(code)) !== null) {
    const idx = m[1];
    const className = m[2];
    const siDecl = `const __si${idx} = [];`;
    const siPos = code.indexOf(siDecl, m.index);
    if (siPos !== -1) {
      s.appendRight(
        siPos + siDecl.length,
        ` ${className}.__sniceHmrInits = __si${idx};`
      );
    }
  }

  // After each lowered `element('tag-name', ...)(ClassName, { ... });`, trigger HMR hot-patch
  // if `tag-name` is already registered (since Snice's `defineElement` skips `customElements.define`
  // when `customElements.get(tagName)` already exists).
  const elCallPattern = /\b(?:element|layout)\s*\(\s*(['"`])([a-z][a-z0-9-]*)\1[^)]*\)\s*\(\s*([A-Za-z_$][\w$]*)\s*,[^;]*\);/g;
  let em: RegExpExecArray | null;
  while ((em = elCallPattern.exec(code)) !== null) {
    const tagName = em[2];
    const className = em[3];
    s.appendRight(
      em.index + em[0].length,
      ` __sniceHmrUpdate(${JSON.stringify(tagName)}, ${className});`
    );
  }

  s.prepend(
    `import { __sniceHmrInstall, __sniceHmrUpdate } from ${JSON.stringify(HMR_SPECIFIER)};\n__sniceHmrInstall();\n`
  );

  if (!code.includes('import.meta.hot')) {
    s.append(`\nif (import.meta.hot) { import.meta.hot.accept(); }\n`);
  }

  return {
    code: s.toString(),
    map: s.generateMap({
      source: id,
      includeContent: true,
      hires: 'boundary',
    }),
  };
}
