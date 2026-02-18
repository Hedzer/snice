import { html, TemplateResult } from 'snice';

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
 * - Everything else -> span with text (emoji, font ligatures)
 *
 * Examples:
 * - "/path/icon.svg" -> <img>
 * - "icon.png" -> <img>
 * - "img://filename" -> <img> (forced)
 * - "home" -> <span> text (Material Symbols ligature)
 * - "🏠" -> <span> text (emoji)
 * - "text:///not/a/path" -> <span> text (forced)
 */
export function renderIcon(icon: string, className = 'icon'): TemplateResult {
  if (!icon) return html``;

  // Check for scheme overrides first
  if (icon.startsWith('img://')) {
    const src = icon.slice(6);
    return html`<img class="${className}" src="${src}" alt="" part="icon" />`;
  }

  if (icon.startsWith('text://')) {
    const content = icon.slice(7);
    return html`<span class="${className}" part="icon">${content}</span>`;
  }

  // Auto-detect: Check if it's a URL pattern
  if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:)/.test(icon)) {
    return html`<img class="${className}" src="${icon}" alt="" part="icon" />`;
  }

  // Auto-detect: Check if it's a file with image extension
  // Must have at least one char before the dot, and no unsupported protocol prefix
  // Covers: SVG, PNG, JPEG variants, GIF, WebP, AVIF, JPEG XL, ICO, BMP, TIFF, HEIC/HEIF, APNG
  if (/^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)$/i.test(icon)) {
    return html`<img class="${className}" src="${icon}" alt="" part="icon" />`;
  }

  // Default: text content (emoji, font icon ligature names)
  // All content is escaped - no HTML injection possible
  return html`<span class="${className}" part="icon">${icon}</span>`;
}
