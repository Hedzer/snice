import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Tabs component
 */
export interface TabsProps extends SniceBaseProps {
    placement?: any;
    selected?: any;
    noScrollControls?: any;
    transition?: any;
    onTabChange?: (event: any) => void;
}
/**
 * Tabs - React adapter for snice-tabs
 *
 * This is an auto-generated React wrapper for the Snice tabs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs/snice-tabs';
 * import { Tabs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tabs />;
 * }
 * ```
 */
export declare const Tabs: SniceReactComponent<TabsProps, SniceComponentRef>;
//# sourceMappingURL=tabs.d.ts.map