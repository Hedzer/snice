import { getRenderRoot, type SniceRenderRoot } from './render-root';

const scheduledHosts = new WeakSet<HTMLElement>();
const processedCandidates = new WeakSet<Element>();

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function hasMeaningfulFocus(document: Document): boolean {
  const active = document.activeElement;
  return Boolean(active && active !== document.body && active !== document.documentElement);
}

function isFocused(target: HTMLElement): boolean {
  const root = target.getRootNode() as Document | ShadowRoot;
  const active = root.activeElement;
  return active === target || Boolean(active && target.contains(active));
}

function tryFocus(target: HTMLElement): boolean {
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

  // Match native first-wins behavior and preserve focus deliberately
  // established by application code or an earlier autofocus candidate.
  if (hasMeaningfulFocus(host.ownerDocument)) {
    for (const candidate of candidates) processedCandidates.add(candidate);
    return;
  }

  for (const candidate of candidates) {
    processedCandidates.add(candidate);
    if (tryFocus(candidate)) return;

    // A decorated custom-element host is not necessarily a focusable area.
    // If its public focus() has no effect, use its first native focus target
    // without adding tabindex or changing the host's accessibility semantics.
    if (candidate === host) {
      for (const fallback of fallbackCandidates(root)) {
        if (tryFocus(fallback)) return;
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
  Promise.resolve(ready).then(run, run);
}

/** Allow an explicitly removed/re-added host autofocus attribute to run again. */
export function resetHostAutofocus(host: HTMLElement): void {
  processedCandidates.delete(host);
}
