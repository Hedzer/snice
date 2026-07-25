import { html, unsafeHTML, TemplateResult } from 'snice';
import { ICONS } from './icons/index';

/**
 * Reflect only actual string values across a string attribute boundary.
 * Public component properties remain typed JavaScript inputs, so hostile or
 * accidental object values must not be coerced by calling user code.
 */
export const strictStringAttributeConverter = {
  toAttribute(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
};

/**
 * Classify a consumer-supplied icon value.
 *
 * This is the single source of truth for icon resolution. `renderIcon` uses it
 * for declarative rendering; components that build DOM imperatively (nav) use
 * it directly, so both paths agree on what counts as an image, a registry
 * name, or plain text.
 */
export function classifyIcon(icon: string): { kind: 'img' | 'registry' | 'text'; value: string } {
  if (icon.startsWith('img://')) return { kind: 'img', value: icon.slice(6) };
  if (icon.startsWith('text://')) return { kind: 'text', value: icon.slice(7) };

  // URL-shaped, or a filename with an image extension (an optional query
  // string is allowed so cache-busted paths still resolve as images).
  const isUrl = /^(https?:\/\/|\/|\.\/|\.\.\/|data:)/.test(icon);
  const isImageFile =
    /^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)(\?.*)?$/i.test(icon);
  if (isUrl || isImageFile) return { kind: 'img', value: icon };

  if ((ICONS as Record<string, string>)[icon]) return { kind: 'registry', value: icon };

  return { kind: 'text', value: icon };
}

/**
 * Detects icon type and returns appropriate template
 *
 * Scheme overrides:
 * - img://path -> forces <img> element
 * - text://content -> forces text content
 *
 * Auto-detection (when no scheme):
 * - URLs (http://, https://, /, ./, ../, data:) -> <img>
 * - Image extensions (svg, png, jpg, jpeg, jfif, pjp, gif, webp, avif, jxl,
 *   ico, cur, bmp, tif, tiff, heic, heif, apng) -> <img>
 * - Everything else -> span with text content (emoji, plain text)
 *
 * ⚠️ "home" or "settings" renders as PLAIN TEXT, not a Material icon.
 * For Material Symbols, use the icon slot instead:
 * <span slot="icon" class="material-symbols-outlined">home</span>
 *
 * Examples:
 * - "/path/icon.svg" -> <img>
 * - "icon.png" -> <img>
 * - "img://filename" -> <img> (forced)
 * - "🏠" -> <span> text (emoji)
 * - "home" -> <span> text (plain text, NOT a Material icon)
 * - "text:///not/a/path" -> <span> text (forced)
 */
export function renderIcon(icon: string, className = 'icon'): TemplateResult {
  if (!icon) return html``;

  const { kind, value } = classifyIcon(icon);

  if (kind === 'img') {
    return html`<img class="${className}" src="${value}" alt="" part="icon" />`;
  }

  // Built-in SVG registry (components/icons) — named icons resolve here
  // BEFORE the font-ligature fallback. Without this, names like 'search'
  // render as literal text unless an external icon font is loaded.
  if (kind === 'registry') {
    return html`<span class="${className}" part="icon">${unsafeHTML((ICONS as Record<string, string>)[value])}</span>`;
  }

  // Default: text content (emoji, font icon ligature names)
  // All content is escaped - no HTML injection possible
  // Detect ligature icon names (lowercase words with underscores, e.g. "search", "check_circle")
  // vs emoji/other text — apply --snice-icon-font (defaults to Material Symbols Outlined)
  if (/^[a-z][a-z0-9_]*$/.test(value)) {
    return html`<span class="${className} snice-icon-ligature" style="font-family:var(--snice-icon-font,'Material Symbols Outlined'),sans-serif" part="icon">${value}</span>`;
  }
  return html`<span class="${className}" part="icon">${value}</span>`;
}

/**
 * Fallback accent hues (muted/business tones). Used when CSS vars haven't
 * been applied (test and non-browser environments) or when the 8 accent tokens have
 * been stripped. Keep in lockstep with `theme.css` --snice-color-accent-1..8.
 */
export const FALLBACK_ACCENTS = [
  'hsl(214 55% 48%)', 'hsl(27 62% 50%)', 'hsl(160 40% 40%)', 'hsl(275 32% 52%)',
  'hsl(42 62% 48%)',  'hsl(340 42% 55%)', 'hsl(110 32% 42%)', 'hsl(195 45% 46%)',
];

/**
 * Returns the 8-slot accent palette resolved against the current document's
 * CSS variables, with in-process fallback for non-browser contexts. Data-vis
 * components call this instead of hard-coding color arrays so themes flow
 * through automatically.
 *
 * The returned strings are safe for `canvas.fillStyle`, `svg fill`, or
 * inline `style` — they're either a `hsl(...)` literal or whatever the
 * consumer set as `--snice-color-accent-N`.
 */
export function getAccentPalette(root?: HTMLElement): string[] {
  if (typeof getComputedStyle !== 'function') return FALLBACK_ACCENTS;
  const target = root ?? document.documentElement;
  const cs = getComputedStyle(target);
  return FALLBACK_ACCENTS.map((fallback, i) => {
    const v = cs.getPropertyValue(`--snice-color-accent-${i + 1}`).trim();
    return v || fallback;
  });
}

/**
 * Parses a CSS color string into sRGB components in [0,1]. Handles `rgb()`,
 * `rgba()`, `hsl()`, `hsla()`, and `#hex`. Returns null if unparseable.
 */
function parseCssColor(value: string): [number, number, number] | null {
  if (!value) return null;
  const s = value.trim();
  // Hex: #RGB #RRGGBB #RGBA #RRGGBBAA
  if (s[0] === '#') {
    const hex = s.slice(1);
    const norm = hex.length === 3 || hex.length === 4
      ? hex.slice(0, 3).split('').map(c => c + c).join('')
      : hex.slice(0, 6);
    if (norm.length !== 6) return null;
    const n = parseInt(norm, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  // rgb() / rgba()
  const rgbMatch = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgbMatch) {
    return [+rgbMatch[1] / 255, +rgbMatch[2] / 255, +rgbMatch[3] / 255];
  }
  // hsl() / hsla() — quick conversion via an offscreen element for accuracy
  // (skip manual HSL→RGB to keep this helper small; browsers will resolve
  // any hsl() via getComputedStyle on the element anyway).
  if (/^hsla?\(/i.test(s) && typeof document !== 'undefined') {
    const probe = document.createElement('span');
    probe.style.color = s;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return parseCssColor(resolved);
  }
  return null;
}

/**
 * Relative luminance per WCAG 2.x, input in sRGB [0,1].
 */
function luminance(rgb: [number, number, number]): number {
  const lin = rgb.map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  ) as [number, number, number];
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/**
 * Picks a readable text color for the given `bg`, choosing between the
 * theme's existing text tokens. Light bg → `--snice-color-text` (dark text);
 * dark bg → `--snice-color-text-inverse` (light text). Falls back to inverse
 * for unparseable bg (safe default for colored fills).
 *
 * Used by badge/chip (and anything else pairing a colored fill with a label)
 * so the text stays legible regardless of theme — without hardcoding #fff.
 */
export function pickContrastColor(bg: string): string {
  const rgb = parseCssColor(bg);
  if (!rgb) return 'var(--snice-color-text-inverse)';
  // Threshold 0.55 keeps saturated blues/greens (luminance ~0.2) using the
  // inverse (light) text, and pastels/lightened fills (> 0.55) using the
  // main text token (dark).
  return luminance(rgb) > 0.55
    ? 'var(--snice-color-text)'
    : 'var(--snice-color-text-inverse)';
}

/**
 * Subscribe to theme changes on the document root. Returns an unsubscribe
 * fn. A single shared MutationObserver notifies all subscribers when the
 * `data-theme` or `class` attribute changes on <html>.
 */
type ThemeListener = () => void;
const themeListeners = new Set<ThemeListener>();
let themeObserver: MutationObserver | null = null;

export function onThemeChange(fn: ThemeListener): () => void {
  if (typeof document === 'undefined') return () => {};
  themeListeners.add(fn);
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => {
      for (const listener of themeListeners) {
        try { listener(); } catch {}
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'data-theme-variant'],
    });
  }
  return () => {
    themeListeners.delete(fn);
    if (themeListeners.size === 0 && themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
  };
}
