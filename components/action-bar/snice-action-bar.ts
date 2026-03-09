import { element, property, query, watch, dispatch, render, styles, on, ready } from 'snice';
import { html, css } from 'snice';
import cssContent from './snice-action-bar.css?inline';
import type { ActionBarPosition, ActionBarSize, ActionBarVariant, SniceActionBarElement, ActionBarEventDetail } from './snice-action-bar.types';

@element('snice-action-bar')
export class SniceActionBar extends HTMLElement implements SniceActionBarElement {
  @property({ type: Boolean }) open = false;
  @property() position: ActionBarPosition = 'bottom';
  @property() size: ActionBarSize = 'medium';
  @property() variant: ActionBarVariant = 'default';
  @property({ type: Boolean, attribute: 'no-animation' }) noAnimation = false;
  @property({ type: Boolean, attribute: 'no-escape-dismiss' }) noEscapeDismiss = false;

  @query('slot') private slotElement?: HTMLSlotElement;

  @ready()
  onReady() {
    this.setAttribute('data-ready', '');
  }

  @watch('open')
  handleOpenChange() {
    if (this.open) {
      this.setAttribute('open', '');
      this.emitOpen();
    } else {
      this.removeAttribute('open');
      this.emitClose();
    }
  }

  @watch('noAnimation')
  updateNoAnimationAttribute() {
    if (this.noAnimation) {
      this.setAttribute('no-animation', '');
    } else {
      this.removeAttribute('no-animation');
    }
  }

  @dispatch('action-bar-open', { bubbles: true, composed: true })
  private emitOpen(): ActionBarEventDetail {
    return { actionBar: this };
  }

  @dispatch('action-bar-close', { bubbles: true, composed: true })
  private emitClose(): ActionBarEventDetail {
    return { actionBar: this };
  }

  @on('keydown')
  handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !this.noEscapeDismiss) {
      this.hide();
      return;
    }

    const focusable = this.getFocusableChildren();
    if (focusable.length === 0) return;

    const current = focusable.indexOf(document.activeElement as HTMLElement);
    let next = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = current < focusable.length - 1 ? current + 1 : 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = current > 0 ? current - 1 : focusable.length - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = focusable.length - 1;
    }

    if (next >= 0) {
      focusable[next].focus();
    }
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }

  private getFocusableChildren(): HTMLElement[] {
    if (!this.slotElement) return [];
    const elements = this.slotElement.assignedElements({ flatten: true }) as HTMLElement[];
    return elements.filter(el =>
      !el.hasAttribute('disabled') &&
      (el.tabIndex >= 0 || el.matches('button, [href], input, select, textarea, [tabindex]'))
    );
  }

  @render()
  template() {
    return html`
      <div class="action-bar" role="toolbar" aria-label="Actions" part="base">
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
