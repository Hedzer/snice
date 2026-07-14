import { controller, respond, IController } from '../../src/index.ts';

@controller('demo-list-controller')
export class DemoListController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach(_element: HTMLElement) {
  }

  private itemCount = 3;

  @respond('list/load-more')
  async loadMore(params: any) {
    // Simulate server delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const list = params.list;

    // Add more items
    for (let i = 0; i < 5; i++) {
      this.itemCount++;
      const item = document.createElement('snice-list-item');
      const before = document.createElement('span');
      before.slot = 'before';
      before.textContent = '📄';
      const content = document.createElement('div');
      content.textContent = `Item ${this.itemCount}`;
      item.appendChild(before);
      item.appendChild(content);
      list.appendChild(item);
    }

    return { success: true };
  }

  @respond('list/search')
  async search(params: any) {
    const query = params.query.toLowerCase();
    const list = params.list;

    // Check if this is client-side or server-side search by ID
    if (list.id === 'client-search-list') {
      // Client-side search - hide/show items
      const items = list.querySelectorAll('snice-list-item');
      let visibleCount = 0;
      items.forEach((item: HTMLElement) => {
        const text = item.textContent?.toLowerCase() || '';
        const isVisible = text.includes(query);
        item.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
      });

      // Update no-results state on the element
      list.noResults = visibleCount === 0 && query.length > 0;

      return { query };
    } else if (list.id === 'server-search-list') {
      // Server-side search - replace items
      if (!query) {
        list.innerHTML = `
          <snice-list-item>
            <span slot="before">🔍</span>
            <div>Search results will appear here...</div>
          </snice-list-item>
        `;
        return { results: [] };
      }

      // Simulate server search
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock search results
      const allPeople = [
        { name: 'Alice Johnson', email: 'alice@example.com' },
        { name: 'Bob Smith', email: 'bob@example.com' },
        { name: 'Carol Williams', email: 'carol@example.com' }
      ];

      const results = allPeople.filter(person =>
        person.name.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query)
      );

      list.innerHTML = '';

      if (results.length === 0) {
        const item = document.createElement('snice-list-item');
        const before = document.createElement('span');
        before.slot = 'before';
        before.textContent = '❌';
        const content = document.createElement('div');
        content.textContent = 'No results found';
        item.appendChild(before);
        item.appendChild(content);
        list.appendChild(item);
      } else {
        results.forEach(person => {
          const item = document.createElement('snice-list-item');
          const before = document.createElement('span');
          before.slot = 'before';
          before.textContent = '👤';
          const content = document.createElement('div');
          content.innerHTML = `
            <div style="font-weight: 500;">${person.name}</div>
            <div style="font-size: 0.875rem; color: #6b7280;">${person.email}</div>
          `;
          item.appendChild(before);
          item.appendChild(content);
          list.appendChild(item);
        });
      }

      return { results };
    }

    return { query };
  }
}
