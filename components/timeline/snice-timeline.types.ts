export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelinePosition = 'left' | 'right' | 'alternate';
export type TimelineItemVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface TimelineItem {
  timestamp?: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: TimelineItemVariant;
}

export interface SniceTimelineElement extends HTMLElement {
  orientation: TimelineOrientation;
  position: TimelinePosition;
  items: TimelineItem[];
  reverse: boolean;
}
