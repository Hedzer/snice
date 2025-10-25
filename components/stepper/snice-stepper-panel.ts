import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-stepper-panel.css?inline';
import type { SniceStepperPanelElement } from './snice-stepper-panel.types';

@element('snice-stepper-panel')
export class SniceStepperPanel extends HTMLElement implements SniceStepperPanelElement {
  @property({ type: Number })
  index = 0;

  @property({ type: Boolean, reflect: true })
  active = false;

  @styles()
  get componentStyles() {
    return css`${cssContent}`;
  }

  @render()
  renderContent() {
    return html`
      <div class="panel" part="panel">
        <slot></slot>
      </div>
    `;
  }
}
