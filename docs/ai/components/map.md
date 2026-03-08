# snice-map

Interactive slippy map using OpenStreetMap tiles with markers, popups, drag panning, scroll zoom, and programmatic control.

## Properties

```ts
center: MapCenter = { lat: 51.505, lng: -0.09 }  // Map center (set via JS)
zoom: number = 13                                  // attr: zoom — Zoom level
minZoom: number = 1                                // attr: min-zoom
maxZoom: number = 18                               // attr: max-zoom
markers: MapMarker[] = []                          // Marker data (set via JS)
tileUrl: string = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'  // attr: tile-url — Tile server template
```

## Types

```ts
interface MapCenter {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  popup?: string;   // Popup text shown on marker click
}
```

## Events

- `map-click` -> `{ lat: number, lng: number }` — Click on map (not a marker)
- `marker-click` -> `{ marker: MapMarker }` — Marker clicked (also toggles popup)
- `map-move` -> `{ center: MapCenter, zoom: number }` — After drag pan completes
- `map-zoom` -> `{ zoom: number }` — Zoom level changed

## Methods

- `setCenter(lat: number, lng: number): void` — Pan to coordinates
- `setZoom(zoom: number): void` — Set zoom level (clamped to min/max)
- `addMarker(marker: MapMarker): void` — Add a marker
- `removeMarker(id: string): void` — Remove marker by ID
- `fitBounds(markers?: MapMarker[]): void` — Auto-zoom/center to fit markers (defaults to all)

**CSS Parts:**
- `base` - The outer map container
- `tiles` - The tile layer container
- `markers` - The markers layer container
- `controls` - The zoom controls container

## Behavior

- Mouse drag to pan, scroll wheel to zoom
- Zoom +/- buttons in top-right corner
- Marker click toggles popup display
- OpenStreetMap attribution included
- Custom tile servers via `tile-url` with `{x}`, `{y}`, `{z}` placeholders

## Usage

```html
<snice-map zoom="10" min-zoom="3" max-zoom="16"></snice-map>
```

```typescript
map.center = { lat: 40.7128, lng: -74.006 };
map.markers = [
  { id: 'nyc', lat: 40.7128, lng: -74.006, label: 'NYC', popup: 'New York City' },
  { id: 'bos', lat: 42.3601, lng: -71.0589, popup: 'Boston' }
];
map.fitBounds();
map.addEventListener('marker-click', e => console.log(e.detail.marker.label));
```
