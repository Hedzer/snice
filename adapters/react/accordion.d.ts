import { type SniceReactComponent } from './wrapper';
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
export declare const Accordion: SniceReactComponent<AccordionProps, SniceComponentRef>;
//# sourceMappingURL=accordion.d.ts.map