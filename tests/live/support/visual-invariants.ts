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

    const boxOf = (el: Element): { left: number; top: number; right: number; bottom: number } => {
      // getBoundingClientRect on SVG shapes is engine-inconsistent: Firefox
      // includes the stroke, Chromium and WebKit do not (the gauge's thick
      // arcs measure 154x109 in Firefox and 90x45 elsewhere for the same
      // element). Measure the geometry via getBBox and add the true painted
      // margin — half the stroke-width on every side — so the check is the
      // same question in every engine.
      const isSvgShape = el.namespaceURI === 'http://www.w3.org/2000/svg'
        && el.tagName.toLowerCase() !== 'svg';
      if (isSvgShape) {
        try {
          const bbox = (el as SVGGraphicsElement).getBBox();
          const ctm = (el as SVGGraphicsElement).getScreenCTM?.();
          if (bbox && ctm) {
            const half = parseFloat(getComputedStyle(el).strokeWidth || '0') / 2 || 0;
            const p1 = new DOMPoint(bbox.x - half, bbox.y - half).matrixTransform(ctm);
            const p2 = new DOMPoint(bbox.x + bbox.width + half, bbox.y + bbox.height + half).matrixTransform(ctm);
            return { left: p1.x, top: p1.y, right: p2.x, bottom: p2.y };
          }
        } catch {
          // Fall through to getBoundingClientRect for unmeasurable shapes.
        }
      }
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };

    const checkHost = (host: Element) => {
      const root = (host as HTMLElement).shadowRoot;
      if (!root) return;
      const hostRect = host.getBoundingClientRect();
      const hostCs = getComputedStyle(host);
      // Firefox reports the computed `display` of a host whose `:host {
      // display: none }` rule is adopted via a constructable stylesheet as ""
      // instead of "none" (the pricing-table's snice-plan/snice-feature data
      // carriers) while the element is genuinely hidden — no box, no
      // offsetParent. The offsetParent + zero-box signature is the
      // engine-consistent way to recognise that state.
      const hostCollapsed = hostRect.width === 0 && hostRect.height === 0
        && (host as HTMLElement).offsetParent === null;
      const hostVisible = hostCs.display !== 'none' && hostCs.visibility !== 'hidden'
        && !(host as HTMLElement).hidden && !hostCollapsed;

      if (hostVisible && root.children.length > 0
          && hostRect.width === 0 && hostRect.height === 0) {
        problems.push(`<${host.tagName.toLowerCase()}> renders at 0x0`);
      }
      if (!hostVisible || hostCs.overflow !== 'visible') return;

      root.querySelectorAll('*').forEach(el => {
        if (el.tagName === 'STYLE' || el.tagName === 'SLOT') return;
        const rect = boxOf(el);
        if (rect.right - rect.left === 0 || rect.bottom - rect.top === 0) return;
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
          + ` escapes its host (${Math.round(rect.right - rect.left)}x${Math.round(rect.bottom - rect.top)}`
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
