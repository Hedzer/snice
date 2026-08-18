// GENERATED FILE — DO NOT EDIT.
// Source: components/code-block/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * CodeBlock - React adapter for snice-code-block
 *
 * This is an auto-generated React wrapper for the Snice code-block component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/code-block/snice-code-block';
 * import { CodeBlock } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CodeBlock />;
 * }
 * ```
 */
export const CodeBlock = createReactAdapter({
    tagName: 'snice-code-block',
    properties: ["code", "language", "showLineNumbers", "startLine", "highlightLines", "copyable", "filename", "grammar", "fetchMode", "format", "theme"],
    events: { "code-copy": "onCodeCopy", "code-before-highlight": "onCodeBeforeHighlight", "code-after-highlight": "onCodeAfterHighlight", "code-before-format": "onCodeBeforeFormat", "code-after-format": "onCodeAfterFormat", "grammar-request": "onGrammarRequest", "grammar-loaded": "onGrammarLoaded" },
    formAssociated: false
});
//# sourceMappingURL=code-block.js.map