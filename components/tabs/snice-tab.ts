import { element, property, query, on, dispatch } from 'snice';
import css from './snice-tab.css?inline';
import type { TabSelectDetail, TabCloseDetail, SniceTabElement } from './snice-tabs.types';

@element('snice-tab')
export class SniceTab extends HTMLElement implements SniceTabElement {
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  closable = false;

  @query('.tab')
  tab?: HTMLElement;

  @query('.tab__close')
  closeButton?: HTMLButtonElement;

  html() {
    return /*html*/`
      <div class="tab ${this.disabled ? 'tab--disabled' : ''}" part="base" tabindex="0">
        <span class="tab__label" part="label">
          <slot></slot>
        </span>
        ${this.closable ? /*html*/`
          <button class="tab__close" part="close" tabindex="-1" aria-label="Close tab">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }

  css() {
    return css;
  }

  @on('click', '.tab__close')
  @dispatch('@snice/close')
  handleClose(event: MouseEvent): TabCloseDetail {
    event.stopPropagation();
    return { tab: this } as TabCloseDetail;
  }

  @on('click')
  @dispatch('@snice/tab-select')
  handleClick(event: MouseEvent): TabSelectDetail | undefined {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    return { tab: this } as TabSelectDetail;
  }

  focus(options?: FocusOptions) {
    this.tab?.focus(options);
  }

  blur() {
    this.tab?.blur();
  }
}