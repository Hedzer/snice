import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/split-pane/snice-split-pane';
import type { SniceResizeElement } from '../../components/split-pane/snice-split-pane.types';

describe('snice-split-pane', () => {
  let splitPane: SniceResizeElement;

  afterEach(() => {
    if (splitPane) {
      removeComponent(splitPane as HTMLElement);
    }
  });

  it('should render', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane');
    expect(splitPane).toBeTruthy();
  });

  it('should have default properties', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane');
    expect(splitPane.direction).toBe('horizontal');
    expect(splitPane.primarySize).toBe(50);
    expect(splitPane.minPrimarySize).toBe(10);
    expect(splitPane.minSecondarySize).toBe(10);
    expect(splitPane.disabled).toBe(false);
  });

  it('should support vertical direction', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      direction: 'vertical'
    });
    expect(splitPane.direction).toBe('vertical');
  });

  it('should support custom primary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'primary-size': 30
    });
    expect(splitPane.primarySize).toBe(30);
  });

  it('should get primary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'primary-size': 40
    });
    expect(splitPane.getPrimarySize()).toBe(40);
  });

  it('should get secondary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'primary-size': 40
    });
    expect(splitPane.getSecondarySize()).toBe(60);
  });

  it('should set primary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane');
    splitPane.setPrimarySize(30);
    await wait();
    expect(splitPane.primarySize).toBe(30);
  });

  it('should respect min primary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'min-primary-size': 20
    });
    splitPane.setPrimarySize(10);
    await wait();
    expect(splitPane.primarySize).toBe(20);
  });

  it('should respect min secondary size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'min-secondary-size': 20
    });
    splitPane.setPrimarySize(90);
    await wait();
    expect(splitPane.primarySize).toBe(80);
  });

  it('should reset to 50%', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'primary-size': 70
    });
    splitPane.reset();
    await wait();
    expect(splitPane.primarySize).toBe(50);
  });

  it('should support disabled state', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      disabled: true
    });
    expect(splitPane.disabled).toBe(true);
  });

  it('should support snap size', async () => {
    splitPane = await createComponent<SniceResizeElement>('snice-split-pane', {
      'snap-size': 10
    });
    expect(splitPane.snapSize).toBe(10);
  });
});
