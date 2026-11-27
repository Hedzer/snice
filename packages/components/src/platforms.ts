/**
 * Canonical Platform Skins registry, contemporary specification targets,
 * element-equivalence classifications, and pure-CSS contract validation.
 *
 * Zero runtime dependencies on core or bundler plugin so both
 * `packages/components/` and `packages/plugin/` can consume it cleanly.
 */

export const SNICE_SKIN_PLATFORMS = ['ios', 'material', 'windows', 'macos'] as const;
export type SniceSkinPlatform = (typeof SNICE_SKIN_PLATFORMS)[number];

export const SNICE_PLATFORMS = ['default', ...SNICE_SKIN_PLATFORMS] as const;
export type SnicePlatform = (typeof SNICE_PLATFORMS)[number];

export function isSnicePlatform(value: unknown): value is SnicePlatform {
  return typeof value === 'string' && (SNICE_PLATFORMS as readonly string[]).includes(value);
}

export function isSniceSkinPlatform(value: unknown): value is SniceSkinPlatform {
  return typeof value === 'string' && (SNICE_SKIN_PLATFORMS as readonly string[]).includes(value);
}

export type ComponentPlatformClassification =
  | 'direct-analogue'
  | 'composite'
  | 'non-native-guideline';

export interface PlatformSpecTarget {
  readonly id: SniceSkinPlatform;
  readonly displayName: string;
  readonly guidelineRelease: string;
  readonly pinnedDate: string;
  readonly fontPolicy: string;
  readonly browserLimits: readonly string[];
}

/**
 * Pinned contemporary official platform design systems and browser-boundary notes.
 * Never target legacy iOS 16, Material 2, or Fluent 1 approximations.
 */
export const PLATFORM_SPEC_TARGETS: Readonly<Record<SniceSkinPlatform, PlatformSpecTarget>> = {
  ios: {
    id: 'ios',
    displayName: 'iOS 26+ Liquid Glass',
    guidelineRelease: 'Apple Human Interface Guidelines (iOS 26 / Liquid Glass)',
    pinnedDate: '2026-08-20',
    fontPolicy: 'System SF stack (-apple-system, BlinkMacSystemFont, system-ui, sans-serif); no proprietary font redistribution.',
    browserLimits: [
      'OS-private CoreHaptics / UIImpactFeedbackGenerator tactile feedback is unavailable on the web; visual spring/magnification cues provide browser-expressible feedback.',
      'True cross-window desktop/wallpaper sampling is bounded by CSS backdrop-filter; @supports not (backdrop-filter) and prefers-reduced-transparency fall back to high-legibility tinted surfaces.'
    ]
  },
  material: {
    id: 'material',
    displayName: 'Android Material 3 Expressive',
    guidelineRelease: 'Material Design 3 Expressive (m3.material.io, 2025/2026)',
    pinnedDate: '2026-08-20',
    fontPolicy: 'System Roboto/sans stack (Roboto, system-ui, -apple-system, sans-serif); no proprietary font redistribution.',
    browserLimits: [
      'Android OS wallpaper Dynamic Color extraction is unavailable to web pages; user --snice-color-primary brand overrides cascade identically through CSS color-mix().',
      'System vibration/haptic ticks on slider stops are OS-private; visual stop dots and spring physics provide browser-expressible feedback.'
    ]
  },
  windows: {
    id: 'windows',
    displayName: 'Windows 11 Fluent 2 / WinUI 3',
    guidelineRelease: 'Microsoft Fluent 2 Design System & WinUI 3 (Windows 11 24H2/25H2)',
    pinnedDate: '2026-08-20',
    fontPolicy: "System Segoe UI Variable stack ('Segoe UI Variable', 'Segoe UI', system-ui, sans-serif); no proprietary font redistribution.",
    browserLimits: [
      'Desktop wallpaper DWM Mica sampling is OS-compositor private; layered translucent tint + subtle luminance elevation approximates Mica/Mica Alt with crisp opaque fallbacks.',
      'Windows accent color sync uses user --snice-color-primary or OS forced-colors system keywords where active.'
    ]
  },
  macos: {
    id: 'macos',
    displayName: 'macOS 26+ Liquid Glass / AppKit',
    guidelineRelease: 'Apple Human Interface Guidelines (macOS 26 Tahoe / Liquid Glass AppKit)',
    pinnedDate: '2026-08-20',
    fontPolicy: 'System SF Pro stack (-apple-system, BlinkMacSystemFont, system-ui, sans-serif); no proprietary font redistribution.',
    browserLimits: [
      'Native NSVisualEffectView behind-window desktop blending is OS-private; in-viewport backdrop-filter vibrancy + specular rims replicate Liquid Glass with reduced-transparency fallbacks.',
      'Native macOS traffic-light window chrome and Force Touch haptics are OS-private.'
    ]
  }
};

/**
 * Full-catalog element equivalence classification across all 134 released Snice components.
 * - `direct-analogue`: direct native OS control counterpart (exact native anatomy/metrics/behavior).
 * - `composite`: built from contemporary official platform patterns.
 * - `non-native-guideline`: Snice capability styled purposefully to each platform's official layout,
 *   surface, typography, density, and chrome guidance.
 */
export const COMPONENT_PLATFORM_CLASSIFICATION: Readonly<Record<string, ComponentPlatformClassification>> = {
  // Direct native analogues
  alert: 'direct-analogue',
  badge: 'direct-analogue',
  banner: 'direct-analogue',
  button: 'direct-analogue',
  checkbox: 'direct-analogue',
  chip: 'direct-analogue',
  divider: 'direct-analogue',
  drawer: 'direct-analogue',
  input: 'direct-analogue',
  link: 'direct-analogue',
  list: 'direct-analogue',
  menu: 'direct-analogue',
  modal: 'direct-analogue',
  nav: 'direct-analogue',
  popover: 'direct-analogue',
  progress: 'direct-analogue',
  'progress-ring': 'direct-analogue',
  radio: 'direct-analogue',
  'range-slider': 'direct-analogue',
  'segmented-control': 'direct-analogue',
  select: 'direct-analogue',
  slider: 'direct-analogue',
  spinner: 'direct-analogue',
  'split-button': 'direct-analogue',
  switch: 'direct-analogue',
  tabs: 'direct-analogue',
  tag: 'direct-analogue',
  textarea: 'direct-analogue',
  toast: 'direct-analogue',
  tooltip: 'direct-analogue',

  // Official pattern compositions
  accordion: 'composite',
  'action-bar': 'composite',
  avatar: 'composite',
  'avatar-group': 'composite',
  breadcrumbs: 'composite',
  card: 'composite',
  carousel: 'composite',
  'color-display': 'composite',
  'color-picker': 'composite',
  'command-palette': 'composite',
  'date-picker': 'composite',
  'date-range-picker': 'composite',
  'date-time-picker': 'composite',
  'empty-state': 'composite',
  'file-upload': 'composite',
  'form-layout': 'composite',
  image: 'composite',
  'key-value': 'composite',
  layout: 'composite',
  login: 'composite',
  'message-strip': 'composite',
  'notification-center': 'composite',
  pagination: 'composite',
  rating: 'composite',
  skeleton: 'composite',
  'split-pane': 'composite',
  spotlight: 'composite',
  'step-input': 'composite',
  stepper: 'composite',
  'tag-input': 'composite',
  'time-picker': 'composite',
  'time-range-picker': 'composite',
  tree: 'composite',

  // Non-native Snice elements styled to each platform's official design language
  'activity-feed': 'non-native-guideline',
  'app-tiles': 'non-native-guideline',
  'approval-flow': 'non-native-guideline',
  'audio-recorder': 'non-native-guideline',
  availability: 'non-native-guideline',
  binpack: 'non-native-guideline',
  book: 'non-native-guideline',
  booking: 'non-native-guideline',
  calendar: 'non-native-guideline',
  camera: 'non-native-guideline',
  'camera-annotate': 'non-native-guideline',
  candlestick: 'non-native-guideline',
  cart: 'non-native-guideline',
  chart: 'non-native-guideline',
  chat: 'non-native-guideline',
  'code-block': 'non-native-guideline',
  comments: 'non-native-guideline',
  countdown: 'non-native-guideline',
  cropper: 'non-native-guideline',
  'data-card': 'non-native-guideline',
  diff: 'non-native-guideline',
  doc: 'non-native-guideline',
  draw: 'non-native-guideline',
  estimate: 'non-native-guideline',
  'file-gallery': 'non-native-guideline',
  'flip-card': 'non-native-guideline',
  flow: 'non-native-guideline',
  funnel: 'non-native-guideline',
  gantt: 'non-native-guideline',
  gauge: 'non-native-guideline',
  grid: 'non-native-guideline',
  heatmap: 'non-native-guideline',
  invoice: 'non-native-guideline',
  kanban: 'non-native-guideline',
  kpi: 'non-native-guideline',
  leaderboard: 'non-native-guideline',
  'link-preview': 'non-native-guideline',
  location: 'non-native-guideline',
  map: 'non-native-guideline',
  markdown: 'non-native-guideline',
  masonry: 'non-native-guideline',
  'music-player': 'non-native-guideline',
  'network-graph': 'non-native-guideline',
  'order-tracker': 'non-native-guideline',
  'org-chart': 'non-native-guideline',
  paint: 'non-native-guideline',
  'pdf-viewer': 'non-native-guideline',
  'permission-matrix': 'non-native-guideline',
  'podcast-player': 'non-native-guideline',
  'pricing-table': 'non-native-guideline',
  'product-card': 'non-native-guideline',
  'qr-code': 'non-native-guideline',
  'qr-reader': 'non-native-guideline',
  receipt: 'non-native-guideline',
  recipe: 'non-native-guideline',
  sankey: 'non-native-guideline',
  sortable: 'non-native-guideline',
  sparkline: 'non-native-guideline',
  'stat-group': 'non-native-guideline',
  table: 'non-native-guideline',
  terminal: 'non-native-guideline',
  testimonial: 'non-native-guideline',
  timeline: 'non-native-guideline',
  timer: 'non-native-guideline',
  treemap: 'non-native-guideline',
  'user-card': 'non-native-guideline',
  'video-player': 'non-native-guideline',
  'virtual-scroller': 'non-native-guideline',
  waterfall: 'non-native-guideline',
  weather: 'non-native-guideline',
  'work-order': 'non-native-guideline'
};

/**
 * Splits a comma-separated CSS selector list while respecting nested parentheses/brackets/quotes.
 */
function splitSelectorList(selectorText: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote: string | null = null;

  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i];
    if (quote) {
      current += ch;
      if (ch === '\\' && i + 1 < selectorText.length) {
        current += selectorText[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

/**
 * Validates a single complex selector against the Layer 2 `<comp>/<platform>.css` contract:
 * Allowed forms:
 * - `:host` (with optional `(...)` and pseudo-classes/pseudo-elements)
 * - `[part~="<name>"]` (with optional pseudo-classes/pseudo-elements/attribute selectors)
 * - `:host(...) [part~="<name>"]` (optional `:host` ancestor followed by whitespace and `[part~="..."]`)
 *
 * Forbidden:
 * - Private internal class selectors (`.foo`) outside `:host(...)`
 * - ID selectors (`#foo`) outside `:host(...)`
 * - Bare tag selectors (`div`, `span`, `button`, `*`, etc.)
 * - Descendants or combinators after `[part~="..."]`
 * - `:host-context(...)` (not supported in Firefox)
 */
const HOST_PREFIX_RE = /^:host(?:\([^)]*\))?(?:::[a-zA-Z-]+|:[a-zA-Z-]+(?:\([^)]*\))?)*$/;
const PART_SIMPLE_RE = /^\[part~=["']?[a-zA-Z0-9_-]+["']?\](?:\[(?:[^\]"']|"[^"]*"|'[^']*')*\]|::[a-zA-Z-]+|:[a-zA-Z-]+(?:\([^)]*\))?)*$/;
const HOST_AND_PART_RE = /^:host(?:\([^)]*\))?(?::[a-zA-Z-]+(?:\([^)]*\))?)*\s+\[part~=["']?[a-zA-Z0-9_-]+["']?\](?:\[(?:[^\]"']|"[^"]*"|'[^']*')*\]|::[a-zA-Z-]+|:[a-zA-Z-]+(?:\([^)]*\))?)*$/;

export function isValidPlatformComponentSelector(selector: string): boolean {
  const s = selector.trim();
  if (!s) return false;
  if (s.includes(':host-context')) return false;
  return HOST_PREFIX_RE.test(s) || PART_SIMPLE_RE.test(s) || HOST_AND_PART_RE.test(s);
}

/**
 * Validates a Layer 2 `<comp>/<platform>.css` stylesheet against the Snice platform skin contract.
 * Returns an array of human-readable violation diagnostics (empty array = valid).
 */
export function validatePlatformCss(cssText: string, filePath = '<platform.css>'): string[] {
  const errors: string[] = [];
  // Strip comments while preserving structure
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  if (/!\s*important\b/i.test(stripped)) {
    errors.push(`${filePath}: "!important" is forbidden in platform component CSS (use cascade layer precedence instead).`);
  }

  // Walk blocks recursively to inspect rule selectors (ignoring @keyframes bodies)
  const checkBlock = (text: string, inKeyframes = false): void => {
    let i = 0;
    const len = text.length;
    while (i < len) {
      // Skip whitespace
      while (i < len && /\s/.test(text[i])) i++;
      if (i >= len) break;

      // Read prelude up to `{` or `;`
      const start = i;
      let quote: string | null = null;
      let parenDepth = 0;
      while (i < len) {
        const ch = text[i];
        if (quote) {
          if (ch === '\\') { i += 2; continue; }
          if (ch === quote) quote = null;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
        if (parenDepth === 0 && (ch === '{' || ch === ';')) break;
        i++;
      }

      if (i >= len) break;
      const prelude = text.slice(start, i).trim();
      const delim = text[i++];

      if (delim === ';') {
        // At-rule statement like @charset or @import or declaration
        continue;
      }

      // Find matching `}`
      const bodyStart = i;
      let braceDepth = 1;
      quote = null;
      while (i < len && braceDepth > 0) {
        const ch = text[i];
        if (quote) {
          if (ch === '\\') { i += 2; continue; }
          if (ch === quote) quote = null;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        i++;
      }
      const body = text.slice(bodyStart, i - 1);

      if (inKeyframes) continue;

      if (prelude.startsWith('@')) {
        const atName = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
        if (atName === 'keyframes' || atName === '-webkit-keyframes') {
          checkBlock(body, true);
        } else if (
          atName === 'media' ||
          atName === 'supports' ||
          atName === 'layer' ||
          atName === 'container'
        ) {
          checkBlock(body, false);
        }
        continue;
      }

      // Standard style rule: validate every selector in the comma-separated list
      for (const sel of splitSelectorList(prelude)) {
        if (!isValidPlatformComponentSelector(sel)) {
          errors.push(
            `${filePath}: invalid platform component selector "${sel}". Only :host and [part~="<name>"] (with optional pseudos, no private classes or descendants after [part~="..."]) are allowed.`
          );
        }
      }
    }
  };

  checkBlock(stripped);
  return errors;
}
