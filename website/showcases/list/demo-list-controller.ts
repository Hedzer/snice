import { controller, respond, IController } from '../../../packages/core/src/index.ts';

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

  @respond('list/search')
  async search(params: any) {
    const query = params.query.toLowerCase();
    const list = params.list;
    if (list.id === 'client-search-list') {
      const items = list.querySelectorAll('snice-list-item');
      let visibleCount = 0;
      items.forEach((item: HTMLElement) => {
        const isVisible = (item.textContent?.toLowerCase() || '').includes(query);
        item.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
      });
      list.noResults = visibleCount === 0 && query.length > 0;
      return { query };
    }

    if (list.id === 'server-search-list') {
      if (!query) {
        list.innerHTML = '<snice-list-item><span slot="before">🔍</span><div>Search results will appear here...</div></snice-list-item>';
        return { results: [] };
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const people = [
        { name: 'Alice Johnson', email: 'alice@example.com' },
        { name: 'Bob Smith', email: 'bob@example.com' },
        { name: 'Carol Williams', email: 'carol@example.com' }
      ];
      const results = people.filter(person => person.name.toLowerCase().includes(query) || person.email.includes(query));
      list.innerHTML = '';
      for (const person of results) {
        const item = document.createElement('snice-list-item');
        item.innerHTML = `<span slot="before">👤</span><div><div style="font-weight: 500">${person.name}</div><div>${person.email}</div></div>`;
        list.appendChild(item);
      }
      if (results.length === 0) list.innerHTML = '<snice-list-item><span slot="before">❌</span><div>No results found</div></snice-list-item>';
      return { results };
    }
    return { query };
  }
}
