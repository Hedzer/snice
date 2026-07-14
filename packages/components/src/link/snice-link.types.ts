export type LinkVariant = 'default' | 'primary' | 'secondary' | 'muted';
export type LinkTarget = '_self' | '_blank' | '_parent' | '_top';

export interface SniceLinkElement extends HTMLElement {
  href: string;
  target: LinkTarget;
  variant: LinkVariant;
  disabled: boolean;
  external: boolean;
  underline: boolean;
  hash: boolean;
}
