import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Accordion component
 */
export interface AccordionProps extends SniceBaseProps {
  multiple?: any;

}

/**
 * Accordion - React adapter for snice-accordion
 *
 * This is an auto-generated React wrapper for the Snice accordion component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/accordion';
 * import { Accordion } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Accordion />;
 * }
 * ```
 */
export const Accordion = createReactAdapter<AccordionProps>({
  tagName: 'snice-accordion',
  properties: ["multiple"],
  events: {},
  formAssociated: false
});
