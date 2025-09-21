export interface SniceGlobal {
  controllerRegistry: Map<string, any>;
  controllerIdCounter: number;
  symbols: Map<string, symbol>;
}