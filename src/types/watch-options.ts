export interface WatchOptions {
  /**
   * Whether the watcher fires once during initialization with the element's
   * initial value (`oldValue` is `undefined`), in addition to firing on later
   * changes. Defaults to `true`. Set `false` for a change-only watcher — e.g.
   * one that dispatches an event, so it doesn't emit spuriously on mount.
   */
  immediate?: boolean;
}
