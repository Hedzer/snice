/**
 * Interface for Snice elements with all the framework-provided properties and methods
 */
export interface SniceElement extends HTMLElement {
  ready: Promise<void>;
  html?(): string | Promise<string>;
  css?(): string | string[] | Promise<string | string[]>;
}