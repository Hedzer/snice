import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Rating component
 */
export interface RatingProps extends SniceBaseProps {
    value?: any;
    max?: any;
    icon?: any;
    emptyIcon?: any;
    size?: any;
    readonly?: any;
    precision?: any;
    onRatingChange?: (event: any) => void;
}
/**
 * Rating - React adapter for snice-rating
 *
 * This is an auto-generated React wrapper for the Snice rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/rating/snice-rating';
 * import { Rating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Rating />;
 * }
 * ```
 */
export declare const Rating: SniceReactComponent<RatingProps, SniceComponentRef>;
//# sourceMappingURL=rating.d.ts.map