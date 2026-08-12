/**
 * Milliseconds used by an event timing option.
 *
 * A resolver is invoked with the decorated element, controller, or daemon as
 * `this`, allowing the interval to vary per instance.
 */
export type EventTiming = number | ((this: any) => number);
