import { element, property, watch, ready, dispatch, on, render, styles, html, css, isSafeUrl } from 'snice';
import cssContent from './snice-link-preview.css?inline';
import type { LinkPreviewVariant, LinkPreviewSize, SniceLinkPreviewElement } from './snice-link-preview.types';

@element('snice-link-preview')
export class SniceLinkPreview extends HTMLElement implements SniceLinkPreviewElement {
  @property()
  url = '';

  // No reflection: a `title` attribute on the host would double as a native
  // browser tooltip over the whole link preview card.
  @property({ reflect: false })
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
    if (this.url && isSafeUrl(this.url)) {
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

  @ready()
  init() {
    this.stripNativeTooltip();
  }

  @watch('title')
  handleTitleChange() {
    this.stripNativeTooltip();
  }

  private stripNativeTooltip() {
    if (!this.hasAttribute('title')) return;
    const value = this.title || this.getAttribute('title') || '';
    this.removeAttribute('title');
    if (this.title !== value) {
      this.title = value;
    }
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
    const normalizedSite = this.siteName.trim().toLowerCase().replace(/^www\./, '');
    const normalizedDomain = domain.trim().toLowerCase().replace(/^www\./, '');
    const showDomain = Boolean(domain) && (!this.siteName || normalizedSite !== normalizedDomain);
    const hasFooter = Boolean(this.siteName || this.favicon || showDomain);

    return html/*html*/`
      <div part="base" class="link-preview"
           role="article"
           tabindex="0"
           aria-label="${this.title || 'Link preview'}">
        <if ${this.image}>
          <div part="media" class="link-preview__image">
            <img part="image" src="${this.image}" alt="" loading="lazy">
          </div>
        </if>
        <if ${!this.image}>
          <div part="media" class="link-preview__image">
            <div part="placeholder" class="link-preview__image-placeholder">
              <svg part="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </if>
        <div part="content" class="link-preview__content">
          <if ${this.title}>
            <p part="title" class="link-preview__title">${this.title}</p>
          </if>
          <if ${this.description}>
            <p part="description" class="link-preview__description">${this.description}</p>
          </if>
          <if ${hasFooter}>
            <div part="footer" class="link-preview__footer">
              <if ${this.favicon}>
                <img part="favicon" class="link-preview__favicon" src="${this.favicon}" alt="">
              </if>
              <if ${this.siteName}>
                <span part="site-name" class="link-preview__site-name">${this.siteName}</span>
              </if>
              <if ${this.siteName && showDomain}>
                <span part="separator" class="link-preview__footer-separator">&middot;</span>
              </if>
              <if ${showDomain}>
                <span part="domain" class="link-preview__domain">${domain}</span>
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
