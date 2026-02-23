import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Diff component
 */
export interface DiffProps extends SniceBaseProps {
  oldText?: any;
  newText?: any;
  language?: any;
  mode?: any;
  lineNumbers?: any;
  contextLines?: any;

}

/**
 * Diff - React adapter for snice-diff
 *
 * This is an auto-generated React wrapper for the Snice diff component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/diff';
 * import { Diff } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Diff />;
 * }
 * ```
 */
export const Diff = createReactAdapter<DiffProps>({
  tagName: 'snice-diff',
  properties: ["oldText","newText","language","mode","lineNumbers","contextLines"],
  events: {},
  formAssociated: false
});
