/**
 * JSON formatter for snice-code-block
 *
 * Zero-dependency formatter that pretty-prints JSON using
 * JSON.parse() + JSON.stringify().
 *
 * @example
 * ```typescript
 * import { createJsonFormatter } from './formatters/json';
 *
 * const formatter = createJsonFormatter({ indent: 2 });
 * codeBlock.setFormatter(formatter);
 * codeBlock.format = true;
 * ```
 */

import type { FormatterFunction } from '../snice-code-block.types';

export interface JsonFormatterOptions {
  indent?: number;
}

const JSON_LANGUAGES = new Set(['json', 'jsonc']);

/**
 * Create a JSON formatter function.
 * Parses and re-serializes JSON with indentation.
 * Returns original code on parse failure.
 */
export function createJsonFormatter(options?: JsonFormatterOptions): FormatterFunction {
  const indent = options?.indent ?? 2;

  return (code: string, language: string) => {
    if (!JSON_LANGUAGES.has(language)) return code;

    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, indent);
    } catch {
      return code;
    }
  };
}
