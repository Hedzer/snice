<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/map.md -->

# Map
`<snice-map>`

An interactive slippy map component using OpenStreetMap tiles. Supports markers with popups, drag panning, scroll zoom, and programmatic control over the viewport.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `center` | `MapCenter` | `{ lat: 51.505, lng: -0.09 }` | Map center coordinates (set via JavaScript) |
| `zoom` | `number` | `13` | Current zoom level |
| `minZoom` (attr: `min-zoom`) | `number` | `1` | Minimum allowed zoom level |
| `maxZoom` (attr: `max-zoom`) | `number` | `18` | Maximum allowed zoom level |
| `markers` | `MapMarker[]` | `[]` | Array of marker data (set via JavaScript) |
| `tileUrl` (attr: `tile-url`) | `string` | `'https://tile.openstreetmap.org/{z}/{x}/{y}.png'` | Tile server URL template with `{x}`, `{y}`, `{z}` placeholders |

### Types

```typescript
interface MapCenter {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string;       // Unique identifier
  lat: number;      // Latitude
  lng: number;      // Longitude
  label?: string;   // Marker label text
  icon?: string;    // Custom icon URL
  popup?: string;   // Popup text shown on marker click
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setCenter()` | `lat: number, lng: number` | Pan the map to the specified coordinates |
| `setZoom()` | `zoom: number` | Set the zoom level (clamped to min/max range) |
| `addMarker()` | `marker: MapMarker` | Add a single marker to the map |
| `removeMarker()` | `id: string` | Remove a marker by its ID |
| `fitBounds()` | `markers?: MapMarker[]` | Auto-zoom and center to fit all markers. Defaults to all current markers if none specified |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `map-click` | `{ lat: number, lng: number }` | Fired when the map is clicked (not on a marker) |
| `marker-click` | `{ marker: MapMarker }` | Fired when a marker is clicked. Also toggles the marker's popup |
| `map-move` | `{ center: MapCenter, zoom: number }` | Fired after a drag pan operation completes |
| `map-zoom` | `{ zoom: number }` | Fired when the zoom level changes |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer map container |
| `tiles` | `<div>` | The tile layer container |
| `markers` | `<div>` | The markers layer container |
| `controls` | `<div>` | The zoom controls container |

```css
snice-map::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-map::part(controls) {
  opacity: 0.8;
}
```

## Basic Usage

```typescript
import 'snice/components/map/snice-map';
```

```html
<snice-map zoom="13"></snice-map>
```

## Examples

### Setting the Map Center

Set the `center` property via JavaScript to position the map on a specific location.

```html
<snice-map id="my-map" zoom="10"></snice-map>

<script type="module">
  import 'snice/components/map/snice-map';

  const map = document.getElementById('my-map');
  map.center = { lat: 40.7128, lng: -74.006 };
</script>
```

### Adding Markers

Use the `markers` property to display pins on the map with optional labels and popups.

```html
<snice-map id="city-map" zoom="5"></snice-map>

<script type="module">
  import 'snice/components/map/snice-map';

  const map = document.getElementById('city-map');
  map.center = { lat: 39.8283, lng: -98.5795 };
  map.markers = [
    { id: 'nyc', lat: 40.7128, lng: -74.006, label: 'New York', popup: 'The Big Apple' },
    { id: 'chi', lat: 41.8781, lng: -87.6298, label: 'Chicago', popup: 'The Windy City' },
    { id: 'la', lat: 34.0522, lng: -118.2437, label: 'Los Angeles', popup: 'City of Angels' }
  ];
</script>
```

### Fit to Markers

Use `fitBounds()` to automatically zoom and center the map so all markers are visible.

```html
<snice-map id="auto-fit-map"></snice-map>

<script type="module">
  import 'snice/components/map/snice-map';

  const map = document.getElementById('auto-fit-map');
  map.markers = [
    { id: 'paris', lat: 48.8566, lng: 2.3522, popup: 'Paris' },
    { id: 'london', lat: 51.5074, lng: -0.1278, popup: 'London' },
    { id: 'berlin', lat: 52.52, lng: 13.405, popup: 'Berlin' }
  ];
  map.fitBounds();
</script>
```

### Handling Map Events

Listen for click and marker events to build interactive map features.

```html
<snice-map id="interactive-map" zoom="12"></snice-map>
<div id="map-output"></div>

<script type="module">
  import 'snice/components/map/snice-map';

  const map = document.getElementById('interactive-map');
  const output = document.getElementById('map-output');
  map.center = { lat: 51.505, lng: -0.09 };

  map.addEventListener('map-click', (e) => {
    const { lat, lng } = e.detail;
    output.textContent = `Clicked at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Add a marker at the clicked location
    map.addMarker({
      id: `pin-${Date.now()}`,
      lat,
      lng,
      popup: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    });
  });

  map.addEventListener('marker-click', (e) => {
    output.textContent = `Marker: ${e.detail.marker.label || e.detail.marker.id}`;
  });
</script>
```

### Custom Tile Server

Use the `tile-url` attribute to load tiles from a different provider.

```html
<snice-map
  zoom="10"
  tile-url="https://tiles.example.com/{z}/{x}/{y}.png"
></snice-map>
```

## Accessibility

- Mouse drag to pan, scroll wheel to zoom
- Zoom in/out buttons in the top-right corner for keyboard and pointer access
- Markers are interactive and toggle popup display on click
- OpenStreetMap attribution is included automatically
- For keyboard-only users, the zoom buttons provide an accessible alternative to scroll-wheel zoom
