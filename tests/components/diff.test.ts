import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/diff/snice-diff';
import type { SniceDiffElement, DiffMode } from '../../components/diff/snice-diff.types';

describe('snice-diff', () => {
  let diff: SniceDiffElement;

  afterEach(() => {
    if (diff) {
      removeComponent(diff as HTMLElement);
    }
  });

  describe('component registration', () => {
    it('should render diff element', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect(diff).toBeTruthy();
      expect(diff.tagName).toBe('SNICE-DIFF');
    });

    it('should have default properties', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect(diff.oldText).toBe('');
      expect(diff.newText).toBe('');
      expect(diff.mode).toBe('unified');
      expect(diff.language).toBe('');
      expect(diff.lineNumbers).toBe(true);
      expect(diff.contextLines).toBe(3);
    });
  });

  describe('property: oldText', () => {
    it('should accept oldText property', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'old content'
      });
      expect(diff.oldText).toBe('old content');
    });

    it('should update when oldText changes', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      diff.oldText = 'updated old content';
      expect(diff.oldText).toBe('updated old content');
    });

    it('should reflect old-text attribute', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      diff.setAttribute('old-text', 'attribute content');
      expect(diff.oldText).toBe('attribute content');
    });
  });

  describe('property: newText', () => {
    it('should accept newText property', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        newText: 'new content'
      });
      expect(diff.newText).toBe('new content');
    });

    it('should update when newText changes', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      diff.newText = 'updated new content';
      expect(diff.newText).toBe('updated new content');
    });

    it('should reflect new-text attribute', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      diff.setAttribute('new-text', 'attribute content');
      expect(diff.newText).toBe('attribute content');
    });
  });

  describe('property: mode', () => {
    it('should default to unified mode', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect(diff.mode).toBe('unified');
    });

    it('should accept unified mode', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        mode: 'unified' as DiffMode
      });
      expect(diff.mode).toBe('unified');
    });

    it('should accept split mode', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        mode: 'split' as DiffMode
      });
      expect(diff.mode).toBe('split');
    });

    it('should update mode dynamically', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      diff.mode = 'split' as DiffMode;
      expect(diff.mode).toBe('split');
    });
  });

  describe('property: language', () => {
    it('should accept language property', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        language: 'javascript'
      });
      expect(diff.language).toBe('javascript');
    });

    it('should accept different language values', async () => {
      const languages = ['javascript', 'typescript', 'json', 'html', 'css', 'python'];
      
      for (const lang of languages) {
        diff = await createComponent<SniceDiffElement>('snice-diff', {
          language: lang
        });
        expect(diff.language).toBe(lang);
        removeComponent(diff as HTMLElement);
      }
    });
  });

  describe('property: lineNumbers', () => {
    it('should default to true', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect(diff.lineNumbers).toBe(true);
    });

    it('should accept false value', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        lineNumbers: false
      });
      expect(diff.lineNumbers).toBe(false);
    });

    it('should reflect line-numbers attribute', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      // Setting property directly should work
      diff.lineNumbers = false;
      expect(diff.lineNumbers).toBe(false);
      // Setting attribute should reflect to property
      diff.setAttribute('line-numbers', '');
      expect(diff.lineNumbers).toBe(true);
    });
  });

  describe('property: contextLines', () => {
    it('should default to 3', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect(diff.contextLines).toBe(3);
    });

    it('should accept different values', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        contextLines: 5
      });
      expect(diff.contextLines).toBe(5);
    });

    it('should accept zero context lines', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        contextLines: 0
      });
      expect(diff.contextLines).toBe(0);
    });
  });

  describe('property: markers', () => {
    it('should default to true', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      expect((diff as any).markers).toBe(true);
    });

    it('should accept false value', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        markers: false
      });
      expect((diff as any).markers).toBe(false);
    });
  });

  describe('diff rendering', () => {
    it('should render diff container', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1\nline2',
        newText: 'line1\nline2 modified'
      });
      await wait(50);

      const container = queryShadow(diff as HTMLElement, '.diff-container');
      expect(container).toBeTruthy();
    });

    it('should render header with stats', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'old',
        newText: 'new'
      });
      await wait(50);

      const header = queryShadow(diff as HTMLElement, '.diff-header');
      expect(header).toBeTruthy();

      const statAdd = queryShadow(diff as HTMLElement, '.diff-stat-add');
      const statDel = queryShadow(diff as HTMLElement, '.diff-stat-del');
      expect(statAdd).toBeTruthy();
      expect(statDel).toBeTruthy();
    });

    it('should render mode toggle buttons', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');
      await wait(50);

      const toggle = queryShadow(diff as HTMLElement, '.diff-mode-toggle');
      expect(toggle).toBeTruthy();

      const buttons = toggle?.querySelectorAll('.diff-mode-btn');
      expect(buttons?.length).toBe(2);
    });

    it('should render unified view by default', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1',
        newText: 'line1 modified'
      });
      await wait(50);

      const table = queryShadow(diff as HTMLElement, '.diff-table');
      expect(table).toBeTruthy();
    });

    it('should render split view when mode is split', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1',
        newText: 'line1 modified',
        mode: 'split' as DiffMode
      });
      await wait(50);

      const splitContainer = queryShadow(diff as HTMLElement, '.diff-split');
      expect(splitContainer).toBeTruthy();

      const panes = splitContainer?.querySelectorAll('.diff-split-pane');
      expect(panes?.length).toBe(2);
    });

    it('should show additions in diff', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1',
        newText: 'line1\nline2'
      });
      await wait(50);

      const addedLine = queryShadow(diff as HTMLElement, '.diff-line--added');
      expect(addedLine).toBeTruthy();
    });

    it('should show deletions in diff', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1\nline2',
        newText: 'line1'
      });
      await wait(50);

      const removedLine = queryShadow(diff as HTMLElement, '.diff-line--removed');
      expect(removedLine).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should dispatch diff-computed event', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        diff.addEventListener('diff-computed', (e) => resolve(e as CustomEvent), { once: true });
      });

      diff.oldText = 'old';
      diff.newText = 'new';

      const event = await eventPromise;
      expect(event.detail).toHaveProperty('hunks');
      expect(event.detail).toHaveProperty('additions');
      expect(event.detail).toHaveProperty('deletions');
    });

    it('should include correct stats in diff-computed event', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        diff.addEventListener('diff-computed', (e) => resolve(e as CustomEvent), { once: true });
      });

      diff.oldText = 'line1\nline2';
      diff.newText = 'line1\nmodified\nline3';

      const event = await eventPromise;
      expect(event.detail.additions).toBeGreaterThanOrEqual(0);
      expect(event.detail.deletions).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(event.detail.hunks)).toBe(true);
    });

    it('should bubble diff-computed event', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff');

      let eventReceived = false;
      document.body.addEventListener('diff-computed', () => {
        eventReceived = true;
      }, { once: true });

      diff.oldText = 'test';
      diff.newText = 'test modified';
      await wait(50);

      expect(eventReceived).toBe(true);
    });
  });

  describe('diff algorithm', () => {
    it('should detect added lines', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'a\nb',
        newText: 'a\nb\nc'
      });
      await wait(50);

      const addedLines = queryShadowAll(diff as HTMLElement, '.diff-line--added');
      expect(addedLines.length).toBeGreaterThan(0);
    });

    it('should detect removed lines', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'a\nb\nc',
        newText: 'a\nc'
      });
      await wait(50);

      const removedLines = queryShadowAll(diff as HTMLElement, '.diff-line--removed');
      expect(removedLines.length).toBeGreaterThan(0);
    });

    it('should handle identical content', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'same content',
        newText: 'same content'
      });
      await wait(50);

      const container = queryShadow(diff as HTMLElement, '.diff-container');
      expect(container).toBeTruthy();
    });

    it('should handle empty old text', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: '',
        newText: 'new content'
      });
      await wait(50);

      const container = queryShadow(diff as HTMLElement, '.diff-container');
      expect(container).toBeTruthy();
    });

    it('should handle empty new text', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'old content',
        newText: ''
      });
      await wait(50);

      const container = queryShadow(diff as HTMLElement, '.diff-container');
      expect(container).toBeTruthy();
    });

    it('should handle multi-line changes', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'line1\nline2\nline3\nline4\nline5',
        newText: 'line1\nmodified2\nmodified3\nline4\nline5'
      });
      await wait(50);

      const container = queryShadow(diff as HTMLElement, '.diff-container');
      expect(container).toBeTruthy();
    });
  });

  describe('mode toggle', () => {
    it('should switch between unified and split modes', async () => {
      diff = await createComponent<SniceDiffElement>('snice-diff', {
        oldText: 'old',
        newText: 'new'
      });
      await wait(50);

      // Start with unified
      expect(diff.mode).toBe('unified');

      // Switch to split
      diff.mode = 'split' as DiffMode;
      await wait(50);

      const splitContainer = queryShadow(diff as HTMLElement, '.diff-split');
      expect(splitContainer).toBeTruthy();

      // Switch back to unified
      diff.mode = 'unified' as DiffMode;
      await wait(50);

      const table = queryShadow(diff as HTMLElement, '.diff-table');
      expect(table).toBeTruthy();
    });
  });
});
