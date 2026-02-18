import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, triggerMouseEvent, trackRenders } from './test-utils';
import '../../components/breadcrumbs/snice-breadcrumbs';
import type { SniceBreadcrumbsElement, BreadcrumbItem } from '../../components/breadcrumbs/snice-breadcrumbs.types';

describe('snice-breadcrumbs', () => {
  let breadcrumbs: SniceBreadcrumbsElement;

  afterEach(() => {
    if (breadcrumbs) {
      removeComponent(breadcrumbs as HTMLElement);
    }
  });

  it('should render breadcrumbs element', async () => {
    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');
    expect(breadcrumbs).toBeTruthy();
  });

  it('should render items from items property', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Details' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const breadcrumbItems = queryShadowAll(breadcrumbs as HTMLElement, '.breadcrumb-item');
    expect(breadcrumbItems.length).toBe(3);
  });

  it('should render separator between items', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const separators = queryShadowAll(breadcrumbs as HTMLElement, '.breadcrumb-separator');
    expect(separators.length).toBe(1); // One separator between two items
    expect(separators[0]?.textContent?.trim()).toBe('/');
  });

  it('should support custom separator', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    breadcrumbs.separator = '>';
    await tracker.next();

    const separator = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-separator');
    expect(separator?.textContent?.trim()).toBe('>');
  });

  it('should mark last item as active', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const breadcrumbItems = queryShadowAll(breadcrumbs as HTMLElement, '.breadcrumb-item');
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    expect(lastItem?.classList.contains('breadcrumb-item--active')).toBe(true);
  });

  it('should render links for items with href', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const link = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-link') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('should render text span for items without href', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const text = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-text');
    expect(text).toBeTruthy();
    expect(text?.textContent?.trim()).toBe('Products');
  });

  it('should support maxItems with ellipsis', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Subcategory', href: '/subcategory' },
      { label: 'Products', href: '/products' },
      { label: 'Details' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    breadcrumbs.maxItems = 3;
    await tracker.next();

    const ellipsis = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-ellipsis');
    expect(ellipsis).toBeTruthy();
  });

  it('should expand when ellipsis is clicked', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Subcategory', href: '/subcategory' },
      { label: 'Products', href: '/products' },
      { label: 'Details' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    let tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    breadcrumbs.maxItems = 3;
    await tracker.next();

    const ellipsis = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-ellipsis') as HTMLElement;

    tracker = trackRenders(breadcrumbs as HTMLElement);
    triggerMouseEvent(ellipsis, 'click');
    await tracker.next();

    const visibleItems = queryShadowAll(breadcrumbs as HTMLElement, '.breadcrumb-item:not(.breadcrumb-item--hidden)');
    expect(visibleItems.length).toBeGreaterThan(3);
  });

  it('should dispatch breadcrumb-click event when link is clicked', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    let eventDetail: any = null;
    (breadcrumbs as HTMLElement).addEventListener('breadcrumb-click', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const link = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-link') as HTMLElement;
    triggerMouseEvent(link, 'click');

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.label).toBe('Home');
    expect(eventDetail.href).toBe('/');
  });

  it('should have setItems() method', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Products' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.setItems(items);
    await tracker.next();

    const breadcrumbItems = queryShadowAll(breadcrumbs as HTMLElement, '.breadcrumb-item');
    expect(breadcrumbItems.length).toBe(2);
  });

  it('should support icon in breadcrumb items', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: '🏠' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    const icon = queryShadow(breadcrumbs as HTMLElement, '.breadcrumb-icon');
    expect(icon).toBeTruthy();
    expect(icon?.textContent).toBe('🏠');
  });

  it('should support iconImage in breadcrumb items', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/', iconImage: '/home.png' }
    ];

    breadcrumbs = await createComponent<SniceBreadcrumbsElement>('snice-breadcrumbs');

    const tracker = trackRenders(breadcrumbs as HTMLElement);
    breadcrumbs.items = items;
    await tracker.next();

    // iconImage renders as img.breadcrumb-icon
    const iconImage = queryShadow(breadcrumbs as HTMLElement, 'img.breadcrumb-icon') as HTMLImageElement;
    expect(iconImage).toBeTruthy();
    expect(iconImage?.getAttribute('src')).toBe('/home.png');
  });
});
