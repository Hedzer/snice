import { element, property } from 'snice';
import css from './snice-layout-split.css?inline';

@element('snice-layout-split')
export class SniceLayoutSplit extends HTMLElement {
  @property({ reflect: true })
  direction: 'horizontal' | 'vertical' = 'horizontal';
  
  @property({ reflect: true })
  ratio: '50-50' | '60-40' | '70-30' | '33-67' | '67-33' = '50-50';

  html() {
    return /*html*/`
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

  css() {
    return css;
  }
}