import { element, property, dispatch, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-order-tracker.css?inline';
import type {
  SniceOrderTrackerElement,
  OrderTrackerVariant,
  OrderStep,
  StepClickDetail
} from './snice-order-tracker.types';

/** Layout state token added to the steps list's part — one entry per `OrderTrackerVariant`. */
const STEPS_VARIANT_PARTS = { horizontal: ' steps-horizontal', vertical: ' steps-vertical' } satisfies Record<OrderTrackerVariant, string>;

@element('snice-order-tracker')
export class SniceOrderTracker extends HTMLElement implements SniceOrderTrackerElement {
  @property({ type: Array, attribute: false })
  steps: OrderStep[] = [];

  @property({ attribute: 'tracking-number' })
  trackingNumber = '';

  @property()
  carrier = '';

  @property()
  variant: OrderTrackerVariant = 'horizontal';

  private handleStepClick(step: OrderStep, index: number) {
    this.emitStepClick({ step, index });
  }

  @dispatch('step-click', { bubbles: true, composed: true })
  private emitStepClick(detail?: StepClickDetail): StepClickDetail {
    return detail!;
  }

  private renderCheckIcon(): unknown {
    return html/*html*/`
      <svg class="tracker__step-icon" part="step-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  private renderDefaultIcon(step: OrderStep, index: number): unknown {
    if (step.icon) {
      return renderIcon(step.icon, 'tracker__step-icon-authored');
    }
    if (step.status === 'completed') {
      return this.renderCheckIcon();
    }
    return html`${index + 1}`;
  }

  private renderTrackingInfo(): unknown {
    const hasTracking = this.trackingNumber || this.carrier;
    if (!hasTracking) return html``;

    return html/*html*/`
      <div class="tracker__info" part="info">
        <if ${this.carrier}>
          <div class="tracker__info-item" part="info-item">
            <span class="tracker__info-label" part="info-label">Carrier:</span>
            <span class="tracker__info-value" part="info-value">${this.carrier}</span>
          </div>
        </if>
        <if ${this.trackingNumber}>
          <div class="tracker__info-item" part="info-item">
            <span class="tracker__info-label" part="info-label">Tracking:</span>
            <span class="tracker__info-value" part="info-value">${this.trackingNumber}</span>
          </div>
        </if>
      </div>
    `;
  }

  @render()
  renderContent() {
    const stepsClasses = `tracker__steps tracker__steps--${this.variant}`;

    return html/*html*/`
      <div class="tracker" part="base">
        ${this.renderTrackingInfo()}
        <div class="${stepsClasses}" part="steps${STEPS_VARIANT_PARTS[this.variant] ?? ''}" role="list">
          ${this.steps.map((step: OrderStep, index: number) => {
            const stepClasses = [
              'tracker__step',
              `tracker__step--${step.status}`
            ].join(' ');
            const isCompleted = step.status === 'completed';
            const isActiveStep = step.status === 'active';

            return html/*html*/`
              <div class="${stepClasses}"
                   part="step ${isCompleted ? 'step-completed' : isActiveStep ? 'step-active' : 'step-pending'}"
                   role="listitem"
                   aria-current="${step.status === 'active' ? 'step' : 'false'}"
                   tabindex="0"
                   @click=${() => this.handleStepClick(step, index)}
                   @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleStepClick(step, index); } }}>
                <div class="tracker__step-indicator" part="step-indicator ${isCompleted ? 'step-indicator-completed' : isActiveStep ? 'step-indicator-active' : 'step-indicator-pending'}">
                  ${this.renderDefaultIcon(step, index)}
                </div>
                <div class="tracker__step-content" part="step-content">
                  <span class="tracker__step-label" part="step-label ${isCompleted ? 'step-label-completed' : isActiveStep ? 'step-label-active' : 'step-label-pending'}">${step.label}</span>
                  <if ${step.timestamp}>
                    <span class="tracker__step-timestamp" part="step-timestamp">${step.timestamp}</span>
                  </if>
                  <if ${step.description}>
                    <span class="tracker__step-description" part="step-description">${step.description}</span>
                  </if>
                </div>
                <div class="tracker__step-connector" part="step-connector ${isCompleted ? 'step-connector-completed' : isActiveStep ? 'step-connector-active' : 'step-connector-pending'}"></div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
