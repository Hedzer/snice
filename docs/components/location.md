[//]: # (AI: For a low-token version of this doc, use docs/ai/components/location.md instead)

# Location
`<snice-location>`

Displays location information with addresses, coordinates, maps, and custom icons.

## Basic Usage

```typescript
import 'snice/components/location/snice-location';
```

```html
<snice-location
  name="Central Park"
  address="Central Park"
  city="New York"
  state="NY"
  latitude="40.7829"
  longitude="-73.9654">
</snice-location>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/location/snice-location';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-location.min.js"></script>
```

## Examples

### Display Modes

Use the `mode` attribute to control what information is shown.

```html
<!-- Full mode (default) - shows name, address, and coordinates -->
<snice-location
  name="Empire State Building"
  address="350 5th Ave"
  city="New York"
  state="NY"
  latitude="40.7484"
  longitude="-73.9857"
  mode="full">
</snice-location>

<!-- Compact mode -->
<snice-location name="Times Square" city="New York" mode="compact"></snice-location>

<!-- Coordinates only -->
<snice-location latitude="40.7580" longitude="-73.9855" mode="coordinates"></snice-location>

<!-- Address only -->
<snice-location name="Brooklyn Bridge" city="New York" state="NY" mode="address"></snice-location>
```

### Custom Icons

Use the `icon` attribute for emoji or the `icon` slot for external icon fonts.

```html
<!-- Emoji icon -->
<snice-location name="Office" address="123 Business Blvd" icon="🏢"></snice-location>

<!-- Image icon -->
<snice-location name="Store" address="456 Shopping Ave" icon-image="/icons/store.svg"></snice-location>

<!-- Icon slot (for CSS icon fonts) -->
<snice-location name="Restaurant" city="New York">
  <span slot="icon" class="material-symbols-outlined">restaurant</span>
</snice-location>

<!-- No icon -->
<snice-location name="Home" address="789 Elm St" show-icon="false"></snice-location>
```

### Clickable Locations

Set the `clickable` attribute to make the location interactive.

```html
<snice-location
  name="Golden Gate Bridge"
  latitude="37.8199"
  longitude="-122.4783"
  clickable>
</snice-location>
```

### Embedded Maps

Set the `show-map` attribute to display an embedded Google Maps iframe.

```html
<snice-location
  name="Statue of Liberty"
  address="Liberty Island"
  city="New York"
  latitude="40.6892"
  longitude="-74.0445"
  show-map>
</snice-location>
```

### Custom Map URL

Use `map-url` to link to an alternative maps provider.

```html
<snice-location
  name="Custom Location"
  latitude="34.0522"
  longitude="-118.2437"
  clickable
  map-url="https://www.openstreetmap.org/?mlat=34.0522&mlon=-118.2437">
</snice-location>
```

### Complete Address

```html
<snice-location
  name="White House"
  address="1600 Pennsylvania Avenue NW"
  city="Washington"
  state="DC"
  zip-code="20500"
  country="USA"
  latitude="38.8977"
  longitude="-77.0365"
  clickable>
</snice-location>
```

### Programmatic Usage

```typescript
const location = document.querySelector('snice-location');

// Get data
const data = location.getData();
const coords = location.getCoordinates();
const address = location.getFullAddress();

// Open in maps
location.openMap();

// Listen for clicks
location.addEventListener('location-click', (e) => {
  console.log('Clicked:', e.detail);
});
```

## Slots

| Name | Description |
|------|-------------|
| `icon` | Custom icon content (overrides `icon` and `iconImage` properties) |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'full' \| 'compact' \| 'coordinates' \| 'address'` | `'full'` | Display mode |
| `name` | `string` | `''` | Location name |
| `address` | `string` | `''` | Street address |
| `city` | `string` | `''` | City name |
| `state` | `string` | `''` | State or province |
| `country` | `string` | `''` | Country name |
| `zipCode` (attr: `zip-code`) | `string` | `''` | ZIP/postal code |
| `latitude` | `number \| string` | `''` | Latitude coordinate |
| `longitude` | `number \| string` | `''` | Longitude coordinate |
| `showMap` (attr: `show-map`) | `boolean` | `false` | Show embedded map |
| `showIcon` (attr: `show-icon`) | `boolean` | `true` | Show location icon |
| `icon` | `string` | `'📍'` | Icon (emoji, URL). Use slot for icon fonts. |
| `iconImage` (attr: `icon-image`) | `string` | `''` | Icon image URL |
| `mapUrl` (attr: `map-url`) | `string` | `''` | Custom map URL |
| `clickable` | `boolean` | `false` | Make location clickable |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `location-click` | `LocationData` | Fired when a clickable location is clicked |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getData()` | -- | Returns complete LocationData object |
| `getCoordinates()` | -- | Returns `{ latitude, longitude }` or null |
| `getFullAddress()` | -- | Returns formatted address string |
| `openMap()` | -- | Opens location in maps (new tab) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer location container |
| `icon` | `<div>` | The icon container |
| `content` | `<div>` | The content area with name, address, and coordinates |
| `map` | `<div>` | The embedded map container (visible when `show-map` is set) |

```css
snice-location::part(base) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

snice-location::part(icon) {
  font-size: 1.5rem;
}

snice-location::part(map) {
  border-radius: 4px;
  overflow: hidden;
}
```
