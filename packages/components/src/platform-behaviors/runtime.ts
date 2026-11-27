/**
 * Opt-in runtime lazy behavior binder for multi-platform `[data-platform="..."]`
 * showcases, documentation, Storybook, and multi-tenant apps.
 *
 * Purely opt-in and side-effect-free on import — ships 0 bytes in single-platform
 * `snice({ platform })` builds unless explicitly imported.
 */
import { isSniceSkinPlatform, type SniceSkinPlatform } from '../platforms';
import type { PlatformBehaviorCleanup, PlatformBehaviorModule } from './types';

export type PlatformBehaviorLoader = () => Promise<PlatformBehaviorModule>;

export interface RuntimePlatformBehaviorOptions {
  /** Optional custom loaders (useful for testing or custom platform extensions). */
  loaders?: Partial<Record<SniceSkinPlatform, PlatformBehaviorLoader>>;
}

export interface RuntimePlatformBehaviorHandle {
  /** Disconnect all observers and detach every active platform behavior controller. */
  dispose(): void;
  /** Re-scan `[data-platform]` hosts immediately. */
  refresh(): void;
  /** List the skin platforms currently attached in the observed tree. */
  getActivePlatforms(): SniceSkinPlatform[];
}

const DEFAULT_LOADERS: Record<SniceSkinPlatform, PlatformBehaviorLoader> = {
  ios: () => import('./ios'),
  material: () => import('./material'),
  windows: () => import('./windows'),
  macos: () => import('./macos'),
};

interface HostBinding {
  platform: SniceSkinPlatform;
  token: number;
  cleanup: PlatformBehaviorCleanup | null;
}

/**
 * Observe `[data-platform="..."]` elements under `root` and lazily load + bind
 * ONLY the behavior module(s) for platforms actually present in the DOM.
 *
 * Switching `data-platform` at runtime cleanly swaps attached micro-behaviors
 * without recreating DOM nodes or disrupting focus, input values, checked state,
 * form association, scroll position, or attached event listeners.
 */
export function enableRuntimePlatformBehaviors(
  root: Document | Element = typeof document !== 'undefined' ? document : (undefined as any),
  options?: RuntimePlatformBehaviorOptions
): RuntimePlatformBehaviorHandle {
  if (!root) {
    return {
      dispose() {},
      refresh() {},
      getActivePlatforms() {
        return [];
      },
    };
  }

  const loaders: Record<SniceSkinPlatform, PlatformBehaviorLoader> = {
    ...DEFAULT_LOADERS,
    ...(options?.loaders ?? {}),
  };

  const moduleCache = new Map<SniceSkinPlatform, Promise<PlatformBehaviorModule>>();
  const bindings = new Map<Element, HostBinding>();
  let disposed = false;
  let nextToken = 1;

  function loadModule(platform: SniceSkinPlatform): Promise<PlatformBehaviorModule> {
    let cached = moduleCache.get(platform);
    if (!cached) {
      cached = loaders[platform]();
      moduleCache.set(platform, cached);
    }
    return cached;
  }

  function detachHost(el: Element): void {
    const existing = bindings.get(el);
    if (!existing) return;
    bindings.delete(el);
    try {
      existing.cleanup?.();
    } catch {
      // Never throw during teardown
    }
  }

  function syncHost(el: Element): void {
    if (disposed) return;
    const raw = el.getAttribute('data-platform')?.trim();
    const existing = bindings.get(el);

    if (!raw || !isSniceSkinPlatform(raw)) {
      if (existing) detachHost(el);
      return;
    }

    if (existing && existing.platform === raw) {
      return;
    }

    if (existing) {
      detachHost(el);
    }

    const token = nextToken++;
    const record: HostBinding = { platform: raw, token, cleanup: null };
    bindings.set(el, record);

    loadModule(raw)
      .then((mod) => {
        if (disposed) return;
        const current = bindings.get(el);
        if (!current || current.token !== token || !el.isConnected) return;
        current.cleanup = mod.attach(el);
      })
      .catch(() => {
        // Gracefully ignore unavailable optional behavior module
      });
  }

  function collectTargets(): Set<Element> {
    const targets = new Set<Element>();
    const container: Element | null =
      root instanceof Document ? root.documentElement : root;
    if (!container) return targets;

    if (container.hasAttribute('data-platform')) {
      targets.add(container);
    }
    for (const el of Array.from(container.querySelectorAll('[data-platform]'))) {
      targets.add(el);
    }
    return targets;
  }

  function refresh(): void {
    if (disposed) return;
    const targets = collectTargets();

    // Detach any hosts that lost their attribute or disconnected
    for (const el of Array.from(bindings.keys())) {
      if (!targets.has(el) || !el.isConnected) {
        detachHost(el);
      }
    }

    for (const el of targets) {
      syncHost(el);
    }
  }

  const observeTarget = root instanceof Document ? root.documentElement : root;
  const observer =
    typeof MutationObserver !== 'undefined' && observeTarget
      ? new MutationObserver((mutations) => {
          if (disposed) return;
          let needsFullRefresh = false;
          for (const m of mutations) {
            if (m.type === 'attributes' && m.target instanceof Element) {
              syncHost(m.target);
            } else if (m.type === 'childList') {
              needsFullRefresh = true;
            }
          }
          if (needsFullRefresh) {
            refresh();
          }
        })
      : null;

  if (observer && observeTarget) {
    observer.observe(observeTarget, {
      attributes: true,
      attributeFilter: ['data-platform'],
      childList: true,
      subtree: true,
    });
  }

  // Initial scan
  refresh();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      for (const el of Array.from(bindings.keys())) {
        detachHost(el);
      }
      bindings.clear();
    },
    refresh,
    getActivePlatforms() {
      const set = new Set<SniceSkinPlatform>();
      for (const b of bindings.values()) {
        set.add(b.platform);
      }
      return Array.from(set).sort();
    },
  };
}
