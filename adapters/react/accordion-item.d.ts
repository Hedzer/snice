import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the AccordionItem component
 */
export interface AccordionItemProps extends SniceBaseProps {
    itemId?: any;
    open?: any;
    disabled?: any;
    onAccordionItemToggle?: (event: any) => void;
}
/**
 * AccordionItem - React adapter for snice-accordion-item
 *
 * This is an auto-generated React wrapper for the Snice accordion-item component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/accordion/snice-accordion-item';
 * import { AccordionItem } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AccordionItem />;
 * }
 * ```
 */
export declare const AccordionItem: SniceReactComponent<AccordionItemProps, SniceComponentRef>;
//# sourceMappingURL=accordion-item.d.ts.map