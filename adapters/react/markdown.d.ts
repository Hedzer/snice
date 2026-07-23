import { type SniceReactComponent } from './wrapper';
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
export declare const Markdown: SniceReactComponent<MarkdownProps, SniceComponentRef>;
//# sourceMappingURL=markdown.d.ts.map