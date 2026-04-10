import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-weather';

type Args = {
  variant?: 'full' | 'compact';
  unit?: 'celsius' | 'fahrenheit';
};

const meta: Meta<Args> = {
  title: 'Specialty/Weather',
  component: 'snice-weather',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['full', 'compact'] },
    unit:    { control: 'select', options: ['celsius', 'fahrenheit'] },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-weather');
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.unit    !== undefined) el.setAttribute('unit',    args.unit);
    (el as any).data = { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, forecast: [
      { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
      { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
      { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' },
    ]};
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

const fullForecast = [
  { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
  { day: 'Tue', high: 20, low: 15, condition: 'Rain' },
  { day: 'Wed', high: 22, low: 16, condition: 'Cloudy' },
  { day: 'Thu', high: 25, low: 19, condition: 'Partly Cloudy' },
  { day: 'Fri', high: 21, low: 14, condition: 'Thunderstorm' },
];

function makeWeather(attrs: Record<string, string> = {}, data?: object) {
  const el = document.createElement('snice-weather');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (data) (el as any).data = data;
  return el;
}

function grid(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

export const Default: Story = {
  args: { variant: 'full', unit: 'celsius' },
};

// h2: Variant: full (default)
export const VariantFull: Story = {
  render: () => grid(
    makeWeather({ variant: 'full' }, { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, forecast: fullForecast }),
  ),
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => grid(
    makeWeather({ variant: 'compact' }, { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, forecast: fullForecast }),
  ),
};

// h2: Unit: celsius vs fahrenheit
export const UnitCelsiusVsFahrenheit: Story = {
  render: () => grid(
    makeWeather({ unit: 'celsius' },    { temp: 22, condition: 'Sunny', humidity: 40, wind: 8, forecast: fullForecast }),
    makeWeather({ unit: 'fahrenheit' }, { temp: 72, condition: 'Sunny', humidity: 40, wind: 8, forecast: fullForecast }),
  ),
};

// h2: All Auto-detected Conditions
export const AllAutoDetectedConditions: Story = {
  render: () => {
    const conditions = [
      { condition: 'Sunny',        temp: 28 },
      { condition: 'Clear',        temp: 26 },
      { condition: 'Partly Cloudy',temp: 22 },
      { condition: 'Cloudy',       temp: 18 },
      { condition: 'Rain',         temp: 14 },
      { condition: 'Snow',         temp: -2 },
      { condition: 'Thunderstorm', temp: 20 },
      { condition: 'Fog',          temp: 10 },
      { condition: 'Windy',        temp: 16 },
    ];
    return grid(...conditions.map(c => makeWeather({}, { temp: c.temp, condition: c.condition, humidity: 50, wind: 15 })));
  },
};

// h2: Custom Icon Override
export const CustomIconOverride: Story = {
  render: () => grid(
    makeWeather({}, { temp: 25, condition: 'Alien Weather', icon: '👽', humidity: 99, wind: 999 }),
  ),
};

// h2: With Humidity Only
export const WithHumidityOnly: Story = {
  render: () => grid(
    makeWeather({}, { temp: 30, condition: 'Sunny', humidity: 80 }),
  ),
};

// h2: With Wind Only
export const WithWindOnly: Story = {
  render: () => grid(
    makeWeather({}, { temp: 15, condition: 'Windy', wind: 45 }),
  ),
};

// h2: With Humidity + Wind
export const WithHumidityAndWind: Story = {
  render: () => grid(
    makeWeather({}, { temp: 22, condition: 'Clear', humidity: 55, wind: 20 }),
  ),
};

// h2: No Details (no humidity, no wind)
export const NoDetails: Story = {
  render: () => grid(
    makeWeather({}, { temp: 20, condition: 'Cloudy' }),
  ),
};

// h2: With Forecast
export const WithForecast: Story = {
  render: () => grid(
    makeWeather({}, { temp: 22, condition: 'Sunny', humidity: 40, wind: 10, forecast: fullForecast }),
  ),
};

// h2: Forecast with Custom Icons
export const ForecastWithCustomIcons: Story = {
  render: () => grid(
    makeWeather({}, {
      temp: 18, condition: 'Cloudy', humidity: 70, wind: 25,
      forecast: [
        { day: 'Mon', high: 20, low: 14, condition: 'Sunny', icon: '☀️' },
        { day: 'Tue', high: 18, low: 12, condition: 'Rain',  icon: '🌧️' },
        { day: 'Wed', high: 22, low: 15, condition: 'Clear', icon: '🌞' },
      ],
    }),
  ),
};

// h2: No Forecast
export const NoForecast: Story = {
  render: () => grid(
    makeWeather({}, { temp: 25, condition: 'Sunny', humidity: 30, wind: 5 }),
  ),
};

// h2: Extreme Temperatures
export const ExtremeTemperatures: Story = {
  render: () => grid(
    makeWeather({}, { temp: 48,  condition: 'Clear', humidity: 10, wind: 5  }),
    makeWeather({}, { temp: -35, condition: 'Snow',  humidity: 90, wind: 40 }),
  ),
};

// h2: No Data (null)
export const NoData: Story = {
  render: () => grid(makeWeather()),
};

// h2: Compact x Fahrenheit
export const CompactXFahrenheit: Story = {
  render: () => grid(
    makeWeather({ variant: 'compact', unit: 'fahrenheit' }, { temp: 85, condition: 'Sunny', humidity: 30, wind: 8 }),
  ),
};
