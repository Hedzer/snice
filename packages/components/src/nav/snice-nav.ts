/**
 * Uses manual DOM manipulation (no @render) so async `visibleOn` placards can
 * be appended after resolution without retriggering a full render. Update path
 * diffs existing nodes instead of rebuilding (`innerHTML = ''`) to avoid flash
 * on route changes.
 */
import { element, property, watch, context } from 'snice';
import type { Placard, AppContext, Context } from 'snice';
import { ICONS } from '../icons';
import cssContent from './snice-nav.css?inline';
import type { SniceNavElement, NavVariant, NavOrientation, NavActiveStyle } from './snice-nav.types';

const NAME_KEY = 'data-placard-name';
const GROUP_KEY = 'data-group';

@element('snice-nav')
export class SniceNav extends HTMLElement implements SniceNavElement {

  @property()
  variant: NavVariant = 'flat';

  @property()
  orientation: NavOrientation = 'horizontal';

  @property({ attribute: 'active-style' })
  activeStyle: NavActiveStyle = 'fill';

  @property({ type: Boolean, attribute: 'is-top-level' })
  isTopLevel = false;

  private placards: Placard[] = [];
  private currentRoute = '';
  private routeParams: Record<string, string> = {};
  private appContext: AppContext | null = null;

  private wrapper: HTMLElement | null = null;
  private navElement: HTMLElement | null = null;
  private lastVariant: NavVariant | null = null;
  private lastOrientation: NavOrientation | null = null;

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.applyStyles();
    this.render();
  }

  @context()
  handleContext(ctx: Context) {
    if (this.isTopLevel) {
      this.update(
        ctx.navigation.placards,
        ctx.application,
        ctx.navigation.route,
        ctx.navigation.params
      );
    }
  }

  @watch('variant', 'orientation', 'activeStyle')
  handleChange() {
    this.render();
  }

  private applyStyles() {
    if (!this.shadowRoot) return;
    if (this.shadowRoot.querySelector('style')) return;
    const style = document.createElement('style');
    style.textContent = cssContent;
    this.shadowRoot.appendChild(style);
  }

  private renderToken = 0;

  private render() {
    if (!this.shadowRoot) return;
    const token = ++this.renderToken;
    this.applyStyles();

    // Structural change: variant or orientation flipped, or first render.
    const structuralChange =
      this.lastVariant !== this.variant ||
      this.lastOrientation !== this.orientation ||
      !this.wrapper ||
      !this.wrapper.isConnected;

    if (structuralChange) {
      // Full rebuild: remove any prior content (except style + slot).
      // Leaving the slot in place avoids a reflow of light-DOM children.
      const existingSlot = this.shadowRoot.querySelector('slot');
      for (const child of Array.from(this.shadowRoot.children)) {
        if (child.tagName !== 'STYLE' && child !== existingSlot) child.remove();
      }

      this.wrapper = document.createElement('div');
      this.wrapper.className = 'nav-content';
      this.wrapper.setAttribute('part', 'base');
      this.navElement = null;

      this.shadowRoot.insertBefore(
        this.wrapper,
        existingSlot ?? null
      );

      if (!existingSlot) {
        this.shadowRoot.appendChild(document.createElement('slot'));
      }

      this.lastVariant = this.variant;
      this.lastOrientation = this.orientation;
    }

    const candidates = this.placards
      .filter(p => !p.parent && p.show !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Render items for every candidate whose guard is true OR pending; skip
    // only when the guard is synchronously false. Pending items render hidden
    // and flip visible (or remove themselves) once the guard resolves — no
    // re-render, just a single attribute flip on the existing node.
    const rendered: { placard: Placard; pending?: Promise<boolean> }[] = [];
    for (const p of candidates) {
      const result = this.isVisible(p);
      if (result === false) continue;
      if (result === true) {
        rendered.push({ placard: p });
      } else if (result && typeof (result as Promise<boolean>).then === 'function') {
        rendered.push({ placard: p, pending: result as Promise<boolean> });
      }
    }

    if (rendered.length === 0) {
      if (this.navElement) {
        this.navElement.remove();
        this.navElement = null;
      }
    } else {
      if (!this.navElement || !this.navElement.isConnected) {
        this.navElement = this.createNavElement();
        this.wrapper!.appendChild(this.navElement);
      } else {
        this.navElement.className = `nav nav--${this.variant} nav--${this.orientation}`;
      }

      const placards = rendered.map(r => r.placard);
      if (this.variant === 'grouped') {
        this.diffGrouped(this.navElement, placards);
      } else if (this.variant === 'hierarchical') {
        this.diffHierarchical(this.navElement, placards);
      } else {
        this.diffFlat(this.navElement, placards);
      }

      // Now that every rendered placard has a real DOM node, flip hidden on
      // items whose guards are pending and wire up resolution handlers.
      for (const { placard, pending } of rendered) {
        const node = this.itemNodeFor(placard);
        if (!node) continue;
        if (pending) {
          this.markHidden(node, true);
          pending.then(ok => {
            if (token !== this.renderToken) return;
            if (ok) this.markHidden(node, false);
            else node.remove();
          }).catch(() => node.remove());
        } else {
          this.markHidden(node, false);
        }
      }
    }
  }

  /** Returns the top-level .nav__item or .nav__group element for a placard. */
  private itemNodeFor(placard: Placard): HTMLElement | null {
    if (!this.navElement) return null;
    if (this.variant === 'hierarchical') {
      return this.navElement.querySelector(
        `:scope > .nav__group[${NAME_KEY}="${CSS.escape(placard.name)}"]`
      ) as HTMLElement | null;
    }
    if (this.variant === 'grouped') {
      const group = placard.group || 'default';
      return this.navElement.querySelector(
        `:scope > .nav__group[${GROUP_KEY}="${CSS.escape(group)}"] > .nav__item[${NAME_KEY}="${CSS.escape(placard.name)}"]`
      ) as HTMLElement | null;
    }
    return this.navElement.querySelector(
      `:scope > .nav__item[${NAME_KEY}="${CSS.escape(placard.name)}"]`
    ) as HTMLElement | null;
  }

  private markHidden(el: HTMLElement, hidden: boolean) {
    if (hidden) {
      if (!el.hasAttribute('hidden')) el.setAttribute('hidden', '');
      if (el.getAttribute('aria-hidden') !== 'true') el.setAttribute('aria-hidden', 'true');
    } else {
      if (el.hasAttribute('hidden')) el.removeAttribute('hidden');
      if (el.hasAttribute('aria-hidden')) el.removeAttribute('aria-hidden');
    }
  }

  private createNavElement(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = `nav nav--${this.variant} nav--${this.orientation}`;
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('part', 'nav');
    return nav;
  }

  // ─── Diff: flat ────────────────────────────────────────────────────────
  private diffFlat(nav: HTMLElement, items: Placard[]) {
    const existing = this.indexByName(
      nav.children,
      el => el.classList.contains('nav__item')
    );
    const wanted = items.map(p => this.reuseOrCreateItem(existing, p));
    this.reorderChildren(nav, wanted);
    this.removeUnused(nav, existing, wanted);
  }

  // ─── Diff: hierarchical ────────────────────────────────────────────────
  private diffHierarchical(nav: HTMLElement, items: Placard[]) {
    const existing = this.indexByName(
      nav.children,
      el => el.classList.contains('nav__group')
    );
    const wanted: HTMLElement[] = [];

    for (const placard of items) {
      let group = existing.get(placard.name);
      if (!group) {
        group = document.createElement('div');
        group.setAttribute(NAME_KEY, placard.name);
      }
      group.className = this.isActive(placard)
        ? 'nav__group nav__group--active'
        : 'nav__group';

      // Reuse or create the parent link as the first child.
      let parentLink = group.firstElementChild as HTMLElement | null;
      if (!parentLink || parentLink.tagName !== 'A' || !parentLink.classList.contains('nav__link')) {
        parentLink = this.buildNavLink(placard);
        if (group.firstChild) group.insertBefore(parentLink, group.firstChild);
        else group.appendChild(parentLink);
      } else {
        this.updateNavLink(parentLink, placard);
      }

      // Children of this hierarchical item
      const children = this.placards
        .filter(p => p.parent === placard.name && p.show !== false && this.isVisible(p) === true)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      let submenu = group.querySelector(':scope > .nav__submenu') as HTMLElement | null;
      if (children.length === 0) {
        if (submenu) submenu.remove();
      } else {
        if (!submenu) {
          submenu = document.createElement('ul');
          submenu.className = 'nav__submenu';
          group.appendChild(submenu);
        }
        const subExisting = this.indexByName(
          submenu.children,
          el => el.classList.contains('nav__item')
        );
        const subWanted: HTMLElement[] = [];
        for (const child of children) {
          let li = subExisting.get(child.name);
          if (!li) {
            li = document.createElement('li');
            li.setAttribute(NAME_KEY, child.name);
          }
          li.className = this.isActive(child) ? 'nav__item nav__item--active' : 'nav__item';
          let link = li.firstElementChild as HTMLElement | null;
          if (!link || link.tagName !== 'A') {
            link = this.buildNavLink(child);
            li.innerHTML = '';
            li.appendChild(link);
          } else {
            this.updateNavLink(link, child);
          }
          subWanted.push(li);
        }
        this.reorderChildren(submenu, subWanted);
        this.removeUnused(submenu, subExisting, subWanted);
      }

      wanted.push(group);
    }

    this.reorderChildren(nav, wanted);
    this.removeUnused(nav, existing, wanted);
  }

  // ─── Diff: grouped ─────────────────────────────────────────────────────
  private diffGrouped(nav: HTMLElement, items: Placard[]) {
    const groups = new Map<string, Placard[]>();
    for (const placard of items) {
      const key = placard.group || 'default';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(placard);
    }

    // Index existing groups by their data-group attribute
    const existing = new Map<string, HTMLElement>();
    for (const child of Array.from(nav.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (!child.classList.contains('nav__group')) continue;
      const key = child.getAttribute(GROUP_KEY);
      if (key) existing.set(key, child);
    }

    const wanted: HTMLElement[] = [];
    for (const [groupName, groupItems] of groups) {
      const sorted = [...groupItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      let groupEl = existing.get(groupName);
      if (!groupEl) {
        groupEl = document.createElement('div');
        groupEl.className = 'nav__group';
        groupEl.setAttribute(GROUP_KEY, groupName);
      }

      // Label (only for non-default groups)
      let label = groupEl.querySelector(':scope > .nav__group-label') as HTMLElement | null;
      if (groupName === 'default') {
        if (label) label.remove();
      } else {
        if (!label) {
          label = document.createElement('div');
          label.className = 'nav__group-label';
          groupEl.insertBefore(label, groupEl.firstChild);
        }
        if (label.textContent !== groupName) label.textContent = groupName;
      }

      const itemExisting = this.indexByName(
        groupEl.children,
        el => el.classList.contains('nav__item')
      );
      const itemWanted: HTMLElement[] = [];
      for (const placard of sorted) {
        itemWanted.push(this.reuseOrCreateItem(itemExisting, placard));
      }
      // Keep label first, then items
      const labelFirst = label ? [label] : [];
      this.reorderChildren(groupEl, [...labelFirst, ...itemWanted]);
      this.removeUnused(groupEl, itemExisting, itemWanted);

      wanted.push(groupEl);
    }

    this.reorderChildrenByElement(nav, wanted, el => el instanceof HTMLElement && el.classList.contains('nav__group'));
    for (const [key, el] of existing) {
      if (!groups.has(key)) el.remove();
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────
  private indexByName(
    children: HTMLCollection,
    pred: (el: HTMLElement) => boolean
  ): Map<string, HTMLElement> {
    const out = new Map<string, HTMLElement>();
    for (const child of Array.from(children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (!pred(child)) continue;
      const name = child.getAttribute(NAME_KEY);
      if (name) out.set(name, child);
    }
    return out;
  }

  private reuseOrCreateItem(
    existing: Map<string, HTMLElement>,
    placard: Placard
  ): HTMLElement {
    let item = existing.get(placard.name);
    if (!item) {
      item = document.createElement('div');
      item.setAttribute(NAME_KEY, placard.name);
      const link = this.buildNavLink(placard);
      item.appendChild(link);
    } else {
      const link = item.firstElementChild as HTMLElement | null;
      if (link && link.tagName === 'A') {
        this.updateNavLink(link, placard);
      } else {
        item.innerHTML = '';
        item.appendChild(this.buildNavLink(placard));
      }
    }
    item.className = this.isActive(placard) ? 'nav__item nav__item--active' : 'nav__item';
    return item;
  }

  private reorderChildren(parent: HTMLElement, wanted: HTMLElement[]) {
    let expected = parent.firstChild;
    for (const node of wanted) {
      if (expected === node) {
        expected = node.nextSibling;
      } else {
        parent.insertBefore(node, expected);
      }
    }
  }

  /** Like reorderChildren but only considers children matching `filter`. */
  private reorderChildrenByElement(
    parent: HTMLElement,
    wanted: HTMLElement[],
    filter: (el: ChildNode) => boolean
  ) {
    let idx = 0;
    let cur = parent.firstChild;
    while (cur && idx < wanted.length) {
      if (!filter(cur)) {
        cur = cur.nextSibling;
        continue;
      }
      const target = wanted[idx];
      if (cur !== target) parent.insertBefore(target, cur);
      else cur = cur.nextSibling;
      idx++;
    }
    for (; idx < wanted.length; idx++) parent.appendChild(wanted[idx]);
  }

  private removeUnused(
    parent: HTMLElement,
    existing: Map<string, HTMLElement>,
    wanted: HTMLElement[]
  ) {
    const wantedSet = new Set(wanted);
    for (const el of existing.values()) {
      if (!wantedSet.has(el) && el.parentNode === parent) el.remove();
    }
  }

  // ─── Link update in place ──────────────────────────────────────────────
  private updateNavLink(a: HTMLElement, placard: Placard) {
    const wantHref = placard.href || '';
    if (a.getAttribute('href') !== wantHref) a.setAttribute('href', wantHref);

    const wantClass = this.isActive(placard) ? 'nav__link nav__link--active' : 'nav__link';
    if (a.className !== wantClass) a.className = wantClass;

    if (this.isActive(placard)) {
      if (a.getAttribute('aria-current') !== 'page') a.setAttribute('aria-current', 'page');
    } else if (a.hasAttribute('aria-current')) {
      a.removeAttribute('aria-current');
    }

    this.syncAttr(a, 'aria-label', placard.description);
    this.syncAttr(a, 'title', placard.tooltip || placard.description);

    if (placard.hotkeys && placard.hotkeys.length > 0) {
      this.syncAttr(a, 'data-hotkeys', placard.hotkeys.join(','));
    } else {
      a.removeAttribute('data-hotkeys');
    }

    this.syncAttr(a, 'data-help-url', placard.helpUrl);

    if (placard.searchTerms && placard.searchTerms.length > 0) {
      this.syncAttr(a, 'data-search-terms', placard.searchTerms.join(','));
    } else {
      a.removeAttribute('data-search-terms');
    }

    if (placard.attributes) {
      for (const [key, value] of Object.entries(placard.attributes)) {
        this.syncAttr(a, `data-${key}`, String(value));
      }
    }

    // Icon
    const iconMeta = placard.icon ? classifyIcon(placard.icon) : null;
    const existingIcon = a.querySelector(':scope > .nav__icon') as HTMLElement | null;
    if (!iconMeta) {
      if (existingIcon) existingIcon.remove();
    } else {
      const needsReplace = !existingIcon ||
        (iconMeta.kind === 'img' && existingIcon.tagName !== 'IMG') ||
        (iconMeta.kind !== 'img' && existingIcon.tagName !== 'SPAN');
      if (needsReplace) {
        if (existingIcon) existingIcon.remove();
        const iconEl = this.buildIcon(iconMeta);
        a.insertBefore(iconEl, a.firstChild);
      } else {
        if (iconMeta.kind === 'img') {
          const img = existingIcon as HTMLImageElement;
          if (img.src !== iconMeta.value) img.src = iconMeta.value;
        } else if (iconMeta.kind === 'registry') {
          if (existingIcon.dataset.icon !== iconMeta.value) {
            existingIcon.innerHTML = (ICONS as Record<string, string>)[iconMeta.value];
            existingIcon.dataset.icon = iconMeta.value;
          }
        } else {
          if (existingIcon.textContent !== iconMeta.value) {
            delete existingIcon.dataset.icon;
            existingIcon.textContent = iconMeta.value;
          }
        }
      }
    }

    // Label
    let labelSpan = a.querySelector(':scope > .nav__label') as HTMLElement | null;
    if (!labelSpan) {
      labelSpan = document.createElement('span');
      labelSpan.className = 'nav__label';
      a.appendChild(labelSpan);
    }
    if (labelSpan.textContent !== placard.title) labelSpan.textContent = placard.title;
  }

  private syncAttr(el: HTMLElement, name: string, value: string | null | undefined) {
    if (value === undefined || value === null || value === '') {
      el.removeAttribute(name);
      return;
    }
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  }

  private buildIcon(meta: { kind: 'img' | 'registry' | 'text'; value: string }): HTMLElement {
    if (meta.kind === 'img') {
      const img = document.createElement('img');
      img.className = 'nav__icon';
      img.src = meta.value;
      img.alt = '';
      img.setAttribute('part', 'icon');
      return img;
    }
    const span = document.createElement('span');
    span.className = 'nav__icon';
    span.setAttribute('part', 'icon');
    if (meta.kind === 'registry') {
      // Registry values are our own static SVG constants — safe to inject.
      span.innerHTML = (ICONS as Record<string, string>)[meta.value];
      span.dataset.icon = meta.value;
    } else {
      span.textContent = meta.value;
    }
    return span;
  }

  private buildNavLink(placard: Placard): HTMLElement {
    const a = document.createElement('a');
    a.setAttribute('part', 'link');
    this.updateNavLink(a, placard);
    return a;
  }

  private isActive(placard: Placard): boolean {
    const route = this.currentRoute.startsWith('/')
      ? this.currentRoute.slice(1)
      : this.currentRoute;
    return route === placard.name ||
           route.startsWith(`${placard.name}/`) ||
           (placard.name === 'home' && (this.currentRoute === '/' || this.currentRoute === ''));
  }

  private isVisible(placard: Placard): boolean | Promise<boolean> {
    if (!placard.visibleOn) return true;
    if (!this.appContext) return true;

    const guards = Array.isArray(placard.visibleOn) ? placard.visibleOn : [placard.visibleOn];
    const results = guards.map(g => g(this.appContext!, this.routeParams));

    if (results.every(r => r === true)) return true;
    if (results.some(r => r === false)) return false;

    return Promise.all(results).then(rs => rs.every(Boolean)).catch(() => false);
  }

  update(placards: Placard[], appContext?: AppContext, currentRoute?: string, routeParams?: Record<string, string>) {
    this.placards = [...placards];
    if (appContext) {
      this.appContext = appContext;
    }
    if (currentRoute !== undefined) {
      this.currentRoute = currentRoute;
    }
    if (routeParams) {
      this.routeParams = routeParams;
    }
    this.render();
  }
}

function classifyIcon(icon: string): { kind: 'img' | 'registry' | 'text'; value: string } {
  const isImg = icon.startsWith('img://') ||
    /^(https?:\/\/|\/|\.\/|\.\.\/|data:)/.test(icon) ||
    /^[^:]*\w\.(svg|png|jpe?g|jfif|pjp|gif|webp|avif|jxl|ico|cur|bmp|tiff?|heic|heif|apng)$/i.test(icon);
  const forceText = icon.startsWith('text://');
  if (isImg && !forceText) {
    return { kind: 'img', value: icon.startsWith('img://') ? icon.slice(6) : icon };
  }
  if (!forceText && (ICONS as Record<string, string>)[icon]) {
    return { kind: 'registry', value: icon };
  }
  return { kind: 'text', value: forceText ? icon.slice(7) : icon };
}
