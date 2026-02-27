# snice-location

Display location information with addresses, coordinates, and maps.

## Properties

```typescript
mode: 'full'|'compact'|'coordinates'|'address' = 'full';
name: string = '';
address: string = '';
city: string = '';
state: string = '';
country: string = '';
zipCode: string = '';           // attr: zip-code
latitude: number | string = '';
longitude: number | string = '';
showMap: boolean = false;        // attr: show-map
showIcon: boolean = true;        // attr: show-icon
icon: string = '📍';
iconImage: string = '';          // attr: icon-image
mapUrl: string = '';             // attr: map-url
clickable: boolean = false;
```

## Slots

- `icon` - Custom icon content (overrides `icon`/`iconImage` properties)

## Methods

- `getData()` - Returns LocationData object
- `getCoordinates()` - Returns `{ latitude, longitude }` or null
- `getFullAddress()` - Returns formatted address string
- `openMap()` - Opens location in maps app (new tab)

## Events

- `location-click` → `LocationData` - Clicked (when clickable)

## Usage

```html
<snice-location
  name="Central Park"
  address="Central Park"
  city="New York"
  state="NY"
  latitude="40.7829"
  longitude="-73.9654"
  clickable>
</snice-location>

<!-- With embedded map -->
<snice-location name="Times Square" latitude="40.7580" longitude="-73.9855" show-map></snice-location>

<!-- Coordinates only -->
<snice-location latitude="40.7580" longitude="-73.9855" mode="coordinates"></snice-location>

<!-- Icon slot -->
<snice-location name="Office" address="123 Main St">
  <span slot="icon" class="material-symbols-outlined">business</span>
</snice-location>
```

**CSS Parts:**
- `base` - The outer location container
- `icon` - The icon container
- `content` - The content area with name, address, coordinates
- `map` - The embedded map container

## Features

- 4 display modes (full/compact/coordinates/address)
- Embedded Google Maps support
- Custom icons (emoji, URL, image, font ligatures, slot)
- Clickable to open in maps app
- Custom map URL support
- Complete address formatting
