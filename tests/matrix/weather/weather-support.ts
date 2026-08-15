/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-weather matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/weather.md` and
 * `packages/components/src/weather/snice-weather.types.ts`:
 *
 *   · `data: WeatherData | null = null` — the card has nothing to show until it
 *     is given something.
 *   · `WeatherData.temp` and `.condition` are required; `.icon`, `.humidity`
 *     (percentage), `.wind` (km/h) and `.forecast` are optional, so each one is
 *     rendered exactly when it is supplied.
 *   · `icon?` is documented as "emoji or custom icon (auto-detected from
 *     condition if omitted)" — so an omitted icon still produces an icon, and
 *     it is a FUNCTION OF THE CONDITION. The doc names no glyph table, so the
 *     oracle asserts the documented property (derived from the condition,
 *     distinct across condition families) rather than freezing a glyph.
 *   · `unit: 'celsius' | 'fahrenheit'` selects the degree symbol every
 *     temperature is shown with. The doc gives `WeatherData.temp` no unit of
 *     its own and states no conversion rule, so the number shown is the number
 *     supplied.
 *   · `WeatherForecastDay` has `day`, `high`, `low`, `condition`, and its own
 *     optional `icon` — the same icon rule, per day.
 *   · Parts: `base`, `current` (icon + temp + condition), `details` (humidity
 *     and wind), `forecast`.
 *   · `variant: 'compact' | 'full'` is presentation only — the stylesheet
 *     selects on `:host([variant="compact"])`, so the DOM tier owns the host
 *     attribute and the VISUAL tier owns what the rule does with it.
 */
import { shadow, text, part } from '../matrix-utils';
import '../../../packages/components/src/weather/snice-weather';
import type {
  WeatherData, WeatherForecastDay, WeatherUnit, WeatherVariant,
} from '../../../packages/components/src/weather/snice-weather.types';

export type { WeatherData, WeatherForecastDay, WeatherUnit, WeatherVariant };

// ── Documented value sets and defaults ──────────────────────────────────────

export const UNITS: readonly WeatherUnit[] = ['celsius', 'fahrenheit'];
export const VARIANTS: readonly WeatherVariant[] = ['compact', 'full'];
export const DEFAULT_UNIT: WeatherUnit = 'celsius';
export const DEFAULT_VARIANT: WeatherVariant = 'full';

/** The degree symbol each documented unit is shown with. */
export const SYMBOL: Record<WeatherUnit, string> = { celsius: '°C', fahrenheit: '°F' };

/** The documented rendering of a temperature. */
export const formatTemp = (temp: number, unit: WeatherUnit): string =>
  `${Math.round(temp)}${SYMBOL[unit]}`;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The condition families the doc names by example, plus one it does not. */
export const CONDITIONS = ['Sunny', 'Partly Cloudy', 'Rain', 'Snow', 'Thunderstorm', 'Fog'] as const;

export const FORECAST: WeatherForecastDay[] = [
  { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
  { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
  { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' },
];

export const weatherData = (overrides: Partial<WeatherData> = {}): WeatherData => ({
  temp: 22,
  condition: 'Partly Cloudy',
  ...overrides,
});

export interface WeatherCombo {
  data: WeatherData | null;
  unit: WeatherUnit;
  variant: WeatherVariant;
}

export const combo = (overrides: Partial<WeatherCombo> = {}): WeatherCombo => ({
  data: null,
  unit: DEFAULT_UNIT,
  variant: DEFAULT_VARIANT,
  ...overrides,
});

export const attrsOf = (c: WeatherCombo): Record<string, any> => ({
  unit: c.unit,
  variant: c.variant,
});

export const propsOf = (c: WeatherCombo): Record<string, any> => ({ data: c.data });

export const comboId = (c: WeatherCombo): string => {
  if (!c.data) return `${c.unit}/${c.variant} data=null`;
  const d = c.data;
  return `${c.unit}/${c.variant} "${d.condition}" icon=${d.icon ? 'custom' : 'auto'}`
    + ` humidity=${d.humidity ?? 'none'} wind=${d.wind ?? 'none'} forecast=${d.forecast?.length ?? 0}`;
};

// ── Reading ─────────────────────────────────────────────────────────────────

export interface RenderedDay {
  day: string;
  icon: string;
  high: string;
  low: string;
}

export interface Reading {
  base: HTMLElement | null;
  current: HTMLElement | null;
  details: HTMLElement | null;
  forecast: HTMLElement | null;
  icon: string;
  temp: string;
  condition: string;
  detailTexts: string[];
  days: RenderedDay[];
  hostUnit: string | null;
  hostVariant: string | null;
  bodyText: string;
}

export function read(el: HTMLElement): Reading {
  const root = shadow(el);
  return {
    base: part(el, 'base'),
    current: part(el, 'current'),
    details: part(el, 'details'),
    forecast: part(el, 'forecast'),
    icon: text(root.querySelector('.icon')),
    temp: text(root.querySelector('.temp')),
    condition: text(root.querySelector('.condition')),
    detailTexts: [...root.querySelectorAll('.detail-item')].map(node => text(node)),
    days: [...root.querySelectorAll('.forecast-day')].map(node => ({
      day: text(node.querySelector('.forecast-day-name')),
      icon: text(node.querySelector('.forecast-icon')),
      high: text(node.querySelector('.forecast-high')),
      low: text(node.querySelector('.forecast-low')),
    })),
    hostUnit: el.getAttribute('unit'),
    hostVariant: el.getAttribute('variant'),
    bodyText: text(root.querySelector('.weather')),
  };
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** Every documented consequence of `c`, as a problem list. */
export function weatherProblems(el: HTMLElement, c: WeatherCombo): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read(el);

  // ── Presentation hooks the stylesheet selects on ─────────────────────────
  const hostAttribute = (name: string, got: string | null, want: string, isDefault: boolean) => {
    if (got === want) return;
    if (isDefault && got === null) return;
    say(`host ${name} is "${got}", expected "${want}"`);
  };
  hostAttribute('unit', r.hostUnit, c.unit, c.unit === DEFAULT_UNIT);
  hostAttribute('variant', r.hostVariant, c.variant, c.variant === DEFAULT_VARIANT);

  // ── No data ──────────────────────────────────────────────────────────────
  if (!c.data) {
    if (r.current) say('data is null but a [part="current"] conditions section is rendered');
    if (r.forecast) say('data is null but a [part="forecast"] section is rendered');
    if (r.bodyText === '') say('data is null and the card says nothing at all');
    return problems;
  }

  const d = c.data;

  // ── Current conditions ───────────────────────────────────────────────────
  if (!r.base) say('no [part="base"] card');
  if (!r.current) say('no [part="current"] conditions section');

  const wantTemp = formatTemp(d.temp, c.unit);
  if (r.temp !== wantTemp) say(`temperature "${r.temp}" != "${wantTemp}"`);
  if (r.condition !== d.condition) say(`condition "${r.condition}" != "${d.condition}"`);

  if (d.icon) {
    if (r.icon !== d.icon) say(`icon "${r.icon}" != the supplied "${d.icon}"`);
  } else if (r.icon === '') {
    say(`no icon supplied and none auto-detected from condition "${d.condition}"`);
  }

  // ── Details: humidity is a percentage, wind is km/h ──────────────────────
  const wantDetails: string[] = [];
  if (d.humidity != null) wantDetails.push(`${d.humidity}%`);
  if (d.wind != null) wantDetails.push(`${d.wind} km/h`);

  if (wantDetails.length !== r.detailTexts.length) {
    say(`${r.detailTexts.length} detail items ${JSON.stringify(r.detailTexts)},`
      + ` expected ${wantDetails.length} (${JSON.stringify(wantDetails)})`);
  } else {
    wantDetails.forEach((want, i) => {
      if (!r.detailTexts[i].includes(want)) {
        say(`detail #${i} "${r.detailTexts[i]}" does not report "${want}"`);
      }
    });
  }

  // ── Forecast ─────────────────────────────────────────────────────────────
  const forecast = d.forecast ?? [];
  if (forecast.length > 0) {
    if (!r.forecast) say(`${forecast.length} forecast days but no [part="forecast"]`);
    if (r.days.length !== forecast.length) {
      say(`rendered ${r.days.length} forecast days, expected ${forecast.length}`);
    } else {
      forecast.forEach((day, i) => {
        const got = r.days[i];
        if (got.day !== day.day) say(`forecast #${i} day "${got.day}" != "${day.day}"`);
        const high = formatTemp(day.high, c.unit);
        const low = formatTemp(day.low, c.unit);
        if (got.high !== high) say(`forecast #${i} high "${got.high}" != "${high}"`);
        if (got.low !== low) say(`forecast #${i} low "${got.low}" != "${low}"`);
        if (day.icon) {
          if (got.icon !== day.icon) say(`forecast #${i} icon "${got.icon}" != "${day.icon}"`);
        } else if (got.icon === '') {
          say(`forecast #${i} has no icon and none was auto-detected from "${day.condition}"`);
        }
      });
    }
  } else if (r.forecast) {
    say('no forecast days but a [part="forecast"] section is rendered');
  }

  return problems;
}
