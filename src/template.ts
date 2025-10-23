/**
 * Template system for Snice v3.0.0
 * Inspired by lit-html but custom implementation
 * Provides html`` and css`` tagged template processors with differential rendering
 */

// Unique symbols for type checking
export const HTML_RESULT = Symbol('html-result');
export const CSS_RESULT = Symbol('css-result');

/**
 * Result of html`` tagged template
 * Contains static strings and dynamic values for differential rendering
 */
export interface TemplateResult {
  readonly _$litType$: typeof HTML_RESULT;
  readonly strings: TemplateStringsArray;
  readonly values: readonly any[];
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
 * Tagged template function for creating HTML templates
 *
 * @example
 * ```typescript
 * html`<div class="card">
 *   <h1>${this.title}</h1>
 *   <button @click=${this.handleClick}>Click me</button>
 * </div>`
 * ```
 */
export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  return {
    _$litType$: HTML_RESULT,
    strings,
    values
  };
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
  // Combine strings and values into final CSS text
  let cssText = strings[0];
  for (let i = 0; i < values.length; i++) {
    cssText += String(values[i]) + strings[i + 1];
  }

  const result: CSSResult = {
    _$litType$: CSS_RESULT,
    cssText
  };

  // Try to create constructable stylesheet for better performance
  // This will be cached and reused across instances
  if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype) {
    try {
      const sheet = new CSSStyleSheet();
      (sheet as any).replaceSync(cssText);
      result.styleSheet = sheet;
    } catch (e) {
      // Fall back to regular <style> tag if constructable stylesheets fail
    }
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
 */
export const nothing = Symbol('nothing');

/**
 * Type for template values that represent "no content"
 */
export type Nothing = typeof nothing;

// Unique symbol for unsafe HTML
const UNSAFE_HTML = Symbol('unsafe-html');

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
