export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
export type WorkOrderVariant = 'standard' | 'compact' | 'field-service' | 'maintenance' | 'detailed';
export type QrPosition = 'top-right' | 'header' | 'footer';

export interface WorkOrderCustomer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface WorkOrderTask {
  description: string;
  assignee?: string;
  completed?: boolean;
  hours?: number;
}

export interface WorkOrderPart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
}

export interface WorkOrderAsset {
  id: string;
  name: string;
  location?: string;
  serial?: string;
  lastService?: string;
}

export interface TaskToggleDetail {
  index: number;
  task: WorkOrderTask;
  completed: boolean;
}

export interface StatusChangeDetail {
  previousStatus: WorkOrderStatus;
  status: WorkOrderStatus;
}

export interface WorkOrderSignDetail {
  woNumber: string;
  timestamp: string;
}

export interface WorkOrderJSON {
  woNumber: string;
  date: string;
  dueDate: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  customer: WorkOrderCustomer | null;
  description: string;
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  asset: WorkOrderAsset | null;
  laborRate: number;
  notes: string;
  variant: WorkOrderVariant;
  totalPartsCost: number;
  totalLaborHours: number;
  totalLaborCost: number;
  totalCost: number;
}

export interface SniceWorkOrderElement extends HTMLElement {
  woNumber: string;
  date: string;
  dueDate: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  customer: WorkOrderCustomer | null;
  description: string;
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  asset: WorkOrderAsset | null;
  laborRate: number;
  notes: string;
  variant: WorkOrderVariant;
  showQr: boolean;
  qrData: string;
  qrPosition: QrPosition;
  print(): void;
  toJSON(): WorkOrderJSON;
}

export interface SniceWorkOrderEventMap {
  'task-toggle': CustomEvent<TaskToggleDetail>;
  'status-change': CustomEvent<StatusChangeDetail>;
  'wo-sign': CustomEvent<WorkOrderSignDetail>;
}
