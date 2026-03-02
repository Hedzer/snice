import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/weather/snice-weather';
import type { SniceWeatherElement, WeatherData } from '../../components/weather/snice-weather.types';

describe('snice-weather', () => {
  let weather: SniceWeatherElement;

  const sampleData: WeatherData = {
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    forecast: [
      { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
      { day: 'Tue', high: 23, low: 17, condition: 'Cloudy' },
      { day: 'Wed', high: 21, low: 16, condition: 'Rainy' }
    ]
  };

  afterEach(() => {
    if (weather) {
      removeComponent(weather as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render weather element', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');

      expect(weather).toBeTruthy();
      expect(weather.tagName).toBe('SNICE-WEATHER');
    });

    it('should have default properties', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');

      expect(weather.data).toBe(null);
      expect(weather.unit).toBe('celsius');
      expect(weather.variant).toBe('full');
    });

    it('should render empty state when no data', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      await wait(10);

      const base = queryShadow(weather as HTMLElement, '.weather');
      expect(base).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept data object', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      expect(weather.data).toEqual(sampleData);
    });

    it('should accept unit attribute', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather', {
        unit: 'fahrenheit'
      });

      expect(weather.unit).toBe('fahrenheit');
    });

    it('should accept variant attribute', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather', {
        variant: 'compact'
      });

      expect(weather.variant).toBe('compact');
    });
  });

  describe('rendering with data', () => {
    it('should display temperature', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const temp = queryShadow(weather as HTMLElement, '.temp');
      expect(temp).toBeTruthy();
      expect(temp?.textContent).toContain('22');
    });

    it('should display condition', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const condition = queryShadow(weather as HTMLElement, '.condition');
      expect(condition).toBeTruthy();
      expect(condition?.textContent).toContain('Partly Cloudy');
    });

    it('should display weather icon', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const icon = queryShadow(weather as HTMLElement, '.icon');
      expect(icon).toBeTruthy();
    });

    it('should display details when available', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const details = queryShadow(weather as HTMLElement, '.details');
      expect(details).toBeTruthy();
    });

    it('should display forecast when available', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const forecast = queryShadow(weather as HTMLElement, '.forecast');
      expect(forecast).toBeTruthy();
    });
  });

  describe('unit conversion', () => {
    it('should show celsius symbol by default', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather');
      weather.data = sampleData;
      await wait(10);

      const temp = queryShadow(weather as HTMLElement, '.temp');
      expect(temp?.textContent).toContain('°C');
    });

    it('should show fahrenheit symbol when unit is fahrenheit', async () => {
      weather = await createComponent<SniceWeatherElement>('snice-weather', {
        unit: 'fahrenheit'
      });
      weather.data = sampleData;
      await wait(10);

      const temp = queryShadow(weather as HTMLElement, '.temp');
      expect(temp?.textContent).toContain('°F');
    });
  });
});
