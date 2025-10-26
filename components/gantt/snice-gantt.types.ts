export type GanttViewMode = 'day' | 'week' | 'month' | 'year';

export interface GanttTask {
  id: string | number;
  name: string;
  start: Date | string;
  end: Date | string;
  progress?: number; // 0-100
  dependencies?: (string | number)[];
  color?: string;
  data?: any;
}

export interface SniceGanttElement extends HTMLElement {
  tasks: GanttTask[];
  viewMode: GanttViewMode;
  showToday: boolean;
  showProgress: boolean;
  showDependencies: boolean;
  minDate: Date | string;
  maxDate: Date | string;

  getTask(id: string | number): GanttTask | undefined;
  scrollToToday(): void;
  scrollToTask(id: string | number): void;
}
