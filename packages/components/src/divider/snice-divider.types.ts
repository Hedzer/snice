export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';
export type DividerAlign = 'start' | 'center' | 'end';
export type DividerSpacing = 'none' | 'small' | 'medium' | 'large';

export interface SniceDividerElement extends HTMLElement {
  orientation: DividerOrientation;
  variant: DividerVariant;
  spacing: DividerSpacing;
  align: DividerAlign;
  text: string;
  textBackground: string;
  color: string;
  capped: boolean;
}