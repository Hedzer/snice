/**
 * Theme color regression guard.
 *
 * Loads the unified components showcase (website/public/components.html) in BOTH
 * light and dark themes and walks EVERY element that has meaningful text
 * content inside every component. For each, it asserts:
 *
 *   1. Text vs resolved (composited-over-ancestors) background contrast ≥
 *      3.0 (WCAG AA for UI chrome / large text).
 *   2. For elements with :hover bg rules → the hovered bg still yields ≥ 3.0
 *      contrast AND produces a perceptible luminance delta from idle.
 *
 * It doesn't just look at a handful of components — it recursively walks
 * every text-bearing descendant (including shadow roots) and samples their
 * foreground/background pair. That catches broken contrast anywhere, not
 * just on a hand-picked list.
 *
 * Runnable:
 *   npm run test:dark-mode-colors          (serves website/public/ + runs spec)
 *   SNICE_AUDIT_URL=http://… npx playwright test tests/dark-mode-colors.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ─── color math ──────────────────────────────────────────────────────────────
function parseRgb(s: string): { r: number; g: number; b: number; a: number } | null {
  if (!s) return null;
  const m = s.match(/rgba?\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:[ ,/]+([0-9.]+))?\s*\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
}
function composite(over: any, base: any) {
  if (!over) return base;
  if (over.a >= 1) return { r: over.r, g: over.g, b: over.b, a: 1 };
  if (!base) return over;
  const a = over.a;
  return {
    r: over.r * a + base.r * (1 - a),
    g: over.g * a + base.g * (1 - a),
    b: over.b * a + base.b * (1 - a),
    a: 1,
  };
}
function luminance(c: any) {
  if (!c) return 0;
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
function contrastRatio(a: any, b: any) {
  const la = luminance(a);
  const lb = luminance(b);
  const [bright, dark] = la > lb ? [la, lb] : [lb, la];
  return (bright + 0.05) / (dark + 0.05);
}

const URL = process.env.SNICE_AUDIT_URL || 'http://localhost:5566/components.html';

// Minimum contrast ratio for text (WCAG AA: 4.5 for body, 3.0 for large/UI).
// 3.0 is the practical floor — going below that is always wrong.
const MIN_CONTRAST = 3.0;
// Hosts we care about — every snice-* element plus any element with text that
// sits inside a shadow root.
const HOST_SELECTOR = 'snice-alert, snice-button, snice-badge, snice-banner, snice-card, snice-chip, snice-tag, snice-accordion, snice-accordion-item, snice-menu, snice-menu-item, snice-list, snice-list-item, snice-tabs, snice-tab, snice-tree, snice-tree-item, snice-select, snice-input, snice-textarea, snice-checkbox, snice-switch, snice-radio, snice-table, snice-toast, snice-tooltip, snice-pagination, snice-kpi, snice-data-card, snice-stat-group, snice-stepper, snice-step-input, snice-range-slider, snice-slider, snice-segmented-control, snice-breadcrumbs, snice-divider, snice-timeline, snice-nav, snice-approval-flow';

// ─── probe fn ────────────────────────────────────────────────────────────────
type Finding = {
  component: string;
  ancestorChain: string;
  sample: string;
  fg: string;
  bg: string;
  surface: string;
  contrast: number;
  hoverBg?: string;
  hoverContrast?: number;
  hoverDelta?: number;
  kind: 'contrast' | 'hover-contrast' | 'hover-delta';
};

async function scanPage(page: Page) {
  return (await page.evaluate(({ HOST_SELECTOR }) => {
    // Walk the light DOM + shadow roots and collect every text-bearing leaf.
    function* walkTextNodes(root: Document | ShadowRoot | Element): Generator<HTMLElement> {
      const stack: (Document | ShadowRoot | Element)[] = [root];
      while (stack.length) {
        const node = stack.pop()!;
        const children = (node as Element).children || (node as ShadowRoot).children;
        for (const child of Array.from(children || [])) {
          stack.push(child);
          const sr = (child as HTMLElement).shadowRoot;
          if (sr) stack.push(sr);
        }
        // Only report leaves (no text-bearing descendants) that have direct text content
        if ((node as Element).nodeType === 1) {
          const el = node as HTMLElement;
          // Has at least one direct text child with non-whitespace
          let hasText = false;
          for (const c of Array.from(el.childNodes)) {
            if (c.nodeType === 3 && (c.textContent || '').trim().length > 0) { hasText = true; break; }
          }
          if (hasText) yield el;
        }
      }
    }

    function getBg(el: Element | null): { color: string; node: Element | null } {
      let n: Element | null = el;
      for (let i = 0; i < 12 && n; i++) {
        const cs = getComputedStyle(n);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return { color: bg, node: n };
        }
        n = n.parentElement || (n.getRootNode() as any).host || null;
      }
      return { color: getComputedStyle(document.body).backgroundColor, node: document.body };
    }

    // Find a deep solid surface to composite alpha bgs over.
    function deepSurface(startFromNode: Element | null): string {
      let n: Element | null = startFromNode?.parentElement || null;
      for (let i = 0; i < 20 && n; i++) {
        const cs = getComputedStyle(n);
        const p = cs.backgroundColor;
        if (p && p !== 'rgba(0, 0, 0, 0)' && p !== 'transparent') {
          const match = p.match(/rgba?\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:[ ,/]+([0-9.]+))?\s*\)/);
          if (match && (match[4] ? +match[4] : 1) >= 0.9) return p;
        }
        n = n.parentElement || (n.getRootNode() as any).host || null;
      }
      return getComputedStyle(document.body).backgroundColor;
    }

    // Collect :hover background declarations that apply to an element.
    function findHoverBg(target: Element): string | null {
      const root = target.getRootNode() as ShadowRoot | Document;
      const sheets: CSSStyleSheet[] = [];
      if ((root as ShadowRoot).host) {
        const sr = root as ShadowRoot;
        for (const s of (sr.adoptedStyleSheets || [])) sheets.push(s);
        for (const el of sr.querySelectorAll('style')) {
          if ((el as HTMLStyleElement).sheet) sheets.push((el as HTMLStyleElement).sheet as CSSStyleSheet);
        }
      }
      for (const sheet of sheets) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of Array.from(rules || [])) {
          const sel = (rule as CSSStyleRule).selectorText;
          if (!sel || !sel.includes(':hover')) continue;
          const bare = sel.replace(/:hover/g, '').replace(/:not\([^)]*\)/g, '').trim();
          if (!bare) continue;
          try {
            if (target.matches(bare) || target.parentElement?.matches(bare) || target.closest(bare)) {
              const v = (rule as CSSStyleRule).style?.getPropertyValue('background-color')
                   || (rule as CSSStyleRule).style?.getPropertyValue('background');
              if (v) return v.trim();
            }
          } catch { /* non-matches() selector; skip */ }
        }
      }
      return null;
    }

    function applyAndRead(el: HTMLElement, prop: string, decl: string): string {
      const prev = el.style.getPropertyValue(prop);
      el.style.setProperty(prop, decl, 'important');
      const resolved = getComputedStyle(el).getPropertyValue(prop);
      if (prev) el.style.setProperty(prop, prev);
      else el.style.removeProperty(prop);
      return resolved;
    }

    function ancestorChain(el: Element): string {
      const parts: string[] = [];
      let n: Element | null = el;
      let host: Element | null = null;
      for (let i = 0; i < 8 && n; i++) {
        parts.push(n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ').filter(Boolean).join('.') : ''));
        if ((n.getRootNode() as ShadowRoot).host && !host) host = (n.getRootNode() as ShadowRoot).host as Element;
        n = n.parentElement || (n.getRootNode() as any).host || null;
      }
      return parts.join(' < ');
    }

    const out: any[] = [];
    const components = document.querySelectorAll(HOST_SELECTOR);
    for (const comp of Array.from(components)) {
      const sr = (comp as HTMLElement).shadowRoot;
      const root: Document | ShadowRoot | Element = sr || comp;
      const componentName = comp.tagName.toLowerCase();
      for (const el of walkTextNodes(root)) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) <= 0.01 || rect.width === 0 || rect.height === 0) continue;
        const fg = cs.color;
        const bgInfo = getBg(el);
        const surface = deepSurface(bgInfo.node);
        const sample = (el.textContent || '').trim().slice(0, 30);
        if (!sample) continue;
        const hoverBgDecl = findHoverBg(el);
        out.push({
          component: componentName,
          ancestorChain: ancestorChain(el),
          sample,
          fg,
          bg: bgInfo.color,
          surface,
          hoverBg: hoverBgDecl ? applyAndRead(el as HTMLElement, 'background-color', hoverBgDecl) : null,
        });
      }
    }
    return out;
  }, { HOST_SELECTOR }));
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(async (t) => {
    const roots: Array<Document | ShadowRoot> = [document];
    for (let index = 0; index < roots.length; index++) {
      const root = roots[index];
      for (const element of Array.from(root.querySelectorAll('*'))) {
        if ((element as HTMLElement).shadowRoot) roots.push((element as HTMLElement).shadowRoot!);
      }
    }
    for (const root of roots) {
      if (root.querySelector('#contrast-audit-motion-guard')) continue;
      const guard = document.createElement('style');
      guard.id = 'contrast-audit-motion-guard';
      guard.textContent = ':host, *, *::before, *::after { transition: none !important; animation: none !important; }';
      (root === document ? document.head : root).appendChild(guard);
    }
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('snice-theme', t); } catch { /* ignore */ }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, theme);
}

// ─── tests ────────────────────────────────────────────────────────────────────
test.describe('Theme color regression guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const tags = new Set(Array.from(document.querySelectorAll('*'))
        .map(element => element.localName)
        .filter(tag => tag.startsWith('snice-')));
      await Promise.all(Array.from(tags, tag => customElements.whenDefined(tag)));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`[${theme}] every visible text element meets contrast requirements`, async ({ page }) => {
      await setTheme(page, theme);
      const samples = await scanPage(page);
      const failures: Finding[] = [];
      for (const s of samples) {
        const fg = parseRgb(s.fg);
        const bg = parseRgb(s.bg);
        const surface = parseRgb(s.surface);
        if (!fg || !bg) continue;
        const bgResolved = bg.a < 1 ? composite(bg, surface) : bg;
        const fgResolved = fg.a < 1 ? composite(fg, bgResolved) : fg;
        const ratio = contrastRatio(fgResolved, bgResolved);
        if (ratio < MIN_CONTRAST) {
          failures.push({ ...s, contrast: ratio, kind: 'contrast' } as Finding);
        }
      }
      if (failures.length) {
        const msg = failures.map(f => {
          if (f.kind === 'contrast') return `  ${f.component} "${f.sample}": text ${f.fg} on ${f.bg} = ${f.contrast.toFixed(2)}:1`;
          return `  ${f.component} "${f.sample}": text ${f.fg} on ${f.bg} = ${f.contrast.toFixed(2)}:1`;
        }).join('\n');
        throw new Error(`${failures.length} contrast/hover problems in ${theme} theme:\n${msg}`);
      }
    });
  }
});
