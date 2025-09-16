import { element, property } from 'snice';
import css from './snice-layout-fullscreen.css?inline';

@element('snice-layout-fullscreen')
export class SniceLayoutFullscreen extends HTMLElement {
  @property({ type: Boolean, reflect: true })
  overlay = false;

  html() {
    return /*html*/`
      <div class="layout">
        <div class="background">
          <slot name="background"></slot>
        </div>
        
        <div class="overlay">
          <slot name="overlay"></slot>
        </div>
        
        <div class="content">
          <slot></slot>
        </div>
        
        <div class="controls">
          <slot name="controls"></slot>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }
}