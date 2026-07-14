// Global symbols for all Snice components
// Ensures components work correctly even if bundled multiple times

function getComponentSymbol(namespace: string, name: string): symbol {
  if (!(globalThis as any).sniceComponents) {
    (globalThis as any).sniceComponents = {
      symbols: new Map<string, symbol>()
    };
  }
  
  const key = `${namespace}/${name}`;
  const symbols = (globalThis as any).sniceComponents.symbols;
  
  if (!symbols.has(key)) {
    symbols.set(key, Symbol(key));
  }
  return symbols.get(key)!;
}

// Export helper for component-specific symbols
export function getSymbol(namespace: string, name: string): symbol {
  return getComponentSymbol(namespace, name);
}