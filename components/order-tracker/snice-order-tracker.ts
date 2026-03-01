import { element, property, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-order-tracker.css?inline';
import type {
  SniceOrderTrackerElement,
  OrderTrackerVariant,
  OrderStep,
  StepClickDetail
} from './snice-order-tracker.types';

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
      <svg class="tracker__step-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  private renderDefaultIcon(step: OrderStep, index: number): unknown {
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
          <div class="tracker__info-item">
            <span class="tracker__info-label">Carrier:</span>
            <span class="tracker__info-value">${this.carrier}</span>
          </div>
        </if>
        <if ${this.trackingNumber}>
          <div class="tracker__info-item">
            <span class="tracker__info-label">Tracking:</span>
            <span class="tracker__info-value">${this.trackingNumber}</span>
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
        <div class="${stepsClasses}" part="steps" role="list">
          ${this.steps.map((step: OrderStep, index: number) => {
            const stepClasses = [
              'tracker__step',
              `tracker__step--${step.status}`
            ].join(' ');

            return html/*html*/`
              <div class="${stepClasses}"
                   part="step"
                   role="listitem"
                   tabindex="0"
                   @click=${() => this.handleStepClick(step, index)}
                   @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleStepClick(step, index); } }}>
                <div class="tracker__step-indicator" part="step-indicator">
                  ${this.renderDefaultIcon(step, index)}
                </div>
                <div class="tracker__step-content" part="step-content">
                  <span class="tracker__step-label">${step.label}</span>
                  <if ${step.timestamp}>
                    <span class="tracker__step-timestamp">${step.timestamp}</span>
                  </if>
                  <if ${step.description}>
                    <span class="tracker__step-description">${step.description}</span>
                  </if>
                </div>
                <div class="tracker__step-connector"></div>
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
