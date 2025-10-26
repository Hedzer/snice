import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/actions/snice-actions';
import type { SniceActionsElement, ActionButton } from '../../components/actions/snice-actions.types';

describe('snice-actions', () => {
  let actions: SniceActionsElement;

  afterEach(() => {
    if (actions) {
      removeComponent(actions as HTMLElement);
    }
  });

  it('should render', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions');
    expect(actions).toBeTruthy();
  });

  it('should have default properties', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions');
    expect(actions.size).toBe('medium');
    expect(actions.variant).toBe('text');
    expect(actions.showLabels).toBe(true);
    expect(actions.maxVisible).toBe(3);
  });

  it('should render action buttons', async () => {
    const testActions: ActionButton[] = [
      { id: 'edit', label: 'Edit', icon: '✏️' },
      { id: 'delete', label: 'Delete', icon: '🗑️' }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    expect(actions.actions.length).toBe(2);
  });

  it('should support different sizes', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions', {
      size: 'large'
    });
    expect(actions.size).toBe('large');
  });

  it('should support different variants', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions', {
      variant: 'outlined'
    });
    expect(actions.variant).toBe('outlined');
  });

  it('should hide labels when showLabels is false', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions', {
      'show-labels': false
    });
    expect(actions.showLabels).toBe(false);
  });

  it('should limit visible actions', async () => {
    const testActions: ActionButton[] = [
      { id: '1', label: 'Action 1' },
      { id: '2', label: 'Action 2' },
      { id: '3', label: 'Action 3' },
      { id: '4', label: 'Action 4' },
      { id: '5', label: 'Action 5' }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions', {
      'max-visible': 2
    });
    actions.actions = testActions;
    await wait();

    expect(actions.maxVisible).toBe(2);
  });

  it('should get action by id', async () => {
    const testActions: ActionButton[] = [
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete' }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    const action = actions.getAction('edit');
    expect(action?.id).toBe('edit');
    expect(action?.label).toBe('Edit');
  });

  it('should return undefined for non-existent action', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = [];
    await wait();

    const action = actions.getAction('nonexistent');
    expect(action).toBeUndefined();
  });

  it.skip('should trigger action callback', async () => {
    const callback = vi.fn();
    const testActions: ActionButton[] = [
      { id: 'test', label: 'Test', action: callback }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    actions.triggerAction('test');
    await wait();

    expect(callback).toHaveBeenCalled();
  });

  it('should not trigger disabled action', async () => {
    const callback = vi.fn();
    const testActions: ActionButton[] = [
      { id: 'test', label: 'Test', action: callback, disabled: true }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    actions.triggerAction('test');
    await wait();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should support danger actions', async () => {
    const testActions: ActionButton[] = [
      { id: 'delete', label: 'Delete', danger: true }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    expect(actions.actions[0].danger).toBe(true);
  });

  it('should support custom more label', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions', {
      'more-label': 'Actions'
    });
    expect(actions.moreLabel).toBe('Actions');
  });

  it('should support custom more icon', async () => {
    actions = await createComponent<SniceActionsElement>('snice-actions', {
      'more-icon': '•••'
    });
    expect(actions.moreIcon).toBe('•••');
  });

  it('should support href actions', async () => {
    const testActions: ActionButton[] = [
      { id: 'link', label: 'Link', href: 'https://example.com' }
    ];

    actions = await createComponent<SniceActionsElement>('snice-actions');
    actions.actions = testActions;
    await wait();

    expect(actions.actions[0].href).toBe('https://example.com');
  });
});
