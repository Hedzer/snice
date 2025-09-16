export type BreadcrumbSeparator = '/' | '>' | '»' | '•' | '|';
export type BreadcrumbSize = 'small' | 'medium' | 'large';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  iconImage?: string;
  active?: boolean;
}

export interface SniceBreadcrumbsElement extends HTMLElement {
  items: BreadcrumbItem[];
  separator: BreadcrumbSeparator;
  size: BreadcrumbSize;
  maxItems: number;
  setItems(items: BreadcrumbItem[]): void;
}

export interface SniceCrumbElement extends HTMLElement {
  label: string;
  href: string;
  icon: string;
  iconImage: string;
  active: boolean;
}
