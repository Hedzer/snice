import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/command-palette/snice-command-palette';
import type { SniceCommandPaletteElement, CommandItem } from '../../components/command-palette/snice-command-palette.types';

describe('snice-command-palette', () => {
  let palette: SniceCommandPaletteElement;

  const sampleCommands: CommandItem[] = [
    {
      id: 'cmd1',
      label: 'Command 1',
      description: 'First command',
      icon: '📄',
      category: 'File'
    },
    {
      id: 'cmd2',
      label: 'Command 2',
      description: 'Second command',
      icon: '📂',
      category: 'File'
    },
    {
      id: 'cmd3',
      label: 'Search',
      description: 'Search command',
      icon: '🔍',
      category: 'Edit'
    }
  ];

  afterEach(() => {
    if (palette) {
      removeComponent(palette as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render palette element', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      expect(palette).toBeTruthy();
    });

    it('should have default properties', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      expect(palette.open).toBe(false);
      expect(palette.commands.length).toBe(0);
      expect(palette.placeholder).toBe('Type a command or search...');
      expect(palette.maxResults).toBe(50);
    });

    it('should default to closed', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      expect(palette.open).toBe(false);
    });
  });

  describe('commands', () => {
    it('should accept commands array', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.commands = sampleCommands;
      await wait(50);
      expect(palette.commands.length).toBe(3);
    });

    it('should add command', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.commands = sampleCommands;
      await wait(50);
      palette.addCommand({ id: 'cmd4', label: 'Command 4' });
      await wait(50);
      expect(palette.commands.length).toBe(4);
    });

    it('should remove command', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.commands = sampleCommands;
      await wait(50);
      palette.removeCommand('cmd2');
      await wait(50);
      expect(palette.commands.length).toBe(2);
      expect(palette.commands.find(c => c.id === 'cmd2')).toBeFalsy();
    });
  });

  describe('open/close', () => {
    it('should open with show()', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.show();
      await wait(50);
      expect(palette.open).toBe(true);
    });

    it('should close with close()', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', { open: true });
      await wait(50);
      palette.close();
      await wait(50);
      expect(palette.open).toBe(false);
    });

    it('should toggle with toggle()', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.toggle();
      await wait(50);
      expect(palette.open).toBe(true);
      palette.toggle();
      await wait(50);
      expect(palette.open).toBe(false);
    });
  });

  describe('properties', () => {
    it('should support placeholder property', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', {
        placeholder: 'Search commands...'
      });
      expect(palette.placeholder).toBe('Search commands...');
    });

    it.skip('should support noResultsText property', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', {
        noResultsText: 'Nothing found'
      });
      expect(palette.noResultsText).toBe('Nothing found');
    });

    it.skip('should support maxResults property', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', {
        maxResults: 10
      });
      expect(palette.maxResults).toBe(10);
    });

    it('should support showRecentCommands property', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', {
        showRecentCommands: false
      });
      expect(palette.showRecentCommands).toBe(false);
    });

    it('should support caseSensitive property', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette', {
        caseSensitive: true
      });
      expect(palette.caseSensitive).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit @snice/command-palette-open event', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      let eventFired = false;
      palette.addEventListener('command-palette-open', () => {
        eventFired = true;
      });
      palette.show();
      await wait(50);
      expect(eventFired).toBe(true);
    });

    it('should emit @snice/command-palette-close event', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.open = true;
      await wait(50);

      let eventFired = false;
      palette.addEventListener('command-palette-close', () => {
        eventFired = true;
      });

      palette.close();
      await wait(50);
      expect(eventFired).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should clear search', async () => {
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.clearSearch();
      await wait(50);
      // Should not throw
      expect(true).toBe(true);
    });

    it.skip('should execute command by ID', async () => {
      let executed = false;
      palette = await createComponent<SniceCommandPaletteElement>('snice-command-palette');
      palette.commands = [
        {
          id: 'test',
          label: 'Test',
          action: () => { executed = true; }
        }
      ];
      await wait(50);
      palette.executeCommand('test');
      await wait(50);
      expect(executed).toBe(true);
    });
  });
});
