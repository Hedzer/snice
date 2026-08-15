/**
 * snice-weather feature matrix.
 *
 * Dimensions (docs/ai/components/weather.md § Properties):
 *   unit (2) x variant (2) x humidity (2) x wind (2) x forecast (3: none / one
 *   day / three days) x icon (2: supplied / auto-detected) = 96 combos, plus a
 *   condition sweep for the documented auto-detection and the null-data case.
 *
 * Every case is judged by `weatherProblems`, the one oracle for this component.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product } from '../matrix-utils';
import {
  UNITS, VARIANTS, CONDITIONS, FORECAST, weatherData, combo, attrsOf, propsOf,
  comboId, weatherProblems, read, formatTemp, type WeatherCombo,
} from './weather-support';

const mountWeather = (c: WeatherCombo) =>
  mount<HTMLElement>('snice-weather', attrsOf(c), '', propsOf(c));

describe('weather matrix', () => {
  afterEach(() => unmountAll());

  // ── The full cross ───────────────────────────────────────────────────────

  for (const point of product({
    unit: UNITS,
    variant: VARIANTS,
    humidity: [false, true],
    wind: [false, true],
    forecast: [0, 1, 3],
    icon: [false, true],
  })) {
    const c = combo({
      unit: point.unit,
      variant: point.variant,
      data: weatherData({
        temp: 22,
        condition: 'Partly Cloudy',
        ...(point.icon ? { icon: '🌤' } : {}),
        ...(point.humidity ? { humidity: 65 } : {}),
        ...(point.wind ? { wind: 12 } : {}),
        ...(point.forecast > 0 ? { forecast: FORECAST.slice(0, point.forecast) } : {}),
      }),
    });

    it(comboId(c), async () => {
      const el = await mountWeather(c);
      expect(weatherProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── The documented icon auto-detection ───────────────────────────────────

  for (const condition of CONDITIONS) {
    it(`"${condition}" auto-detects an icon`, async () => {
      const c = combo({ data: weatherData({ condition }) });
      const el = await mountWeather(c);
      expect(weatherProblems(el, c)).toEqual([]);
      expect(read(el).icon, `no icon derived from "${condition}"`).not.toBe('');
    });
  }

  it('different condition families get different auto-detected icons', async () => {
    // "auto-detected from condition" is only meaningful if the condition
    // actually decides: a component that returned one fixed glyph would pass
    // every case above.
    const icons: string[] = [];
    for (const condition of ['Sunny', 'Rain', 'Snow']) {
      const c = combo({ data: weatherData({ condition }) });
      const el = await mountWeather(c);
      icons.push(read(el).icon);
    }
    expect(new Set(icons).size, `three conditions produced ${JSON.stringify(icons)}`).toBe(3);
  });

  it('a supplied icon overrides auto-detection', async () => {
    const c = combo({ data: weatherData({ condition: 'Sunny', icon: '🛰' }) });
    const el = await mountWeather(c);
    expect(read(el).icon).toBe('🛰');
    expect(weatherProblems(el, c)).toEqual([]);
  });

  it('a forecast day may carry its own icon', async () => {
    const c = combo({
      data: weatherData({
        forecast: [
          { day: 'Mon', high: 24, low: 18, condition: 'Sunny', icon: '🌅' },
          { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
        ],
      }),
    });
    const el = await mountWeather(c);
    expect(weatherProblems(el, c)).toEqual([]);
    const days = read(el).days;
    expect(days[0].icon).toBe('🌅');
    expect(days[1].icon, 'the day without an icon got none').not.toBe('');
  });

  // ── Units ────────────────────────────────────────────────────────────────

  for (const unit of UNITS) {
    it(`${unit} shows every temperature with its symbol`, async () => {
      const c = combo({ unit, data: weatherData({ temp: 22.4, forecast: FORECAST }) });
      const el = await mountWeather(c);
      expect(weatherProblems(el, c)).toEqual([]);

      const r = read(el);
      expect(r.temp).toBe(formatTemp(22.4, unit));
      expect(r.days.map(d => [d.high, d.low]))
        .toEqual(FORECAST.map(d => [formatTemp(d.high, unit), formatTemp(d.low, unit)]));
    });
  }

  it('temperatures are rounded to whole degrees', async () => {
    const c = combo({ data: weatherData({ temp: -0.6 }) });
    const el = await mountWeather(c);
    expect(read(el).temp).toBe('-1°C');
  });

  // ── Degenerate data ──────────────────────────────────────────────────────

  it('null data says so instead of rendering an empty card', async () => {
    const c = combo();
    const el = await mountWeather(c);
    expect(weatherProblems(el, c)).toEqual([]);
    expect(read(el).bodyText).not.toBe('');
  });

  it('an empty forecast array is not a forecast', async () => {
    const c = combo({ data: weatherData({ forecast: [] }) });
    const el = await mountWeather(c);
    expect(weatherProblems(el, c)).toEqual([]);
    expect(read(el).days).toEqual([]);
  });

  it('zero humidity and zero wind are still values to show', async () => {
    // `humidity?: number` and `wind?: number` are OPTIONAL, not truthy: 0% and
    // 0 km/h are readings, and only an absent key means "not measured".
    const c = combo({ data: weatherData({ humidity: 0, wind: 0 }) });
    const el = await mountWeather(c);
    expect(weatherProblems(el, c)).toEqual([]);
    expect(read(el).detailTexts).toHaveLength(2);
  });

  it('re-supplying data re-renders the card', async () => {
    const first = combo({ data: weatherData({ temp: 5, condition: 'Snow' }) });
    const el = await mountWeather(first);
    expect(weatherProblems(el, first)).toEqual([]);

    const second = combo({ data: weatherData({ temp: 30, condition: 'Sunny', humidity: 20, forecast: FORECAST }) });
    (el as any).data = second.data;
    await (el as any).rendered;

    expect(weatherProblems(el, second)).toEqual([]);
  });
});
