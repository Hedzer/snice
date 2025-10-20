import { element, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-minimal.css?inline';

@element('snice-layout-minimal')
export class SniceLayoutMinimal extends HTMLElement {
  @render()
  renderContent() {
    return html/*html*/`
      <div class="layout">
        <main class="main">
          <slot name="page"></slot>
        </main>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}