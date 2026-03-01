import { element, property, render, styles, html, css, dispatch } from 'snice';
import cssContent from './snice-approval-flow.css?inline';
import type { ApprovalStep, ApprovalOrientation, SniceApprovalFlowElement } from './snice-approval-flow.types';

@element('snice-approval-flow')
export class SniceApprovalFlow extends HTMLElement implements SniceApprovalFlowElement {
  @property({ type: Array, attribute: false })
  steps: ApprovalStep[] = [];

  @property()
  orientation: ApprovalOrientation = 'horizontal';

  @property()
  currentStep = '';

  @dispatch('step-approve', { bubbles: true, composed: true })
  private emitApprove(step: ApprovalStep) {
    return { step };
  }

  @dispatch('step-reject', { bubbles: true, composed: true })
  private emitReject(step: ApprovalStep) {
    return { step };
  }

  @dispatch('step-comment', { bubbles: true, composed: true })
  private emitComment(step: ApprovalStep, comment: string) {
    return { step, comment };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2);
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      skipped: 'Skipped'
    };
    return labels[status] || status;
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      approved: '✓',
      rejected: '✕',
      skipped: '⏭'
    };
    return icons[status] || '';
  }

  private handleApprove(step: ApprovalStep) {
    this.emitApprove(step);
  }

  private handleReject(step: ApprovalStep) {
    this.emitReject(step);
  }

  @render()
  render() {
    const flowClasses = [
      'flow',
      `flow--${this.orientation}`
    ].join(' ');

    return html/*html*/`
      <div class="${flowClasses}" part="container" role="list">
        ${this.steps.map((step: ApprovalStep) => this.renderStep(step))}
      </div>
    `;
  }

  private renderStep(step: ApprovalStep) {
    const isCurrent = step.id === this.currentStep;
    const stepClasses = [
      'step',
      `step--${step.status}`,
      isCurrent ? 'step--current' : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${stepClasses}" part="step" role="listitem">
        <div class="step__avatar" part="avatar">
          <if ${step.avatar}>
            <img src="${step.avatar}" alt="${step.approver}" />
          </if>
          <if ${!step.avatar}>
            ${this.getInitials(step.approver)}
          </if>
        </div>

        <div class="step__content" part="content">
          <div class="step__name" part="name">${step.approver}</div>
          <if ${step.role}>
            <div class="step__role" part="role">${step.role}</div>
          </if>
          <div class="step__status" part="status">
            <span>${this.getStatusIcon(step.status)}</span>
            <span>${this.getStatusLabel(step.status)}</span>
          </div>
          <if ${step.comment}>
            <div class="step__comment" part="comment">"${step.comment}"</div>
          </if>
          <if ${step.timestamp}>
            <div class="step__timestamp" part="timestamp">${step.timestamp}</div>
          </if>
          <if ${isCurrent && step.status === 'pending'}>
            <div class="step__actions" part="actions">
              <button class="step__btn step__btn--approve" @click=${() => this.handleApprove(step)}>Approve</button>
              <button class="step__btn step__btn--reject" @click=${() => this.handleReject(step)}>Reject</button>
            </div>
          </if>
        </div>

        <div class="step__connector" part="connector"></div>
      </div>
    `;
  }
}
