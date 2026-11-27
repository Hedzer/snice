/**
 * Template system for Snice v3.0.0
 * Provides html`` and css`` tagged template processors with differential rendering
 */

// Unique symbols for type checking
// Use Symbol.for() to ensure symbols are shared across multiple Snice instances
export const HTML_RESULT = /*#__PURE__*/ Symbol.for('snice:html-result');
export const CSS_RESULT = /*#__PURE__*/ Symbol.for('snice:css-result');

// Static css`` sites are the common stylesheet path and can be reused forever.
const cssResultCache = /*#__PURE__*/ new WeakMap<TemplateStringsArray, CSSResult>();
// Bounded O(1)-per-callsite cache for interpolated css`` sites (e.g. css`${importedCss}`).
// Holds at most one { cssText, result } entry per TemplateStringsArray callsite so
// repeated component instances share one CSSResult/CSSStyleSheet without unbounded
// retention when interpolated values change dynamically.
const interpolatedCssResultCache = /*#__PURE__*/ new WeakMap<TemplateStringsArray, { cssText: string; result: CSSResult }>();

/**
 * Tree-shakeable part factory invoked by `CompiledTemplateInstance`.
 */
export type CompiledPartFactory = (
  node: Node,
  arg1: any,
  arg2: any,
  ctx: any
) => any;

export type CompiledPartTuple =
  | readonly [slot: number, valueIndex: number, factory: CompiledPartFactory]
  | readonly [slot: number, valueIndex: number, factory: CompiledPartFactory, arg1: any]
  | readonly [slot: number, valueIndex: number, factory: CompiledPartFactory, arg1: any, arg2: any];

/**
 * Pre-compiled build-time descriptor produced by `snice/vite` / `snice/rollup`
 * when `precompileTemplates: true`. Allows `CompiledTemplateInstance` to bypass
 * `prepareTemplate()`, `scanTemplateQuasis()`, and `TreeWalker` completely while
 * importing ONLY the part factories used by that template.
 */
export interface CompiledTemplateDescriptor {
  /** Pre-compiled static HTML with deterministic slot markers */
  readonly html: string;
  /** Ordered part descriptors referencing tree-shakeable part factories */
  readonly parts: readonly CompiledPartTuple[];
  /** Marker attribute name (defaults to 'data-s') */
  readonly m?: string;
  /** Value index of `key=${...}` binding, or -1 if unkeyed */
  readonly k?: number;
}

/**
 * Result of html`` tagged template
 * Contains static strings and dynamic values for differential rendering
 */
export interface TemplateResult {
  readonly _$litType$: typeof HTML_RESULT;
  readonly strings: TemplateStringsArray;
  readonly values: readonly any[];
  /** True when created by svg`` — parses in the SVG namespace */
  readonly svg?: boolean;
  /** Optional build-time pre-compiled descriptor */
  readonly compiled?: CompiledTemplateDescriptor;
  /** @internal Factory creating a TemplateInstance without coupling render.ts to parts.ts */
  readonly _create?: (
    result: TemplateResult,
    renderIdentity: any,
    customElementRegistry: any
  ) => any;
  /** @internal Key-index resolver for keyed list reconciliation */
  readonly _keyIndex?: (result: TemplateResult) => number;
}

/**
 * Result of css`` tagged template
 * Contains CSS text for style injection
 */
export interface CSSResult {
  readonly _$litType$: typeof CSS_RESULT;
  readonly cssText: string;
  styleSheet?: CSSStyleSheet;
}

/**
 * Tagged template function for creating CSS
 *
 * @example
 * ```typescript
 * css`:host {
 *   display: block;
 *   padding: 1rem;
 * }`
 * ```
 */
export function css(strings: TemplateStringsArray, ...values: any[]): CSSResult {
  if (values.length === 0) {
    const cached = cssResultCache.get(strings);
    if (cached) return cached;
  }

  let cssText: string;
  if (
    values.length === 1 &&
    strings[0] === '' &&
    strings[1] === '' &&
    typeof values[0] === 'string'
  ) {
    // O(1) fast path for the dominant component pattern: css`${importedCss}`
    cssText = values[0];
  } else {
    // Combine strings and values into final CSS text
    cssText = strings[0];
    for (let i = 0; i < values.length; i++) {
      // Inline a nested css`` result by its text so style fragments compose;
      // String() on a CSSResult object would yield "[object Object]".
      const value = values[i];
      cssText += (isCSSResult(value) ? value.cssText : String(value)) + strings[i + 1];
    }
  }

  if (values.length > 0) {
    const cached = interpolatedCssResultCache.get(strings);
    if (cached && cached.cssText === cssText) {
      return cached.result;
    }
  }

  const result: CSSResult = {
    _$litType$: CSS_RESULT,
    cssText
  };

  // Try to create constructable stylesheet for better performance
  // This will be cached and reused across instances. Guard against envs
  // without a Document global (for example, workers).
  if (
    typeof CSSStyleSheet !== 'undefined' &&
    typeof Document !== 'undefined' &&
    'adoptedStyleSheets' in Document.prototype
  ) {
    try {
      const sheet = new CSSStyleSheet();
      (sheet as any).replaceSync(cssText);
      result.styleSheet = sheet;
    } catch (e) {
      // Fall back to regular <style> tag if constructable stylesheets fail
    }
  }

  if (values.length === 0) {
    cssResultCache.set(strings, result);
  } else {
    interpolatedCssResultCache.set(strings, { cssText, result });
  }

  return result;
}

/**
 * Check if a value is a TemplateResult
 */
export function isTemplateResult(value: any): value is TemplateResult {
  return value && value._$litType$ === HTML_RESULT;
}

/**
 * Check if a value is a CSSResult
 */
export function isCSSResult(value: any): value is CSSResult {
  return value && value._$litType$ === CSS_RESULT;
}

/**
 * Type guard for primitive values
 */
export function isPrimitive(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  );
}

/**
 * Sanitize HTML to prevent XSS
 * Only allows safe HTML, escapes dangerous content
 */
export function sanitize(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Template results are safe - they've been processed
  if (isTemplateResult(value)) {
    return ''; // Will be handled by template renderer
  }

  // Convert to string and escape HTML entities
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Nothing - represents no value (different from null/undefined)
 * Used to remove content from templates
 * Use Symbol.for() to ensure symbols are shared across multiple Snice instances
 */
export const nothing = /*#__PURE__*/ Symbol.for('snice:nothing');

/**
 * Type for template values that represent "no content"
 */
export type Nothing = typeof nothing;

// Unique symbol for unsafe HTML
// Use Symbol.for() to ensure symbols are shared across multiple Snice instances
const UNSAFE_HTML = /*#__PURE__*/ Symbol.for('snice:unsafe-html');

/**
 * Wrapper for raw HTML strings that should not be escaped
 * WARNING: Only use with sanitized/trusted content to prevent XSS
 */
export interface UnsafeHTML {
  readonly _$litType$: typeof UNSAFE_HTML;
  readonly html: string;
}

/**
 * Mark a string as raw HTML that should not be escaped
 * WARNING: Only use with sanitized content - using user input can lead to XSS!
 *
 * @example
 * ```typescript
 * const htmlString = '<span class="bold">Hello</span>';
 * html`<div>${unsafeHTML(htmlString)}</div>`
 * ```
 */
export function unsafeHTML(html: string): UnsafeHTML {
  return {
    _$litType$: UNSAFE_HTML,
    html
  };
}

/**
 * Check if a value is an UnsafeHTML wrapper
 */
export function isUnsafeHTML(value: any): value is UnsafeHTML {
  return value && value._$litType$ === UNSAFE_HTML;
}
