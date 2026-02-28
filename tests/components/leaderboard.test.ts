import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/leaderboard/snice-leaderboard';
import '../../components/leaderboard/snice-leaderboard-entry';
import type { SniceLeaderboardElement, SniceLeaderboardEntryElement } from '../../components/leaderboard/snice-leaderboard.types';

describe('snice-leaderboard', () => {
  let leaderboard: SniceLeaderboardElement;

  afterEach(() => {
    if (leaderboard) {
      removeComponent(leaderboard as HTMLElement);
    }
  });

  it('should render leaderboard element', async () => {
    leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    expect(leaderboard).toBeTruthy();
    expect(leaderboard.shadowRoot).toBeTruthy();
  });

  it('should have default property values', async () => {
    leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    expect(leaderboard.variant).toBe('default');
    expect(leaderboard.size).toBe('medium');
    expect(leaderboard.title).toBe('');
  });

  it('should accept variant attribute', async () => {
    leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard', { variant: 'podium' });
    expect(leaderboard.variant).toBe('podium');
  });

  it('should accept size attribute', async () => {
    leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard', { size: 'large' });
    expect(leaderboard.size).toBe('large');
  });

  it('should show empty state when no entries', async () => {
    leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    await wait(50);

    const empty = leaderboard.shadowRoot!.querySelector('.leaderboard__empty');
    expect(empty).toBeTruthy();
    expect(empty!.textContent).toContain('No entries');
  });

  describe('setEntries() imperative API', () => {
    it('should render entries via setEntries()', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
        { rank: 2, name: 'Bob', score: 2100 },
        { rank: 3, name: 'Charlie', score: 1800 },
      ]);
      await wait(100);

      const entries = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(entries.length).toBe(3);
    });

    it('should display name and score', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
      ]);
      await wait(100);

      const name = leaderboard.shadowRoot!.querySelector('.leaderboard__name');
      expect(name!.textContent).toContain('Alice');

      const score = leaderboard.shadowRoot!.querySelector('.leaderboard__score');
      expect(score!.textContent).toContain('2500');
    });

    it('should render avatar image when provided', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500, avatar: 'alice.jpg' },
      ]);
      await wait(100);

      const avatar = leaderboard.shadowRoot!.querySelector('.leaderboard__avatar') as HTMLImageElement;
      expect(avatar).toBeTruthy();
      expect(avatar.src).toContain('alice.jpg');
    });

    it('should render avatar placeholder when no avatar', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
      ]);
      await wait(100);

      const placeholder = leaderboard.shadowRoot!.querySelector('.leaderboard__avatar-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder!.textContent).toContain('A');
    });

    it('should render change indicators', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500, change: 3 },
        { rank: 2, name: 'Bob', score: 2100, change: -2 },
      ]);
      await wait(100);

      const upChange = leaderboard.shadowRoot!.querySelector('.leaderboard__change--up');
      expect(upChange).toBeTruthy();

      const downChange = leaderboard.shadowRoot!.querySelector('.leaderboard__change--down');
      expect(downChange).toBeTruthy();
    });

    it('should render highlighted entries', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500, highlighted: true },
        { rank: 2, name: 'Bob', score: 2100 },
      ]);
      await wait(100);

      const highlighted = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry--highlighted');
      expect(highlighted.length).toBe(1);
    });

    it('should clear entries when setEntries is called with empty array', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
      ]);
      await wait(100);

      let entries = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(entries.length).toBe(1);

      leaderboard.setEntries([]);
      await wait(100);

      entries = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(entries.length).toBe(0);

      const empty = leaderboard.shadowRoot!.querySelector('.leaderboard__empty');
      expect(empty).toBeTruthy();
    });
  });

  describe('declarative child element usage', () => {
    it('should render from <snice-leaderboard-entry> children', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry1 = document.createElement('snice-leaderboard-entry');
      entry1.setAttribute('rank', '1');
      entry1.setAttribute('name', 'Alice');
      entry1.setAttribute('score', '2500');

      const entry2 = document.createElement('snice-leaderboard-entry');
      entry2.setAttribute('rank', '2');
      entry2.setAttribute('name', 'Bob');
      entry2.setAttribute('score', '2100');

      leaderboard.appendChild(entry1);
      leaderboard.appendChild(entry2);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      const rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(2);

      const name = leaderboard.shadowRoot!.querySelector('.leaderboard__name');
      expect(name!.textContent).toContain('Alice');
    });

    it('should read avatar attribute from children', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'Alice');
      entry.setAttribute('score', '2500');
      entry.setAttribute('avatar', 'alice.jpg');

      leaderboard.appendChild(entry);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      const avatar = leaderboard.shadowRoot!.querySelector('.leaderboard__avatar') as HTMLImageElement;
      expect(avatar).toBeTruthy();
      expect(avatar.src).toContain('alice.jpg');
    });

    it('should read highlighted attribute from children', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'Alice');
      entry.setAttribute('score', '2500');
      entry.setAttribute('highlighted', '');

      leaderboard.appendChild(entry);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      const highlighted = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry--highlighted');
      expect(highlighted.length).toBe(1);
    });

    it('should read change attribute from children', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'Alice');
      entry.setAttribute('score', '2500');
      entry.setAttribute('change', '3');

      leaderboard.appendChild(entry);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      const change = leaderboard.shadowRoot!.querySelector('.leaderboard__change--up');
      expect(change).toBeTruthy();
    });
  });

  describe('slot children take precedence', () => {
    it('should use slot children over setEntries()', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'SlotAlice');
      entry.setAttribute('score', '9999');

      leaderboard.appendChild(entry);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      // Now try to override with setEntries — should be ignored
      leaderboard.setEntries([
        { rank: 1, name: 'ImperativeBob', score: 1111 },
        { rank: 2, name: 'ImperativeCharlie', score: 2222 },
      ]);
      await wait(100);

      // Should still show slot data, not imperative
      const rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(1);

      const name = leaderboard.shadowRoot!.querySelector('.leaderboard__name');
      expect(name!.textContent).toContain('SlotAlice');
    });
  });

  describe('MutationObserver reacts to child changes', () => {
    it('should update when children are added', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(50);

      // Initially empty
      let rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(0);

      // Add a child
      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'DynamicAlice');
      entry.setAttribute('score', '5000');
      leaderboard.appendChild(entry);

      await wait(200);

      rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(1);

      const name = leaderboard.shadowRoot!.querySelector('.leaderboard__name');
      expect(name!.textContent).toContain('DynamicAlice');
    });

    it('should update when children are removed', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry1 = document.createElement('snice-leaderboard-entry');
      entry1.setAttribute('rank', '1');
      entry1.setAttribute('name', 'Alice');
      entry1.setAttribute('score', '2500');

      const entry2 = document.createElement('snice-leaderboard-entry');
      entry2.setAttribute('rank', '2');
      entry2.setAttribute('name', 'Bob');
      entry2.setAttribute('score', '2100');

      leaderboard.appendChild(entry1);
      leaderboard.appendChild(entry2);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      let rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(2);

      // Remove one child
      leaderboard.removeChild(entry2);
      await wait(200);

      rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(1);
    });

    it('should fall back to imperative mode when all children removed', async () => {
      leaderboard = document.createElement('snice-leaderboard') as SniceLeaderboardElement;

      const entry = document.createElement('snice-leaderboard-entry');
      entry.setAttribute('rank', '1');
      entry.setAttribute('name', 'Alice');
      entry.setAttribute('score', '2500');

      leaderboard.appendChild(entry);
      document.body.appendChild(leaderboard);

      await (leaderboard as any).ready;
      await wait(100);

      // Remove all children — should leave slot mode
      leaderboard.removeChild(entry);
      await wait(200);

      // Now setEntries should work
      leaderboard.setEntries([
        { rank: 1, name: 'ImperativeBob', score: 3000 },
      ]);
      await wait(100);

      const rendered = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(rendered.length).toBe(1);

      const name = leaderboard.shadowRoot!.querySelector('.leaderboard__name');
      expect(name!.textContent).toContain('ImperativeBob');
    });
  });

  describe('podium variant', () => {
    it('should render podium for top 3 entries', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard', { variant: 'podium' });
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
        { rank: 2, name: 'Bob', score: 2100 },
        { rank: 3, name: 'Charlie', score: 1800 },
        { rank: 4, name: 'Diana', score: 1500 },
      ]);
      await wait(100);

      const podium = leaderboard.shadowRoot!.querySelector('.leaderboard__podium');
      expect(podium).toBeTruthy();

      const podiumEntries = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__podium-entry');
      expect(podiumEntries.length).toBe(3);

      // 4th entry should be in the list, not the podium
      const listEntries = leaderboard.shadowRoot!.querySelectorAll('.leaderboard__entry');
      expect(listEntries.length).toBe(1);
    });
  });

  describe('entry-click event', () => {
    it('should dispatch entry-click event when entry is clicked', async () => {
      leaderboard = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
      await wait(50);

      leaderboard.setEntries([
        { rank: 1, name: 'Alice', score: 2500 },
      ]);
      await wait(100);

      let clickedEntry: any = null;
      leaderboard.addEventListener('entry-click', (e: Event) => {
        clickedEntry = (e as CustomEvent).detail;
      });

      const entry = leaderboard.shadowRoot!.querySelector('.leaderboard__entry') as HTMLElement;
      entry.click();
      await wait(50);

      expect(clickedEntry).toBeTruthy();
      expect(clickedEntry.entry.name).toBe('Alice');
      expect(clickedEntry.index).toBe(0);
    });
  });
});

describe('snice-leaderboard-entry', () => {
  let entry: SniceLeaderboardEntryElement;

  afterEach(() => {
    if (entry) {
      removeComponent(entry as HTMLElement);
    }
  });

  it('should register as custom element', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry).toBeTruthy();
  });

  it('should accept rank attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('rank', '5');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.rank).toBe(5);
  });

  it('should accept name attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('name', 'Alice');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.name).toBe('Alice');
  });

  it('should accept score attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('score', '2500');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.score).toBe('2500');
  });

  it('should accept highlighted boolean attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('highlighted', '');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.highlighted).toBe(true);
  });

  it('should accept change attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('change', '-3');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.change).toBe(-3);
  });

  it('should accept avatar attribute', async () => {
    entry = document.createElement('snice-leaderboard-entry') as SniceLeaderboardEntryElement;
    entry.setAttribute('avatar', 'test.jpg');
    document.body.appendChild(entry);
    await (entry as any).ready;
    expect(entry.avatar).toBe('test.jpg');
  });
});
