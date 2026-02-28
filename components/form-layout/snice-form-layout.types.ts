export type FormLayoutLabelPosition = 'top' | 'left' | 'right';
export type FormLayoutGap = 'small' | 'medium' | 'large';
export type FormLayoutVariant = 'default' | 'compact' | 'inline';

export interface SniceFormLayoutElement extends HTMLElement {
  columns: number;
  labelPosition: FormLayoutLabelPosition;
  labelWidth: string;
  gap: FormLayoutGap;
  variant: FormLayoutVariant;
}

export interface SniceFormLayoutEventMap {
  // No events — this is a layout-only component
}
