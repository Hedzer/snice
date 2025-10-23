import type { Placard, AppContext } from 'snice';

export type NavVariant = 'flat' | 'hierarchical' | 'grouped';
export type NavOrientation = 'horizontal' | 'vertical';

export interface SniceNavElement extends HTMLElement {
  variant: NavVariant;
  orientation: NavOrientation;
  isTopLevel: boolean;
  update(placards: Placard[], appContext?: AppContext, currentRoute?: string, routeParams?: Record<string, string>): void;
  html?(): string | Promise<string>;
  css?(): string | string[] | Promise<string | string[]>;
}
