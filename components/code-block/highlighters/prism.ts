/**
 * Prism.js integration for snice-code-block
 *
 * Usage:
 * 1. Install Prism: npm install prismjs
 * 2. Import this file and Prism with your desired languages/themes
 * 3. Call setupPrismHighlighter()
 *
 * @example
 * ```typescript
 * import Prism from 'prismjs';
 * import 'prismjs/components/prism-javascript';
 * import 'prismjs/components/prism-typescript';
 * import 'prismjs/themes/prism-tomorrow.css';
 * import { setupPrismHighlighter } from './highlighters/prism';
 *
 * setupPrismHighlighter(Prism);
 * ```
 */

import { SniceCodeBlock } from '../snice-code-block';
import type { HighlighterFunction } from '../snice-code-block.types';

interface PrismInstance {
  highlight: (code: string, grammar: any, language: string) => string;
  languages: Record<string, any>;
}

/**
 * Create a Prism highlighter function
 */
export function createPrismHighlighter(prism: PrismInstance): HighlighterFunction {
  return (code: string, language: string) => {
    const grammar = prism.languages[language];
    if (!grammar) {
      console.warn(`Prism: Language '${language}' not loaded`);
      return code;
    }
    return prism.highlight(code, grammar, language);
  };
}

/**
 * Setup Prism as the global highlighter for all code blocks
 */
export function setupPrismHighlighter(prism: PrismInstance) {
  SniceCodeBlock.setGlobalHighlighter(createPrismHighlighter(prism));
}

/**
 * Language aliases mapping common names to Prism language names
 */
export const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'jsx',
  'tsx': 'tsx',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
};

/**
 * Create a Prism highlighter with language alias support
 */
export function createPrismHighlighterWithAliases(prism: PrismInstance): HighlighterFunction {
  return (code: string, language: string) => {
    const resolvedLanguage = languageAliases[language] || language;
    const grammar = prism.languages[resolvedLanguage];
    if (!grammar) {
      console.warn(`Prism: Language '${resolvedLanguage}' not loaded`);
      return code;
    }
    return prism.highlight(code, grammar, resolvedLanguage);
  };
}
