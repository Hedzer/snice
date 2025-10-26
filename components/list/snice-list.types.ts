export interface ListItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  iconImage?: string;
  disabled?: boolean;
  selected?: boolean;
  data?: any;
}

export type ListSelectionMode = 'single' | 'multiple' | 'none';

export interface SniceListElement extends HTMLElement {
  items: ListItem[];
  selectionMode: ListSelectionMode;
  selectedItems: string[];
  hoverable: boolean;
  dividers: boolean;
  dense: boolean;

  selectItem(id: string): void;
  deselectItem(id: string): void;
  toggleSelection(id: string): void;
  getSelectedItems(): ListItem[];
}

export interface ListItemSelectDetail {
  item: ListItem;
  selected: boolean;
  list: SniceListElement;
}
