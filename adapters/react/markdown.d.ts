import type { SniceBaseProps } from './types';
/**
 * Props for the Markdown component
 */
export interface MarkdownProps extends SniceBaseProps {
    sanitize?: any;
    theme?: any;
    renderedHtml?: any;
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
export declare const Markdown: import("react").ForwardRefExoticComponent<Omit<MarkdownProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=markdown.d.ts.map