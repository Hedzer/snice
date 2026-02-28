export type SchedulerView = 'day' | 'week' | 'month';

export interface SchedulerResource {
  id: string | number;
  name: string;
  avatar?: string;
  color?: string;
}

export interface SchedulerEvent {
  id: string | number;
  resourceId: string | number;
  start: Date | string;
  end: Date | string;
  title: string;
  color?: string;
  data?: any;
}

export interface SniceSchedulerElement extends HTMLElement {
  resources: SchedulerResource[];
  events: SchedulerEvent[];
  view: SchedulerView;
  date: Date | string;
  granularity: number;
  startHour: number;
  endHour: number;

  addEvent(event: SchedulerEvent): void;
  removeEvent(id: string | number): void;
  scrollToDate(date: Date | string): void;
  scrollToResource(id: string | number): void;
}

export interface SniceSchedulerEventMap {
  'event-create': CustomEvent<{ event: SchedulerEvent }>;
  'event-move': CustomEvent<{ event: SchedulerEvent; oldResourceId: string | number; oldStart: Date | string; oldEnd: Date | string }>;
  'event-resize': CustomEvent<{ event: SchedulerEvent; oldStart: Date | string; oldEnd: Date | string }>;
  'event-click': CustomEvent<{ event: SchedulerEvent }>;
  'slot-click': CustomEvent<{ resourceId: string | number; start: Date; end: Date }>;
}
