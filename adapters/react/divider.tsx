// GENERATED FILE — DO NOT EDIT.
// Source: components/divider/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Divider component
 */
export interface DividerProps extends SniceBaseProps {
  orientation?: any;
  variant?: any;
  spacing?: any;
  align?: any;
  text?: any;
  textBackground?: any;
  color?: any;
  capped?: any;

}

/**
 * Divider - React adapter for snice-divider
 *
 * This is an auto-generated React wrapper for the Snice divider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/divider/snice-divider';
 * import { Divider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Divider />;
 * }
 * ```
 */
export const Divider: SniceReactComponent<DividerProps, SniceComponentRef> = createReactAdapter<DividerProps, false>({
  tagName: 'snice-divider',
  properties: ["orientation","variant","spacing","align","text","textBackground","color","capped"],
  events: {},
  formAssociated: false
});
