import { controller, respond, IController } from '/packages/core/src/index.ts';

@controller('demo-list-controller')
export class DemoListController implements IController {
  element: HTMLElement | null = null;
  private itemCount = 3;

  async attach(element: HTMLElement) { this.element = element; }
  async detach(_element: HTMLElement) {}

  @respond('list/load-more')
  async loadMore(params: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const list = params.list;
    for (let i = 0; i < 5; i++) {
      this.itemCount++;
      const item = document.createElement('snice-list-item');
      const before = document.createElement('span');
      before.slot = 'before';
      before.textContent = '📄';
      const content = document.createElement('div');
      content.textContent = `Item ${this.itemCount}`;
      item.append(before, content);
      list.appendChild(item);
    }
    return { success: true };
  }
}
