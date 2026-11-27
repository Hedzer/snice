import type { PlatformBehaviorCleanup } from './types';

export const platform = 'material' as const;

export function attach(_root: Document | Element): PlatformBehaviorCleanup {
  return () => {};
}
