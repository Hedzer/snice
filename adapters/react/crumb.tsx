// GENERATED FILE — DO NOT EDIT.
// Source: components/breadcrumbs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Crumb component
 */
export interface CrumbProps extends SniceBaseProps {
  label?: any;
  href?: any;
  icon?: any;
  iconImage?: any;
  active?: any;

}

/**
 * Crumb - React adapter for snice-crumb
 *
 * This is an auto-generated React wrapper for the Snice crumb component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/breadcrumbs/snice-crumb';
 * import { Crumb } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Crumb />;
 * }
 * ```
 */
export const Crumb: SniceReactComponent<CrumbProps, SniceComponentRef> = createReactAdapter<CrumbProps, false>({
  tagName: 'snice-crumb',
  properties: ["label","href","icon","iconImage","active"],
  events: {},
  formAssociated: false
});
