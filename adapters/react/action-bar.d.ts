import type { SniceBaseProps } from './types';
/**
 * Props for the ActionBar component
 */
export interface ActionBarProps extends SniceBaseProps {
    open?: any;
    position?: any;
    size?: any;
    variant?: any;
    noAnimation?: any;
    noEscapeDismiss?: any;
}
/**
 * ActionBar - React adapter for snice-action-bar
 *
 * This is an auto-generated React wrapper for the Snice action-bar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/action-bar';
 * import { ActionBar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActionBar />;
 * }
 * ```
 */
export declare const ActionBar: import("react").ForwardRefExoticComponent<Omit<ActionBarProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=action-bar.d.ts.map