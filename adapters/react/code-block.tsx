import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the CodeBlock component
 */
export interface CodeBlockProps extends SniceBaseProps {
  language?: any;
  showLineNumbers?: any;
  startLine?: any;
  highlightLines?: any;
  copyable?: any;
  filename?: any;
  grammar?: any;
  fetchMode?: any;

}

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
export const CodeBlock = createReactAdapter<CodeBlockProps>({
  tagName: 'snice-code-block',
  properties: ["language","showLineNumbers","startLine","highlightLines","copyable","filename","grammar","fetchMode"],
  events: {},
  formAssociated: false
});
