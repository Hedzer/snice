import { createReactAdapter } from './wrapper';
/**
 * Drawer - React adapter for snice-drawer
 *
 * This is an auto-generated React wrapper for the Snice drawer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/drawer';
 * import { Drawer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Drawer />;
 * }
 * ```
 */
export const Drawer = createReactAdapter({
    tagName: 'snice-drawer',
    properties: ["open", "position", "size", "inline", "breakpoint", "noBackdrop", "noBackdropDismiss", "noEscapeDismiss", "noFocusTrap", "persistent", "pushContent", "contained", "noHeader", "noFooter"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=drawer.js.map