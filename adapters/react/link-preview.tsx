// GENERATED FILE — DO NOT EDIT.
// Source: components/link-preview/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LinkPreview component
 */
export interface LinkPreviewProps extends SniceBaseProps {
  url?: any;
  title?: any;
  description?: any;
  image?: any;
  siteName?: any;
  favicon?: any;
  variant?: any;
  size?: any;
  onLinkClick?: (event: any) => void;
}

/**
 * LinkPreview - React adapter for snice-link-preview
 *
 * This is an auto-generated React wrapper for the Snice link-preview component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/link-preview/snice-link-preview';
 * import { LinkPreview } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LinkPreview />;
 * }
 * ```
 */
export const LinkPreview: SniceReactComponent<LinkPreviewProps, SniceComponentRef> = createReactAdapter<LinkPreviewProps, false>({
  tagName: 'snice-link-preview',
  properties: ["url","title","description","image","siteName","favicon","variant","size"],
  events: {"link-click":"onLinkClick"},
  formAssociated: false
});
