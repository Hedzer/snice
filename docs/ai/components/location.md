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
- `openMap()` → Validates and opens the resolved map URL in an isolated new tab; does not emit `location-click`

## Events

- `location-click` → `LocationData`; synchronous, bubbling, composed; emitted before navigation for pointer, Enter, and host `click()` activation

## Slots

- `icon` - Custom icon content (overrides `icon`/`iconImage` properties)

## CSS Parts

- `base` - Outer location container
- `icon` - Icon container
- `content` - Content area (name, address, coordinates)
- `map` - Embedded map container

## URL Safety

- `mapUrl`/`map-url` is checked by core `isSafeUrl()` before both `window.open()` and iframe rendering.
- Valid relative references and the default safe protocols (`http:`, `https:`, `mailto:`, `tel:`) are accepted. Malformed URLs, control-character obfuscation, and unlisted schemes are rejected.
- Non-string runtime `mapUrl` values fail closed without coercion.
- Exact `''` generates a URL from coordinates first, then the encoded full address. Whitespace-only authored values are invalid and do not trigger fallback.
- Successful opens use `'_blank'` with `'noopener'`; the opened page receives no `window.opener`.

## Activation Contract

- `clickable=true` renders the internal base with `role="link"` and `tabindex="0"`.
- Pointer activation, Enter, and `element.click()` each emit one `location-click`, then attempt safe navigation.
- Space and unrelated keys do not activate link semantics.
- An unsafe/missing destination still emits the activation event but never opens.
- Direct `openMap()` validates/opens without checking `clickable` and without emitting the event.
- `clickable=false` removes the interactive role/tab stop and makes pointer, keyboard, and host `click()` activation inert.

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
