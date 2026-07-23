// GENERATED FILE — DO NOT EDIT.
// Source: components/pricing-table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Feature component
 */
export interface FeatureProps extends SniceBaseProps {
  'excluded'?: boolean;
  'value'?: string;

}

/**
 * Feature - React adapter for snice-feature
 *
 * This is an auto-generated React wrapper for the Snice feature component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pricing-table/snice-pricing-table';
 * import { Feature } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Feature />;
 * }
 * ```
 */
export const Feature: SniceReactComponent<FeatureProps, SniceComponentRef> = createReactAdapter<FeatureProps, false>({
  tagName: 'snice-feature',
  properties: [],
  events: {},
  formAssociated: false
});
