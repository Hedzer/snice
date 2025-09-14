import { element, property, watch } from 'snice';
import css from './snice-tab-panel.css?inline';
import type { SniceTabPanelElement } from './snice-tabs.types';

@element('snice-tab-panel')
export class SniceTabPanel extends HTMLElement implements SniceTabPanelElement {
  @property({ reflect: true })
  name = '';

  @property({ reflect: true })
  transitionIn = '';

  @property({ reflect: true })
  transitionOut = '';

  @property({ reflect: true })
  transitioning: 'in' | 'out' | '' = '';

  @property({ type: Number, reflect: true })
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