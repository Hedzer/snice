import { layout } from '../../../src/index';

@layout('minimal-layout')
export class MinimalLayout extends HTMLElement {
  html() {
    return /*html*/`
      <main class="minimal-content">
        <slot name="page"></slot>
      </main>
    `;
  }

  css() {
    return /*css*/`
      :host {
        display: block;
        min-height: 100vh;
      }
      
      .minimal-content {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    `;
  }
}