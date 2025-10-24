import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, css, styles } from '../src/index';

/**
 * Performance Benchmark Test Suite
 *
 * These tests measure render pipeline performance to establish baselines
 * for optimization work. When optimizing the render pipeline, run these
 * tests before and after to quantify improvements.
 *
 * Baseline measurements should be recorded and compared across optimization attempts.
 */

interface BenchmarkResult {
  name: string;
  duration: number;
  ops?: number;
  opsPerSecond?: number;
}

const benchmarkResults: BenchmarkResult[] = [];

function benchmark(name: string, fn: () => Promise<void> | void): Promise<number> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    benchmarkResults.push({ name, duration });
    resolve(duration);
  });
}

function benchmarkOps(name: string, ops: number, fn: () => Promise<void> | void): Promise<number> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    const opsPerSecond = (ops / duration) * 1000;
    benchmarkResults.push({ name, duration, ops, opsPerSecond });
    resolve(duration);
  });
}

describe('Render Performance Benchmarks', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    benchmarkResults.length = 0;
  });

  afterEach(() => {
    document.body.removeChild(container);

    // Output benchmark results
    if (benchmarkResults.length > 0) {
      console.log('\n=== Performance Benchmark Results ===');
      benchmarkResults.forEach(result => {
        const opsInfo = result.opsPerSecond
          ? ` (${result.ops} ops, ${result.opsPerSecond.toFixed(2)} ops/sec)`
          : '';
        console.log(`${result.name}: ${result.duration.toFixed(2)}ms${opsInfo}`);
      });
      console.log('=====================================\n');
    }
  });

  it('Baseline: Single element initial render', async () => {
    @element('bench-single')
    class BenchSingle extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Hello World</div>`;
      }
    }

    const duration = await benchmark('Single element initial render', async () => {
      const el = document.createElement('bench-single');
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(100); // Sanity check
  });

  it('Benchmark: Small element list (100 minimal elements)', async () => {
    @element('bench-small-item')
    class BenchSmallItem extends HTMLElement {
      @render()
      renderContent() {
        return html`<span>•</span>`;
      }
    }

    @element('bench-small-list')
    class BenchSmallList extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        const items = [];
        for (let i = 0; i < this.count; i++) {
          items.push(html`<bench-small-item></bench-small-item>`);
        }
        return html`<div>${items}</div>`;
      }
    }

    const duration = await benchmarkOps('Small element list 100 items', 100, async () => {
      const el = document.createElement('bench-small-list') as BenchSmallList;
      el.count = 100;
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(500);
  });

  it('Baseline: Simple property update re-render', async () => {
    @element('bench-update')
    class BenchUpdate extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        return html`<div>Count: ${this.count}</div>`;
      }
    }

    const el = document.createElement('bench-update') as BenchUpdate;
    container.appendChild(el);
    await (el as any).ready;

    const duration = await benchmark('Property update re-render', () => {
      el.count = 42;
      return new Promise(resolve => queueMicrotask(resolve));
    });

    expect(duration).toBeLessThan(50);
  });

  it('Benchmark: 100 rapid property updates (batching efficiency)', async () => {
    @element('bench-rapid')
    class BenchRapid extends HTMLElement {
      @property({ type: Number })
      value = 0;

      @render()
      renderContent() {
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('bench-rapid') as BenchRapid;
    container.appendChild(el);
    await (el as any).ready;

    const duration = await benchmarkOps('100 rapid property updates', 100, () => {
      for (let i = 0; i < 100; i++) {
        el.value = i;
      }
      return new Promise(resolve => queueMicrotask(resolve));
    });

    expect(duration).toBeLessThan(200);
  });

  it('Benchmark: Large list (1000 items) initial render', async () => {
    @element('bench-list-item')
    class BenchListItem extends HTMLElement {
      @property({ type: Number })
      index = 0;

      @render()
      renderContent() {
        return html`<div>Item ${this.index}</div>`;
      }
    }

    @element('bench-large-list')
    class BenchLargeList extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        const items = [];
        for (let i = 0; i < this.count; i++) {
          items.push(html`<bench-list-item .index=${i}></bench-list-item>`);
        }
        return html`<div>${items}</div>`;
      }
    }

    const duration = await benchmarkOps('Large list 1000 items render', 1000, async () => {
      const el = document.createElement('bench-large-list') as BenchLargeList;
      el.count = 1000;
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(5000);
  });

  it('Benchmark: Large list re-render (update all 1000 items)', async () => {
    @element('bench-rerender-item')
    class BenchRerenderItem extends HTMLElement {
      @property({ type: Number })
      value = 0;

      @render()
      renderContent() {
        return html`<div>${this.value}</div>`;
      }
    }

    @element('bench-rerender-list')
    class BenchRerenderList extends HTMLElement {
      @property({ type: Number })
      multiplier = 1;

      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        const items = [];
        for (let i = 0; i < this.count; i++) {
          items.push(html`<bench-rerender-item .value=${i * this.multiplier}></bench-rerender-item>`);
        }
        return html`<div>${items}</div>`;
      }
    }

    const el = document.createElement('bench-rerender-list') as BenchRerenderList;
    el.count = 1000;
    container.appendChild(el);
    await (el as any).ready;

    const duration = await benchmarkOps('Large list 1000 items re-render', 1000, () => {
      el.multiplier = 2;
      return new Promise(resolve => queueMicrotask(resolve));
    });

    expect(duration).toBeLessThan(5000);
  });

  it('Benchmark: Deep nesting (20 levels)', async () => {
    @element('bench-deep-leaf')
    class BenchDeepLeaf extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @render()
      renderContent() {
        return html`<div>Depth ${this.depth}</div>`;
      }
    }

    @element('bench-deep-node')
    class BenchDeepNode extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @property({ type: Number })
      maxDepth = 20;

      @render()
      renderContent() {
        if (this.depth >= this.maxDepth) {
          return html`<bench-deep-leaf .depth=${this.depth}></bench-deep-leaf>`;
        }
        return html`
          <bench-deep-node .depth=${this.depth + 1} .maxDepth=${this.maxDepth}></bench-deep-node>
        `;
      }
    }

    const duration = await benchmarkOps('Deep nesting 20 levels', 20, async () => {
      const el = document.createElement('bench-deep-node') as BenchDeepNode;
      el.maxDepth = 20;
      container.appendChild(el);
      await (el as any).ready;
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(duration).toBeLessThan(1000);
  });

  it('Benchmark: Wide tree (5 levels, 3 branches per level = 243 elements)', async () => {
    @element('bench-tree-leaf')
    class BenchTreeLeaf extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Leaf</div>`;
      }
    }

    @element('bench-tree-branch')
    class BenchTreeBranch extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @property({ type: Number })
      maxDepth = 5;

      @render()
      renderContent() {
        if (this.depth >= this.maxDepth) {
          return html`<bench-tree-leaf></bench-tree-leaf>`;
        }

        return html`
          <div>
            <bench-tree-branch .depth=${this.depth + 1} .maxDepth=${this.maxDepth}></bench-tree-branch>
            <bench-tree-branch .depth=${this.depth + 1} .maxDepth=${this.maxDepth}></bench-tree-branch>
            <bench-tree-branch .depth=${this.depth + 1} .maxDepth=${this.maxDepth}></bench-tree-branch>
          </div>
        `;
      }
    }

    const expectedElements = Math.pow(3, 5); // 243 elements
    const duration = await benchmarkOps(`Wide tree ${expectedElements} elements`, expectedElements, async () => {
      const el = document.createElement('bench-tree-branch') as BenchTreeBranch;
      el.maxDepth = 5;
      container.appendChild(el);
      await (el as any).ready;
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(duration).toBeLessThan(3000);
  });

  it('Benchmark: Complex template with interpolations (100 properties)', async () => {
    @element('bench-complex')
    class BenchComplex extends HTMLElement {
      @property({ type: Array })
      values: number[] = [];

      @render()
      renderContent() {
        return html`
          <div>
            ${this.values.map((val, idx) => html`
              <span class="item-${idx}">Value ${idx}: ${val} (${val * 2}, ${val * 3})</span>
            `)}
          </div>
        `;
      }
    }

    const values = Array.from({ length: 100 }, (_, i) => i);
    const duration = await benchmarkOps('Complex template 100 properties', 100, async () => {
      const el = document.createElement('bench-complex') as BenchComplex;
      el.values = values;
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(500);
  });

  it('Benchmark: Styled component (CSS processing)', async () => {
    const largeStyles = css`
      :host {
        display: block;
        font-family: system-ui;
      }
      .container { padding: 20px; }
      .header { font-size: 24px; font-weight: bold; }
      .content { margin: 10px 0; }
      .footer { border-top: 1px solid #ccc; }
      .btn { padding: 8px 16px; border-radius: 4px; }
      .btn-primary { background: blue; color: white; }
      .btn-secondary { background: gray; color: white; }
      .card { border: 1px solid #ddd; border-radius: 8px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
    `;

    @element('bench-styled')
    class BenchStyled extends HTMLElement {
      @styles()
      componentStyles() {
        return largeStyles;
      }

      @render()
      renderContent() {
        return html`
          <div class="container">
            <div class="header">Header</div>
            <div class="content">Content</div>
            <div class="footer">Footer</div>
          </div>
        `;
      }
    }

    const duration = await benchmark('Styled component CSS processing', async () => {
      const el = document.createElement('bench-styled');
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(100);
  });

  it('Benchmark: Conditional rendering toggle (100 iterations)', async () => {
    @element('bench-conditional')
    class BenchConditional extends HTMLElement {
      @property({ type: Boolean })
      show = false;

      @render()
      renderContent() {
        return html`
          <div>
            ${this.show ? html`
              <div class="content">
                <p>Line 1</p>
                <p>Line 2</p>
                <p>Line 3</p>
              </div>
            ` : html`
              <div class="placeholder">Hidden</div>
            `}
          </div>
        `;
      }
    }

    const el = document.createElement('bench-conditional') as BenchConditional;
    container.appendChild(el);
    await (el as any).ready;

    const duration = await benchmarkOps('Conditional rendering toggle 100x', 100, async () => {
      for (let i = 0; i < 100; i++) {
        el.show = !el.show;
        await new Promise(resolve => queueMicrotask(resolve));
      }
    });

    expect(duration).toBeLessThan(1000);
  });

  it('Benchmark: Array manipulation (add/remove items)', async () => {
    @element('bench-array-item')
    class BenchArrayItem extends HTMLElement {
      @property()
      label = '';

      @render()
      renderContent() {
        return html`<div>${this.label}</div>`;
      }
    }

    @element('bench-array-list')
    class BenchArrayList extends HTMLElement {
      @property({ type: Array })
      items: string[] = [];

      @render()
      renderContent() {
        return html`
          <div>
            ${this.items.map(item => html`
              <bench-array-item .label=${item}></bench-array-item>
            `)}
          </div>
        `;
      }
    }

    const el = document.createElement('bench-array-list') as BenchArrayList;
    el.items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
    container.appendChild(el);
    await (el as any).ready;

    const duration = await benchmarkOps('Array manipulation 50 ops', 50, async () => {
      // Remove first 10
      el.items = el.items.slice(10);
      await new Promise(resolve => queueMicrotask(resolve));

      // Add 20 at end
      el.items = [...el.items, ...Array.from({ length: 20 }, (_, i) => `New ${i}`)];
      await new Promise(resolve => queueMicrotask(resolve));

      // Remove last 10
      el.items = el.items.slice(0, -10);
      await new Promise(resolve => queueMicrotask(resolve));
    });

    expect(duration).toBeLessThan(500);
  });

  it('Benchmark: Event handler registration (1000 handlers)', async () => {
    @element('bench-events')
    class BenchEvents extends HTMLElement {
      @property({ type: Number })
      count = 0;

      handleClick(index: number) {
        // Handler
      }

      @render()
      renderContent() {
        const buttons = [];
        for (let i = 0; i < this.count; i++) {
          buttons.push(html`
            <button @click=${() => this.handleClick(i)}>Button ${i}</button>
          `);
        }
        return html`<div>${buttons}</div>`;
      }
    }

    const duration = await benchmarkOps('Event handler registration 1000', 1000, async () => {
      const el = document.createElement('bench-events') as BenchEvents;
      el.count = 1000;
      container.appendChild(el);
      await (el as any).ready;
    });

    expect(duration).toBeLessThan(2000);
  });

  it('Benchmark: Property binding update cascade (10 levels deep)', async () => {
    @element('bench-cascade-child')
    class BenchCascadeChild extends HTMLElement {
      @property({ type: Number })
      value = 0;

      @property({ type: Number })
      level = 0;

      @property({ type: Number })
      maxLevel = 10;

      @render()
      renderContent() {
        if (this.level >= this.maxLevel) {
          return html`<div>Final: ${this.value}</div>`;
        }
        return html`
          <bench-cascade-child
            .value=${this.value * 2}
            .level=${this.level + 1}
            .maxLevel=${this.maxLevel}
          ></bench-cascade-child>
        `;
      }
    }

    const el = document.createElement('bench-cascade-child') as BenchCascadeChild;
    el.maxLevel = 10;
    container.appendChild(el);
    await (el as any).ready;
    await new Promise(resolve => setTimeout(resolve, 100));

    const duration = await benchmark('Property binding cascade 10 levels', () => {
      el.value = 1;
      return new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(duration).toBeLessThan(300);
  });

  it('Memory: Element creation and cleanup (stress test)', async () => {
    @element('bench-memory')
    class BenchMemory extends HTMLElement {
      @property({ type: Number })
      id = 0;

      @render()
      renderContent() {
        return html`<div>Element ${this.id}</div>`;
      }
    }

    const iterations = 100;
    const duration = await benchmarkOps('Create and destroy 100 elements', iterations, async () => {
      for (let i = 0; i < iterations; i++) {
        const el = document.createElement('bench-memory') as BenchMemory;
        el.id = i;
        container.appendChild(el);
        await (el as any).ready;
        container.removeChild(el);
      }
    });

    expect(duration).toBeLessThan(2000);
  });
});
