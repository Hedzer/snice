import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/app-tiles/snice-app-tiles';
import type { SniceAppTilesElement, AppTile } from '../../components/app-tiles/snice-app-tiles.types';

const SAMPLE_TILES: AppTile[] = [
  { id: 'mail', name: 'Gmail', icon: '📧' },
  { id: 'cal', name: 'Calendar', icon: '📅' },
  { id: 'drive', name: 'Drive', icon: '📁' },
  { id: 'docs', name: 'Docs', icon: '📄' },
];

describe('snice-app-tiles', () => {
  let tiles: SniceAppTilesElement;

  afterEach(() => {
    if (tiles) {
      removeComponent(tiles as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render app-tiles element', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      expect(tiles).toBeTruthy();
      expect(tiles.tagName).toBe('SNICE-APP-TILES');
    });

    it('should have default properties', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      expect(tiles.tiles).toEqual([]);
      expect(tiles.columns).toBe(4);
      expect(tiles.size).toBe('md');
      expect(tiles.variant).toBe('grid');
    });

    it('should render tiles container', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      const container = queryShadow(tiles as HTMLElement, '.tiles');
      expect(container).toBeTruthy();
    });
  });

  describe('data rendering', () => {
    it('should render tiles from data', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      const tileButtons = queryShadowAll(tiles as HTMLElement, '.tile');
      expect(tileButtons.length).toBe(4);
    });

    it('should render tile names', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      const names = queryShadowAll(tiles as HTMLElement, '.tile__name');
      expect(names.length).toBe(4);
      expect(names[0].textContent).toBe('Gmail');
    });

    it('should update when tiles change', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      let tileButtons = queryShadowAll(tiles as HTMLElement, '.tile');
      expect(tileButtons.length).toBe(4);

      tiles.tiles = SAMPLE_TILES.slice(0, 2);
      await wait(50);

      tileButtons = queryShadowAll(tiles as HTMLElement, '.tile');
      expect(tileButtons.length).toBe(2);
    });
  });

  describe('tile icons', () => {
    it('should render emoji icons', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = [{ id: '1', name: 'Test', icon: '🎯' }];
      await wait(50);

      const icon = queryShadow(tiles as HTMLElement, '.tile__icon--emoji');
      expect(icon).toBeTruthy();
    });

    it('should render letter fallback when no icon', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = [{ id: '1', name: 'Test', icon: '' }];
      await wait(50);

      const icon = queryShadow(tiles as HTMLElement, '.tile__icon--text');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('T');
    });

    it('should render image icons', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = [{ id: '1', name: 'Test', icon: 'https://example.com/icon.png' }];
      await wait(50);

      const img = queryShadow(tiles as HTMLElement, '.tile__icon img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/icon.png');
    });
  });

  describe('events', () => {
    it('should emit tile-click on tile click', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      let clickEvent: CustomEvent | null = null;
      tiles.addEventListener('tile-click', (e) => {
        clickEvent = e as CustomEvent;
      });

      const tileBtn = queryShadow(tiles as HTMLElement, '.tile');
      tileBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickEvent).toBeTruthy();
      expect(clickEvent!.detail.tile.name).toBe('Gmail');
      expect(clickEvent!.detail.index).toBe(0);
    });
  });

  describe('variants', () => {
    it('should support list variant', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.variant = 'list';
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      const container = queryShadow(tiles as HTMLElement, '.tiles');
      expect(container?.classList.contains('tiles--list')).toBe(true);
    });

    it('should support compact variant', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.variant = 'compact';
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      const container = queryShadow(tiles as HTMLElement, '.tiles');
      expect(container?.classList.contains('tiles--compact')).toBe(true);
    });
  });

  describe('badges', () => {
    it('should render badge when tile has badge', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.tiles = [{ id: '1', name: 'Mail', icon: '📧', badge: '3' }];
      await wait(50);

      const badge = queryShadow(tiles as HTMLElement, 'snice-badge');
      expect(badge).toBeTruthy();
      expect(badge?.getAttribute('content')).toBe('3');
    });
  });

  describe('columns', () => {
    it('should set columns CSS variable', async () => {
      tiles = await createComponent<SniceAppTilesElement>('snice-app-tiles');
      tiles.columns = 3;
      tiles.tiles = SAMPLE_TILES;
      await wait(50);

      const container = queryShadow(tiles as HTMLElement, '.tiles') as HTMLElement;
      expect(container?.style.getPropertyValue('--tiles-columns')).toBe('3');
    });
  });
});
