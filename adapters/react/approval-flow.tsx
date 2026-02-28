import { createReactAdapter } from './wrapper';
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
export const ApprovalFlow = createReactAdapter<ApprovalFlowProps>({
  tagName: 'snice-approval-flow',
  properties: ["steps","orientation","currentStep"],
  events: {},
  formAssociated: false
});
