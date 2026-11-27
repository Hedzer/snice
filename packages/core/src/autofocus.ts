import { getRenderRoot, type SniceRenderRoot } from './render-root';
import { ELEMENT_OPTIONS, INITIALIZED, IS_ELEMENT_CLASS, READY_RESOLVE } from './symbols';

const scheduledHosts = /*#__PURE__*/ new WeakSet<HTMLElement>();
const processedCandidates = /*#__PURE__*/ new WeakSet<Element>();
const deferredWatchers = /*#__PURE__*/ new WeakMap<HTMLElement, WeakSet<Element>>();

export interface FocusSnapshot {
  active: Element | null;
  deepActive: Element | null;
}

interface RouteAutofocusScope {
  page: HTMLElement;
  allowPriorFocusOverride: boolean;
  priorActive: Element | null;
  priorDeepActive: Element | null;
  outgoingPage: HTMLElement | null;
  claimed: boolean;
}

const routeAutofocusScopes = /*#__PURE__*/ new WeakMap<Node, RouteAutofocusScope>();

const focusableSelector =
  'a[href],' +
  'area[href],' +
  'button:not([disabled]),' +
  'input:not([disabled]):not([type="hidden"]),' +
  'select:not([disabled]),' +
  'textarea:not([disabled]),' +
  'iframe,' +
  'object,' +
  'embed,' +
  'summary,' +
  'audio[controls],' +
  'video[controls],' +
  '[contenteditable]:not([contenteditable="false"]),' +
  '[tabindex]:not([tabindex="-1"])';

function getDeepActiveElement(doc: Document): Element | null {
  let active: Element | null = doc.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    const next = active.shadowRoot.activeElement;
    if (next === active) break;
    active = next;
  }
  return active;
}

export function captureFocusSnapshot(doc: Document): FocusSnapshot {
  return {
    active: doc.activeElement,
    deepActive: getDeepActiveElement(doc),
  };
}

export function beginRouteAutofocus(
  page: HTMLElement,
  options?: {
    allowPriorFocusOverride?: boolean;
    priorFocus?: FocusSnapshot;
    outgoingPage?: HTMLElement | null;
  }
): void {
  routeAutofocusScopes.set(page, {
    page,
    allowPriorFocusOverride: Boolean(options?.allowPriorFocusOverride),
    priorActive: options?.priorFocus?.active ?? null,
    priorDeepActive: options?.priorFocus?.deepActive ?? null,
    outgoingPage: options?.outgoingPage ?? null,
    claimed: false,
  });
}

function findRouteAutofocusScope(node: Node): RouteAutofocusScope | null {
  let current: Node | null = node;
  while (current) {
    const scope = routeAutofocusScopes.get(current);
    if (scope) return scope;
    if (current.parentNode) {
      current = current.parentNode;
    } else if ((current as ShadowRoot).host) {
      current = (current as ShadowRoot).host;
    } else {
      break;
    }
  }
  return null;
}

function isWithinComposedTree(node: Node | null, ancestor: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (current === ancestor) return true;
    if (current.parentNode) {
      current = current.parentNode;
    } else if ((current as ShadowRoot).host) {
      current = (current as ShadowRoot).host;
    } else {
      break;
    }
  }
  return false;
}

function hasMeaningfulFocus(doc: Document, scope: RouteAutofocusScope | null): boolean {
  const active = doc.activeElement;
  if (!active || !active.isConnected || !doc.contains(active) || active === doc.body || active === doc.documentElement) {
    return false;
  }
  if (!scope || !scope.allowPriorFocusOverride) {
    return true;
  }
  if (scope.claimed) {
    return true;
  }
  const deepActive = getDeepActiveElement(doc);
  if (isWithinComposedTree(active, scope.page) || isWithinComposedTree(deepActive, scope.page)) {
    return true;
  }
  if (
    scope.outgoingPage &&
    (isWithinComposedTree(active, scope.outgoingPage) || isWithinComposedTree(deepActive, scope.outgoingPage))
  ) {
    return false;
  }
  if (
    scope.priorActive &&
    active === scope.priorActive &&
    (deepActive === scope.priorDeepActive || deepActive === scope.priorActive)
  ) {
    return false;
  }
  return true;
}

function isFocused(target: HTMLElement): boolean {
  const root = target.getRootNode() as Document | ShadowRoot;
  const active = root.activeElement;
  if (active === target || Boolean(active && target.contains(active))) {
    return true;
  }
  const innerRoot = getRenderRoot(target) ?? target.shadowRoot;
  if (innerRoot && innerRoot !== target && 'activeElement' in innerRoot) {
    return Boolean((innerRoot as ShadowRoot).activeElement);
  }
  return false;
}

function isDisabledElement(target: HTMLElement): boolean {
  return target.hasAttribute('disabled') || (target as any).disabled === true;
}

function canFocusHostDirectly(target: HTMLElement): boolean {
  if (!(target as any)[IS_ELEMENT_CLASS]) return true;
  if (target.hasAttribute('tabindex')) return true;
  const proto = target.ownerDocument.defaultView?.HTMLElement?.prototype;
  if (proto && target.focus !== proto.focus) return true;
  const opts = (target.constructor as any)?.[ELEMENT_OPTIONS];
  if (opts?.delegatesFocus) return true;
  if (target.shadowRoot?.delegatesFocus) return true;
  return false;
}

function tryFocus(target: HTMLElement): boolean {
  if (isDisabledElement(target)) return false;
  try {
    target.focus();
  } catch {
    return false;
  }
  return isFocused(target);
}

function explicitCandidates(root: SniceRenderRoot | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[autofocus]'))
    .filter(candidate => !processedCandidates.has(candidate));
}

function fallbackCandidates(root: SniceRenderRoot | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector));
}

function hasCandidate(host: HTMLElement): boolean {
  if (host.hasAttribute('autofocus') && !processedCandidates.has(host)) return true;
  return explicitCandidates(getRenderRoot(host)).length > 0;
}

function isUnupgradedCustomElement(el: HTMLElement): boolean {
  if (!el.localName.includes('-')) return false;
  const registry = el.ownerDocument.defaultView?.customElements;
  if (!registry) return false;
  return !registry.get(el.localName);
}

function isPendingSniceElement(el: HTMLElement): boolean {
  if (!(el as any)[IS_ELEMENT_CLASS]) return false;
  return !(el as any)[INITIALIZED] || Boolean((el as any)[READY_RESOLVE]);
}

function deferForCandidate(host: HTMLElement, candidate: HTMLElement): boolean {
  if (isUnupgradedCustomElement(candidate)) {
    const registry = candidate.ownerDocument.defaultView?.customElements;
    if (registry?.whenDefined) {
      let watched = deferredWatchers.get(host);
      if (!watched) {
        watched = new WeakSet();
        deferredWatchers.set(host, watched);
      }
      if (!watched.has(candidate)) {
        watched.add(candidate);
        registry.whenDefined(candidate.localName).then(() => {
          if (!host.isConnected) return;
          if ((candidate as any)[IS_ELEMENT_CLASS]) {
            scheduleAutofocus(candidate);
            Promise.resolve((candidate as any).ready).then(
              () => scheduleAutofocus(host),
              () => scheduleAutofocus(host)
            );
          } else {
            scheduleAutofocus(host);
          }
        });
      }
    }
    return true;
  }

  if (isPendingSniceElement(candidate)) {
    scheduleAutofocus(candidate);
    let watched = deferredWatchers.get(host);
    if (!watched) {
      watched = new WeakSet();
      deferredWatchers.set(host, watched);
    }
    if (!watched.has(candidate)) {
      watched.add(candidate);
      Promise.resolve((candidate as any).ready).then(
        () => scheduleAutofocus(host),
        () => scheduleAutofocus(host)
      );
    }
    return true;
  }

  return false;
}

/**
 * Complete native autofocus processing after a Snice element becomes usable.
 * Browsers do not consistently revisit late-upgraded hosts or autofocus
 * controls inserted into Shadow DOM, so Snice supplies that missing pass.
 */
export function applyAutofocus(host: HTMLElement): void {
  if (!host.isConnected) return;

  const root = getRenderRoot(host);
  const candidates: HTMLElement[] = [];
  if (host.hasAttribute('autofocus') && !processedCandidates.has(host)) candidates.push(host);
  candidates.push(...explicitCandidates(root));
  if (candidates.length === 0) return;

  const scope = findRouteAutofocusScope(host);

  // Match native first-wins behavior and preserve focus deliberately
  // established by application code or an earlier autofocus candidate.
  if (hasMeaningfulFocus(host.ownerDocument, scope)) {
    for (const candidate of candidates) processedCandidates.add(candidate);
    return;
  }

  for (const candidate of candidates) {
    if (candidate !== host && deferForCandidate(host, candidate)) {
      // Preserve document-order first-wins without poisoning an unready
      // nested custom element before it upgrades and renders.
      return;
    }

    processedCandidates.add(candidate);
    if (isDisabledElement(candidate)) continue;
    if (canFocusHostDirectly(candidate) && tryFocus(candidate)) {
      if (scope) scope.claimed = true;
      return;
    }

    // A decorated custom-element host is not necessarily a focusable area.
    // If its public focus() has no effect, use its first explicit autofocus
    // or native focus target without adding tabindex or changing semantics.
    const candidateRoot: SniceRenderRoot | null = candidate === host
      ? root
      : ((candidate as any)[IS_ELEMENT_CLASS] ? getRenderRoot(candidate) : candidate.shadowRoot);
    if (candidateRoot) {
      if (candidate !== host) {
        for (const nested of explicitCandidates(candidateRoot)) {
          processedCandidates.add(nested);
          if (tryFocus(nested)) {
            if (scope) scope.claimed = true;
            return;
          }
        }
      }
      for (const fallback of fallbackCandidates(candidateRoot)) {
        if (tryFocus(fallback)) {
          if (scope) scope.claimed = true;
          return;
        }
      }
    }
  }
}

/** Schedule one post-ready, post-paint autofocus pass for a Snice host. */
export function scheduleAutofocus(host: HTMLElement): void {
  if (scheduledHosts.has(host) || !hasCandidate(host)) return;
  scheduledHosts.add(host);

  const run = () => {
    const view = host.ownerDocument.defaultView;
    const apply = () => {
      scheduledHosts.delete(host);
      applyAutofocus(host);
    };
    if (view?.requestAnimationFrame) view.requestAnimationFrame(apply);
    else queueMicrotask(apply);
  };

  const ready = (host as any).ready as Promise<unknown> | undefined;
  const scope = findRouteAutofocusScope(host);
  const pageReady = scope && scope.page !== host
    ? ((scope.page as any).ready as Promise<unknown> | undefined)
    : undefined;

  const wait = pageReady
    ? Promise.all([
        Promise.resolve(ready).catch(() => {}),
        Promise.resolve(pageReady).catch(() => {})
      ])
    : Promise.resolve(ready);

  wait.then(run, run);
}

/** Allow an explicitly removed/re-added host autofocus attribute to run again. */
export function resetHostAutofocus(host: HTMLElement): void {
  processedCandidates.delete(host);
}
