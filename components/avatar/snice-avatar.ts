import { element, property, watch, query, ready, on } from '../../src/index';
import css from './snice-avatar.css?inline';
import type { AvatarSize, AvatarShape, SniceAvatarElement } from './snice-avatar.types';

@element('snice-avatar')
export class SniceAvatar extends HTMLElement implements SniceAvatarElement {
  @property({ reflect: true })
  src = '';

  @property({ reflect: true })
  alt = '';

  @property({ reflect: true })
  name = '';

  @property({ reflect: true })
  size: AvatarSize = 'medium';

  @property({ reflect: true })
  shape: AvatarShape = 'circle';

  @property({ attribute: 'fallback-color', reflect: true })
  fallbackColor = '#ffffff';

  @property({ attribute: 'fallback-background', reflect: true })
  fallbackBackground = '';

  @query('.avatar-image')
  imageElement?: HTMLImageElement;

  @query('.avatar-fallback')
  fallbackElement?: HTMLElement;

  private imageError = false;

  html() {
    const initials = this.getInitials(this.name);
    const colorClass = this.fallbackBackground ? '' : this.getColorClass(this.name);
    const bgStyle = this.fallbackBackground ? `style="--avatar-bg: ${this.fallbackBackground}; --avatar-color: ${this.fallbackColor}"` : '';
    
    return /*html*/`
      <div class="avatar ${colorClass}" ${bgStyle}>
        ${this.src ? /*html*/`
          <img class="avatar-image ${this.imageError ? 'avatar-image--error' : ''}" 
               src="${this.src}" 
               alt="${this.alt || this.name}"
               loading="lazy">
        ` : ''}
        <div class="avatar-fallback ${!this.src || this.imageError ? 'avatar-fallback--visible' : ''}">
          ${initials || this.renderIcon()}
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    this.setupImageHandlers();
  }

  private setupImageHandlers() {
    if (this.imageElement) {
      this.imageElement.addEventListener('load', this.handleImageLoad.bind(this));
      this.imageElement.addEventListener('error', this.handleImageError.bind(this));
    }
  }

  @on('load', '.avatar-image')
  handleImageLoad() {
    this.imageError = false;
    if (this.imageElement) {
      this.imageElement.classList.remove('avatar-image--error');
    }
    if (this.fallbackElement) {
      this.fallbackElement.classList.remove('avatar-fallback--visible');
    }
  }

  @on('error', '.avatar-image')
  handleImageError() {
    this.imageError = true;
    if (this.imageElement) {
      this.imageElement.classList.add('avatar-image--error');
    }
    if (this.fallbackElement) {
      this.fallbackElement.classList.add('avatar-fallback--visible');
    }
  }

  @watch('src')
  updateSrc() {
    if (this.imageElement && this.src) {
      this.imageError = false;
      this.imageElement.src = this.src;
      this.imageElement.classList.remove('avatar-image--error');
    }
  }

  @watch('name')
  updateName() {
    // Re-render to update color class and initials
    this.render();
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

  private render() {
    const shadow = this.shadowRoot;
    if (shadow) {
      shadow.innerHTML = '';
      if (this.css) {
        const style = document.createElement('style');
        style.textContent = this.css();
        shadow.appendChild(style);
      }
      const template = document.createElement('template');
      template.innerHTML = this.html();
      shadow.appendChild(template.content.cloneNode(true));
      this.setupImageHandlers();
    }
  }

  private renderIcon(): string {
    return /*html*/`
      <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
  }
}