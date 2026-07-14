export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
export type EstimateVariant = 'standard' | 'comparison' | 'professional' | 'creative' | 'minimal';
export type QrPosition = 'top-right' | 'bottom-right' | 'footer';

export interface EstimateParty {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  optional?: boolean;
  included?: boolean;
}

export interface EstimateAcceptDetail {
  estimateNumber: string;
  items: EstimateItem[];
  total: number;
}

export interface EstimateDeclineDetail {
  estimateNumber: string;
}

export interface ItemToggleDetail {
  index: number;
  item: EstimateItem;
  included: boolean;
}

export interface EstimateJSON {
  estimateNumber: string;
  date: string;
  expiryDate: string;
  status: EstimateStatus;
  from: EstimateParty | null;
  to: EstimateParty | null;
  items: EstimateItem[];
  currency: string;
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface SniceEstimateElement extends HTMLElement {
  estimateNumber: string;
  date: string;
  expiryDate: string;
  status: EstimateStatus;
  from: EstimateParty | null;
  to: EstimateParty | null;
  items: EstimateItem[];
  currency: string;
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  variant: EstimateVariant;
  showQr: boolean;
  qrData: string;
  qrPosition: QrPosition;
  print(): void;
  toJSON(): EstimateJSON;
}

export interface SniceEstimateEventMap {
  'estimate-accept': CustomEvent<EstimateAcceptDetail>;
  'estimate-decline': CustomEvent<EstimateDeclineDetail>;
  'item-toggle': CustomEvent<ItemToggleDetail>;
}
