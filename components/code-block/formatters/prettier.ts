/**
 * Prettier integration for snice-code-block
 *
 * Usage:
 * 1. Install Prettier: npm install prettier
 * 2. Import this file and Prettier with your desired plugins
 * 3. Call setupPrettierFormatter() or createPrettierFormatter()
 *
 * @example
 * ```typescript
 * import * as prettier from 'prettier/standalone';
 * import parserBabel from 'prettier/plugins/babel';
 * import parserEstree from 'prettier/plugins/estree';
 * import { setupPrettierFormatter } from './formatters/prettier';
 *
 * const formatter = setupPrettierFormatter(prettier, [parserBabel, parserEstree]);
 * codeBlock.setFormatter(formatter);
 * codeBlock.format = true;
 * ```
 */

import type { FormatterFunction } from '../snice-code-block.types';

interface PrettierInstance {
  format: (source: string, options: Record<string, any>) => string | Promise<string>;
}

/**
 * Language → Prettier parser mapping
 */
export const languageParserMap: Record<string, string> = {
  'javascript': 'babel',
  'js': 'babel',
  'jsx': 'babel',
  'typescript': 'typescript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'json': 'json',
  'jsonc': 'json',
  'css': 'css',
  'scss': 'scss',
  'less': 'less',
  'html': 'html',
  'htm': 'html',
  'markdown': 'markdown',
  'md': 'markdown',
  'yaml': 'yaml',
  'yml': 'yaml',
  'graphql': 'graphql',
};

export interface PrettierFormatterOptions {
  tabWidth?: number;
  useTabs?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'all' | 'es5' | 'none';
  printWidth?: number;
  semi?: boolean;
}

/**
 * Create a Prettier formatter function
 */
export function createPrettierFormatter(
  prettier: PrettierInstance,
  plugins?: any[],
  options?: PrettierFormatterOptions
): FormatterFunction {
  return async (code: string, language: string) => {
    const parser = languageParserMap[language];
    if (!parser) return code;

    try {
      const result = await prettier.format(code, {
        parser,
        plugins,
        ...options,
      });
      return result;
    } catch (err) {
      console.warn(`Prettier: Failed to format as '${language}'`, err);
      return code;
    }
  };
}

/**
 * Create a Prettier formatter for use with snice-code-block.
 * Assign the returned function to a code block via `setFormatter()`.
 *
 * @example
 * ```typescript
 * const formatter = setupPrettierFormatter(prettier, [parserBabel, parserEstree]);
 * codeBlock.setFormatter(formatter);
 * codeBlock.format = true;
 * ```
 */
export function setupPrettierFormatter(
  prettier: PrettierInstance,
  plugins?: any[],
  options?: PrettierFormatterOptions
): FormatterFunction {
  return createPrettierFormatter(prettier, plugins, options);
}
