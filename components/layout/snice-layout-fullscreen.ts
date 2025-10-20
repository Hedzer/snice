import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-fullscreen.css?inline';

@element('snice-layout-fullscreen')
export class SniceLayoutFullscreen extends HTMLElement {
  @property({ type: Boolean,  })
  overlay = false;

  @render()
  renderContent() {
    return html/*html*/`
      <div class="layout">
        <div class="background">
          <slot name="background"></slot>
        </div>

        <div class="overlay">
          <slot name="overlay"></slot>
        </div>

        <div class="content">
          <slot name="page"></slot>
        </div>

        <div class="controls">
          <slot name="controls"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}