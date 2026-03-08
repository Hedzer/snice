import type { SniceBaseProps } from './types';
/**
 * Props for the Drawer component
 */
export interface DrawerProps extends SniceBaseProps {
    open?: any;
    position?: any;
    size?: any;
    inline?: any;
    breakpoint?: any;
    noBackdrop?: any;
    noBackdropDismiss?: any;
    noEscapeDismiss?: any;
    noFocusTrap?: any;
    persistent?: any;
    pushContent?: any;
    contained?: any;
    noHeader?: any;
    noFooter?: any;
}
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
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<DrawerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=drawer.d.ts.map