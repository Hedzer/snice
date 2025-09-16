export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface SniceSkeletonElement extends HTMLElement {
  variant: SkeletonVariant;
  width: string;
  height: string;
  animation: SkeletonAnimation;
  count: number;
  spacing: string;
}