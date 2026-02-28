export type DataCardFieldType = 'text' | 'link' | 'badge' | 'date' | 'currency';
export type DataCardVariant = 'default' | 'horizontal' | 'compact';

export interface DataCardField {
  label: string;
  value: string | number;
  type?: DataCardFieldType;
  editable?: boolean;
  group?: string;
  icon?: string;
  href?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export interface SniceDataCardElement extends HTMLElement {
  fields: DataCardField[];
  editable: boolean;
  variant: DataCardVariant;
  getValues(): Record<string, string | number>;
  setValues(data: Record<string, string | number>): void;
}

export interface SniceDataCardEventMap {
  'field-change': CustomEvent<{ field: DataCardField; value: string | number; previousValue: string | number }>;
  'field-save': CustomEvent<{ field: DataCardField; value: string | number }>;
}
