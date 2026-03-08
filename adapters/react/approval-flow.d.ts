import type { SniceBaseProps } from './types';
/**
 * Props for the ApprovalFlow component
 */
export interface ApprovalFlowProps extends SniceBaseProps {
    steps?: any;
    orientation?: any;
    currentStep?: any;
}
/**
 * ApprovalFlow - React adapter for snice-approval-flow
 *
 * This is an auto-generated React wrapper for the Snice approval-flow component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/approval-flow';
 * import { ApprovalFlow } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ApprovalFlow />;
 * }
 * ```
 */
export declare const ApprovalFlow: import("react").ForwardRefExoticComponent<Omit<ApprovalFlowProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=approval-flow.d.ts.map