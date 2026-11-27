import type { SniceSkinPlatform } from '../platforms';

export type PlatformBehaviorCleanup = () => void;

export interface PlatformBehaviorModule {
  readonly platform: SniceSkinPlatform;
  /**
   * Attach contemporary native interaction micro-behaviors to a single element
   * or subtree root (e.g. a `[data-platform="<p>"]` container or document).
   * Returns a cleanup function that disconnects all listeners/observers cleanly.
   */
  attach(root: Document | Element): PlatformBehaviorCleanup;
}

export function prefersReducedMotion(el?: Element | null): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  }
  const node = el ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (node && typeof node.closest === 'function') {
    const motionHost = node.closest('[data-motion]');
    const val = motionHost?.getAttribute('data-motion');
    if (val === 'reduce' || val === 'off') return true;
  }
  return false;
}
