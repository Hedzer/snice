// GENERATED FILE — DO NOT EDIT.
// Source: components/markdown/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Markdown component
 */
export interface MarkdownProps extends SniceBaseProps {
  content?: any;
  sanitize?: any;
  theme?: any;
  onMarkdownRender?: (event: any) => void;
  onLinkClick?: (event: any) => void;
}

/**
 * Markdown - React adapter for snice-markdown
 *
 * This is an auto-generated React wrapper for the Snice markdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/markdown/snice-markdown';
 * import { Markdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Markdown />;
 * }
 * ```
 */
export const Markdown: SniceReactComponent<MarkdownProps, SniceComponentRef> = createReactAdapter<MarkdownProps, false>({
  tagName: 'snice-markdown',
  properties: ["content","sanitize","theme"],
  events: {"markdown-render":"onMarkdownRender","link-click":"onLinkClick"},
  formAssociated: false
});
