import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Plan component
 */
export interface PlanProps extends SniceBaseProps {
    'name'?: string;
    'price'?: string | number;
    'annual-price'?: string | number;
    'highlighted'?: boolean;
    'badge'?: string;
    'cta'?: string;
    'period'?: string;
    'currency'?: string;
    'description'?: string;
}
/**
 * Plan - React adapter for snice-plan
 *
 * This is an auto-generated React wrapper for the Snice plan component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pricing-table/snice-pricing-table';
 * import { Plan } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Plan />;
 * }
 * ```
 */
export declare const Plan: SniceReactComponent<PlanProps, SniceComponentRef>;
//# sourceMappingURL=plan.d.ts.map