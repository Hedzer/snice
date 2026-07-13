/**
 * Interface for Snice elements with all the framework-provided properties and methods
 */
export interface SniceElement extends HTMLElement {
  readonly ready: Promise<void>;
  readonly rendered: Promise<void>;
  invalidate(): Promise<void>;
  renderNow(): Promise<void>;
}
