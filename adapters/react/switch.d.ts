import type { SniceFormProps } from './types';
/**
 * Props for the Switch component
 */
export interface SwitchProps extends SniceFormProps {
    defaultChecked?: any;
    disabled?: any;
    loading?: any;
    required?: any;
    invalid?: any;
    size?: any;
    name?: any;
    value?: any;
    label?: any;
    labelOn?: any;
    labelOff?: any;
    checked?: any;
    onSwitchChange?: (event: any) => void;
}
/**
 * Switch - React adapter for snice-switch
 *
 * This is an auto-generated React wrapper for the Snice switch component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/switch';
 * import { Switch } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Switch />;
 * }
 * ```
 */
export declare const Switch: import("react").ForwardRefExoticComponent<Omit<SwitchProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=switch.d.ts.map