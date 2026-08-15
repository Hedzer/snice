/**
 * Smoke slice of the snice-weather matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/weather/`, excluded from the
 * default Vitest include. This file stays collected and buys the marquee only:
 *
 *   · the fully-populated card, where every documented part is rendered at once;
 *   · both units, the only arithmetic-adjacent rule the component has;
 *   · the bare card (required fields only), where details and forecast vanish;
 *   · icon auto-detection, the one documented derivation;
 *   · null data, the documented initial state.
 *
 * Assertions route through the matrix's own `weatherProblems` oracle.
 * BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll } from '../matrix-utils';
import {
  weatherData, combo, attrsOf, propsOf, comboId, weatherProblems, read, formatTemp,
  FORECAST, type WeatherCombo,
} from './weather-support';

const mountWeather = (c: WeatherCombo) =>
  mount<HTMLElement>('snice-weather', attrsOf(c), '', propsOf(c));

const FULL = weatherData({
  temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, forecast: FORECAST,
});

describe('weather matrix smoke', () => {
  afterEach(() => unmountAll());

  const marquee: WeatherCombo[] = [
    combo({ data: FULL }),
    combo({ data: FULL, unit: 'fahrenheit', variant: 'compact' }),
    combo({ data: weatherData({ temp: 8, condition: 'Rain' }) }),
    combo({ data: weatherData({ temp: 8, condition: 'Rain', icon: '🛰' }) }),
    combo(),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountWeather(c);
      expect(weatherProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('fahrenheit changes the symbol on every temperature', async () => {
    const c = combo({ data: FULL, unit: 'fahrenheit' });
    const el = await mountWeather(c);
    const r = read(el);
    expect(r.temp).toBe(formatTemp(22, 'fahrenheit'));
    expect(r.days.map(d => d.high)).toEqual(FORECAST.map(d => formatTemp(d.high, 'fahrenheit')));
  });

  it('an omitted icon is auto-detected from the condition', async () => {
    const sunny = await mountWeather(combo({ data: weatherData({ condition: 'Sunny' }) }));
    const rainy = await mountWeather(combo({ data: weatherData({ condition: 'Rain' }) }));
    expect(read(sunny).icon).not.toBe('');
    expect(read(sunny).icon).not.toBe(read(rainy).icon);
  });
});
