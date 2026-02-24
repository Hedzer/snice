import type {
  MetricCard,
  ChartDataPoint,
  TimeSeriesPoint,
  ReportRow,
  ActivityItem,
  User,
} from '../types/app';

export function getMockUser(): User {
  return {
    id: 'u1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    avatar: '',
    role: 'admin',
  };
}

export function generateMetrics(): MetricCard[] {
  return [
    {
      id: 'revenue',
      label: 'Revenue',
      value: 48250 + Math.floor(Math.random() * 2000),
      previousValue: 42100,
      format: 'currency',
      icon: '$',
    },
    {
      id: 'orders',
      label: 'Orders',
      value: 1243 + Math.floor(Math.random() * 100),
      previousValue: 1180,
      format: 'number',
      icon: '#',
    },
    {
      id: 'conversion',
      label: 'Conversion',
      value: 3.2 + Math.random() * 0.5,
      previousValue: 2.8,
      format: 'percent',
      icon: '%',
    },
    {
      id: 'visitors',
      label: 'Visitors',
      value: 38420 + Math.floor(Math.random() * 3000),
      previousValue: 35200,
      format: 'number',
      icon: 'U',
    },
  ];
}

export function generateTimeSeries(days: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  let value = 1200;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    value += Math.floor(Math.random() * 200) - 80;
    if (value < 400) value = 400;
    points.push({
      date: d.toISOString().split('T')[0],
      value,
    });
  }
  return points;
}

export function generateCategoryData(): ChartDataPoint[] {
  return [
    { label: 'Electronics', value: 34, color: '#6366f1' },
    { label: 'Clothing', value: 22, color: '#22d3ee' },
    { label: 'Home & Garden', value: 18, color: '#f59e0b' },
    { label: 'Books', value: 14, color: '#10b981' },
    { label: 'Sports', value: 12, color: '#ef4444' },
  ];
}

export function generateReportData(search?: string): ReportRow[] {
  const rows: ReportRow[] = [
    { id: 'p1', name: 'Wireless Headphones', category: 'Electronics', revenue: 12400, orders: 248, conversion: 4.2, trend: 'up' },
    { id: 'p2', name: 'Running Shoes', category: 'Sports', revenue: 8900, orders: 178, conversion: 3.1, trend: 'up' },
    { id: 'p3', name: 'Coffee Maker', category: 'Home & Garden', revenue: 6700, orders: 134, conversion: 2.8, trend: 'down' },
    { id: 'p4', name: 'Programming Book', category: 'Books', revenue: 4500, orders: 300, conversion: 5.1, trend: 'up' },
    { id: 'p5', name: 'Winter Jacket', category: 'Clothing', revenue: 9800, orders: 196, conversion: 3.5, trend: 'flat' },
    { id: 'p6', name: 'Smart Watch', category: 'Electronics', revenue: 15600, orders: 312, conversion: 4.8, trend: 'up' },
    { id: 'p7', name: 'Yoga Mat', category: 'Sports', revenue: 3200, orders: 160, conversion: 2.4, trend: 'down' },
    { id: 'p8', name: 'Desk Lamp', category: 'Home & Garden', revenue: 5100, orders: 170, conversion: 3.0, trend: 'flat' },
    { id: 'p9', name: 'Novel Collection', category: 'Books', revenue: 2800, orders: 140, conversion: 4.0, trend: 'up' },
    { id: 'p10', name: 'Denim Jacket', category: 'Clothing', revenue: 7200, orders: 144, conversion: 3.2, trend: 'up' },
  ];
  if (search) {
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }
  return rows;
}

export function generateActivity(): ActivityItem[] {
  const now = Date.now();
  return [
    { id: 'a1', type: 'sale', message: 'New order #4821 placed', timestamp: new Date(now - 120000), amount: 149.99 },
    { id: 'a2', type: 'signup', message: 'New user registered: Jamie L.', timestamp: new Date(now - 300000) },
    { id: 'a3', type: 'sale', message: 'Order #4820 completed', timestamp: new Date(now - 600000), amount: 89.50 },
    { id: 'a4', type: 'refund', message: 'Refund processed for order #4795', timestamp: new Date(now - 900000), amount: -34.99 },
    { id: 'a5', type: 'alert', message: 'Low stock: Wireless Headphones (5 left)', timestamp: new Date(now - 1200000) },
    { id: 'a6', type: 'sale', message: 'New order #4819 placed', timestamp: new Date(now - 1800000), amount: 224.00 },
    { id: 'a7', type: 'signup', message: 'New user registered: Chris W.', timestamp: new Date(now - 2400000) },
    { id: 'a8', type: 'sale', message: 'Order #4818 shipped', timestamp: new Date(now - 3600000), amount: 67.25 },
  ];
}

export function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

export function formatMetricValue(value: number, format: 'number' | 'currency' | 'percent'): string {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return formatPercent(value);
  return formatNumber(value);
}

export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
