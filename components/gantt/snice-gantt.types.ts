export type GanttZoom = 'day' | 'week' | 'month';

export interface GanttTask {
  id: string;
  name: string;
  start: string; // ISO date
  end: string;   // ISO date
  progress?: number; // 0-100
  dependencies?: string[]; // task IDs
  color?: string;
  group?: string;
}

export interface SniceGanttElement extends HTMLElement {
  tasks: GanttTask[];
  zoom: GanttZoom;
  showDependencies: boolean;

  scrollToDate(date: string): void;
  scrollToTask(id: string): void;
}

export interface SniceGanttEventMap {
  'task-click': CustomEvent<{ task: GanttTask }>;
  'task-resize': CustomEvent<{ task: GanttTask; start: string; end: string }>;
  'task-move': CustomEvent<{ task: GanttTask; start: string; end: string }>;
  'task-link': CustomEvent<{ source: string; target: string }>;
}
