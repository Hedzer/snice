// Global namespace for Snice framework
// Ensures all registries and symbols are shared across different JS files/modules

import { SniceGlobal } from './types/snice-global';


// Initialize the global Snice namespace on globalThis
// This ensures all module instances share the same registry
if (!(globalThis as any).snice) {
  (globalThis as any).snice = {
    controllerRegistry: new Map(),
    controllerIdCounter: 0
  };
}

// Export direct reference to globalThis.snice
export const snice: SniceGlobal = (globalThis as any).snice;

// Helper function to get or create a global symbol
// Symbol.for() already guarantees global uniqueness, no need for a Map cache
export function getSymbol(name: string): symbol {
  return Symbol.for(`snice:${name}`);
}

