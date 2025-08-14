import { element, property, watch } from '../../src/index';
import css from './snice-tab-panel.css?inline';

@element('snice-tab-panel')
export class SniceTabPanel extends HTMLElement {
  @property()
  name = '';

  @property({ reflect: true })
  transitionIn = '';

  @property({ reflect: true })
  transitionOut = '';

  @property({ reflect: true })
  transitioning: 'in' | 'out' | '' = '';

  @property({ type: Number })
  transitionDuration = 300;

  @watch('transitionIn')
  handleTransitionIn() {
    if (this.transitionIn) {
      this.transitioning = 'in';
    }
  }

  @watch('transitionOut')
  handleTransitionOut() {
    if (this.transitionOut) {
      this.transitioning = 'out';
    }
  }

  html() {
    return /*html*/`
      <div class="tab-panel" part="base">
        <slot></slot>
      </div>
    `;
  }

  css() {
    return css;
  }
}