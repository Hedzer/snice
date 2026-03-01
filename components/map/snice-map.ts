import { element, property, render, styles, dispatch, ready, dispose, watch, query, html, css, unsafeHTML } from 'snice';
import type { MapMarker, MapCenter, SniceMapElement } from './snice-map.types';
import mapStyles from './snice-map.css?inline';

const TILE_SIZE = 256;
const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

@element('snice-map')
export class SniceMap extends HTMLElement implements SniceMapElement {
  @property({ type: Object, attribute: false })
  center: MapCenter = { lat: 51.505, lng: -0.09 };

  @property({ type: Number })
  zoom: number = 13;

  @property({ type: Number, attribute: 'min-zoom' })
  minZoom: number = 1;

  @property({ type: Number, attribute: 'max-zoom' })
  maxZoom: number = 18;

  @property({ type: Array, attribute: false })
  markers: MapMarker[] = [];

  @property({ attribute: 'tile-url' })
  tileUrl: string = DEFAULT_TILE_URL;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private activePopupId: string | null = null;

  @query('.map-container')
  private containerEl?: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${mapStyles}`;
  }

  @ready()
  init() {
    this.containerEl?.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  @dispose()
  cleanup() {
    this.containerEl?.removeEventListener('wheel', this.handleWheel);
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      this.setZoom(Math.min(this.zoom + 1, this.maxZoom));
    } else {
      this.setZoom(Math.max(this.zoom - 1, this.minZoom));
    }
  };

  @render()
  renderMap() {
    const tiles = this.getVisibleTiles();
    const markerPositions = this.markers.map(m => ({
      marker: m,
      ...this.latLngToPixel(m.lat, m.lng),
    }));
    const hasPopup = this.activePopupId !== null;

    return html`
      <div
        class="map-container"
        part="base"
        @mousedown=${(e: MouseEvent) => this.handleMouseDown(e)}
        @mousemove=${(e: MouseEvent) => this.handleMouseMove(e)}
        @mouseup=${() => this.handleMouseUp()}
        @mouseleave=${() => this.handleMouseUp()}
        @click=${(e: MouseEvent) => this.handleMapClick(e)}
      >
        <div class="map-tiles" part="tiles">
          ${tiles.map(tile => html`
            <div class="map-tile" style="left: ${tile.pixelX}px; top: ${tile.pixelY}px">
              <img src="${this.getTileUrl(tile.x, tile.y, tile.z)}" alt="" loading="lazy" />
            </div>
          `)}
        </div>

        <div class="map-markers" part="markers">
          ${markerPositions.map(mp => {
            const showPopup = hasPopup && this.activePopupId === mp.marker.id;
            const popupContent = mp.marker.popup || mp.marker.label || '';
            const hasPopupContent = !!popupContent;
            return html`
              <div
                class="map-marker"
                style="left: ${mp.x}px; top: ${mp.y}px"
                @click=${(e: Event) => { e.stopPropagation(); this.handleMarkerClick(mp.marker); }}
              >
                <div class="map-marker-pin">
                  <svg viewBox="0 0 24 36" fill="var(--snice-color-danger, rgb(220 38 38))">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                </div>
                <if ${showPopup && hasPopupContent}>
                  <div class="map-popup">${popupContent}</div>
                </if>
              </div>
            `;
          })}
        </div>

        <div class="map-controls" part="controls">
          <button class="map-control-btn" @click=${(e: Event) => { e.stopPropagation(); this.setZoom(Math.min(this.zoom + 1, this.maxZoom)); }}>+</button>
          <button class="map-control-btn" @click=${(e: Event) => { e.stopPropagation(); this.setZoom(Math.max(this.zoom - 1, this.minZoom)); }}>-</button>
        </div>

        <div class="map-attribution">${unsafeHTML('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>')}</div>
      </div>
    `;
  }

  // --- Public Methods ---

  setCenter(lat: number, lng: number): void {
    this.center = { lat, lng };
    this.emitMapMove();
  }

  setZoom(zoom: number): void {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (clamped !== this.zoom) {
      this.zoom = clamped;
      this.emitMapZoom();
    }
  }

  addMarker(marker: MapMarker): void {
    this.markers = [...this.markers, marker];
  }

  removeMarker(id: string): void {
    this.markers = this.markers.filter(m => m.id !== id);
  }

  fitBounds(markers?: MapMarker[]): void {
    const items = markers || this.markers;
    if (items.length === 0) return;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    for (const m of items) {
      if (m.lat < minLat) minLat = m.lat;
      if (m.lat > maxLat) maxLat = m.lat;
      if (m.lng < minLng) minLng = m.lng;
      if (m.lng > maxLng) maxLng = m.lng;
    }

    this.center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };

    // Estimate zoom to fit bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff < 0.005) this.zoom = 16;
    else if (maxDiff < 0.05) this.zoom = 13;
    else if (maxDiff < 0.5) this.zoom = 10;
    else if (maxDiff < 5) this.zoom = 7;
    else if (maxDiff < 50) this.zoom = 4;
    else this.zoom = 2;
  }

  // --- Private: Tile Calculations ---

  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = ((lng + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return { x, y };
  }

  private latLngToPixel(lat: number, lng: number): { x: number; y: number } {
    if (!this.containerEl) return { x: 0, y: 0 };
    const w = this.containerEl.clientWidth;
    const h = this.containerEl.clientHeight;

    const centerTile = this.latLngToTile(this.center.lat, this.center.lng, this.zoom);
    const markerTile = this.latLngToTile(lat, lng, this.zoom);

    const x = w / 2 + (markerTile.x - centerTile.x) * TILE_SIZE + this.offsetX;
    const y = h / 2 + (markerTile.y - centerTile.y) * TILE_SIZE + this.offsetY;

    return { x, y };
  }

  private getVisibleTiles(): { x: number; y: number; z: number; pixelX: number; pixelY: number }[] {
    if (!this.containerEl) return [];
    const w = this.containerEl.clientWidth;
    const h = this.containerEl.clientHeight;

    const centerTile = this.latLngToTile(this.center.lat, this.center.lng, this.zoom);
    const centerPixelX = w / 2 - (centerTile.x % 1) * TILE_SIZE + this.offsetX;
    const centerPixelY = h / 2 - (centerTile.y % 1) * TILE_SIZE + this.offsetY;

    const centerTileX = Math.floor(centerTile.x);
    const centerTileY = Math.floor(centerTile.y);

    const tilesX = Math.ceil(w / TILE_SIZE) + 2;
    const tilesY = Math.ceil(h / TILE_SIZE) + 2;

    const n = Math.pow(2, this.zoom);
    const tiles: { x: number; y: number; z: number; pixelX: number; pixelY: number }[] = [];

    for (let dx = -Math.floor(tilesX / 2); dx <= Math.floor(tilesX / 2); dx++) {
      for (let dy = -Math.floor(tilesY / 2); dy <= Math.floor(tilesY / 2); dy++) {
        let tileX = centerTileX + dx;
        const tileY = centerTileY + dy;

        if (tileY < 0 || tileY >= n) continue;
        tileX = ((tileX % n) + n) % n;

        const pixelX = centerPixelX + dx * TILE_SIZE;
        const pixelY = centerPixelY + dy * TILE_SIZE;

        tiles.push({ x: tileX, y: tileY, z: this.zoom, pixelX, pixelY });
      }
    }

    return tiles;
  }

  private getTileUrl(x: number, y: number, z: number): string {
    return this.tileUrl
      .replace('{x}', String(x))
      .replace('{y}', String(y))
      .replace('{z}', String(z));
  }

  // --- Mouse Interaction ---

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.offsetX = e.clientX - this.dragStartX;
    this.offsetY = e.clientY - this.dragStartY;
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Convert offset to lat/lng change
    if (this.offsetX !== 0 || this.offsetY !== 0) {
      const n = Math.pow(2, this.zoom);
      const lngDelta = -(this.offsetX / TILE_SIZE) * (360 / n);
      const centerTile = this.latLngToTile(this.center.lat, this.center.lng, this.zoom);
      const newTileY = centerTile.y - this.offsetY / TILE_SIZE;
      const newLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * newTileY) / n))) * 180) / Math.PI;

      this.offsetX = 0;
      this.offsetY = 0;
      this.center = { lat: newLat, lng: this.center.lng + lngDelta };
      this.emitMapMove();
    }
  }

  private handleMapClick(e: MouseEvent): void {
    if (!this.containerEl) return;

    const rect = this.containerEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = this.containerEl.clientWidth;
    const h = this.containerEl.clientHeight;

    const centerTile = this.latLngToTile(this.center.lat, this.center.lng, this.zoom);
    const n = Math.pow(2, this.zoom);

    const tileX = centerTile.x + (x - w / 2) / TILE_SIZE;
    const tileY = centerTile.y + (y - h / 2) / TILE_SIZE;

    const lng = (tileX / n) * 360 - 180;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n))) * 180) / Math.PI;

    this.activePopupId = null;
    this.emitMapClick(lat, lng);
  }

  private handleMarkerClick(marker: MapMarker): void {
    this.activePopupId = this.activePopupId === marker.id ? null : marker.id;
    this.emitMarkerClick(marker);
  }

  // --- Events ---

  @dispatch('map-click', { bubbles: true, composed: true })
  private emitMapClick(lat: number, lng: number) {
    return { lat, lng };
  }

  @dispatch('marker-click', { bubbles: true, composed: true })
  private emitMarkerClick(marker: MapMarker) {
    return { marker };
  }

  @dispatch('map-move', { bubbles: true, composed: true })
  private emitMapMove() {
    return { center: this.center, zoom: this.zoom };
  }

  @dispatch('map-zoom', { bubbles: true, composed: true })
  private emitMapZoom() {
    return { zoom: this.zoom };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-map': SniceMap;
  }
}
