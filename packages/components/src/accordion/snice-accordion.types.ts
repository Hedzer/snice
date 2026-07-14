export interface SniceAccordionElement extends HTMLElement {
  multiple: boolean;
  activeItems: Set<string>;
  openItem(id: string): void;
  closeItem(id: string): void;
  toggleItem(id: string): void;
  openAll(): void;
  closeAll(): void;
}

export interface SniceAccordionItemElement extends HTMLElement {
  itemId: string;
  open: boolean;
  disabled: boolean;
  toggle(): void;
  expand(): void;
  collapse(): void;
}

export interface AccordionOpenEvent {
  detail: {
    itemId: string;
    item: SniceAccordionItemElement;
  };
}

export interface AccordionCloseEvent {
  detail: {
    itemId: string;
    item: SniceAccordionItemElement;
  };
}