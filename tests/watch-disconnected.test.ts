import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, watch } from './test-imports';

describe('@watch decorator - disconnected behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should continue watching properties when element is disconnected', async () => {
    const watcherSpy = vi.fn();

    @element('disconnected-watcher-test')
    class DisconnectedWatcherTest extends HTMLElement {
      @property()
      name = 'initial';

      @watch('name')
      onNameChange(oldValue: string, newValue: string) {
        watcherSpy(oldValue, newValue);
      }
    }

    const el = document.createElement('disconnected-watcher-test') as DisconnectedWatcherTest;
    document.body.appendChild(el);

    // Wait for element to be ready
    await (el as any).ready;

    // Change property while connected
    el.name = 'connected';
    expect(watcherSpy).toHaveBeenCalledWith('initial', 'connected');

    // Disconnect element
    document.body.removeChild(el);

    // Change property while disconnected - watchers should still work
    el.name = 'disconnected';
    expect(watcherSpy).toHaveBeenCalledWith('connected', 'disconnected');

    expect(watcherSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle attribute changes that trigger watchers when disconnected', async () => {
    const watcherSpy = vi.fn();

    @element('disconnected-attr-test')
    class DisconnectedAttrTest extends HTMLElement {
      @property({ attribute: 'user-name' })
      userName = '';

      @watch('userName')
      onUserNameChange(oldValue: string, newValue: string) {
        watcherSpy(oldValue, newValue);
      }
    }

    const el = document.createElement('disconnected-attr-test') as DisconnectedAttrTest;
    document.body.appendChild(el);

    // Wait for element to be ready
    await (el as any).ready;

    // Change attribute while connected
    el.setAttribute('user-name', 'connected');
    expect(watcherSpy).toHaveBeenCalledWith('', 'connected');

    // Disconnect element
    document.body.removeChild(el);

    // Change attribute while disconnected - watchers should still work
    el.setAttribute('user-name', 'disconnected');
    expect(watcherSpy).toHaveBeenCalledWith('connected', 'disconnected');

    expect(watcherSpy).toHaveBeenCalledTimes(2);
  });
});