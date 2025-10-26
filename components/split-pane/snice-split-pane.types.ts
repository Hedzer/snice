export type SplitDirection = 'horizontal' | 'vertical';

export interface SniceResizeDetail {
  primarySize: number;
  secondarySize: number;
  splitPane: SniceResize;
}

export interface SniceResizeElement extends HTMLElement {
  direction: SplitDirection;
  primarySize: number;
  minPrimarySize: number;
  minSecondarySize: number;
  snapSize: number;
  disabled: boolean;

  getPrimarySize(): number;
  getSecondarySize(): number;
  setPrimarySize(size: number): void;
  reset(): void;
}

// Export as alias for backward compatibility
export type SniceSplitPaneElement = SniceResizeElement;
