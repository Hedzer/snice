# snice-map

Interactive slippy map using OpenStreetMap tiles with markers, popups, drag panning, scroll zoom.

## Properties

```ts
center: MapCenter = { lat: 51.505, lng: -0.09 }  // JS only
zoom: number = 13
minZoom: number = 1                                // attr: min-zoom
maxZoom: number = 18                               // attr: max-zoom
markers: MapMarker[] = []                          // JS only
tileUrl: string = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'  // attr: tile-url
```

## Types

```ts
interface MapCenter { lat: number; lng: number; }

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  popup?: string;
}
```

## Methods

- `setCenter(lat, lng)` → Pan to coordinates
- `setZoom(zoom)` → Set zoom (clamped to min/max)
- `addMarker(marker)` → Add a marker
- `removeMarker(id)` → Remove marker by ID
- `fitBounds(markers?)` → Auto-zoom/center to fit markers (defaults to all)

## Events

- `map-click` → `{ lat, lng }` (click on map, not marker)
- `marker-click` → `{ marker: MapMarker }` (also toggles popup)
- `map-move` → `{ center: MapCenter, zoom }` (after drag pan)
- `map-zoom` → `{ zoom }` (zoom level changed)

## CSS Parts

- `base` - Outer map container
- `tiles` - Tile layer container
- `markers` - Markers layer container
- `controls` - Zoom controls container
- `tile` - A single map tile
- `tile-image` - The `<img>` inside a tile
- `marker` - A marker wrapper
- `marker-pin` - A marker's pin box
- `marker-icon` - A marker's icon (image, text, or default pin)
- `popup` - An open marker popup
- `control` - A zoom control button
- `zoom-in` - Added to the zoom-in `control`
- `zoom-out` - Added to the zoom-out `control`
- `attribution` - The attribution strip
- `attribution-link` - The OpenStreetMap link inside `attribution`

State tokens:

- `marker-active` - Added to `marker` while its popup is open

## Basic Usage

```typescript
import 'snice/components/map/snice-map';
```

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
