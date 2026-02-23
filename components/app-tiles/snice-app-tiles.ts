import { element, property, query, watch, dispatch, ready, on, render, styles, html, css } from 'snice';
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
    return css`:host { display: none; }`;
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

const IMG_EXT_RE = /^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)$/i;
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

@element('snice-app-tiles')
export class SniceAppTiles extends HTMLElement implements SniceAppTilesElement {
  @property({ type: Array })
  tiles: AppTile[] = [];

  @property({ type: Number })
  columns = 4;

  @property()
  size: 'sm' | 'md' | 'lg' = 'md';

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
    if (tile.href) {
      window.open(tile.href, '_self');
    }
  }

  private rebuild() {
    const container = this.tilesContainerEl;
    if (!container) {
      requestAnimationFrame(() => this.rebuild());
      return;
    }

    container.style.setProperty('--tiles-columns', String(this.columns));
    container.classList.toggle('tiles--list', this.variant === 'list');
    container.classList.toggle('tiles--compact', this.variant === 'compact');

    let tilesHtml = '';
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      const iconHtml = this.buildTileIcon(tile, i);

      let tileInner = '';
      tileInner += iconHtml;
      tileInner += `<span class="tile__name">${this.esc(tile.name)}</span>`;

      if (tile.badge) {
        tilesHtml += `<snice-badge content="${this.escAttr(tile.badge)}" variant="error" size="small" position="top-right">`;
        tilesHtml += `<button class="tile" data-tile-index="${i}" title="${this.escAttr(tile.name)}">`;
        tilesHtml += tileInner;
        tilesHtml += `</button>`;
        tilesHtml += `</snice-badge>`;
      } else {
        tilesHtml += `<button class="tile" data-tile-index="${i}" title="${this.escAttr(tile.name)}">`;
        tilesHtml += tileInner;
        tilesHtml += `</button>`;
      }
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
      return `<div class="tile__icon tile__icon--text" style="background:${bg}">${letter}</div>`;
    }

    // Strip scheme override prefix for src/content
    let src = raw;
    if (raw.startsWith('img://')) src = raw.slice(6);
    else if (raw.startsWith('text://')) src = raw.slice(7);

    const type = iconType(raw);

    if (type === 'img') {
      return `<div class="tile__icon"><img src="${this.escAttr(src)}" alt="${this.escAttr(tile.name)}" /></div>`;
    }

    // Text icon: emoji or Material Symbols ligature
    const bg = tile.color ? `background:${tile.color}` : '';
    if (isEmoji(src)) {
      return `<div class="tile__icon tile__icon--emoji" style="${bg}">${this.esc(src)}</div>`;
    }
    // Ligature (e.g. Material Symbols)
    return `<div class="tile__icon tile__icon--ligature" style="${bg}"><span class="icon" part="icon">${this.esc(src)}</span></div>`;
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
      <div class="tiles"></div>
      <div hidden><slot></slot></div>
    `;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }
}
