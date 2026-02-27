import { element, property, dispatch, on, render, styles, html, css } from 'snice';
import cssContent from './snice-link-preview.css?inline';
import type { LinkPreviewVariant, LinkPreviewSize, SniceLinkPreviewElement } from './snice-link-preview.types';

@element('snice-link-preview')
export class SniceLinkPreview extends HTMLElement implements SniceLinkPreviewElement {
  @property()
  url = '';

  @property()
  title = '';

  @property()
  description = '';

  @property()
  image = '';

  @property({ attribute: 'site-name' })
  siteName = '';

  @property()
  favicon = '';

  @property()
  variant: LinkPreviewVariant = 'vertical';

  @property()
  size: LinkPreviewSize = 'medium';

  @on('click')
  private handleClick() {
    if (this.url) {
      this.dispatchLinkClick();
      window.open(this.url, '_blank', 'noopener,noreferrer');
    }
  }

  @on('keydown')
  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  }

  @dispatch('link-click', { bubbles: true, composed: true })
  private dispatchLinkClick() {
    return { url: this.url };
  }

  private getDomain(): string {
    if (!this.url) return '';
    try {
      return new URL(this.url).hostname;
    } catch {
      return this.url;
    }
  }

  @render()
  render() {
    const domain = this.getDomain();
    const hasFooter = this.siteName || this.favicon || domain;

    return html/*html*/`
      <div part="base" class="link-preview"
           role="article"
           tabindex="0"
           aria-label="${this.title || 'Link preview'}">
        <if ${this.image}>
          <div class="link-preview__image">
            <img src="${this.image}" alt="" loading="lazy">
          </div>
        </if>
        <if ${!this.image}>
          <div class="link-preview__image">
            <div class="link-preview__image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.924-1.024a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.75 8.064" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </if>
        <div part="content" class="link-preview__content">
          <if ${this.title}>
            <p part="title" class="link-preview__title">${this.title}</p>
          </if>
          <if ${this.description}>
            <p class="link-preview__description">${this.description}</p>
          </if>
          <if ${hasFooter}>
            <div class="link-preview__footer">
              <if ${this.favicon}>
                <img class="link-preview__favicon" src="${this.favicon}" alt="">
              </if>
              <if ${this.siteName}>
                <span class="link-preview__site-name">${this.siteName}</span>
              </if>
              <if ${this.siteName && domain}>
                <span class="link-preview__footer-separator">&middot;</span>
              </if>
              <if ${domain}>
                <span class="link-preview__domain">${domain}</span>
              </if>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-link-preview': SniceLinkPreview;
  }
}
