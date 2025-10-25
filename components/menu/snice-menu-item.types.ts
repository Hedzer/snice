export interface SniceMenuItemElement extends HTMLElement {
  disabled: boolean;
  value: string;
  selected: boolean;
}

export interface MenuItemSelectDetail {
  item: SniceMenuItemElement;
  value: string;
}
