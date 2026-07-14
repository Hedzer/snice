export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';
export type ApprovalOrientation = 'horizontal' | 'vertical';

export interface ApprovalStep {
  id: string;
  approver: string;
  role?: string;
  avatar?: string;
  status: ApprovalStatus;
  comment?: string;
  timestamp?: string;
}

export interface SniceApprovalFlowElement extends HTMLElement {
  steps: ApprovalStep[];
  orientation: ApprovalOrientation;
  currentStep: string;
}

export interface SniceApprovalFlowEventMap {
  'step-approve': CustomEvent<{ step: ApprovalStep }>;
  'step-reject': CustomEvent<{ step: ApprovalStep }>;
  'step-comment': CustomEvent<{ step: ApprovalStep; comment: string }>;
}
