import type { SniceBaseProps } from './types';
/**
 * Props for the Card component
 */
export interface CardProps extends SniceBaseProps {
    variant?: any;
    size?: any;
    clickable?: any;
    selected?: any;
    disabled?: any;
    hasHeader?: any;
    hasFooter?: any;
}
/**
 * Card - React adapter for snice-card
 *
 * This is an auto-generated React wrapper for the Snice card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/card';
 * import { Card } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Card />;
 * }
 * ```
 */
export declare const Card: import("react").ForwardRefExoticComponent<Omit<CardProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=card.d.ts.map