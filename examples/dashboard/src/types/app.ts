import type { AppContext as SniceAppContext } from 'snice';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface DashboardAppContext extends SniceAppContext {
  user: User | null;
  dateRange: { start: Date; end: Date };
  refreshInterval: number;
}

export interface MetricCard {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'currency' | 'percent';
  icon: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface ReportRow {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  conversion: number;
  trend: 'up' | 'down' | 'flat';
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'signup' | 'refund' | 'alert';
  message: string;
  timestamp: Date;
  amount?: number;
}
