import type { SniceBaseProps } from './types';
/**
 * Props for the Badge component
 */
export interface BadgeProps extends SniceBaseProps {
    content?: any;
    count?: any;
    max?: any;
    dot?: any;
    variant?: any;
    position?: any;
    inline?: any;
    size?: any;
    pulse?: any;
    offset?: any;
}
/**
 * Badge - React adapter for snice-badge
 *
 * This is an auto-generated React wrapper for the Snice badge component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/badge';
 * import { Badge } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Badge />;
 * }
 * ```
 */
export declare const Badge: import("react").ForwardRefExoticComponent<Omit<BadgeProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=badge.d.ts.map