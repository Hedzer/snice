import type { Placard } from 'snice';

export type NavVariant = 'flat' | 'hierarchical' | 'grouped';
export type NavOrientation = 'horizontal' | 'vertical';

export interface SniceNavElement extends HTMLElement {
  placards: Placard[];
  currentRoute: string;
  variant: NavVariant;
  orientation: NavOrientation;
  html?(): string | Promise<string>;
  css?(): string | string[] | Promise<string | string[]>;
}
