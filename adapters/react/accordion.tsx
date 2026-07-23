// GENERATED FILE — DO NOT EDIT.
// Source: components/accordion/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Accordion component
 */
export interface AccordionProps extends SniceBaseProps {
  multiple?: any;
  variant?: any;
  onAccordionOpen?: (event: any) => void;
  onAccordionClose?: (event: any) => void;
}

/**
 * Accordion - React adapter for snice-accordion
 *
 * This is an auto-generated React wrapper for the Snice accordion component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/accordion/snice-accordion';
 * import { Accordion } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Accordion />;
 * }
 * ```
 */
export const Accordion: SniceReactComponent<AccordionProps, SniceComponentRef> = createReactAdapter<AccordionProps, false>({
  tagName: 'snice-accordion',
  properties: ["multiple","variant"],
  events: {"accordion-open":"onAccordionOpen","accordion-close":"onAccordionClose"},
  formAssociated: false
});
