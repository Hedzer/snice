[//]: # (AI: For a low-token version of this doc, use docs/ai/components/weather.md instead)

# Weather Component

The weather component displays current weather conditions with temperature, condition description, humidity, wind speed, and an optional multi-day forecast. It supports Celsius and Fahrenheit units, auto-detected weather icons, and compact or full display variants. The component does not make API calls; it receives all data via properties.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-weather></snice-weather>
```

```typescript
import 'snice/components/weather/snice-weather';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `WeatherData \| null` | `null` | Weather data object with current conditions and optional forecast |
| `unit` | `'celsius' \| 'fahrenheit'` | `'celsius'` | Temperature unit |
| `variant` | `'compact' \| 'full'` | `'full'` | Display variant |

### WeatherData

```typescript
interface WeatherData {
  temp: number;                     // Current temperature
  condition: string;                // Condition description (e.g., "Sunny", "Partly Cloudy", "Rain")
  icon?: string;                    // Emoji or custom icon (auto-detected from condition if omitted)
  humidity?: number;                // Humidity percentage
  wind?: number;                    // Wind speed in km/h
  forecast?: WeatherForecastDay[];  // Multi-day forecast array
}
```

### WeatherForecastDay

```typescript
interface WeatherForecastDay {
  day: string;        // Day label (e.g., "Mon", "Tue")
  high: number;       // High temperature
  low: number;        // Low temperature
  condition: string;  // Condition description
  icon?: string;      // Emoji or custom icon (auto-detected if omitted)
}
```

### Variants

| Variant | Description |
|---------|-------------|
| `full` | Shows current weather, detail row (humidity and wind), and multi-day forecast |
| `compact` | Shows only the current temperature and weather icon; hides details and forecast |

### Auto-Detected Icons

When the `icon` property is omitted on either the main data or forecast days, the component maps the `condition` string to an appropriate emoji:

| Condition (contains) | Icon |
|----------------------|------|
| sun / clear | Sun emoji |
| partly cloud | Partly cloudy emoji |
| cloud | Cloud emoji |
| rain | Rain emoji |
| snow | Snow emoji |
| thunder / storm | Thunderstorm emoji |
| fog / mist | Fog emoji |
| wind | Wind emoji |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-background-element` | Card background color | `rgb(252 251 249)` |
| `--snice-color-border` | Card and forecast divider border | _(theme default)_ |
| `--snice-color-text` | Primary text color | `rgb(23 23 23)` |
| `--snice-color-text-secondary` | Condition and detail text color | _(theme default)_ |
| `--snice-color-text-tertiary` | Forecast low temperature color | _(theme default)_ |
| `--snice-font-weight-bold` | Temperature font weight | `700` |
| `--snice-font-weight-semibold` | Forecast high temperature font weight | _(theme default)_ |
| `--snice-border-radius-lg` | Card border radius | `0.5rem` |
| `--snice-spacing-lg` | Card padding | `1.5rem` |

## Examples

### Full Weather Display

Show current conditions with humidity, wind, and a multi-day forecast.

```html
<snice-weather id="weather-full" unit="celsius" variant="full"></snice-weather>

<script type="module">
  import 'snice/components/weather/snice-weather';

  const weather = document.getElementById('weather-full');
  weather.data = {
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    forecast: [
      { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
      { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
      { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' },
      { day: 'Thu', high: 25, low: 19, condition: 'Sunny' },
      { day: 'Fri', high: 21, low: 14, condition: 'Thunderstorm' }
    ]
  };
</script>
```

### Compact Variant

Use the `compact` variant for a small weather badge showing just the temperature and icon.

```html
<snice-weather id="weather-compact" unit="fahrenheit" variant="compact"></snice-weather>

<script type="module">
  const weather = document.getElementById('weather-compact');
  weather.data = {
    temp: 72,
    condition: 'Sunny'
  };
</script>
```

### Fahrenheit Units

Set `unit="fahrenheit"` for Fahrenheit temperature display.

```html
<snice-weather id="weather-f" unit="fahrenheit"></snice-weather>

<script type="module">
  const weather = document.getElementById('weather-f');
  weather.data = {
    temp: 85,
    condition: 'Clear',
    humidity: 45,
    wind: 8,
    forecast: [
      { day: 'Sat', high: 87, low: 72, condition: 'Sunny' },
      { day: 'Sun', high: 82, low: 68, condition: 'Partly Cloudy' },
      { day: 'Mon', high: 79, low: 65, condition: 'Rain' }
    ]
  };
</script>
```

### Custom Icons

Override the auto-detected icons by providing explicit `icon` values.

```html
<snice-weather id="weather-custom"></snice-weather>

<script type="module">
  const weather = document.getElementById('weather-custom');
  weather.data = {
    temp: 18,
    condition: 'Overcast',
    icon: '/icons/weather/overcast.svg',
    humidity: 80,
    wind: 20,
    forecast: [
      { day: 'Mon', high: 20, low: 14, condition: 'Rain', icon: '/icons/weather/rain.svg' },
      { day: 'Tue', high: 22, low: 15, condition: 'Snow', icon: '/icons/weather/snow.svg' }
    ]
  };
</script>
```

### Fetching Data from an API

The weather component does not call any APIs itself. Fetch data externally and pass it in.

```html
<snice-weather id="live-weather" variant="full"></snice-weather>

<script type="module">
  import type { SniceWeatherElement } from 'snice/components/weather/snice-weather.types';

  const weather = document.getElementById('live-weather') as SniceWeatherElement;

  async function loadWeather() {
    const response = await fetch('/api/weather?city=london');
    const apiData = await response.json();

    weather.data = {
      temp: apiData.current.temp,
      condition: apiData.current.condition,
      humidity: apiData.current.humidity,
      wind: apiData.current.wind_speed,
      forecast: apiData.daily.map(day => ({
        day: day.day_name.slice(0, 3),
        high: day.high,
        low: day.low,
        condition: day.condition
      }))
    };
  }

  loadWeather();
</script>
```

## Accessibility

- **ARIA attributes**: The component uses appropriate ARIA roles and labels for the weather display
- **Temperature units**: The unit (C or F) is included in screen reader text alongside the temperature value
- **Weather icons**: Icons have alt text derived from the condition string for screen readers
- **Forecast readability**: Each forecast day includes high and low temperatures with labels
- **Color contrast**: All text meets WCAG AA contrast standards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Pass data via property**: Set `weather.data = {...}` (not via attribute) since the data is a complex object
2. **Handle loading states**: Show a skeleton or spinner while fetching weather data from an API
3. **Choose the right variant**: Use `full` for dedicated weather displays, `compact` for dashboard widgets or headers
4. **Match units to locale**: Use Fahrenheit for US audiences and Celsius for most other regions
5. **Include forecast when available**: The multi-day forecast adds context and is more useful than current conditions alone
6. **Keep condition strings standard**: Use common weather terms (Sunny, Cloudy, Rain, Snow, etc.) for reliable auto-icon detection
7. **Refresh data periodically**: Weather data goes stale quickly; consider refreshing every 15-30 minutes
