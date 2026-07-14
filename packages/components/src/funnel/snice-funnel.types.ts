export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export type FunnelVariant = 'default' | 'gradient';
export type FunnelOrientation = 'vertical' | 'horizontal';

export interface SniceFunnelElement extends HTMLElement {
  data: FunnelStage[];
  variant: FunnelVariant;
  orientation: FunnelOrientation;
  showLabels: boolean;
  showValues: boolean;
  showPercentages: boolean;
  animation: boolean;

  setStages(stages: FunnelStage[]): void;
  exportImage(format?: 'png' | 'svg'): string;
}

export interface SniceFunnelEventMap {
  'funnel-click': CustomEvent<{ stage: FunnelStage; index: number }>;
  'funnel-hover': CustomEvent<{ stage: FunnelStage; index: number }>;
}
