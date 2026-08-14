import type { Page } from '@playwright/test';

/**
 * Shared visual-breakage invariants for component showcase pages.
 *
 * Complements component-specific geometry assertions (see
 * components/calendar/calendar.spec.ts, components/button/
 * button-icon-centering.spec.ts) with checks every component must satisfy:
 *
 *  1. Every snice-* element on the page is defined and upgraded.
 *  2. Visible hosts render at a non-zero size.
 *  3. No statically-positioned shadow descendant escapes its host's box
 *     (positioned overlays and clipped-overflow subtrees are exempt — that's
 *     how popovers, menus, and carousels are supposed to work).
 *  4. The page itself has no horizontal overflow.
 *
 * Returns human-readable violation strings; assert `toEqual([])` so failures
 * list every problem at once.
 */
export async function collectVisualViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const TOLERANCE = 16;

    const tags = new Set<string>();
    document.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (tag.startsWith('snice-')) tags.add(tag);
    });
    for (const tag of tags) {
      if (!customElements.get(tag)) problems.push(`<${tag}> is not defined`);
    }

    const escapesClippedOrPositioned = (el: Element, host: Element): boolean => {
      // Walk from the element up to (but not including) the shadow host.
      // Overlays (fixed/absolute) and clipped subtrees are intentional.
      let node: Element | null = el;
      while (node && node !== host) {
        const cs = getComputedStyle(node);
        if (cs.position === 'fixed' || cs.position === 'absolute') return true;
        if (node !== el && cs.overflow !== 'visible') return true;
        node = node.parentElement ?? ((node.getRootNode() as ShadowRoot).host === host
          ? null
          : (node.getRootNode() as ShadowRoot).host as Element | null);
        if (node === host) return false;
        if (node && node.tagName?.toLowerCase().startsWith('snice-')) return true; // nested component judges itself
      }
      return false;
    };

    const checkHost = (host: Element) => {
      const root = (host as HTMLElement).shadowRoot;
      if (!root) return;
      const hostRect = host.getBoundingClientRect();
      const hostCs = getComputedStyle(host);
      const hostVisible = hostCs.display !== 'none' && hostCs.visibility !== 'hidden'
        && !(host as HTMLElement).hidden;

      if (hostVisible && root.children.length > 0
          && hostRect.width === 0 && hostRect.height === 0) {
        problems.push(`<${host.tagName.toLowerCase()}> renders at 0x0`);
      }
      if (!hostVisible || hostCs.overflow !== 'visible') return;

      root.querySelectorAll('*').forEach(el => {
        if (el.tagName === 'STYLE' || el.tagName === 'SLOT') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const escapes =
          rect.right > hostRect.right + TOLERANCE ||
          rect.bottom > hostRect.bottom + TOLERANCE ||
          rect.left < hostRect.left - TOLERANCE ||
          rect.top < hostRect.top - TOLERANCE;
        if (!escapes) return;
        if (escapesClippedOrPositioned(el, host)) return;
        problems.push(
          `<${host.tagName.toLowerCase()}> content ${el.tagName.toLowerCase()}`
          + `${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`
          + ` escapes its host (${Math.round(rect.width)}x${Math.round(rect.height)}`
          + ` vs host ${Math.round(hostRect.width)}x${Math.round(hostRect.height)})`);
      });

      // Recurse into nested components.
      root.querySelectorAll('*').forEach(el => {
        if (el.tagName.toLowerCase().startsWith('snice-')) checkHost(el);
      });
    };

    document.querySelectorAll('*').forEach(el => {
      if (el.tagName.toLowerCase().startsWith('snice-')) checkHost(el);
    });

    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      problems.push(
        `page overflows horizontally (${document.documentElement.scrollWidth} > ${window.innerWidth})`);
    }

    return [...new Set(problems)];
  });
}
