import type { SniceBaseProps } from './types';
/**
 * Props for the FlipCard component
 */
export interface FlipCardProps extends SniceBaseProps {
    flipped?: any;
    clickToFlip?: any;
    direction?: any;
    duration?: any;
}
/**
 * FlipCard - React adapter for snice-flip-card
 *
 * This is an auto-generated React wrapper for the Snice flip-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/flip-card';
 * import { FlipCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FlipCard />;
 * }
 * ```
 */
export declare const FlipCard: import("react").ForwardRefExoticComponent<Omit<FlipCardProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=flip-card.d.ts.map