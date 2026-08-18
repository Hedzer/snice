// GENERATED FILE — DO NOT EDIT.
// Source: components/code-block/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CodeBlock component
 */
export interface CodeBlockProps extends SniceBaseProps {
  code?: any;
  language?: any;
  showLineNumbers?: any;
  startLine?: any;
  highlightLines?: any;
  copyable?: any;
  filename?: any;
  grammar?: any;
  fetchMode?: any;
  format?: any;
  theme?: any;
  onCodeCopy?: (event: any) => void;
  onCodeBeforeHighlight?: (event: any) => void;
  onCodeAfterHighlight?: (event: any) => void;
  onCodeBeforeFormat?: (event: any) => void;
  onCodeAfterFormat?: (event: any) => void;
  onGrammarRequest?: (event: any) => void;
  onGrammarLoaded?: (event: any) => void;
}

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
export const CodeBlock: SniceReactComponent<CodeBlockProps, SniceComponentRef> = createReactAdapter<CodeBlockProps, false>({
  tagName: 'snice-code-block',
  properties: ["code","language","showLineNumbers","startLine","highlightLines","copyable","filename","grammar","fetchMode","format","theme"],
  events: {"code-copy":"onCodeCopy","code-before-highlight":"onCodeBeforeHighlight","code-after-highlight":"onCodeAfterHighlight","code-before-format":"onCodeBeforeFormat","code-after-format":"onCodeAfterFormat","grammar-request":"onGrammarRequest","grammar-loaded":"onGrammarLoaded"},
  formAssociated: false
});
