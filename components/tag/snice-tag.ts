import { element, property, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-tag.css?inline';
import type { TagVariant, TagSize, SniceTagElement } from './snice-tag.types';

@element('snice-tag')
export class SniceTag extends HTMLElement implements SniceTagElement {
  @property()
  variant: TagVariant = 'default';

  @property()
  size: TagSize = 'medium';

  @property({ type: Boolean })
  removable = false;

  @property({ type: Boolean })
  outline = false;

  @property({ type: Boolean })
  pill = false;

  @render()
  renderContent() {
    return html/*html*/`
      <span class="tag" part="base">
        <span class="tag-icon" part="icon">
          <slot name="icon"></slot>
        </span>
        <span class="tag-label" part="label">
          <slot></slot>
        </span>
        <if ${this.removable}>
          <button class="tag-remove"
                  type="button"
                  tabindex="-1"
                  aria-label="Remove"
                  @click=${this.handleRemove}>
            <svg viewBox="0 0 14 14" fill="currentColor">
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
            </svg>
          </button>
        </if>
      </span>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  private handleRemove(e: MouseEvent) {
    e.stopPropagation();
    this.dispatchTagRemove();
  }

  @dispatch('tag-remove', { bubbles: true, composed: true })
  private dispatchTagRemove() {
    return { tag: this };
  }
}
