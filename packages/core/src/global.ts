// Global namespace for Snice framework
// Ensures all registries and symbols are shared across different JS files/modules

import { SniceGlobal } from './types/snice-global';

/**
 * Lazily read, initialize, or upgrade the shared `globalThis.snice` registry.
 * Reads directly from `globalThis.snice` on every call (no module-local cache)
 * so multiple copies of Snice share a single registry without import-time
 * side effects.
 */
export function getSniceGlobal(): SniceGlobal {
  let g = (globalThis as any).snice;
  if (!g) {
    g = {
      controllerRegistry: new Map(),
      pendingControllerAttachments: new Map(),
      controllerIdCounter: 0
    };
    (globalThis as any).snice = g;
  } else {
    g.controllerRegistry ??= new Map();
    g.pendingControllerAttachments ??= new Map();
    g.controllerIdCounter ??= 0;
  }
  return g;
}

// Helper function to get or create a global symbol
// Symbol.for() already guarantees global uniqueness, no need for a Map cache
export function getSymbol(name: string): symbol {
  return Symbol.for(`snice:${name}`);
}
