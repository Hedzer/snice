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
  if (/^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)(\?.*)?$/i.test(icon)) {
    return html`<img class="${className}" src="${icon}" alt="" part="icon" />`;
  }

  // Default: text content (emoji, font icon ligature names)
  // All content is escaped - no HTML injection possible
  // Detect ligature icon names (lowercase words with underscores, e.g. "search", "check_circle")
  // vs emoji/other text — apply --snice-icon-font (defaults to Material Symbols Outlined)
  if (/^[a-z][a-z0-9_]*$/.test(icon)) {
    return html`<span class="${className} snice-icon-ligature" style="font-family:var(--snice-icon-font,'Material Symbols Outlined'),sans-serif" part="icon">${icon}</span>`;
  }
  return html`<span class="${className}" part="icon">${icon}</span>`;
}

/**
 * Fallback accent hues (muted/business tones). Used when CSS vars haven't
 * been applied (test environments, SSR) or when the 8 accent tokens have
 * been stripped. Keep in lockstep with `theme.css` --snice-color-accent-1..8.
 */
const FALLBACK_ACCENTS = [
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
