import { element, property, render, styles, html, css, watch } from 'snice';
import cssContent from './snice-stepper-panel.css?inline';
import type { SniceStepperPanelElement } from './snice-stepper-panel.types';

@element('snice-stepper-panel')
export class SniceStepperPanel extends HTMLElement implements SniceStepperPanelElement {
  @property({ type: Number })
  index = 0;

  @property({ type: Boolean })
  active = false;

  @watch('active')
  updateActiveAttribute() {
    if (this.active) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  render() {
    return html/*html*/`
      <div class="panel" part="panel">
        <slot></slot>
      </div>
    `;
  }
}
