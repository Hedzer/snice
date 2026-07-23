import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Card component
 */
export interface CardProps extends SniceBaseProps {
    variant?: any;
    size?: any;
    clickable?: any;
    selected?: any;
    disabled?: any;
    onCardClick?: (event: any) => void;
}
/**
 * Card - React adapter for snice-card
 *
 * This is an auto-generated React wrapper for the Snice card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/card/snice-card';
 * import { Card } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Card />;
 * }
 * ```
 */
export declare const Card: SniceReactComponent<CardProps, SniceComponentRef>;
//# sourceMappingURL=card.d.ts.map