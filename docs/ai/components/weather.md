# snice-weather

Weather display card with current conditions, humidity, wind, and multi-day forecast.

## Properties

```typescript
data: WeatherData | null = null;
unit: 'celsius'|'fahrenheit' = 'celsius';
variant: 'compact'|'full' = 'full';

interface WeatherData {
  temp: number;
  condition: string;           // e.g. "Sunny", "Partly Cloudy", "Rain"
  icon?: string;               // emoji or custom icon (auto-detected from condition if omitted)
  humidity?: number;           // percentage
  wind?: number;               // km/h
  forecast?: WeatherForecastDay[];
}

interface WeatherForecastDay {
  day: string;                 // e.g. "Mon", "Tue"
  high: number;
  low: number;
  condition: string;
  icon?: string;
}
```

## CSS Custom Properties

- `--snice-color-background-element` - Card background (default: `rgb(252 251 249)`)
- `--snice-color-border` - Card and forecast divider border
- `--snice-color-text` - Primary text color (default: `rgb(23 23 23)`)
- `--snice-color-text-secondary` - Condition/detail text
- `--snice-color-text-tertiary` - Forecast low temp
- `--snice-font-weight-bold` - Temperature weight (default: `700`)
- `--snice-font-weight-semibold` - Forecast high temp weight
- `--snice-border-radius-lg` - Card border radius (default: `0.5rem`)
- `--snice-spacing-lg` - Card padding (default: `1.5rem`)

## CSS Parts

- `base` - Outer weather card div
- `current` - Current conditions section (icon + temp + condition)
- `details` - Details row (humidity and wind)
- `forecast` - Multi-day forecast section

## Basic Usage

```html
<snice-weather unit="celsius" variant="full"></snice-weather>
<snice-weather unit="fahrenheit" variant="compact"></snice-weather>
```

```typescript
weather.data = {
  temp: 22,
  condition: 'Partly Cloudy',
  humidity: 65,
  wind: 12,
  forecast: [
    { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
    { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
    { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' }
  ]
};
```
