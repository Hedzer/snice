// GENERATED FILE — DO NOT EDIT.
// Source: components/accordion/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const AccordionItem = createReactAdapter({
    tagName: 'snice-accordion-item',
    properties: ["itemId", "open", "disabled"],
    events: { "accordion-item-toggle": "onAccordionItemToggle" },
    formAssociated: false
});
//# sourceMappingURL=accordion-item.js.map