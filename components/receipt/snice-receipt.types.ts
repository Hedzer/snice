export type ReceiptVariant = 'standard' | 'thermal' | 'modern' | 'minimal' | 'detailed';

export type QrPosition = 'top' | 'bottom' | 'footer';

export interface ReceiptMerchant {
  name: string;
  address?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  discount?: number;
  note?: string;
}

export interface ReceiptTaxLine {
  label: string;
  rate?: number;
  amount: number;
}

export interface SniceReceiptElement extends HTMLElement {
  receiptNumber: string;
  date: string;
  currency: string;
  locale: string;
  merchant: ReceiptMerchant;
  items: ReceiptItem[];
  tax: number;
  taxes: ReceiptTaxLine[];
  subtotal: number;
  total: number;
  tip: number;
  discount: number;
  discountLabel: string;
  paymentMethod: string;
  paymentDetails: string;
  variant: ReceiptVariant;
  showQr: boolean;
  qrData: string;
  qrPosition: QrPosition;
  thankYou: string;
  cashier: string;
  terminalId: string;
  print(): void;
}

export interface SniceReceiptEventMap {}
