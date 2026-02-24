import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Markdown component
 */
export interface MarkdownProps extends SniceBaseProps {
  sanitize?: any;
  theme?: any;

}

/**
 * Markdown - React adapter for snice-markdown
 *
 * This is an auto-generated React wrapper for the Snice markdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/markdown';
 * import { Markdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Markdown />;
 * }
 * ```
 */
export const Markdown = createReactAdapter<MarkdownProps>({
  tagName: 'snice-markdown',
  properties: ["sanitize","theme"],
  events: {},
  formAssociated: false
});
