import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the SplitButton component
 */
export interface SplitButtonProps extends SniceBaseProps {
    label?: any;
    actions?: any;
    variant?: any;
    size?: any;
    disabled?: any;
    loading?: any;
    outline?: any;
    pill?: any;
    icon?: any;
    iconPlacement?: any;
    onPrimaryClick?: (event: any) => void;
    onActionClick?: (event: any) => void;
}
/**
 * SplitButton - React adapter for snice-split-button
 *
 * This is an auto-generated React wrapper for the Snice split-button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-button/snice-split-button';
 * import { SplitButton } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitButton />;
 * }
 * ```
 */
export declare const SplitButton: SniceReactComponent<SplitButtonProps, SniceComponentRef>;
//# sourceMappingURL=split-button.d.ts.map