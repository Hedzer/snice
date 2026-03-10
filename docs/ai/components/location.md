# snice-location

Display location information with addresses, coordinates, and maps.

## Properties

```ts
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

## Methods

- `getData()` → `LocationData`
- `getCoordinates()` → `{ latitude, longitude } | null`
- `getFullAddress()` → `string`
- `openMap()` → Opens location in maps (new tab)

## Events

- `location-click` → `LocationData` (when clickable)

## Slots

- `icon` - Custom icon content (overrides `icon`/`iconImage` properties)

## CSS Parts

- `base` - Outer location container
- `icon` - Icon container
- `content` - Content area (name, address, coordinates)
- `map` - Embedded map container

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
