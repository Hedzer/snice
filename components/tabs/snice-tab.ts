import { element, property, query, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-tab.css?inline';
import type { TabSelectDetail, TabCloseDetail, SniceTabElement } from './snice-tabs.types';

@element('snice-tab')
export class SniceTab extends HTMLElement implements SniceTabElement {
  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  closable = false;

  @query('.tab')
  tab?: HTMLElement;

  @query('.tab__close')
  closeButton?: HTMLButtonElement;

  @render()
  render() {
    const tabClasses = `tab${this.disabled ? ' tab--disabled' : ''}`;

    return html/*html*/`
      <div class="${tabClasses}" part="base" tabindex="0" @click="${(e: MouseEvent) => this.handleClick(e)}">
        <span class="tab__label" part="label">
          <slot></slot>
        </span>
        <if ${this.closable}>
          <button class="tab__close" part="close" tabindex="-1" aria-label="Close tab">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Handle close button click
    if (target.closest('.tab__close')) {
      event.stopPropagation();
      this.dispatchCloseEvent();
      return;
    }

    // Handle tab click
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.dispatchSelectEvent();
  }

  @dispatch('@snice/close')
  private dispatchCloseEvent(): TabCloseDetail {
    return { tab: this } as TabCloseDetail;
  }

  @dispatch('@snice/tab-select')
  private dispatchSelectEvent(): TabSelectDetail {
    return { tab: this } as TabSelectDetail;
  }

  focus(options?: FocusOptions) {
    this.tab?.focus(options);
  }

  blur() {
    this.tab?.blur();
  }
}