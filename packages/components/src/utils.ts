import { html, unsafeHTML, TemplateResult } from 'snice';
import { ICONS } from './icons/index';

export {
  strictStringAttributeConverter,
  FALLBACK_ACCENTS,
  getAccentPalette,
  pickContrastColor,
  onThemeChange,
} from './theme-utils';

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
