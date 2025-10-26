import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/stat/snice-stat';
import type { SniceStatElement } from '../../components/stat/snice-stat.types';

describe('snice-stat', () => {
  let stat: SniceStatElement;

  afterEach(() => {
    if (stat) {
      removeComponent(stat as HTMLElement);
    }
  });

  it('should render', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat');
    expect(stat).toBeTruthy();
  });

  it('should have default properties', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat');
    expect(stat.label).toBe('');
    expect(stat.value).toBe('');
    expect(stat.size).toBe('medium');
    expect(stat.trend).toBe('neutral');
  });

  it('should display label and value', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat', { label: 'Revenue', value: '$1,234' });
    expect(stat.label).toBe('Revenue');
    expect(stat.value).toBe('$1,234');
  });

  it('should support trends', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat', { trend: 'up' });
    expect(stat.trend).toBe('up');
  });

  it('should support sizes', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat', { size: 'large' });
    expect(stat.size).toBe('large');
  });

  it('should support icons', async () => {
    stat = await createComponent<SniceStatElement>('snice-stat', { icon: '💰' });
    expect(stat.icon).toBe('💰');
  });
});
