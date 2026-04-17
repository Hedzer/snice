// GENERATED FILE — DO NOT EDIT.
// Source: components/accordion/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const Accordion = createReactAdapter({
    tagName: 'snice-accordion',
    properties: ["multiple", "variant"],
    events: { "accordion-open": "onAccordionOpen", "accordion-close": "onAccordionClose" },
    formAssociated: false
});
//# sourceMappingURL=accordion.js.map