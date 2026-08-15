/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Per-component oracle for the snice-qr-code matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Everything encoded here comes from docs/ai/components/qr-code.md and
 * snice-qr-code.types.ts:
 *
 *   · `value`, `size`, `errorCorrectionLevel` ('L'|'M'|'Q'|'H'), `renderMode`
 *     ('canvas'|'svg'), `dotStyle` ('square'|'rounded'|'dots'), `margin`,
 *     `fgColor`, `bgColor`, and the centre-overlay set (`includeImage`,
 *     `imageUrl`, `imageSize`, `centerText`, `centerTextSize`, `textFillColor`,
 *     `textOutlineColor`).
 *   · `toSVGString()` — "SVG markup string (sync, only when renderMode='svg')".
 *   · `toDataURL(type?, quality?)` — "Export as data URL (async)".
 *   · `toBlob(type?, quality?)` — "Export as Blob (async)".
 *   · CSS part `base` — "QR code container div".
 *
 * ── Why this tier is SVG-shaped ─────────────────────────────────────────────
 *
 * `renderMode: 'canvas'` paints into a 2D context, and happy-dom has none: the
 * canvas element exists and stays blank whatever the component does. So the DOM
 * tier asserts the canvas MODE contract it can see (a canvas is what gets
 * mounted, and `toSVGString()` is empty there, exactly as documented) and leaves
 * the pixels to the visual tier, where a real engine runs. The SVG mode is fully
 * inspectable here, and it is the mode every documented styling property can be
 * checked against without a rasteriser.
 *
 * ── The QR facts the oracle leans on ────────────────────────────────────────
 *
 * QR symbol versions are 21x21 + 4 modules per version, and a higher error
 * correction level never needs FEWER modules for the same payload. Both are
 * properties of the QR standard the component implements, not of this
 * implementation, so the oracle is entitled to them.
 */
import { mount, part, shadow, wait, type Shape } from '../matrix-utils';

export const EC_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export const RENDER_MODES = ['canvas', 'svg'] as const;
export const DOT_STYLES = ['square', 'rounded', 'dots'] as const;

export type EcLevel = typeof EC_LEVELS[number];
export type RenderMode = typeof RENDER_MODES[number];
export type DotStyle = typeof DOT_STYLES[number];

/** Documented defaults, from docs/ai/components/qr-code.md. */
export const DEFAULTS = {
  value: '',
  size: 200,
  errorCorrectionLevel: 'M' as EcLevel,
  renderMode: 'canvas' as RenderMode,
  dotStyle: 'square' as DotStyle,
  margin: 4,
  fgColor: '#000000',
  bgColor: '#ffffff',
  includeImage: false,
  imageUrl: '',
  imageSize: 40,
  centerText: '',
  centerTextSize: 16,
  textFillColor: '#000000',
  textOutlineColor: '#ffffff',
};

export interface QrElement extends HTMLElement {
  value: string;
  size: number;
  errorCorrectionLevel: EcLevel;
  renderMode: RenderMode;
  dotStyle: DotStyle;
  margin: number;
  fgColor: string;
  bgColor: string;
  centerText: string;
  centerTextSize: number;
  textFillColor: string;
  textOutlineColor: string;
  toSVGString(): string;
  toDataURL(type?: string, quality?: number): Promise<string>;
  toBlob(type?: string, quality?: number): Promise<Blob>;
}

/** Payloads: a short one and a long one, so the symbol version really differs. */
export const SHORT = 'https://snice.dev';
export const LONG =
  'https://example.com/catalogue/items/98217?variant=charcoal&size=large&ref=matrix-suite';

export interface QrAttrs {
  value?: string;
  size?: number;
  'error-correction-level'?: EcLevel;
  'render-mode'?: RenderMode;
  'dot-style'?: DotStyle;
  margin?: number;
  'fg-color'?: string;
  'bg-color'?: string;
  'center-text'?: string;
  'center-text-size'?: number;
  'text-fill-color'?: string;
  'text-outline-color'?: string;
}

/**
 * Mount a QR code the documented way — every dimension is an authored attribute
 * — and let the deferred overlay pass (a rAF hop in the component) land.
 */
export async function mountQr(attrs: QrAttrs): Promise<QrElement> {
  const el = await mount<QrElement>('snice-qr-code', attrs as Record<string, any>);
  await wait(60);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function container(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'base');
}

export function svgOf(el: HTMLElement): SVGElement | null {
  return shadow(el).querySelector('svg');
}

export function canvasOf(el: HTMLElement): HTMLCanvasElement | null {
  return shadow(el).querySelector('canvas');
}

/** The symbol's box in module units: `moduleCount + 2 * margin`. */
export function viewBoxSize(svg: SVGElement | null): number | null {
  const parts = (svg?.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  if (parts.length !== 4 || !Number.isFinite(parts[2])) return null;
  return parts[2];
}

/** The two structural rects the SVG symbol is built from. */
export function backgroundRect(svg: SVGElement | null): SVGElement | null {
  return (svg?.querySelector('rect:not(#template)') as SVGElement | null) ?? null;
}

export function templateRect(svg: SVGElement | null): SVGElement | null {
  return (svg?.querySelector('#template') as SVGElement | null) ?? null;
}

export function darkModules(svg: SVGElement | null): number {
  return svg?.querySelectorAll('use').length ?? 0;
}

export function overlayTexts(svg: SVGElement | null): SVGElement[] {
  return svg ? [...svg.querySelectorAll('text')] as unknown as SVGElement[] : [];
}

// ── Oracle ──────────────────────────────────────────────────────────────────

export interface SvgCombo {
  id: string;
  value: string;
  ecLevel: EcLevel;
  margin: number;
  fgColor: string;
  bgColor: string;
  size: number;
}

/**
 * The documented SVG symbol for a combo, plus the QR-standard invariants any
 * conforming symbol satisfies. Reported as a problem list so one failing combo
 * tells its whole story.
 */
export function svgProblems(el: QrElement, combo: SvgCombo): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);

  const base = container(el);
  if (!base) { say('no part="base"'); return problems; }

  const svg = svgOf(el);
  if (!svg) { say('render-mode="svg" produced no <svg>'); return problems; }
  if (!base.contains(svg)) say('the <svg> is not inside part="base"');
  if (canvasOf(el)) say('render-mode="svg" also produced a <canvas>');

  const box = viewBoxSize(svg);
  if (box === null) { say(`unreadable viewBox "${svg.getAttribute('viewBox')}"`); return problems; }

  // The symbol occupies `moduleCount` modules with `margin` modules of quiet
  // zone on every side.
  const modules = box - 2 * combo.margin;
  if (modules < 21) say(`${modules} modules inside the quiet zone — below the 21x21 minimum`);
  if ((modules - 21) % 4 !== 0) {
    say(`${modules} modules is not a QR version size (21 + 4n)`);
  }

  const background = backgroundRect(svg);
  const template = templateRect(svg);
  if (!background) say('no background rect');
  else if (background.getAttribute('fill') !== combo.bgColor) {
    say(`background fill "${background.getAttribute('fill')}" != bg-color "${combo.bgColor}"`);
  }
  if (!template) say('no module template rect');
  else if (template.getAttribute('fill') !== combo.fgColor) {
    say(`module fill "${template.getAttribute('fill')}" != fg-color "${combo.fgColor}"`);
  }

  const dark = darkModules(svg);
  if (dark === 0) say('the symbol has no dark modules at all');
  if (dark >= modules * modules) {
    say(`${dark} dark modules in a ${modules}x${modules} symbol`);
  }

  // "toSVGString() — SVG markup string (sync, only when renderMode='svg')".
  const markup = el.toSVGString();
  if (!markup.startsWith('<svg')) say(`toSVGString() returned "${markup.slice(0, 40)}…"`);
  if (!markup.includes(combo.fgColor)) say('toSVGString() does not carry the foreground colour');

  return problems;
}

export function expectedRenderMode(mode: RenderMode): Shape {
  return {
    hasSvg: mode === 'svg',
    hasCanvas: mode === 'canvas',
    // The docs scope toSVGString() to the SVG mode; in canvas mode there is no
    // SVG to hand back.
    svgStringIsMarkup: mode === 'svg',
  };
}

export function readRenderMode(el: QrElement): Shape {
  const markup = el.toSVGString();
  return {
    hasSvg: !!svgOf(el),
    hasCanvas: !!canvasOf(el),
    svgStringIsMarkup: markup.startsWith('<svg'),
  };
}

export { wait };
