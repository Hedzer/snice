/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-color-display matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * snice-color-display is the simplest kind of component in the library: no
 * interaction, no events, no data pipeline. Its whole contract is "given this
 * property vector, which of the three documented parts exist, what does the
 * label say, and how big is the swatch". So the oracle is a description of that
 * shadow tree, written straight out of docs/ai/components/color-display.md,
 * docs/components/color-display.md and snice-color-display.types.ts:
 *
 *   · `value: string = ''`   — "Color value (hex format)". It is what the
 *                              swatch paints, and — absent a `label` — what the
 *                              label reads, rendered in `format`.
 *   · `format: 'hex'|'rgb'|'hsl' = 'hex'`
 *                            — "Display format". The SAME colour expressed in
 *                              that notation: `#3b82f6` -> `rgb(59, 130, 246)`
 *                              -> `hsl(217, 91%, 60%)`. This module derives all
 *                              three from the hex triplet with the standard
 *                              conversions, so the expectation is arithmetic on
 *                              the documented input rather than a copy of the
 *                              component's own formatter.
 *   · `showSwatch: boolean = true` (attr `show-swatch`)
 *                            — "Show color swatch". `part="swatch"` exists iff
 *                              it is true.
 *   · `showLabel: boolean = true` (attr `show-label`)
 *                            — "Show color label". `part="label"` exists iff
 *                              it is true.
 *   · `swatchSize: 'small'|'medium'|'large' = 'medium'` (attr `swatch-size`)
 *                            — "Swatch size". A pure style axis; in a
 *                              layout-free DOM its observable contract is the
 *                              attribute channel plus the swatch's own size
 *                              class. The px sizes are the visual tier's job.
 *   · `label: string = ''`   — "Custom label text ... display a custom name
 *                              instead of the color value". So a non-empty
 *                              `label` REPLACES the formatted value; an empty
 *                              one falls back to it.
 *   · CSS parts: `container` (outer), `swatch`, `label`. `container` is listed
 *                unconditionally and no property removes it.
 *
 * The attribute-reflection expectations come from docs/ai/properties.md, not
 * from this component: an authored attribute is always present; a property
 * assignment reflects unless the assigned value equals the documented default;
 * a boolean reflects as the string `"true"`, and `false` removes the attribute.
 */
import { mount, part, shadow, settle, type Shape } from '../matrix-utils';

export const FORMATS = ['hex', 'rgb', 'hsl'] as const;
export const SWATCH_SIZES = ['small', 'medium', 'large'] as const;
export const CHANNELS = ['attr', 'prop'] as const;

export type Format = typeof FORMATS[number];
export type SwatchSize = typeof SWATCH_SIZES[number];
/** How a combo is authored: markup attributes, or post-connect JS assignment. */
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from the property table in both doc versions. */
export const DEFAULTS = {
  value: '',
  format: 'hex' as Format,
  showSwatch: true,
  showLabel: true,
  swatchSize: 'medium' as SwatchSize,
  label: '',
};

/**
 * The documented input shape: six-digit hex. Three colours with different
 * hue/saturation/lightness characters, so the hsl conversion is exercised on
 * all three of its branches (max = r, max = g, max = b) plus the achromatic
 * one where saturation collapses to zero.
 */
export const COLORS = ['#3b82f6', '#10b981', '#808080'] as const;

export const CUSTOM_LABEL = 'Error Red';

export interface ColorDisplayCombo {
  value: string;
  format: Format;
  showSwatch: boolean;
  showLabel: boolean;
  swatchSize: SwatchSize;
  label: string;
  channel: Channel;
}

/** A combo with every axis at its documented default, then overridden. */
export function combo(overrides: Partial<ColorDisplayCombo> = {}): ColorDisplayCombo {
  return {
    value: COLORS[0],
    format: DEFAULTS.format,
    showSwatch: DEFAULTS.showSwatch,
    showLabel: DEFAULTS.showLabel,
    swatchSize: DEFAULTS.swatchSize,
    label: DEFAULTS.label,
    channel: 'attr',
    ...overrides,
  };
}

// ── The documented colour notations ─────────────────────────────────────────

/** The three channel bytes of a documented six-digit hex value, or null. */
function hexTriplet(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

/**
 * The same colour in `rgb()` notation. Standard sRGB byte channels — this is
 * arithmetic on the documented hex input, not a reading of the component.
 */
export function asRgb(hex: string): string {
  const rgb = hexTriplet(hex);
  return rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : hex;
}

/**
 * The same colour in `hsl()` notation, by the textbook RGB -> HSL conversion,
 * with each component rounded to the integer a CSS author writes.
 */
export function asHsl(hex: string): string {
  const rgb = hexTriplet(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map(channel => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / delta + 2) / 6;
    else hue = ((r - g) / delta + 4) / 6;
  }
  return `hsl(${Math.round(hue * 360)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`;
}

/** `value` rendered in the requested notation — the documented `format` axis. */
export function formatted(value: string, format: Format): string {
  if (!value) return '';
  switch (format) {
    case 'hex': return value;
    case 'rgb': return asRgb(value);
    case 'hsl': return asHsl(value);
  }
}

/**
 * What the label reads: "display a custom name INSTEAD of the color value", so
 * a non-empty `label` wins and an empty one falls back to the formatted value.
 */
export function expectedLabelText(c: ColorDisplayCombo): string {
  return c.label || formatted(c.value, c.format);
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount a combo through its own authoring channel.
 *
 * The attribute channel writes the booleans as the explicit strings the docs
 * use (`show-label="false"`), because that is the exact spelling
 * docs/components/color-display.md shows and the exact spelling
 * docs/ai/properties.md gives a rule for.
 */
export async function mountColorDisplay(c: ColorDisplayCombo): Promise<HTMLElement> {
  if (c.channel === 'attr') {
    const attrs: Record<string, any> = {
      value: c.value,
      format: c.format,
      'show-swatch': String(c.showSwatch),
      'show-label': String(c.showLabel),
      'swatch-size': c.swatchSize,
    };
    if (c.label) attrs.label = c.label;
    return mount<HTMLElement>('snice-color-display', attrs);
  }
  const el = await mount<HTMLElement>('snice-color-display');
  Object.assign(el as any, {
    value: c.value,
    format: c.format,
    showSwatch: c.showSwatch,
    showLabel: c.showLabel,
    swatchSize: c.swatchSize,
    label: c.label,
  });
  await settle(el, 5);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export const containerPart = (el: HTMLElement) => part<HTMLElement>(el, 'container');
export const swatchPart = (el: HTMLElement) => part<HTMLElement>(el, 'swatch');
export const labelPart = (el: HTMLElement) => part<HTMLElement>(el, 'label');

function classesOf(node: Element | null): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

// ── Oracle ──────────────────────────────────────────────────────────────────

/** The DOCUMENTED shadow shape for a combo — the "expected" side. */
export function expectedShape(c: ColorDisplayCombo): Shape {
  return {
    hasContainer: true,
    hasSwatch: c.showSwatch,
    hasLabel: c.showLabel,
    labelText: c.showLabel ? expectedLabelText(c) : null,
    // "Swatch size" is a style axis, and the swatch's own size class is the
    // only place a layout-free DOM can observe it.
    swatchSizeClass: c.showSwatch ? `color-swatch--${c.swatchSize}` : null,
    // The swatch paints the colour the author gave, verbatim: `value` is the
    // CSS colour, and `format` is about the LABEL's notation, not the paint.
    swatchPaints: c.showSwatch ? c.value : null,
  };
}

/** The same description, read back off the rendered element. */
export function readShape(el: HTMLElement): Shape {
  const swatch = swatchPart(el);
  const label = labelPart(el);
  return {
    hasContainer: !!containerPart(el),
    hasSwatch: !!swatch,
    hasLabel: !!label,
    labelText: label ? (label.textContent ?? '').replace(/\s+/g, ' ').trim() : null,
    swatchSizeClass: swatch
      ? classesOf(swatch).find(name => name.startsWith('color-swatch--')) ?? '∅ no size class'
      : null,
    swatchPaints: swatch ? paintedBackground(swatch) : null,
  };
}

/**
 * The colour the swatch's inline style declares, read off the attribute rather
 * than the parsed `style` object: a CSSOM implementation is free to re-serialise
 * `#3b82f6` into `rgb(59, 130, 246)`, and the claim under test is that the
 * component passed the AUTHOR'S value through to the paint unchanged.
 */
function paintedBackground(swatch: HTMLElement): string {
  const declaration = /background-color:\s*([^;]*)/i.exec(swatch.getAttribute('style') ?? '');
  return declaration ? declaration[1].trim() : '∅ no background-color';
}

/**
 * The documented axis state: the live properties, plus the attributes the
 * framework's reflection rule says must exist.
 */
export function expectedAxes(c: ColorDisplayCombo): Shape {
  const reflects = (value: unknown, fallback: unknown) =>
    c.channel === 'attr' || value !== fallback;
  return {
    'prop.value': c.value,
    'prop.format': c.format,
    'prop.showSwatch': c.showSwatch,
    'prop.showLabel': c.showLabel,
    'prop.swatchSize': c.swatchSize,
    'prop.label': c.label,
    'attr.format': reflects(c.format, DEFAULTS.format) ? c.format : null,
    'attr.swatch-size': reflects(c.swatchSize, DEFAULTS.swatchSize) ? c.swatchSize : null,
    // A boolean reflects as "true"; false removes the attribute entirely.
    'attr.show-swatch': attrForBoolean(c, c.showSwatch, DEFAULTS.showSwatch),
    'attr.show-label': attrForBoolean(c, c.showLabel, DEFAULTS.showLabel),
  };
}

/**
 * The attribute a documented boolean leaves behind.
 *
 * Authored channel: the attribute the author wrote is still there, spelled as
 * they wrote it. Property channel: assigning the default is not reflected (so
 * no attribute at all), and assigning `false` removes the attribute — which for
 * a default-true boolean is the same absence, read differently.
 */
function attrForBoolean(c: ColorDisplayCombo, value: boolean, fallback: boolean): string | null {
  if (c.channel === 'attr') return String(value);
  if (value === fallback) return null;
  return value ? 'true' : null;
}

export function readAxes(el: HTMLElement): Shape {
  const any = el as any;
  return {
    'prop.value': any.value,
    'prop.format': any.format,
    'prop.showSwatch': any.showSwatch,
    'prop.showLabel': any.showLabel,
    'prop.swatchSize': any.swatchSize,
    'prop.label': any.label,
    'attr.format': el.getAttribute('format'),
    'attr.swatch-size': el.getAttribute('swatch-size'),
    'attr.show-swatch': el.getAttribute('show-swatch'),
    'attr.show-label': el.getAttribute('show-label'),
  };
}

/** Every documented part name present in the shadow tree, in document order. */
export function partNames(el: HTMLElement): string[] {
  return [...shadow(el).querySelectorAll('[part]')]
    .flatMap(node => (node.getAttribute('part') ?? '').split(/\s+/))
    .filter(Boolean);
}
