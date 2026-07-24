import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../packages/components/src/stat-group/snice-stat-group';
import type { SniceStatGroupElement, StatItem } from '../../packages/components/src/stat-group/snice-stat-group.types';

const sampleStats: StatItem[] = [
  { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%', icon: '$', color: 'rgb(22 163 74)' },
  { label: 'Users', value: '2,338', trend: 'up', trendValue: '+8.2%' },
  { label: 'Orders', value: '1,245', trend: 'down', trendValue: '-3.1%' },
  { label: 'Conversion', value: '3.24%', trend: 'neutral', trendValue: '0.0%' }
];

describe('snice-stat-group', () => {
  let el: SniceStatGroupElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    expect(el.stats).toEqual([]);
    expect(el.columns).toBe(0);
    expect(el.variant).toBe('card');
  });

  it('should render stat cards', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const stats = queryShadowAll(el as HTMLElement, '.stat');
    expect(stats.length).toBe(4);
  });

  it('should render stat labels', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const labels = queryShadowAll(el as HTMLElement, '.stat__label');
    expect(labels.length).toBe(4);
    expect(labels[0].textContent).toBe('Revenue');
    expect(labels[1].textContent).toBe('Users');
  });

  it('should render stat values', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const values = queryShadowAll(el as HTMLElement, '.stat__value');
    expect(values.length).toBe(4);
    expect(values[0].textContent).toBe('$45,231');
  });

  it('should render trend indicators', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const trends = queryShadowAll(el as HTMLElement, '.stat__trend');
    expect(trends.length).toBe(4);
  });

  it('should render trend up class', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const upTrend = queryShadow(el as HTMLElement, '.stat__trend--up');
    expect(upTrend).toBeTruthy();
  });

  it('should render trend down class', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const downTrend = queryShadow(el as HTMLElement, '.stat__trend--down');
    expect(downTrend).toBeTruthy();
  });

  it('should render trend values', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const trendValues = queryShadowAll(el as HTMLElement, '.stat__trend-value');
    expect(trendValues.length).toBe(4);
    expect(trendValues[0].textContent).toBe('+12.5%');
  });

  it('should render icon when provided', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    const icon = queryShadow(el as HTMLElement, '.stat__icon');
    expect(icon).toBeTruthy();
  });

  it('should emit stat-click event', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = sampleStats;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('stat-click', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const statCards = queryShadowAll(el as HTMLElement, '.stat');
    (statCards[0] as HTMLElement).click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.stat.label).toBe('Revenue');
    expect(detail.index).toBe(0);
  });

  it('should set columns CSS variable when columns property is set', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.columns = 3;
    await wait(50);
    expect(el.style.getPropertyValue('--sg-columns')).toBe('3');
  });

  it('should render without trend when not provided', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = [{ label: 'Total', value: '100' }];
    await wait(50);
    const trends = queryShadowAll(el as HTMLElement, '.stat__trend');
    expect(trends.length).toBe(0);
  });

  it('should apply color to value when provided', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = [{ label: 'Revenue', value: '$100', color: 'rgb(22 163 74)' }];
    await wait(50);
    const value = queryShadow(el as HTMLElement, '.stat__value');
    expect(value).toBeTruthy();
    expect((value as HTMLElement).style.color).toContain('rgb(22');
  });

  it('should render with minimal variant', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.variant = 'minimal';
    el.stats = sampleStats;
    await wait(50);
    expect(el.getAttribute('variant')).toBe('minimal');
    const stats = queryShadowAll(el as HTMLElement, '.stat');
    expect(stats.length).toBe(4);
  });

  it('should render with bordered variant', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.variant = 'bordered';
    el.stats = sampleStats;
    await wait(50);
    expect(el.getAttribute('variant')).toBe('bordered');
    const stats = queryShadowAll(el as HTMLElement, '.stat');
    expect(stats.length).toBe(4);
  });

  it('renders registry SVG icons from icon names', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = [{ label: 'Active Users', value: '1,024', icon: 'users' }];
    await wait(50);

    const icon = queryShadow(el as HTMLElement, '.stat__icon');
    expect(icon?.querySelector('svg')).toBeTruthy();
    expect(icon?.textContent?.trim()).not.toBe('users');
  });

  it('still renders emoji icon values as text', async () => {
    el = await createComponent<SniceStatGroupElement>('snice-stat-group');
    el.stats = [{ label: 'Fun', value: '9000', icon: '🎉' }];
    await wait(50);

    expect(queryShadow(el as HTMLElement, '.stat__icon')?.textContent).toContain('🎉');
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/stat-group/snice-stat-group.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
