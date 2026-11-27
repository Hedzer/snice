/**
 * Compile-time guarded platform behavior binder.
 *
 * When bundled with `snice({ platform: 'ios' })`, `__SNICE_PLATFORM__` folds
 * to `"ios"`, so Rollup/Vite dead-code-eliminates the other 3 platform modules
 * to 0 bytes. Under `platform: 'default'` or `'multi'`, all 4 fold to 0 bytes.
 */
import { attach as attachIos } from './ios';
import { attach as attachMaterial } from './material';
import { attach as attachWindows } from './windows';
import { attach as attachMacos } from './macos';
import type { PlatformBehaviorCleanup } from './types';

declare const __SNICE_PLATFORM__: string | undefined;

export function attachCompiledPlatformBehavior(el: Element): PlatformBehaviorCleanup | undefined {
  if (typeof __SNICE_PLATFORM__ === 'undefined') return undefined;
  if (__SNICE_PLATFORM__ === 'ios') return attachIos(el);
  if (__SNICE_PLATFORM__ === 'material') return attachMaterial(el);
  if (__SNICE_PLATFORM__ === 'windows') return attachWindows(el);
  if (__SNICE_PLATFORM__ === 'macos') return attachMacos(el);
  return undefined;
}
