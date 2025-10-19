import { element, property, watch, query, ready, render, styles, html } from 'snice';
import cssContent from './snice-avatar.css?inline';
import type { AvatarSize, AvatarShape, SniceAvatarElement } from './snice-avatar.types';

@element('snice-avatar')
export class SniceAvatar extends HTMLElement implements SniceAvatarElement {
  @property({  })
  src = '';

  @property({  })
  alt = '';

  @property({  })
  name = '';

  @property({  })
  size: AvatarSize = 'medium';

  @property({  })
  shape: AvatarShape = 'circle';

  @property({ attribute: 'fallback-color',  })
  fallbackColor = '#ffffff';

  @property({ attribute: 'fallback-background',  })
  fallbackBackground = '';

  @query('.avatar-image')
  imageElement?: HTMLImageElement;

  @query('.avatar-fallback')
  fallbackElement?: HTMLElement;

  private imageError = false;

  @render()
  renderContent() {
    const colorClass = this.fallbackBackground ? '' : this.getColorClass(this.name);
    const bgStyle = this.fallbackBackground ? `--avatar-bg: ${this.fallbackBackground}; --avatar-color: ${this.fallbackColor}` : '';

    return html`
      <div class="avatar ${colorClass}" style="${bgStyle}">
        ${this.renderImageSection()}
        ${this.renderFallbackSection()}
      </div>
    `;
  }

  renderImageSection() {
    return this.src ? html`
      <img class="avatar-image ${this.imageError ? 'avatar-image--error' : ''}"
           src="${this.src}"
           alt="${this.alt || this.name}"
           loading="lazy"
           @load=${this.handleImageLoad}
           @error=${this.handleImageError}>
    ` : '';
  }

  renderFallbackSection() {
    const initials = this.getInitials(this.name);
    return html`
      <div class="avatar-fallback ${!this.src || this.imageError ? 'avatar-fallback--visible' : ''}">
        ${initials || this.renderIcon()}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssContent;
  }

  @ready()
  init() {
    // Image handlers are now attached via template events
  }

  handleImageLoad() {
    this.imageError = false;
  }

  handleImageError() {
    this.imageError = true;
  }


  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  private getColorClass(name: string): string {
    if (!name) return '';
    
    const colors = [
      'red', 'orange', 'yellow', 'lime', 'green',
      'teal', 'cyan', 'sky', 'blue', 'indigo',
      'violet', 'purple', 'fuchsia', 'pink', 'rose'
    ];
    
    // Hash the name to get a consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return `avatar--${colors[colorIndex]}`;
  }

  private renderIcon() {
    return html`
      <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
  }
}