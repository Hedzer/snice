// GENERATED FILE — DO NOT EDIT.
// Source: components/nav/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Nav component
 */
export interface NavProps extends SniceBaseProps {
  variant?: any;
  orientation?: any;
  activeStyle?: any;
  isTopLevel?: any;

}

/**
 * Nav - React adapter for snice-nav
 *
 * This is an auto-generated React wrapper for the Snice nav component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/nav';
 * import { Nav } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Nav />;
 * }
 * ```
 */
export const Nav = createReactAdapter<NavProps>({
  tagName: 'snice-nav',
  properties: ["variant","orientation","activeStyle","isTopLevel"],
  events: {},
  formAssociated: false
});
