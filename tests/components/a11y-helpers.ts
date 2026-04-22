/**
 * Run axe-core against a component's rendered output (host + shadow).
 * Returns only violations relevant to non-contrast rules — happy-dom doesn't
 * render colors reliably so contrast checks would false-positive.
 *
 * axe-core is imported lazily because it polyfills pointer-events on load and
 * crashes happy-dom's frozen Node.isConnected getter; importing inside the
 * function defers that to the test that actually wants an axe check.
 */
export async function axeCheck(
  el: HTMLElement,
  rules: Record<string, { enabled: boolean }> = {}
): Promise<any[]> {
  const axe = (await import('axe-core')).default;
  const results = await axe.run(el, {
    resultTypes: ['violations'],
    rules: {
      'color-contrast': { enabled: false }, // happy-dom doesn't render colors
      ...rules,
    },
  });
  return results.violations;
}

/** Assert a host+shadow tree has no axe violations. */
export async function expectA11y(el: HTMLElement, extra: Record<string, { enabled: boolean }> = {}) {
  const violations = await axeCheck(el, extra);
  if (violations.length > 0) {
    const summary = violations.map((v: any) => `  [${v.impact}] ${v.id}: ${v.help}\n    nodes: ${v.nodes.length}`).join('\n');
    throw new Error(`a11y violations:\n${summary}`);
  }
}

/** Assert a form-associated element exposes reset + disable callbacks. */
export function expectFormCallbacks(el: any) {
  if (typeof el.formResetCallback !== 'function') {
    throw new Error(`${el.tagName} missing formResetCallback`);
  }
  if (typeof el.formDisabledCallback !== 'function') {
    throw new Error(`${el.tagName} missing formDisabledCallback`);
  }
}
