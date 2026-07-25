import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../packages/components/src/chip/snice-chip';
import '../../packages/components/src/split-button/snice-split-button';

/**
 * Components whose `label` is their visible caption accept slotted content as
 * well, so `<snice-chip>Starred</snice-chip>` reads naturally. `label=` keeps
 * working unchanged — the slot falls back to it — so this is additive.
 */

let host: HTMLElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); });
afterEach(() => host.remove());

const mount = async (html: string) => {
  host.innerHTML = html;
  const el = host.firstElementChild as any;
  await el.ready;
  await el.rendered;
  return el;
};

/** Text the user actually sees, following slot assignments. */
const visibleText = (el: any): string => {
  const root = el.shadowRoot ?? el;
  let text = '';
  for (const node of root.querySelectorAll('*')) {
    if (node.tagName === 'SLOT') {
      const assigned = (node as HTMLSlotElement).assignedNodes?.() ?? [];
      text += assigned.length
        ? assigned.map((n: Node) => n.textContent ?? '').join('')
        : (node.textContent ?? '');
    }
  }
  return (text || root.textContent || '').replace(/\s+/g, ' ').trim();
};

describe('Slotted labels', () => {
  it('chip renders slotted content', async () => {
    const el = await mount('<snice-chip>Starred</snice-chip>');
    expect(visibleText(el)).toContain('Starred');
  });

  it('chip still renders the label attribute', async () => {
    const el = await mount('<snice-chip label="Starred"></snice-chip>');
    expect(visibleText(el)).toContain('Starred');
  });

  it('chip prefers slotted content over the label attribute', async () => {
    const el = await mount('<snice-chip label="Fallback">Slotted</snice-chip>');
    const text = visibleText(el);
    expect(text).toContain('Slotted');
    expect(text).not.toContain('Fallback');
  });

  it('chip keeps its icon slot working alongside a slotted label', async () => {
    const el = await mount('<snice-chip icon="star">Starred</snice-chip>');
    expect(el.shadowRoot!.querySelector('svg'), 'icon did not render').toBeTruthy();
    expect(visibleText(el)).toContain('Starred');
  });

  it('split-button renders slotted content', async () => {
    const el = await mount('<snice-split-button>Save</snice-split-button>');
    expect(visibleText(el)).toContain('Save');
  });

  it('split-button still renders the label attribute', async () => {
    const el = await mount('<snice-split-button label="Save"></snice-split-button>');
    expect(visibleText(el)).toContain('Save');
  });

  // snice-crumb and snice-option are data carriers with no rendering of their
  // own; their parents already fall back to textContent
  // (snice-breadcrumbs.ts:170, snice-option.ts:49), so slotted text there is
  // pre-existing behaviour covered by their own suites.
});
