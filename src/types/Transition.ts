/**
 * Generic transition system for animating between elements
 */
export interface Transition {
  /**
   * Name of the transition (for identification)
   */
  name?: string;

  /**
   * Duration of the out transition in ms
   */
  outDuration?: number;

  /**
   * Duration of the in transition in ms
   */
  inDuration?: number;

  /**
   * CSS properties for the out transition (as string)
   * Example: 'opacity: 0; transform: scale(0.9)'
   */
  out?: string;

  /**
   * CSS properties for the in transition (as string)
   * Example: 'opacity: 1; transform: scale(1)'
   */
  in?: string;

  /**
   * Transition mode:
   * - 'sequential': out transition completes before in transition starts
   * - 'simultaneous': both transitions happen at the same time
   */
  mode?: 'sequential' | 'simultaneous';
}