import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    onDrawerOpen?: (event: any) => void;
    onDrawerClose?: (event: any) => void;
}
/**
 * Drawer - React adapter for snice-drawer
 *
 * This is an auto-generated React wrapper for the Snice drawer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/drawer/snice-drawer';
 * import { Drawer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Drawer />;
 * }
 * ```
 */
export declare const Drawer: SniceReactComponent<DrawerProps, SniceComponentRef>;
//# sourceMappingURL=drawer.d.ts.map