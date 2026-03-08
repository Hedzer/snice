import { createReactAdapter } from './wrapper';
/**
 * Button - React adapter for snice-button
 *
 * This is an auto-generated React wrapper for the Snice button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/button';
 * import { Button } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Button />;
 * }
 * ```
 */
export const Button = createReactAdapter({
    tagName: 'snice-button',
    properties: ["variant", "size", "type", "disabled", "loading", "outline", "pill", "circle", "href", "target", "download", "icon", "iconPlacement"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=button.js.map