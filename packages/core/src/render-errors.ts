/**
 * Add stable component identity to an error without relying on ambient render
 * state. Contextual errors retain the original failure as their `cause`.
 */
class ContextualRenderError extends Error {
  readonly #hostIdentity: string;

  constructor(
    hostIdentity: string,
    message: string,
    cause: unknown,
  ) {
    super(message, { cause });
    this.#hostIdentity = hostIdentity;
  }

  belongsTo(hostIdentity: string): boolean {
    return this.#hostIdentity === hostIdentity;
  }
}

function renderHostIdentity(host: HTMLElement): string {
  const tag = host.tagName?.toLowerCase() || 'element';
  let className = '';
  try {
    className = host.constructor?.name || '';
  } catch {
    // A hostile/proxied constructor must not hide the useful tag identity.
  }
  return className ? `<${tag}> (${className})` : `<${tag}>`;
}

export function contextualizeRenderError(host: HTMLElement, error: unknown): Error {
  const hostIdentity = renderHostIdentity(host);
  if (error instanceof ContextualRenderError && error.belongsTo(hostIdentity)) return error;

  const message = error instanceof Error ? error.message : String(error);
  const contextual = new ContextualRenderError(
    hostIdentity,
    `snice: render failed for ${hostIdentity}: ${message}`,
    error,
  );
  if (error instanceof Error) contextual.name = error.name;
  return contextual;
}
