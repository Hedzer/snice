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
zipCode: string = '';
latitude: number | string = '';
longitude: number | string = '';
showMap: boolean = false;
showIcon: boolean = true;
icon: string = '📍';
iconImage: string = '';
mapUrl: string = '';
clickable: boolean = false;
```

## Methods

```typescript
getData(): LocationData
getCoordinates(): { latitude: number; longitude: number } | null
getFullAddress(): string
openMap(): void
```

## Events

- `location-click` - Dispatched when clicked (detail: LocationData)

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
<snice-location
  name="Times Square"
  latitude="40.7580"
  longitude="-73.9855"
  show-map>
</snice-location>

<!-- Coordinates only -->
<snice-location
  latitude="40.7580"
  longitude="-73.9855"
  mode="coordinates">
</snice-location>
```

## Features

- Multiple display modes (full/compact/coordinates/address)
- Embedded Google Maps support
- Custom icons (URL, image files, emoji, font ligatures)
- Clickable to open in maps app
- Custom map URL support
- Complete address formatting
- Coordinate validation
