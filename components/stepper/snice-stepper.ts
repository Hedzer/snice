import { element, property, queryAll, render, styles, html, css, watch, ready } from 'snice';
import cssContent from './snice-stepper.css?inline';
import type { Step, StepStatus, StepperOrientation, SniceStepperElement } from './snice-stepper.types';
import type { SniceStepperPanelElement } from './snice-stepper-panel.types';

@element('snice-stepper')
export class SniceStepper extends HTMLElement implements SniceStepperElement {
  @property({ type: Array })
  steps: Step[] = [];

  @property({ type: Number })
  currentStep = 0;

  @property({  })
  orientation: StepperOrientation = 'horizontal';

  @property({ type: Boolean })
  clickable = false;

  @queryAll('snice-stepper-panel', { light: true, shadow: false })
  panels?: NodeListOf<SniceStepperPanelElement>;

  @ready()
  init() {
    // Initialize panels on first render
    setTimeout(() => this.updatePanels(), 0);
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private getStepStatus(index: number, step: Step): StepStatus {
    // Use explicit status if provided
    if (step.status) return step.status;

    // Auto-compute based on currentStep
    if (index < this.currentStep) return 'completed';
    if (index === this.currentStep) return 'active';
    return 'pending';
  }

  private handleStepClick(index: number) {
    if (!this.clickable) return;

    const event = new CustomEvent('step-change', {
      detail: {
        previousStep: this.currentStep,
        currentStep: index,
        step: this.steps[index]
      },
      bubbles: true,
      composed: true,
      cancelable: true
    });

    const shouldChange = this.dispatchEvent(event);
    if (shouldChange) {
      this.currentStep = index;
    }
  }

  @watch('currentStep')
  updatePanels() {
    // Update all stepper-panel children's active state
    if (!this.panels) return;
    this.panels.forEach((panel, index) => {
      panel.active = index === this.currentStep;
    });
  }

  @render()
  render() {
    const stepperClasses = [
      'stepper',
      `stepper--${this.orientation}`
    ].join(' ');

    return html`
      <div class="${stepperClasses}" part="container">
        ${this.steps.map((step: Step, index: number) => {
          const status = this.getStepStatus(index, step);
          const stepClasses = [
            'step',
            `step--${status}`,
            this.clickable ? 'step--clickable' : ''
          ].filter(Boolean).join(' ');

          return html`
            <div
              class="${stepClasses}"
              part="step"
              @click="${() => this.handleStepClick(index)}">

              <div class="step__indicator" part="step-indicator">
                <if ${status === 'completed'}>
                  ✓
                </if>
                <if ${status !== 'completed'}>
                  ${index + 1}
                </if>
              </div>

              <div class="step__content" part="step-content">
                <div class="step__label" part="step-label">${step.label}</div>
                <if ${step.description}>
                  <div class="step__description" part="step-description">${step.description}</div>
                </if>
              </div>

              <div class="step__connector" part="step-connector"></div>
            </div>
          `;
        })}
      </div>
      <div class="stepper__panels" part="panels">
        <slot></slot>
      </div>
    `;
  }
}
