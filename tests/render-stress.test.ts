import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html, controller, css, styles } from '../src/index';

describe('@render decorator - stress tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle deeply nested custom elements (10 levels)', async () => {
    @element('stress-leaf')
    class StressLeaf extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @render()
      renderContent() {
        return html`<div class="leaf">Depth: ${this.depth}</div>`;
      }
    }

    @element('stress-node')
    class StressNode extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @property({ type: Number })
      maxDepth = 10;

      @render()
      renderContent() {
        if (this.depth >= this.maxDepth) {
          return html`<stress-leaf .depth=${this.depth}></stress-leaf>`;
        }
        return html`
          <div class="node">
            <span>Depth: ${this.depth}</span>
            <stress-node .depth=${this.depth + 1} .maxDepth=${this.maxDepth}></stress-node>
          </div>
        `;
      }
    }

    const el = document.createElement('stress-node') as StressNode;
    el.maxDepth = 10;
    container.appendChild(el);
    await el.ready;

    // Find deepest element
    let current: any = el;
    for (let i = 0; i < 10; i++) {
      await current.ready;
      const next = current.shadowRoot?.querySelector('stress-node, stress-leaf');
      if (!next) break;
      current = next;
    }

    expect(current.depth).toBe(10);
  });

  it('should handle many sibling custom elements (100 elements)', async () => {
    @element('stress-item')
    class StressItem extends HTMLElement {
      @property({ type: Number })
      index = 0;

      @render()
      renderContent() {
        return html`<div class="item">Item ${this.index}</div>`;
      }
    }

    @element('stress-list')
    class StressList extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        const items = [];
        for (let i = 0; i < this.count; i++) {
          items.push(html`<stress-item .index=${i}></stress-item>`);
        }
        return html`<div class="list">${items}</div>`;
      }
    }

    const el = document.createElement('stress-list') as StressList;
    el.count = 100;
    container.appendChild(el);
    await el.ready;

    const items = el.shadowRoot?.querySelectorAll('stress-item');
    expect(items?.length).toBe(100);

    // Wait for all items to be ready
    const readyPromises = Array.from(items || []).map((item: any) => item.ready);
    await Promise.all(readyPromises);

    // Check random items
    const firstItem = items?.[0] as any;
    const middleItem = items?.[50] as any;
    const lastItem = items?.[99] as any;

    expect(firstItem?.index).toBe(0);
    expect(middleItem?.index).toBe(50);
    expect(lastItem?.index).toBe(99);
  });

  it('should handle complex tree of nested custom elements', async () => {
    @element('tree-leaf')
    class TreeLeaf extends HTMLElement {
      @property()
      value = '';

      @render()
      renderContent() {
        return html`<div class="leaf">${this.value}</div>`;
      }
    }

    @element('tree-branch')
    class TreeBranch extends HTMLElement {
      @property({ type: Number })
      depth = 0;

      @property({ type: Number })
      branchFactor = 3;

      @property({ type: Number })
      maxDepth = 3;

      @render()
      renderContent() {
        if (this.depth >= this.maxDepth) {
          return html`<tree-leaf .value=${'Leaf at depth ' + this.depth}></tree-leaf>`;
        }

        const branches = [];
        for (let i = 0; i < this.branchFactor; i++) {
          branches.push(html`
            <tree-branch
              .depth=${this.depth + 1}
              .branchFactor=${this.branchFactor}
              .maxDepth=${this.maxDepth}
            ></tree-branch>
          `);
        }

        return html`
          <div class="branch">
            <div class="label">Branch at depth ${this.depth}</div>
            <div class="children">${branches}</div>
          </div>
        `;
      }
    }

    const el = document.createElement('tree-branch') as TreeBranch;
    el.depth = 0;
    el.branchFactor = 3;
    el.maxDepth = 3;
    container.appendChild(el);
    await el.ready;

    // Calculate expected leaf count: 3^3 = 27 leaves
    const expectedLeaves = Math.pow(3, 3);

    // Wait a bit for all nested elements to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Count all leaves in the tree
    const countLeaves = (root: Element): number => {
      let count = 0;
      const leaves = root.shadowRoot?.querySelectorAll('tree-leaf');
      count += leaves?.length || 0;

      const branches = root.shadowRoot?.querySelectorAll('tree-branch');
      branches?.forEach((branch) => {
        count += countLeaves(branch);
      });

      return count;
    };

    const leafCount = countLeaves(el);
    expect(leafCount).toBe(expectedLeaves);
  });

  it('should update nested custom elements reactively', async () => {
    @element('reactive-child')
    class ReactiveChild extends HTMLElement {
      @property()
      message = '';

      @render()
      renderContent() {
        return html`<div class="message">${this.message}</div>`;
      }
    }

    @element('reactive-parent')
    class ReactiveParent extends HTMLElement {
      @property()
      sharedMessage = 'initial';

      @render()
      renderContent() {
        return html`
          <div>
            <reactive-child .message=${this.sharedMessage + ' - Child 1'}></reactive-child>
            <reactive-child .message=${this.sharedMessage + ' - Child 2'}></reactive-child>
            <reactive-child .message=${this.sharedMessage + ' - Child 3'}></reactive-child>
          </div>
        `;
      }
    }

    const el = document.createElement('reactive-parent') as ReactiveParent;
    container.appendChild(el);
    await el.ready;

    const children = el.shadowRoot?.querySelectorAll('reactive-child');
    expect(children?.length).toBe(3);

    // Wait for all children to be ready
    await Promise.all(Array.from(children || []).map((child: any) => child.ready));

    // Check initial messages
    expect((children?.[0] as any)?.message).toBe('initial - Child 1');
    expect((children?.[1] as any)?.message).toBe('initial - Child 2');
    expect((children?.[2] as any)?.message).toBe('initial - Child 3');

    // Update parent - should propagate to all children
    el.sharedMessage = 'updated';
    await new Promise(resolve => queueMicrotask(resolve));

    expect((children?.[0] as any)?.message).toBe('updated - Child 1');
    expect((children?.[1] as any)?.message).toBe('updated - Child 2');
    expect((children?.[2] as any)?.message).toBe('updated - Child 3');
  });

  it('should handle controllers with nested elements', async () => {
    const controllerMounted = vi.fn();
    const controllerUnmounted = vi.fn();

    @controller('stress-controller')
    class StressController {
      host: HTMLElement;

      constructor(host: HTMLElement) {
        this.host = host;
      }

      attach() {
        controllerMounted();
      }

      detach() {
        controllerUnmounted();
      }
    }

    @element('controlled-child')
    class ControlledChild extends HTMLElement {
      @property()
      value = '';

      @render()
      renderContent() {
        return html`<div>${this.value}</div>`;
      }
    }

    @element('controlled-parent')
    class ControlledParent extends HTMLElement {
      @property({ type: Number })
      childCount = 0;

      @render()
      renderContent() {
        const children = [];
        for (let i = 0; i < this.childCount; i++) {
          children.push(html`<controlled-child .value=${'Child ' + i}></controlled-child>`);
        }
        return html`<div>${children}</div>`;
      }
    }

    const el = document.createElement('controlled-parent') as ControlledParent;
    el.setAttribute('controller', 'stress-controller');
    el.childCount = 5;
    container.appendChild(el);
    await el.ready;

    expect(controllerMounted).toHaveBeenCalledTimes(1);

    const children = el.shadowRoot?.querySelectorAll('controlled-child');
    expect(children?.length).toBe(5);

    // Remove element
    container.removeChild(el);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(controllerUnmounted).toHaveBeenCalledTimes(1);
  });

  it('should handle styles with nested elements', async () => {
    @element('styled-child')
    class StyledChild extends HTMLElement {
      @styles()
      componentStyles() {
        return css`
          :host {
            display: block;
            padding: 10px;
            background: lightblue;
          }
        `;
      }

      @render()
      renderContent() {
        return html`<div>Styled Child</div>`;
      }
    }

    @element('styled-parent')
    class StyledParent extends HTMLElement {
      @styles()
      componentStyles() {
        return css`
          :host {
            display: block;
            background: lightgray;
          }
        `;
      }

      @render()
      renderContent() {
        return html`
          <div>
            <styled-child></styled-child>
            <styled-child></styled-child>
          </div>
        `;
      }
    }

    const el = document.createElement('styled-parent') as StyledParent;
    container.appendChild(el);
    await el.ready;

    // Check that parent has styles
    const parentStyles = el.shadowRoot?.adoptedStyleSheets ||
                        el.shadowRoot?.querySelector('style');
    expect(parentStyles).toBeTruthy();

    // Check that children have styles
    const children = el.shadowRoot?.querySelectorAll('styled-child');
    expect(children?.length).toBe(2);

    await Promise.all(Array.from(children || []).map((child: any) => child.ready));

    const child1Styles = (children?.[0] as any).shadowRoot?.adoptedStyleSheets ||
                         (children?.[0] as any).shadowRoot?.querySelector('style');
    expect(child1Styles).toBeTruthy();
  });

  it('should handle rapid property updates on nested elements', async () => {
    @element('rapid-child')
    class RapidChild extends HTMLElement {
      @property({ type: Number })
      count = 0;

      @render()
      renderContent() {
        return html`<div class="count">${this.count}</div>`;
      }
    }

    @element('rapid-parent')
    class RapidParent extends HTMLElement {
      @property({ type: Number })
      value = 0;

      @render()
      renderContent() {
        return html`
          <div>
            <rapid-child .count=${this.value}></rapid-child>
            <rapid-child .count=${this.value * 2}></rapid-child>
            <rapid-child .count=${this.value * 3}></rapid-child>
          </div>
        `;
      }
    }

    const el = document.createElement('rapid-parent') as RapidParent;
    container.appendChild(el);
    await el.ready;

    const children = el.shadowRoot?.querySelectorAll('rapid-child');
    await Promise.all(Array.from(children || []).map((child: any) => child.ready));

    // Rapidly update value
    for (let i = 0; i < 50; i++) {
      el.value = i;
    }

    // Wait for batched updates
    await new Promise(resolve => queueMicrotask(resolve));

    expect((children?.[0] as any)?.count).toBe(49);
    expect((children?.[1] as any)?.count).toBe(98);
    expect((children?.[2] as any)?.count).toBe(147);
  });

  it('should handle conditional rendering of nested elements', async () => {
    @element('conditional-child')
    class ConditionalChild extends HTMLElement {
      @property()
      type = '';

      @render()
      renderContent() {
        return html`<div class="type">${this.type}</div>`;
      }
    }

    @element('conditional-parent')
    class ConditionalParent extends HTMLElement {
      @property({ type: Boolean })
      showA = true;

      @property({ type: Boolean })
      showB = false;

      @render()
      renderContent() {
        return html`
          <div>
            ${this.showA ? html`<conditional-child .type=${'A'}></conditional-child>` : ''}
            ${this.showB ? html`<conditional-child .type=${'B'}></conditional-child>` : ''}
          </div>
        `;
      }
    }

    const el = document.createElement('conditional-parent') as ConditionalParent;
    container.appendChild(el);
    await el.ready;

    let children = el.shadowRoot?.querySelectorAll('conditional-child');
    expect(children?.length).toBe(1);

    await (children?.[0] as any)?.ready;
    expect((children?.[0] as any)?.type).toBe('A');

    // Toggle visibility
    el.showA = false;
    el.showB = true;
    await new Promise(resolve => queueMicrotask(resolve));

    children = el.shadowRoot?.querySelectorAll('conditional-child');
    expect(children?.length).toBe(1);

    await (children?.[0] as any)?.ready;
    expect((children?.[0] as any)?.type).toBe('B');

    // Show both
    el.showA = true;
    el.showB = true;
    await new Promise(resolve => queueMicrotask(resolve));

    children = el.shadowRoot?.querySelectorAll('conditional-child');
    expect(children?.length).toBe(2);
  });

  it('should handle array rendering with nested elements', async () => {
    @element('array-item')
    class ArrayItem extends HTMLElement {
      @property()
      label = '';

      @property({ type: Number })
      value = 0;

      @render()
      renderContent() {
        return html`<div>${this.label}: ${this.value}</div>`;
      }
    }

    @element('array-parent')
    class ArrayParent extends HTMLElement {
      @property({ type: Array })
      items: Array<{ label: string; value: number }> = [];

      @render()
      renderContent() {
        return html`
          <div class="items">
            ${this.items.map(item => html`
              <array-item .label=${item.label} .value=${item.value}></array-item>
            `)}
          </div>
        `;
      }
    }

    const el = document.createElement('array-parent') as ArrayParent;
    el.items = [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
      { label: 'C', value: 3 }
    ];
    container.appendChild(el);
    await el.ready;

    let children = el.shadowRoot?.querySelectorAll('array-item');
    expect(children?.length).toBe(3);

    // Update array
    el.items = [
      { label: 'X', value: 10 },
      { label: 'Y', value: 20 }
    ];
    await new Promise(resolve => queueMicrotask(resolve));

    children = el.shadowRoot?.querySelectorAll('array-item');
    expect(children?.length).toBe(2);

    await Promise.all(Array.from(children || []).map((child: any) => child.ready));

    expect((children?.[0] as any)?.label).toBe('X');
    expect((children?.[0] as any)?.value).toBe(10);
    expect((children?.[1] as any)?.label).toBe('Y');
    expect((children?.[1] as any)?.value).toBe(20);
  });

  it('should handle events within nested custom elements', async () => {
    const parentClickHandler = vi.fn();
    const childClickHandler = vi.fn();

    @element('event-child')
    class EventChild extends HTMLElement {
      @render()
      renderContent() {
        return html`<button @click=${this.handleClick}>Child Button</button>`;
      }

      handleClick(e: Event) {
        childClickHandler(e);
      }
    }

    @element('event-parent')
    class EventParent extends HTMLElement {
      @render()
      renderContent() {
        return html`
          <div>
            <button @click=${this.handleClick}>Parent Button</button>
            <event-child></event-child>
          </div>
        `;
      }

      handleClick(e: Event) {
        parentClickHandler(e);
      }
    }

    const el = document.createElement('event-parent') as EventParent;
    container.appendChild(el);
    await el.ready;

    const child = el.shadowRoot?.querySelector('event-child') as any;
    await child?.ready;

    // Click child button - should trigger child handler only
    const childButton = child?.shadowRoot?.querySelector('button');
    childButton?.click();
    expect(childClickHandler).toHaveBeenCalledTimes(1);
    expect(parentClickHandler).toHaveBeenCalledTimes(0);

    // Click parent button - should trigger parent handler
    const parentButton = el.shadowRoot?.querySelector('button');
    parentButton?.click();
    expect(parentClickHandler).toHaveBeenCalledTimes(1);
    expect(childClickHandler).toHaveBeenCalledTimes(1); // Still just once from before
  });
});
