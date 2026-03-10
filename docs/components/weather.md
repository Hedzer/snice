<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/weather.md -->

# Weather
`<snice-weather>`

Displays current weather conditions with temperature, condition description, humidity, wind speed, and an optional multi-day forecast. The component does not make API calls; it receives all data via properties.

## Table of Contents
- [Properties](#properties)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `WeatherData \| null` | `null` | Weather data object with current conditions and optional forecast |
| `unit` | `'celsius' \| 'fahrenheit'` | `'celsius'` | Temperature unit |
| `variant` | `'compact' \| 'full'` | `'full'` | Display variant |

### WeatherData Interface

```typescript
interface WeatherData {
  temp: number;
  condition: string;                // e.g., "Sunny", "Partly Cloudy", "Rain"
  icon?: string;                    // Emoji or custom icon (auto-detected from condition if omitted)
  humidity?: number;                // Humidity percentage
  wind?: number;                    // Wind speed in km/h
  forecast?: WeatherForecastDay[];
}

interface WeatherForecastDay {
  day: string;        // e.g., "Mon", "Tue"
  high: number;
  low: number;
  condition: string;
  icon?: string;      // Auto-detected if omitted
}
```

### Auto-Detected Icons

When the `icon` property is omitted, the component maps the `condition` string to an appropriate emoji:

| Condition (contains) | Icon |
|----------------------|------|
| sun / clear | Sun |
| partly cloud | Partly cloudy |
| cloud | Cloud |
| rain | Rain |
| snow | Snow |
| thunder / storm | Thunderstorm |
| fog / mist | Fog |
| wind | Wind |

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

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer weather card container |
| `current` | Current conditions section with icon, temperature, and condition text |
| `details` | Details row showing humidity and wind speed |
| `forecast` | Multi-day forecast section with day columns |

## Basic Usage

```typescript
import 'snice/components/weather/snice-weather';
```

```html
<snice-weather></snice-weather>
```

```typescript
weather.data = {
  temp: 22,
  condition: 'Partly Cloudy',
  humidity: 65,
  wind: 12
};
```

## Examples

### Full Weather Display

Show current conditions with humidity, wind, and a multi-day forecast.

```typescript
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
```

### Compact Variant

Use the `compact` variant for a small weather badge showing just the temperature and icon.

```html
<snice-weather unit="fahrenheit" variant="compact"></snice-weather>
```

```typescript
weather.data = {
  temp: 72,
  condition: 'Sunny'
};
```

### Fahrenheit Units

Set `unit="fahrenheit"` for Fahrenheit temperature display.

```html
<snice-weather unit="fahrenheit"></snice-weather>
```

### Custom Icons

Override the auto-detected icons by providing explicit `icon` values.

```typescript
weather.data = {
  temp: 18,
  condition: 'Overcast',
  icon: '/icons/weather/overcast.svg',
  humidity: 80,
  wind: 20,
  forecast: [
    { day: 'Mon', high: 20, low: 14, condition: 'Rain', icon: '/icons/weather/rain.svg' }
  ]
};
```

### Fetching Data from an API

The weather component does not call any APIs itself. Fetch data externally and pass it in.

```typescript
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
```

## Accessibility

- The unit (C or F) is included in screen reader text alongside the temperature value
- Weather icons have alt text derived from the condition string
- Each forecast day includes high and low temperatures with labels
- All text meets WCAG AA contrast standards
