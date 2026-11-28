import { element, property, query, watch, dispatch, ready, on, render, styles, html, css, isSafeUrl } from 'snice';
import cssContent from './snice-app-tiles.css?inline';
import type { SniceAppTilesElement, AppTile, AppTilesVariant, TileClickDetail } from './snice-app-tiles.types';

/**
 * <snice-app-tile> — declarative child element for app tiles.
 *
 * Usage:
 *   <snice-app-tiles columns="4">
 *     <snice-app-tile name="Gmail" icon="https://..." href="/mail"></snice-app-tile>
 *     <snice-app-tile name="Calendar" icon="📅"></snice-app-tile>
 *     <snice-app-tile name="Drive" icon="https://..." color="#4285f4" badge="3"></snice-app-tile>
 *   </snice-app-tiles>
 *
 * Attributes: name, icon (URL or emoji), color, href, badge
 */
@element('snice-app-tile')
export class SniceAppTile extends HTMLElement {
  @render()
  renderContent() {
    return html`<slot></slot>`;
  }

  @styles()
  componentStyles() {
    return css/*css*/`:host { display: none; }`;
  }
}

const DEFAULT_COLORS = [
  'rgb(37 99 235)',
  'rgb(22 163 74)',
  'rgb(234 88 12)',
  'rgb(147 51 234)',
  'rgb(220 38 38)',
  'rgb(14 165 233)',
  'rgb(161 98 7)',
  'rgb(82 82 82)',
];

const IMG_EXT_RE = /^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)(\?.*)?$/i;
const URL_RE = /^(https?:\/\/|\/|\.\/|\.\.\/|data:)/;

/** Matches the detection logic in utils.ts renderIcon */
function iconType(icon: string): 'img' | 'text' {
  if (icon.startsWith('img://')) return 'img';
  if (icon.startsWith('text://')) return 'text';
  if (URL_RE.test(icon)) return 'img';
  if (IMG_EXT_RE.test(icon)) return 'img';
  return 'text';
}

/** Detect if text is purely emoji (no ASCII letters = ligature name) */
function isEmoji(str: string): boolean {
  // If it contains only non-ASCII / symbol codepoints it's emoji; if it has [a-zA-Z_] it's a ligature name
  return !/[a-zA-Z_]/.test(str);
}

/** Pick literal white or dark ink for an explicit tile background color (works identically in light & dark themes). */
function contrastInkForColor(bg: string): string {
  const s = bg.trim();
  let r = 0, g = 0, b = 0;
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
  } else {
    const rgb = s.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)/i);
    if (!rgb) return 'rgb(255 255 255)';
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.36 ? 'rgb(23 23 23)' : 'rgb(255 255 255)';
}

@element('snice-app-tiles')
export class SniceAppTiles extends HTMLElement implements SniceAppTilesElement {
  @property({ type: Array, attribute: false })
  tiles: AppTile[] = [];

  @property({ type: Number })
  columns = 4;

  @property()
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';

  @property()
  variant: AppTilesVariant = 'grid';

  @query('.tiles')
  private tilesContainerEl?: HTMLElement;

  @ready()
  init() {
    this.collectTilesFromChildren();
    this.rebuild();
  }

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.collectTilesFromChildren();
  }

  @watch('tiles', 'columns', 'variant')
  onTilesChange() {
    this.rebuild();
  }

  private collectTilesFromChildren() {
    if (this.tiles.length > 0) return;

    const tileEls = Array.from(this.querySelectorAll(':scope > snice-app-tile'));
    if (tileEls.length === 0) return;

    this.tiles = tileEls.map((el, i) => ({
      id: el.getAttribute('id') || `tile_${i}`,
      name: el.getAttribute('name') || '',
      icon: el.getAttribute('icon') || '',
      color: el.getAttribute('color') || undefined,
      href: el.getAttribute('href') || undefined,
      badge: el.getAttribute('badge') || undefined,
    }));
  }

  private handleTileClick(tile: AppTile, index: number) {
    this.emitTileClick({ tile, index });
    if (tile.href && isSafeUrl(tile.href)) {
      window.open(tile.href, '_self');
    }
  }

  private rebuild() {
    const container = this.tilesContainerEl;
    if (!container) return;

    container.style.setProperty('--tiles-columns', String(this.columns));
    container.classList.toggle('tiles--list', this.variant === 'list');
    container.classList.toggle('tiles--compact', this.variant === 'compact');

    let tilesHtml = '';
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      const iconHtml = this.buildTileIcon(tile, i);

      tilesHtml += `<button class="tile" part="tile" data-tile-index="${i}" title="${this.escAttr(tile.name)}">`;
      if (tile.badge) {
        tilesHtml += `<snice-badge exportparts="base: badge-base, badge: badge-badge, badge-dot: badge-badge-dot, badge-pulse: badge-badge-pulse" content="${this.escAttr(tile.badge)}" variant="error" size="small" position="top-right">`;
        tilesHtml += iconHtml;
        tilesHtml += `</snice-badge>`;
      } else {
        tilesHtml += iconHtml;
      }
      tilesHtml += `<span class="tile__name" part="name">${this.esc(tile.name)}</span>`;
      tilesHtml += `</button>`;
    }

    container.innerHTML = tilesHtml;

    // Attach click listeners (tiles may be inside snice-badge wrappers)
    container.querySelectorAll('button.tile').forEach(el => {
      const idx = Number((el as HTMLElement).dataset.tileIndex);
      const tile = this.tiles[idx];
      if (tile) {
        el.addEventListener('click', () => this.handleTileClick(tile, idx));
      }
    });
  }

  private buildTileIcon(tile: AppTile, index: number): string {
    let raw = tile.icon;

    // No icon → letter fallback
    if (!raw) {
      const letter = tile.name.charAt(0).toUpperCase();
      const bg = tile.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const ink = contrastInkForColor(bg);
      return `<div class="tile__icon tile__icon--text" part="icon-container" style="background:${this.escAttr(bg)};color:${ink}">${this.esc(letter)}</div>`;
    }

    // Strip scheme override prefix for src/content
    let src = raw;
    if (raw.startsWith('img://')) src = raw.slice(6);
    else if (raw.startsWith('text://')) src = raw.slice(7);

    const type = iconType(raw);

    if (type === 'img') {
      const bgStyle = tile.color ? ` style="background:${this.escAttr(tile.color)}"` : '';
      return `<div class="tile__icon" part="icon-container"${bgStyle}><img part="image" src="${this.escAttr(src)}" alt="${this.escAttr(tile.name)}" /></div>`;
    }

    // Text icon: emoji or Material Symbols ligature
    if (isEmoji(src)) {
      const bg = tile.color ? `background:${this.escAttr(tile.color)}` : '';
      return `<div class="tile__icon tile__icon--emoji" part="icon-container" style="${bg}">${this.esc(src)}</div>`;
    }
    // Ligature (e.g. Material Symbols)
    const ligStyle = tile.color
      ? `background:${this.escAttr(tile.color)};color:${contrastInkForColor(tile.color)}`
      : '';
    return `<div class="tile__icon tile__icon--ligature" part="icon-container" style="${ligStyle}"><span class="icon" part="icon">${this.esc(src)}</span></div>`;
  }

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escAttr(str: string): string {
    return this.esc(str).replace(/"/g, '&quot;');
  }

  @dispatch('tile-click', { bubbles: true, composed: true })
  private emitTileClick(detail?: TileClickDetail): TileClickDetail {
    return detail!;
  }

  @render({ once: true })
  renderContent() {
    return html/*html*/`
      <div class="tiles" part="base"></div>
      <div hidden><slot></slot></div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
