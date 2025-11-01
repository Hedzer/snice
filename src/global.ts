// Global namespace for Snice framework
// Ensures all registries and symbols are shared across different JS files/modules

import { SniceGlobal } from './types/snice-global';


// Initialize the global Snice namespace on globalThis
// This ensures all module instances share the same registry
if (!(globalThis as any).snice) {
  (globalThis as any).snice = {
    controllerRegistry: new Map(),
    controllerIdCounter: 0,
    symbols: new Map()
  };
}

// Export direct reference to globalThis.snice
export const snice: SniceGlobal = (globalThis as any).snice;

// Helper function to get or create a global symbol
// Uses Symbol.for() to ensure symbols are shared across multiple Snice instances
export function getSymbol(name: string): symbol {
  if (!snice.symbols.has(name)) {
    snice.symbols.set(name, Symbol.for(`snice:${name}`));
  }
  return snice.symbols.get(name)!;
}