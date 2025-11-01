/**
 * highlight.js integration for snice-code-block
 *
 * Usage:
 * 1. Install highlight.js: npm install highlight.js
 * 2. Import this file and highlight.js with your desired languages/theme
 * 3. Call setupHighlightJs()
 *
 * @example
 * ```typescript
 * import hljs from 'highlight.js';
 * import 'highlight.js/styles/github-dark.css';
 * import { setupHighlightJs } from './highlighters/highlight';
 *
 * setupHighlightJs(hljs);
 * ```
 *
 * @example With specific languages
 * ```typescript
 * import hljs from 'highlight.js/lib/core';
 * import javascript from 'highlight.js/lib/languages/javascript';
 * import typescript from 'highlight.js/lib/languages/typescript';
 * import 'highlight.js/styles/atom-one-dark.css';
 * import { setupHighlightJs } from './highlighters/highlight';
 *
 * hljs.registerLanguage('javascript', javascript);
 * hljs.registerLanguage('typescript', typescript);
 *
 * setupHighlightJs(hljs);
 * ```
 */

import { SniceCodeBlock } from '../snice-code-block';
import type { HighlighterFunction } from '../snice-code-block.types';

interface HighlightJsInstance {
  highlight: (code: string, options: { language: string }) => { value: string };
  highlightAuto: (code: string) => { value: string };
  listLanguages: () => string[];
}

/**
 * Create a highlight.js highlighter function
 */
export function createHighlightJsHighlighter(hljs: HighlightJsInstance): HighlighterFunction {
  return (code: string, language: string) => {
    try {
      const result = hljs.highlight(code, { language });
      return result.value;
    } catch (err) {
      console.warn(`highlight.js: Language '${language}' not supported`, err);
      return code;
    }
  };
}

/**
 * Create a highlight.js highlighter with auto-detection fallback
 */
export function createHighlightJsHighlighterWithAuto(hljs: HighlightJsInstance): HighlighterFunction {
  return (code: string, language: string) => {
    try {
      const result = hljs.highlight(code, { language });
      return result.value;
    } catch (err) {
      console.warn(`highlight.js: Language '${language}' not supported, using auto-detection`);
      const result = hljs.highlightAuto(code);
      return result.value;
    }
  };
}

/**
 * Setup highlight.js as the global highlighter for all code blocks
 */
export function setupHighlightJs(hljs: HighlightJsInstance, useAutoDetection = false) {
  const highlighter = useAutoDetection
    ? createHighlightJsHighlighterWithAuto(hljs)
    : createHighlightJsHighlighter(hljs);

  SniceCodeBlock.setGlobalHighlighter(highlighter);
}

/**
 * Language aliases mapping common names to highlight.js language names
 */
export const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'jsx': 'javascript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
};

/**
 * Create a highlight.js highlighter with language alias support
 */
export function createHighlightJsHighlighterWithAliases(hljs: HighlightJsInstance): HighlighterFunction {
  return (code: string, language: string) => {
    const resolvedLanguage = languageAliases[language] || language;
    try {
      const result = hljs.highlight(code, { language: resolvedLanguage });
      return result.value;
    } catch (err) {
      console.warn(`highlight.js: Language '${resolvedLanguage}' not supported`, err);
      return code;
    }
  };
}
