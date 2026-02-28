import { element, property, watch, ready, dispose, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-avatar-group.css?inline';
import type { AvatarGroupSize, AvatarGroupItem, SniceAvatarGroupElement } from './snice-avatar-group.types';

const COLORS = [
  'red', 'orange', 'yellow', 'lime', 'green',
  'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

@element('snice-avatar-group')
export class SniceAvatarGroup extends HTMLElement implements SniceAvatarGroupElement {
  @property({ type: Array, attribute: false })
  avatars: AvatarGroupItem[] = [];

  @property({ type: Number })
  max = 5;

  @property()
  size: AvatarGroupSize = 'medium';

  @property({ type: Number })
  overlap = 8;

  private _useSlot = false;

  @ready()
  init() {
    this.updateOverlap();
    this.detectMode();
  }

  @watch('overlap')
  updateOverlap() {
    this.style.setProperty('--avatar-group-overlap', `-${this.overlap / 16}rem`);
  }

  @watch('size')
  updateChildSizes() {
    if (this._useSlot) {
      this.applySlottedStyles();
    }
  }

  private detectMode() {
    const slotted = this.querySelectorAll('snice-avatar');
    this._useSlot = slotted.length > 0;
    if (this._useSlot) {
      this.applySlottedStyles();
    }
  }

  private _childObserver: MutationObserver | null = null;

  @ready()
  setupChildObserver() {
    this._childObserver = new MutationObserver(() => this.detectMode());
    this._childObserver.observe(this, { childList: true });
  }

  @dispose()
  cleanupChildObserver() {
    this._childObserver?.disconnect();
    this._childObserver = null;
  }

  private applySlottedStyles() {
    const children = Array.from(this.querySelectorAll('snice-avatar'));
    children.forEach((child, i) => {
      child.classList.add('avatar-group-item');
      if (this.size) {
        child.setAttribute('size', this.size);
      }
      child.setAttribute('shape', 'circle');
    });

    // Handle overflow
    const visible = children.slice(0, this.max);
    const hidden = children.slice(this.max);
    visible.forEach(c => (c as HTMLElement).style.display = '');
    hidden.forEach(c => (c as HTMLElement).style.display = 'none');
  }

  private renderAvatar(avatar: AvatarGroupItem, index: number) {
    const name = avatar.name || avatar.initials || '';
    const initials = avatar.initials || getInitials(name);
    const colorClass = avatar.color
      ? ''
      : name ? `avatar-color-${COLORS[hashName(name) % COLORS.length]}` : '';
    const customBg = avatar.color ? `background: ${avatar.color}` : '';

    if (avatar.src) {
      return html/*html*/`
        <button class="avatar-item ${colorClass}"
                part="avatar"
                type="button"
                style="${customBg}"
                title="${name}"
                aria-label="${name || 'Avatar'}"
                @click=${() => this.handleAvatarClick(avatar, index)}>
          <img src="${avatar.src}" alt="${name}" @error=${(e: Event) => this.handleImgError(e, initials)}>
        </button>
      `;
    }

    if (initials) {
      return html/*html*/`
        <button class="avatar-item ${colorClass}"
                part="avatar"
                type="button"
                style="${customBg}"
                title="${name}"
                aria-label="${name || 'Avatar'}"
                @click=${() => this.handleAvatarClick(avatar, index)}>
          <span class="avatar-initials">${initials}</span>
        </button>
      `;
    }

    return html/*html*/`
      <button class="avatar-item ${colorClass}"
              part="avatar"
              type="button"
              style="${customBg}"
              title="${name}"
              aria-label="${name || 'Avatar'}"
              @click=${() => this.handleAvatarClick(avatar, index)}>
        <svg class="avatar-fallback-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </button>
    `;
  }

  private handleImgError(e: Event, initials: string) {
    const img = e.target as HTMLImageElement;
    const parent = img.parentElement;
    if (parent && initials) {
      img.style.display = 'none';
      const span = document.createElement('span');
      span.className = 'avatar-initials';
      span.textContent = initials;
      parent.appendChild(span);
    }
  }

  private handleAvatarClick(avatar: AvatarGroupItem, index: number) {
    this.dispatchAvatarClick(avatar, index);
  }

  private handleOverflowClick() {
    this.dispatchOverflowClick();
  }

  @dispatch('avatar-click', { bubbles: true, composed: true })
  private dispatchAvatarClick(avatar: AvatarGroupItem, index: number) {
    return { avatar, index };
  }

  @dispatch('overflow-click', { bubbles: true, composed: true })
  private dispatchOverflowClick() {
    const remaining = this._useSlot
      ? this.querySelectorAll('snice-avatar').length - this.max
      : this.avatars.length - this.max;
    const avatars = this._useSlot
      ? []
      : this.avatars.slice(this.max);
    return { remaining, avatars };
  }

  @render()
  renderContent() {
    // Slotted mode: use child <snice-avatar> elements
    if (this._useSlot) {
      const totalChildren = this.querySelectorAll('snice-avatar').length;
      const remaining = totalChildren - this.max;
      return html/*html*/`
        <div class="avatar-group" part="base" role="group" aria-label="Avatar group">
          <slot></slot>
          <if ${remaining > 0}>
            <button class="avatar-item avatar-overflow"
                    part="overflow"
                    type="button"
                    aria-label="${remaining} more"
                    @click=${() => this.handleOverflowClick()}>
              +${remaining}
            </button>
          </if>
        </div>
      `;
    }

    // Imperative mode: render from avatars array
    const visible = this.avatars.slice(0, this.max);
    const remaining = this.avatars.length - this.max;

    return html/*html*/`
      <div class="avatar-group" part="base" role="group" aria-label="Avatar group">
        ${visible.map((avatar, index) => this.renderAvatar(avatar, index))}
        <if ${remaining > 0}>
          <button class="avatar-item avatar-overflow"
                  part="overflow"
                  type="button"
                  aria-label="${remaining} more"
                  @click=${() => this.handleOverflowClick()}>
            +${remaining}
          </button>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
