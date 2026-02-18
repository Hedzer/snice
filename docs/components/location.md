# Location Component

Display location information with addresses, coordinates, maps, and custom icons.

## Basic Usage

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'full' \| 'compact' \| 'coordinates' \| 'address'` | `'full'` | Display mode |
| `name` | `string` | `''` | Location name |
| `address` | `string` | `''` | Street address |
| `city` | `string` | `''` | City name |
| `state` | `string` | `''` | State/province |
| `country` | `string` | `''` | Country name |
| `zipCode` | `string` | `''` | ZIP/postal code |
| `latitude` | `number \| string` | `''` | Latitude coordinate |
| `longitude` | `number \| string` | `''` | Longitude coordinate |
| `showMap` | `boolean` | `false` | Show embedded map |
| `showIcon` | `boolean` | `true` | Show location icon |
| `icon` | `string` | `'📍'` | Icon (URL, image file, emoji, or font ligature) |
| `iconImage` | `string` | `''` | Icon image URL (deprecated, use `icon`) |
| `mapUrl` | `string` | `''` | Custom map URL |
| `clickable` | `boolean` | `false` | Make location clickable |

## Methods

### `getData(): LocationData`
Get complete location data object.

```javascript
const data = location.getData();
console.log(data.name, data.latitude, data.longitude);
```

### `getCoordinates(): { latitude: number; longitude: number } | null`
Get coordinate pair or null if invalid.

```javascript
const coords = location.getCoordinates();
if (coords) {
  console.log(`${coords.latitude}, ${coords.longitude}`);
}
```

### `getFullAddress(): string`
Get formatted full address string.

```javascript
const address = location.getFullAddress();
// "123 Main St, New York, NY, 10001, USA"
```

### `openMap(): void`
Open location in maps application (new tab).

```javascript
location.openMap();
```

## Events

### `location-click`
Dispatched when clickable location is clicked.

```javascript
location.addEventListener('location-click', (e) => {
  console.log('Location clicked:', e.detail);
});
```

**Detail:** `LocationData` object

## Examples

### Display Modes

```html
<!-- Full mode (default) -->
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
<snice-location
  name="Times Square"
  address="Times Square"
  city="New York"
  latitude="40.7580"
  longitude="-73.9855"
  mode="compact">
</snice-location>

<!-- Coordinates only -->
<snice-location
  latitude="40.7580"
  longitude="-73.9855"
  mode="coordinates">
</snice-location>

<!-- Address only -->
<snice-location
  name="Brooklyn Bridge"
  address="Brooklyn Bridge"
  city="New York"
  state="NY"
  mode="address">
</snice-location>
```

### Custom Icons

```html
<!-- Emoji icon -->
<snice-location
  name="Office"
  address="123 Business Blvd"
  icon="🏢">
</snice-location>

<!-- Image icon -->
<snice-location
  name="Store"
  address="456 Shopping Ave"
  icon-image="/icons/store.svg">
</snice-location>

<!-- No icon -->
<snice-location
  name="Home"
  address="789 Residential St"
  show-icon="false">
</snice-location>
```

### Interactive Locations

```html
<!-- Clickable location -->
<snice-location
  name="Golden Gate Bridge"
  latitude="37.8199"
  longitude="-122.4783"
  clickable>
</snice-location>

<!-- Custom map URL -->
<snice-location
  name="Custom Location"
  latitude="34.0522"
  longitude="-118.2437"
  clickable
  map-url="https://www.openstreetmap.org/?mlat=34.0522&mlon=-118.2437">
</snice-location>
```

### Embedded Maps

```html
<!-- Show embedded map -->
<snice-location
  name="Statue of Liberty"
  address="Liberty Island"
  city="New York"
  state="NY"
  latitude="40.6892"
  longitude="-74.0445"
  show-map>
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

### Restaurant Location

```html
<snice-location
  name="Blue Hill"
  address="75 Washington Pl"
  city="New York"
  state="NY"
  zip-code="10011"
  latitude="40.7308"
  longitude="-73.9973"
  icon="🍽️"
  clickable>
</snice-location>
```

### Park Location

```html
<snice-location
  name="Millennium Park"
  address="201 E Randolph St"
  city="Chicago"
  state="IL"
  latitude="41.8826"
  longitude="-87.6226"
  icon="🌳"
  mode="full"
  clickable>
</snice-location>
```

### Airport Location

```html
<snice-location
  name="LAX"
  address="1 World Way"
  city="Los Angeles"
  state="CA"
  zip-code="90045"
  latitude="33.9416"
  longitude="-118.4085"
  icon="✈️"
  clickable>
</snice-location>
```

### Hospital Location

```html
<snice-location
  name="Mayo Clinic"
  address="200 First St SW"
  city="Rochester"
  state="MN"
  zip-code="55905"
  latitude="44.0225"
  longitude="-92.4666"
  icon="🏥"
  show-map>
</snice-location>
```

### University Location

```html
<snice-location
  name="MIT"
  address="77 Massachusetts Ave"
  city="Cambridge"
  state="MA"
  zip-code="02139"
  latitude="42.3601"
  longitude="-71.0942"
  icon="🎓"
  mode="compact"
  clickable>
</snice-location>
```

### Hotel Location

```html
<snice-location
  name="The Plaza Hotel"
  address="768 5th Ave"
  city="New York"
  state="NY"
  zip-code="10019"
  latitude="40.7643"
  longitude="-73.9747"
  icon="🏨"
  clickable>
</snice-location>
```

### Museum Location

```html
<snice-location
  name="The Met"
  address="1000 5th Ave"
  city="New York"
  state="NY"
  zip-code="10028"
  latitude="40.7794"
  longitude="-73.9632"
  icon="🏛️"
  show-map>
</snice-location>
```

### Stadium Location

```html
<snice-location
  name="Yankee Stadium"
  address="1 E 161st St"
  city="Bronx"
  state="NY"
  zip-code="10451"
  latitude="40.8296"
  longitude="-73.9262"
  icon="⚾"
  clickable>
</snice-location>
```

## Programmatic Usage

```javascript
const location = document.createElement('snice-location');
location.name = 'Central Park';
location.latitude = 40.7829;
location.longitude = -73.9654;
location.clickable = true;

location.addEventListener('location-click', (e) => {
  console.log('Clicked:', e.detail);
});

// Get data
const data = location.getData();
const coords = location.getCoordinates();
const address = location.getFullAddress();

// Open in maps
location.openMap();
```

## Accessibility

- Use descriptive `name` attributes for screen readers
- Clickable locations are keyboard accessible
- Icons should be decorative; location name provides context
- Map iframes include proper loading attributes

## Browser Support

- Modern browsers with Custom Elements v1 support
- Embedded maps require internet connection
- Default map provider is Google Maps
- Custom map URLs can use alternative providers
