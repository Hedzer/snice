export type WeatherUnit = 'celsius' | 'fahrenheit';
export type WeatherVariant = 'compact' | 'full';

export interface WeatherForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon?: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon?: string;
  humidity?: number;
  wind?: number;
  forecast?: WeatherForecastDay[];
}

export interface SniceWeatherElement extends HTMLElement {
  data: WeatherData | null;
  unit: WeatherUnit;
  variant: WeatherVariant;
}
