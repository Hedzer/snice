import { Router } from 'snice';
import type { DashboardAppContext } from './types/app';
import { getMockUser } from './services/mock-data';

const now = new Date();
const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'dashboard-shell',
  context: {
    user: getMockUser(),
    dateRange: { start: thirtyDaysAgo, end: now },
    refreshInterval: 30000,
  } as DashboardAppContext,
});

export { page, initialize, navigate };
export type { DashboardAppContext };
