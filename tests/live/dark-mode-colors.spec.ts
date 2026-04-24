/**
 * Dark-mode color regression guard.
 *
 * For every interactive component that has a showcase page, this spec
 *   1. Loads the showcase in BOTH `data-theme="light"` and `data-theme="dark"`
 *   2. Asserts that hover changes the element's visible background
 *      (perceptible luminance delta ≥ 0.01)
 *   3. Asserts that resolved text-on-background contrast ≥ 3.0 (WCAG AA
 *      large-text / UI-chrome minimum). Body text elsewhere uses 4.5:1; here
 *      3.0 is the floor because the interactive surface is usually a button
 *      or chip where WCAG treats the minimum as 3:1 for boundaries.
 *
 * The test is data-driven — add a row to TARGETS to protect a new component.
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
  if (over.a >= 1) return { ...over, a: 1 };
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

// ─── target catalogue ────────────────────────────────────────────────────────
type Target = {
  name: string;
  /** Path under http://localhost:5566/ that serves a full showcase */
  page: string;
  /** Host element on that page */
  host: string;
  /** Inner element inside shadowRoot whose hover/text we sample */
  innerSelector: string;
  /** Skip hover assertion (for disabled/readonly/display-only elements) */
  skipHover?: boolean;
  /** Skip contrast assertion (for elements where the "text" is a glyph/icon and not a char) */
  skipContrast?: boolean;
};
const TARGETS: Target[] = [
  { name: 'button (primary)',        page: 'components/button/full-showcase.html',      host: 'snice-button[variant="primary"]:not([disabled])', innerSelector: '.button' },
  { name: 'button (default)',        page: 'components/button/full-showcase.html',      host: 'snice-button[variant="default"]:not([disabled])', innerSelector: '.button' },
  { name: 'chip (default)',          page: 'components/chip/full-showcase.html',        host: 'snice-chip:not([variant]):not([removable])', innerSelector: '.chip' },
  { name: 'tag (default)',           page: 'components/tag/full-showcase.html',         host: 'snice-tag:not([variant])',          innerSelector: '.tag', skipHover: true },
  { name: 'accordion-item',          page: 'components/accordion/full-showcase.html',   host: 'snice-accordion-item',              innerSelector: '[part="header"]' },
  { name: 'menu-item',               page: 'components/menu/full-showcase.html',        host: 'snice-menu-item',                   innerSelector: '.menu-item' },
  { name: 'list-item',               page: 'components/list/full-showcase.html',        host: 'snice-list-item',                   innerSelector: '[part="content"]' },
  { name: 'tab',                     page: 'components/tabs/full-showcase.html',        host: 'snice-tab',                         innerSelector: '[part="base"]' },
  { name: 'tree-item',               page: 'components/tree/full-showcase.html',        host: 'snice-tree-item',                   innerSelector: '.tree-item__content' },
  { name: 'select trigger',          page: 'components/select/full-showcase.html',      host: 'snice-select',                      innerSelector: '.select-trigger' },
  { name: 'alert (info)',            page: 'components/alert/full-showcase.html',       host: 'snice-alert[variant="info"]',       innerSelector: '.alert', skipHover: true },
  { name: 'alert (success)',         page: 'components/alert/full-showcase.html',       host: 'snice-alert[variant="success"]',    innerSelector: '.alert', skipHover: true },
  { name: 'alert (warning)',         page: 'components/alert/full-showcase.html',       host: 'snice-alert[variant="warning"]',    innerSelector: '.alert', skipHover: true },
  { name: 'alert (error)',           page: 'components/alert/full-showcase.html',       host: 'snice-alert[variant="error"]',      innerSelector: '.alert', skipHover: true },
  { name: 'badge',                   page: 'components/badge/full-showcase.html',       host: 'snice-badge',                       innerSelector: '.badge, [part="base"]', skipHover: true, skipContrast: true },
  { name: 'input',                   page: 'components/input/full-showcase.html',       host: 'snice-input',                       innerSelector: 'input' },
  { name: 'card',                    page: 'components/card/full-showcase.html',        host: 'snice-card',                        innerSelector: '[part="base"]', skipHover: true },
];

// ─── per-target probe ────────────────────────────────────────────────────────
type Probe = {
  idle: string;
  hover: string;
  surface: string;
  textColor: string;
  hoverTextColor: string;
};

async function probe(page: Page, target: Target): Promise<Probe | null> {
  return await page.evaluate(({ host, innerSelector }) => {
    const findInner = (el: Element): Element | null => {
      const sr = (el as HTMLElement).shadowRoot;
      if (!sr) return el;
      for (const sel of innerSelector.split(',').map(s => s.trim())) {
        const n = sr.querySelector(sel);
        if (n) return n;
      }
      return el;
    };
    const hostEl = document.querySelector(host);
    if (!hostEl) return null;
    hostEl.scrollIntoView({ block: 'center' });
    const inner = findInner(hostEl);
    if (!inner) return null;

    const getBg = (el: Element | null): string => {
      let n: Element | null = el;
      for (let i = 0; i < 8 && n; i++) {
        const cs = getComputedStyle(n);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
          return cs.backgroundColor;
        }
        n = n.parentElement || (n.getRootNode() as any).host || null;
      }
      return 'rgba(0, 0, 0, 0)';
    };

    const surface = (() => {
      let n: Element | null = inner.parentElement || (inner.getRootNode() as any).host;
      for (let i = 0; i < 10 && n; i++) {
        const cs = getComputedStyle(n);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          return cs.backgroundColor;
        }
        n = n.parentElement || (n.getRootNode() as any).host || null;
      }
      return getComputedStyle(document.body).backgroundColor;
    })();

    const idleBg = getBg(inner);
    const idleColor = getComputedStyle(inner).color;

    // To resolve :hover, look up CSS rules that apply to the inner element's
    // selector with :hover and extract the declared bg / color. Simulating
    // real :hover from JS doesn't fire pseudo-class styles reliably.
    const shadowSheets: CSSStyleSheet[] = [];
    const sr = (hostEl as HTMLElement).shadowRoot;
    if (sr) {
      for (const s of (sr.adoptedStyleSheets || [])) shadowSheets.push(s);
      for (const el of sr.querySelectorAll('style')) {
        if ((el as HTMLStyleElement).sheet) shadowSheets.push((el as HTMLStyleElement).sheet as CSSStyleSheet);
      }
    }
    const matchHover = (prop: 'background-color' | 'color'): string | null => {
      for (const sheet of shadowSheets) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of Array.from(rules || [])) {
          const sel = (rule as CSSStyleRule).selectorText;
          if (!sel || !sel.includes(':hover')) continue;
          const bare = sel.replace(/:hover/g, '').replace(/:not\([^)]*\)/g, '').trim();
          if (!bare) continue;
          try {
            if (inner.matches(bare) || inner.parentElement?.matches(bare) || inner.closest(bare)) {
              const v = (rule as CSSStyleRule).style?.getPropertyValue(prop)
                   || (prop === 'background-color' ? (rule as CSSStyleRule).style?.getPropertyValue('background') : '');
              if (v) return v.trim();
            }
          } catch { /* invalid selector for matches(); skip */ }
        }
      }
      return null;
    };

    const applyAndRead = (prop: 'background-color' | 'color', decl: string | null): string => {
      if (!decl) return prop === 'background-color' ? idleBg : idleColor;
      const prev = (inner as HTMLElement).style.getPropertyValue(prop);
      (inner as HTMLElement).style.setProperty(prop, decl, 'important');
      const resolved = getComputedStyle(inner).getPropertyValue(prop);
      if (prev) (inner as HTMLElement).style.setProperty(prop, prev);
      else (inner as HTMLElement).style.removeProperty(prop);
      return resolved;
    };

    const hoverBgDecl = matchHover('background-color');
    const hoverColorDecl = matchHover('color');
    const hoverBg = applyAndRead('background-color', hoverBgDecl);
    const hoverColor = applyAndRead('color', hoverColorDecl);

    return {
      idle: idleBg,
      hover: hoverBg,
      surface,
      textColor: idleColor,
      hoverTextColor: hoverColor,
    };
  }, target);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('snice-theme', t); } catch { /* iframe */ }
  }, theme);
  await page.waitForTimeout(150);
}

// ─── tests ────────────────────────────────────────────────────────────────────
test.describe('Dark-mode color regression guard', () => {
  const pages = [...new Set(TARGETS.map(t => t.page))];
  // eslint-disable-next-line no-console
  for (const pagePath of pages) {
    test.describe(pagePath, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`http://localhost:5566/${pagePath}`);
        await page.waitForLoadState('networkidle');
      });

      for (const theme of ['light', 'dark'] as const) {
        for (const target of TARGETS.filter(t => t.page === pagePath)) {
          test(`[${theme}] ${target.name}`, async ({ page }) => {
            await setTheme(page, theme);
            const p = await probe(page, target);
            expect(p, `target ${target.host} not found on ${target.page}`).not.toBeNull();
            if (!p) return;

            const idle = parseRgb(p.idle);
            const hover = parseRgb(p.hover);
            const surface = parseRgb(p.surface);
            const text = parseRgb(p.textColor);
            const hoverText = parseRgb(p.hoverTextColor);

            const idleResolved = idle && idle.a < 1 ? composite(idle, surface) : idle;
            const hoverResolved = hover && hover.a < 1 ? composite(hover, surface) : hover;

            // 1. text contrast against resolved idle surface
            if (!target.skipContrast) {
              const ratio = contrastRatio(text, idleResolved);
              expect.soft(ratio, `${theme} ${target.name}: text ${p.textColor} on bg ${p.idle}`)
                .toBeGreaterThan(3.0);
            }

            // 2. hover produces a visibly different background
            if (!target.skipHover) {
              const dL = Math.abs(luminance(idleResolved) - luminance(hoverResolved));
              expect.soft(dL, `${theme} ${target.name}: hover bg didn't change (idle=${p.idle}, hover=${p.hover})`)
                .toBeGreaterThan(0.005);
            }

            // 3. hover text contrast is still OK
            if (!target.skipContrast) {
              const hoverRatio = contrastRatio(hoverText, hoverResolved);
              expect.soft(hoverRatio, `${theme} ${target.name}: hover text ${p.hoverTextColor} on hover bg ${p.hover}`)
                .toBeGreaterThan(3.0);
            }
          });
        }
      }
    });
  }
});
