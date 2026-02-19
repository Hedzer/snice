import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/progress/snice-progress';
import type { SniceProgressElement } from '../../components/progress/snice-progress.types';

describe('snice-progress', () => {
  let progress: SniceProgressElement;

  afterEach(() => {
    if (progress) {
      removeComponent(progress as HTMLElement);
    }
  });

  it('should render progress element', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');
    expect(progress).toBeTruthy();
  });

  it('should have default linear variant', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');
    const el = queryShadow(progress as HTMLElement, '.progress--linear');
    expect(el).toBeTruthy();
  });

  it('should support circular variant', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { variant: 'circular' });

    const el = queryShadow(progress as HTMLElement, '.progress--circular');
    expect(el).toBeTruthy();
  });

  it('should show progress value', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { value: 50 });

    const bar = queryShadow(progress as HTMLElement, '.progress__bar') as HTMLElement;
    expect(bar?.getAttribute('style')).toBe('width: 50%');
  });

  it('should support max value', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { value: 25, max: 50 });

    const bar = queryShadow(progress as HTMLElement, '.progress__bar') as HTMLElement;
    expect(bar?.getAttribute('style')).toBe('width: 50%'); // 25/50 = 50%
  });

  it('should support indeterminate state', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { indeterminate: true });
    expect(progress.indeterminate).toBe(true);
  });

  it('should show label when showLabel is true', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');
    const tracker = trackRenders(progress as HTMLElement);
    progress.showLabel = true;
    progress.value = 75;
    await tracker.next();

    const label = queryShadow(progress as HTMLElement, '.progress__label');
    expect(label).toBeTruthy();
    expect(label?.textContent).toBe('75%');
  });

  it('should support custom label text', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');
    const tracker = trackRenders(progress as HTMLElement);
    progress.showLabel = true;
    progress.label = 'Loading...';
    await tracker.next();

    const label = queryShadow(progress as HTMLElement, '.progress__label');
    expect(label?.textContent).toBe('Loading...');
  });

  it('should have getPercentage() method', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { value: 33, max: 100 });
    expect(progress.getPercentage()).toBe(33);
  });

  it('should have setProgress() method', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');

    progress.setProgress(60);

    expect(progress.value).toBe(60);

    progress.setProgress(40, 200);

    expect(progress.value).toBe(40);
    expect(progress.max).toBe(200);
  });

  it('should dispatch progress-change event', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress');

    let eventDetail: any = null;
    (progress as HTMLElement).addEventListener('progress-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    progress.value = 80;

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.value).toBe(80);
    expect(eventDetail.percentage).toBe(80);
  });

  it('should support semantic color values', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { color: 'success' });

    // Semantic colors should not set inline --progress-color
    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('');
    expect(progress.color).toBe('success');
  });

  it('should support custom hex color values', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { color: '#ff5500' });

    // Custom colors should set inline --progress-color
    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('#ff5500');
  });

  it('should support custom rgb color values', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { color: 'rgb(255, 85, 0)' });

    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('rgb(255, 85, 0)');
  });

  it('should switch between semantic and custom colors', async () => {
    progress = await createComponent<SniceProgressElement>('snice-progress', { color: '#ff5500' });
    const tracker = trackRenders(progress as HTMLElement);

    // Start with custom color
    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('#ff5500');

    // Switch to semantic color
    progress.color = 'primary';
    await tracker.next();
    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('');

    // Switch back to custom color
    progress.color = '#00ff00';
    await tracker.next();
    expect((progress as HTMLElement).style.getPropertyValue('--progress-color')).toBe('#00ff00');
  });
});
