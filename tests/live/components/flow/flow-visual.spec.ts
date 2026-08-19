import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/flow/visual.html';

test.describe('Snice Flow visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('nodes sit at their model coordinates with header and body tiling the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const flows = [...document.querySelectorAll('snice-flow')] as any[];
      if (flows.length === 0) problems.push('no flows rendered');
      flows.forEach(flow => {
        const sr = flow.shadowRoot as ShadowRoot;
        const layer = sr.querySelector('.flow__nodes') as HTMLElement;
        const canvas = sr.querySelector('.flow') as HTMLElement;
        if (!layer || !canvas) { problems.push(`${flow.id}: missing canvas layers`); return; }
        const lr = layer.getBoundingClientRect();
        const cards = [...sr.querySelectorAll('.flow__node')] as HTMLElement[];
        const model = (flow.nodes ?? []) as Array<{ id: string; x: number; y: number }>;
        if (cards.length !== model.length) {
          problems.push(`${flow.id}: ${cards.length} cards for ${model.length} nodes`);
          return;
        }
        cards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          // Untransformed canvas: the card's offset inside the node layer is the model point.
          const dx = (r.left - lr.left) - model[i].x;
          const dy = (r.top - lr.top) - model[i].y;
          if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
            problems.push(`${flow.id} node ${model[i].id}: at +${dx.toFixed(1)},${dy.toFixed(1)} off its model point`);
          }

          const header = card.querySelector('.flow__node-header') as HTMLElement | null;
          const body = card.querySelector('.flow__node-body') as HTMLElement | null;
          if (!header || !body) { problems.push(`${flow.id} node ${model[i].id}: missing header/body`); return; }
          const hr = header.getBoundingClientRect();
          const br = body.getBoundingClientRect();
          if (hr.top < r.top - 1) problems.push(`${flow.id} node ${model[i].id}: header above the card`);
          if (Math.abs(br.top - hr.bottom) > 1) {
            problems.push(`${flow.id} node ${model[i].id}: gap between header and body`);
          }
          if (br.bottom > r.bottom + 1) problems.push(`${flow.id} node ${model[i].id}: body overflows the card`);
          if (Math.abs(hr.width - br.width) > 1) {
            problems.push(`${flow.id} node ${model[i].id}: header/body widths differ`);
          }
          const label = header.querySelector('span');
          if (label) {
            const tr = label.getBoundingClientRect();
            if (tr.right > hr.right + 1 || tr.left < hr.left - 1) {
              problems.push(`${flow.id} node ${model[i].id}: label spills its header`);
            }
          }
          // The card must stay inside the clipped canvas viewport.
          const cr = canvas.getBoundingClientRect();
          if (r.left < cr.left - 1 || r.top < cr.top - 1) {
            problems.push(`${flow.id} node ${model[i].id}: starts outside the canvas`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('minimap is a small inset panel anchored inside the canvas', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-flow').forEach(flow => {
        const sr = (flow as HTMLElement).shadowRoot!;
        const canvas = sr.querySelector('.flow') as HTMLElement;
        const mini = sr.querySelector('.flow__minimap') as HTMLElement | null;
        const wanted = flow.getAttribute('minimap') !== 'false';
        const shown = !!mini && getComputedStyle(mini).display !== 'none';
        if (!wanted) {
          // The panel stays in the DOM behind display:none; it must not paint.
          if (shown) problems.push(`${flow.id}: minimap="false" still shows a minimap`);
          return;
        }
        if (!shown) { problems.push(`${flow.id}: minimap missing`); return; }
        const cr = canvas.getBoundingClientRect();
        const mr = mini.getBoundingClientRect();
        if (mr.width < 60 || mr.height < 40) {
          problems.push(`${flow.id}: minimap too small (${Math.round(mr.width)}x${Math.round(mr.height)})`);
        }
        if (mr.width > cr.width / 3 || mr.height > cr.height / 2) {
          problems.push(`${flow.id}: minimap too large (${Math.round(mr.width)}x${Math.round(mr.height)}`
            + ` in ${Math.round(cr.width)}x${Math.round(cr.height)})`);
        }
        if (mr.left < cr.left - 1 || mr.right > cr.right + 1
            || mr.top < cr.top - 1 || mr.bottom > cr.bottom + 1) {
          problems.push(`${flow.id}: minimap escapes the canvas`);
        }
        // Anchored to the bottom-right corner.
        if (cr.right - mr.right > 24 || cr.bottom - mr.bottom > 24) {
          problems.push(`${flow.id}: minimap not anchored bottom-right`
            + ` (insets ${Math.round(cr.right - mr.right)},${Math.round(cr.bottom - mr.bottom)})`);
        }
        const svg = mini.querySelector('svg') as SVGElement | null;
        if (svg) {
          const svgRect = svg.getBoundingClientRect();
          if (svgRect.width < mr.width - 6) problems.push(`${flow.id}: minimap svg does not fill the panel`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: a node whose model declares only outputs renders its output ports flush
  // against the LEFT edge of the node body (`.flow__node-body` is a flex row and
  // the lone `.flow__node-outputs` child lands at flex-start). Every "source"
  // node in the showcase therefore shows its outgoing dot on the wrong side, and
  // the edge drawn from it starts inside the node and runs back under the card.
  // Nodes that declare both inputs and outputs are correct.
  test.fixme('input ports hug the left edge and output ports the right edge', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-flow').forEach(flow => {
        const sr = (flow as HTMLElement).shadowRoot!;
        [...sr.querySelectorAll('.flow__node')].forEach(card => {
          const r = (card as HTMLElement).getBoundingClientRect();
          [...card.querySelectorAll('.flow__port')].forEach(port => {
            const dot = port.querySelector('.flow__port-dot') as HTMLElement | null;
            if (!dot) return;
            const dr = dot.getBoundingClientRect();
            const centre = dr.left + dr.width / 2;
            const isOutput = port.classList.contains('flow__port--output');
            const inset = isOutput ? r.right - centre : centre - r.left;
            if (inset > 32) {
              problems.push(`${flow.id} ${isOutput ? 'output' : 'input'} port`
                + ` sits ${Math.round(inset)}px from its edge`);
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `node.height` is honoured by the minimap and the edge/port maths
  // (`node.height || DEFAULT_NODE_HEIGHT`) but is never written to the rendered
  // card, which only gets `left/top/width`. In the "Custom Node Dimensions"
  // showcase all three nodes render 51px tall instead of 60/100/140, and the
  // minimap draws them at the declared heights — the two views disagree.
  // `min-width: 8.75rem` on .flow__node additionally clamps the 100px and 120px
  // nodes to the same 142px width.
  test.fixme('custom node width and height are applied to the rendered card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const flow = document.getElementById('f-dims') as any;
      const sr = flow.shadowRoot as ShadowRoot;
      const cards = [...sr.querySelectorAll('.flow__node')] as HTMLElement[];
      flow.nodes.forEach((n: any, i: number) => {
        const r = cards[i].getBoundingClientRect();
        if (n.width && Math.abs(r.width - n.width) > 2) {
          problems.push(`node ${n.id}: width ${Math.round(r.width)} != declared ${n.width}`);
        }
        if (n.height && Math.abs(r.height - n.height) > 2) {
          problems.push(`node ${n.id}: height ${Math.round(r.height)} != declared ${n.height}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
