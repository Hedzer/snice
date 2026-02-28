import { element, property, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-user-card.css?inline';
import type { UserCardVariant, UserCardStatus, SocialLink, SniceUserCardElement } from './snice-user-card.types';

@element('snice-user-card')
export class SniceUserCard extends HTMLElement implements SniceUserCardElement {
  @property()
  name = '';

  @property()
  avatar = '';

  @property()
  role = '';

  @property()
  company = '';

  @property()
  email = '';

  @property()
  phone = '';

  @property()
  location = '';

  @property({ type: Array, attribute: false })
  social: SocialLink[] = [];

  @property()
  status: UserCardStatus = 'offline';

  @property()
  variant: UserCardVariant = 'card';

  @render()
  renderContent() {
    const initials = this.getInitials(this.name);
    const roleText = [this.role, this.company].filter(Boolean).join(' at ');
    const hasContact = this.email || this.phone || this.location;
    const hasSocial = this.social && this.social.length > 0;

    return html/*html*/`
      <div part="base" class="user-card">
        <div class="user-card-avatar-wrapper" part="avatar">
          <if ${this.avatar}>
            <img class="user-card-avatar"
                 src="${this.avatar}"
                 alt="${this.name}"
                 loading="lazy"
                 @error=${this.handleAvatarError}>
          </if>
          <if ${!this.avatar}>
            <div class="user-card-avatar-fallback">${initials}</div>
          </if>
          <if ${this.status}>
            <span class="user-card-status" part="status"
                  role="img"
                  aria-label="${this.status}"></span>
          </if>
        </div>

        <div class="user-card-info">
          <if ${this.name}>
            <h3 class="user-card-name" part="name">${this.name}</h3>
          </if>
          <if ${roleText}>
            <p class="user-card-role" part="role">${roleText}</p>
          </if>

          <if ${hasContact}>
            <div class="user-card-contact" part="contact">
              <if ${this.email}>
                <div class="user-card-contact-item">
                  <svg class="user-card-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <a class="user-card-contact-link" href="mailto:${this.email}">${this.email}</a>
                </div>
              </if>
              <if ${this.phone}>
                <div class="user-card-contact-item">
                  <svg class="user-card-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <a class="user-card-contact-link" href="tel:${this.phone}">${this.phone}</a>
                </div>
              </if>
              <if ${this.location}>
                <div class="user-card-contact-item">
                  <svg class="user-card-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span class="user-card-contact-text">${this.location}</span>
                </div>
              </if>
            </div>
          </if>

          <if ${hasSocial}>
            <div class="user-card-social" part="social">
              ${this.social.map(link => html/*html*/`
                <button class="user-card-social-link"
                        title="${link.platform}"
                        aria-label="${link.platform}"
                        @click=${() => this.handleSocialClick(link)}>
                  ${this.renderSocialIcon(link.platform)}
                </button>
              `)}
            </div>
          </if>

          <div class="user-card-actions" part="actions">
            <slot @slotchange=${this.handleSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  private handleAvatarError = () => {
    // Hide the broken image and show fallback
    const img = this.shadowRoot?.querySelector('.user-card-avatar') as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'user-card-avatar-fallback';
      fallback.textContent = this.getInitials(this.name);
      img.parentElement?.insertBefore(fallback, img);
    }
  }

  private handleSlotChange = () => {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement;
    const actions = this.shadowRoot?.querySelector('.user-card-actions') as HTMLElement;
    if (slot && actions) {
      const hasContent = slot.assignedNodes().length > 0;
      actions.hidden = !hasContent;
    }
  }

  @dispatch('social-click', { bubbles: true, composed: true })
  private handleSocialClick(link: SocialLink) {
    return { platform: link.platform, url: link.url };
  }

  @dispatch('action-click', { bubbles: true, composed: true })
  emitActionClick(action: string) {
    return { action };
  }

  private getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  private renderSocialIcon(platform: string) {
    const p = platform.toLowerCase();
    // Common social platform icons as inline SVG
    switch (p) {
      case 'github':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
      case 'twitter':
      case 'x':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
      case 'linkedin':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
      case 'facebook':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
      case 'instagram':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.882 0 1.441 1.441 0 0 1 2.882 0z"/></svg>`;
      case 'youtube':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
      case 'website':
      case 'web':
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
      default:
        // Generic link icon
        return html`<svg class="user-card-social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    }
  }
}
