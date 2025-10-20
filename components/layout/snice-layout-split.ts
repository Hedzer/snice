import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-split.css?inline';

@element('snice-layout-split')
export class SniceLayoutSplit extends HTMLElement {
  @property({  })
  direction: 'horizontal' | 'vertical' = 'horizontal';

  @property({  })
  ratio: '50-50' | '60-40' | '70-30' | '33-67' | '67-33' = '50-50';

  @render()
  renderContent() {
    return html/*html*/`
      <div class="layout">
        <div class="panel panel-left">
          <slot name="left"></slot>
        </div>
        <div class="divider"></div>
        <div class="panel panel-right">
          <slot name="right"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}