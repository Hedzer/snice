import { element, property, watch, render, styles, html, css } from 'snice';
import cssContent from './snice-tab-panel.css?inline';
import type { SniceTabPanelElement } from './snice-tabs.types';

@element('snice-tab-panel')
export class SniceTabPanel extends HTMLElement implements SniceTabPanelElement {
  @property({  })
  name = '';

  @property({  })
  transitionIn = '';

  @property({  })
  transitionOut = '';

  @property({  })
  transitioning: 'in' | 'out' | '' = '';

  @property({ type: Number,  })
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

  @render()
  render() {
    return html/*html*/`
      <div class="tab-panel" part="base">
        <slot></slot>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}