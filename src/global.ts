// Global namespace for Snice framework
// Ensures all registries and symbols are shared across different JS files/modules

export interface SniceGlobal {
  controllerRegistry: Map<string, any>;
  controllerIdCounter: number;
  symbols: Map<string, symbol>;
}

// Initialize or get the global Snice namespace
function initGlobalNamespace(): SniceGlobal {
  if (!(globalThis as any).snice) {
    (globalThis as any).snice = {
      controllerRegistry: new Map(),
      controllerIdCounter: 0,
      symbols: new Map()
    };
  }
  return (globalThis as any).snice;
}

// Export the global namespace
export const snice = initGlobalNamespace();

// Helper function to get or create a global symbol
export function getSymbol(name: string): symbol {
  if (!snice.symbols.has(name)) {
    snice.symbols.set(name, Symbol(name));
  }
  return snice.symbols.get(name)!;
}