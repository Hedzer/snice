export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceVariant = 'standard' | 'modern' | 'classic' | 'minimal' | 'detailed';
export type QrPosition = 'top-right' | 'bottom-right' | 'bottom-left' | 'footer';

export interface InvoiceParty {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logo?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  tax?: number;
}

export interface SniceInvoiceElement extends HTMLElement {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  taxRate: number;
  discount: number;
  from: InvoiceParty;
  to: InvoiceParty;
  items: InvoiceItem[];
  notes: string;
  variant: InvoiceVariant;
  showQr: boolean;
  qrData: string;
  qrPosition: QrPosition;
  print(): void;
  toJSON(): object;
}

export interface InvoiceItemChangeDetail {
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceStatusChangeDetail {
  oldStatus: InvoiceStatus;
  newStatus: InvoiceStatus;
}

export interface SniceInvoiceEventMap {
  'invoice-item-change': CustomEvent<InvoiceItemChangeDetail>;
  'invoice-status-change': CustomEvent<InvoiceStatusChangeDetail>;
}
