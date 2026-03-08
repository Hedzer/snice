import { createReactAdapter } from './wrapper';
/**
 * CodeBlock - React adapter for snice-code-block
 *
 * This is an auto-generated React wrapper for the Snice code-block component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/code-block';
 * import { CodeBlock } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CodeBlock />;
 * }
 * ```
 */
export const CodeBlock = createReactAdapter({
    tagName: 'snice-code-block',
    properties: ["language", "showLineNumbers", "startLine", "highlightLines", "copyable", "filename", "grammar", "fetchMode", "format", "theme"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=code-block.js.map