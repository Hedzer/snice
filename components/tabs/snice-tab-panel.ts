import { element, property } from '../../src/index';
import css from './snice-tab-panel.css?inline';

@element('snice-tab-panel')
export class SniceTabPanel extends HTMLElement {
  @property()
  name = '';

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