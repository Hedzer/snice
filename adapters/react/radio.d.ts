import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the Radio component
 */
export interface RadioProps extends SniceFormProps {
    defaultChecked?: any;
    disabled?: any;
    loading?: any;
    required?: any;
    invalid?: any;
    variant?: any;
    size?: any;
    name?: any;
    value?: any;
    label?: any;
    description?: any;
    checked?: any;
    onRadioChange?: (event: any) => void;
}
/**
 * Radio - React adapter for snice-radio
 *
 * This is an auto-generated React wrapper for the Snice radio component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/radio/snice-radio';
 * import { Radio } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Radio />;
 * }
 * ```
 */
export declare const Radio: SniceReactComponent<RadioProps, SniceFormRef>;
//# sourceMappingURL=radio.d.ts.map