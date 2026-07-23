// GENERATED FILE — DO NOT EDIT.
// Source: components/approval-flow/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * ApprovalFlow - React adapter for snice-approval-flow
 *
 * This is an auto-generated React wrapper for the Snice approval-flow component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/approval-flow/snice-approval-flow';
 * import { ApprovalFlow } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ApprovalFlow />;
 * }
 * ```
 */
export const ApprovalFlow = createReactAdapter({
    tagName: 'snice-approval-flow',
    properties: ["steps", "orientation", "currentStep"],
    events: { "step-approve": "onStepApprove", "step-reject": "onStepReject", "step-comment": "onStepComment" },
    formAssociated: false
});
//# sourceMappingURL=approval-flow.js.map