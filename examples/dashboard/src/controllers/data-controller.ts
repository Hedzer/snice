import { controller, respond } from 'snice';
import type { IController } from 'snice';
import {
  generateMetrics,
  generateTimeSeries,
  generateCategoryData,
  generateReportData,
  generateActivity,
} from '../services/mock-data';

@controller('dashboard-data')
export class DashboardDataController implements IController {
  element!: HTMLElement;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @respond('fetch-metrics')
  async handleFetchMetrics() {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));
    return generateMetrics();
  }

  @respond('fetch-timeseries')
  async handleFetchTimeSeries(payload: { days: number }) {
    await new Promise((r) => setTimeout(r, 300));
    return generateTimeSeries(payload.days);
  }

  @respond('fetch-categories')
  async handleFetchCategories() {
    await new Promise((r) => setTimeout(r, 250));
    return generateCategoryData();
  }

  @respond('fetch-reports')
  async handleFetchReports(payload: { search?: string }) {
    await new Promise((r) => setTimeout(r, 350));
    return generateReportData(payload.search);
  }

  @respond('fetch-activity')
  async handleFetchActivity() {
    await new Promise((r) => setTimeout(r, 200));
    return generateActivity();
  }
}
