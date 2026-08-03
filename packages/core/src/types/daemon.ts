/**
 * Named daemon instances exposed by an application context.
 *
 * The values remain structurally typed as objects because TypeScript cannot
 * express "an instance of a class carrying the @daemon decorator". Snice
 * validates the decorator marker when the context is provided.
 */
export type DaemonMap = Readonly<Record<string, object>>;
