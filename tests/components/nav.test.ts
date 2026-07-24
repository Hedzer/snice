import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './test-utils';
import '../../packages/components/src/nav/snice-nav';
import type { SniceNavElement } from '../../packages/components/src/nav/snice-nav.types';
import type { Placard } from '../../packages/core/src/types';

describe('snice-nav', () => {
  let nav: SniceNavElement;

  afterEach(() => {
    if (nav) {
      removeComponent(nav as HTMLElement);
    }
  });

  it('should render nav element', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav).toBeTruthy();
  });

  it('should have default variant of flat', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav.variant).toBe('flat');
  });

  it('should support hierarchical variant', async () => {
    nav = document.createElement('snice-nav') as SniceNavElement;
    nav.variant = 'hierarchical';
    document.body.appendChild(nav);
    await nav.ready;

    expect(nav.variant).toBe('hierarchical');
  });

  it('should support grouped variant', async () => {
    nav = document.createElement('snice-nav') as SniceNavElement;
    nav.variant = 'grouped';
    document.body.appendChild(nav);
    await nav.ready;

    expect(nav.variant).toBe('grouped');
  });

  it('should have default orientation of horizontal', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav.orientation).toBe('horizontal');
  });

  it('should support vertical orientation', async () => {
    nav = document.createElement('snice-nav') as SniceNavElement;
    nav.orientation = 'vertical';
    document.body.appendChild(nav);
    await nav.ready;

    expect(nav.orientation).toBe('vertical');
  });

  it('defaults active-style to fill', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav.activeStyle).toBe('fill');
  });

  it('accepts active-style="text" via attribute', async () => {
    nav = document.createElement('snice-nav') as SniceNavElement;
    nav.setAttribute('active-style', 'text');
    document.body.appendChild(nav);
    await nav.ready;
    expect(nav.activeStyle).toBe('text');
  });

  it('should not be top-level by default', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav.isTopLevel).toBe(false);
  });

  it('should support isTopLevel property', async () => {
    nav = document.createElement('snice-nav') as SniceNavElement;
    nav.isTopLevel = true;
    document.body.appendChild(nav);
    await nav.ready;

    expect(nav.isTopLevel).toBe(true);
  });

  it('accepts the documented is-top-level boolean attribute', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav', { 'is-top-level': true });

    expect(nav.isTopLevel).toBe(true);
    expect(nav.getAttribute('is-top-level')).toBe('true');
  });

  it('should have shadow root', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(nav.shadowRoot).toBeTruthy();
  });

  it('should have update() method', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    expect(typeof nav.update).toBe('function');
  });

  it('should render with empty placards', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([]);

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(nav.shadowRoot?.querySelector('nav')).toBeFalsy();
  });

  it('should render nav items from placards', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const navElement = nav.shadowRoot?.querySelector('nav');
    expect(navElement).toBeTruthy();
  });

  it('should sort nav items by order', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'third', title: 'Third', order: 2 },
      { name: 'first', title: 'First', order: 0 },
      { name: 'second', title: 'Second', order: 1 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const links = nav.shadowRoot?.querySelectorAll('.nav__link');
    expect(links?.length).toBe(3);
    expect(links?.[0].textContent).toContain('First');
    expect(links?.[1].textContent).toContain('Second');
    expect(links?.[2].textContent).toContain('Third');
  });

  it('should render icons when provided', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', icon: '🏠', order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const icon = nav.shadowRoot?.querySelector('.nav__icon');
    expect(icon).toBeTruthy();
    expect(icon?.textContent).toBe('🏠');
  });

  it('should update current route', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ];

    nav.update(placards, undefined, 'about');
    await new Promise(resolve => setTimeout(resolve, 50));

    const activeLink = nav.shadowRoot?.querySelector('.nav__link--active');
    expect(activeLink).toBeTruthy();
    expect(activeLink?.textContent).toContain('About');
  });

  it('should mark home as active for empty route', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ];

    nav.update(placards, undefined, '');
    await new Promise(resolve => setTimeout(resolve, 50));

    const activeLinks = nav.shadowRoot?.querySelectorAll('.nav__link--active');
    expect(activeLinks?.length).toBe(1);

    const activeLink = activeLinks?.[0];
    expect(activeLink?.textContent).toContain('Home');
  });

  it('should hide items with show: false', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'hidden', title: 'Hidden', order: 1, show: false },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const links = nav.shadowRoot?.querySelectorAll('.nav__link');
    expect(links?.length).toBe(1);
    expect(links?.[0].textContent).toContain('Home');
  });

  it('should apply accessibility attributes', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
    ];

    nav.update(placards, undefined, 'home');
    await new Promise(resolve => setTimeout(resolve, 50));

    const navElement = nav.shadowRoot?.querySelector('nav');
    expect(navElement?.getAttribute('role')).toBe('navigation');

    const activeLink = nav.shadowRoot?.querySelector('.nav__link--active');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
  });

  it('should apply description as aria-label', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', description: 'Go to home page', order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('.nav__link');
    expect(link?.getAttribute('aria-label')).toBe('Go to home page');
  });

  it('should group items in grouped variant', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.variant = 'grouped';

    const placards: Placard[] = [
      { name: 'home', title: 'Home', group: 'Main', order: 0 },
      { name: 'about', title: 'About', group: 'Main', order: 1 },
      { name: 'settings', title: 'Settings', group: 'Other', order: 2 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const groups = nav.shadowRoot?.querySelectorAll('.nav__group');
    expect(groups?.length).toBe(2);
  });

  it('should render hierarchical structure', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.variant = 'hierarchical';

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
      { name: 'team', title: 'Team', parent: 'about', order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const submenu = nav.shadowRoot?.querySelector('.nav__submenu');
    expect(submenu).toBeTruthy();
  });

  it('should apply hotkeys data attribute', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', hotkeys: ['h', 'Ctrl+H'], order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('.nav__link');
    expect(link?.getAttribute('data-hotkeys')).toBe('h,Ctrl+H');
  });

  it('should apply help URL data attribute', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', helpUrl: '/help/home', order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('.nav__link');
    expect(link?.getAttribute('data-help-url')).toBe('/help/home');
  });

  it('should apply search terms data attribute', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', searchTerms: ['main', 'start'], order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('.nav__link');
    expect(link?.getAttribute('data-search-terms')).toBe('main,start');
  });

  it('should apply custom attributes', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', attributes: { custom: 'value', another: 123 }, order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('.nav__link');
    expect(link?.getAttribute('data-custom')).toBe('value');
    expect(link?.getAttribute('data-another')).toBe('123');
  });

  it('uses placard.href directly for link href', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', href: '/custom-home', order: 0 },
      { name: 'about', title: 'About', href: '#/about', order: 1 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const links = nav.shadowRoot?.querySelectorAll('a.nav__link');
    expect(links?.[0].getAttribute('href')).toBe('/custom-home');
    expect(links?.[1].getAttribute('href')).toBe('#/about');
  });

  it('renders empty href when placard.href is missing', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
    ];

    nav.update(placards);
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = nav.shadowRoot?.querySelector('a.nav__link');
    expect(link?.getAttribute('href')).toBe('');
  });

  it('async visibleOn: hides item until guard resolves true', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    let resolveGuard: (v: boolean) => void;
    const guardPromise = new Promise<boolean>(r => { resolveGuard = r; });

    const placards: Placard[] = [
      { name: 'always', title: 'Always', href: '#/always', order: 0 },
      { name: 'gated', title: 'Gated', href: '#/gated', order: 1, visibleOn: () => guardPromise },
    ];

    nav.update(placards, {} as any);
    await new Promise(r => setTimeout(r, 50));

    // Items with pending guards are rendered but hidden; count visible ones.
    let visible = nav.shadowRoot?.querySelectorAll('.nav__item:not([hidden]) a.nav__link');
    expect(visible?.length).toBe(1);
    expect(visible?.[0].textContent).toContain('Always');

    resolveGuard!(true);
    await new Promise(r => setTimeout(r, 50));

    visible = nav.shadowRoot?.querySelectorAll('.nav__item:not([hidden]) a.nav__link');
    expect(visible?.length).toBe(2);
    const labels = Array.from(visible!).map(l => l.textContent);
    expect(labels.some(t => t?.includes('Gated'))).toBe(true);
  });

  it('async visibleOn: stays hidden when guard resolves false', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'always', title: 'Always', href: '#/always', order: 0 },
      { name: 'gated', title: 'Gated', href: '#/gated', order: 1, visibleOn: () => Promise.resolve(false) },
    ];

    nav.update(placards, {} as any);
    await new Promise(r => setTimeout(r, 50));

    const links = nav.shadowRoot?.querySelectorAll('a.nav__link');
    expect(links?.length).toBe(1);
  });

  it('async visibleOn: rejected promise keeps item hidden', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    const placards: Placard[] = [
      { name: 'always', title: 'Always', href: '#/always', order: 0 },
      { name: 'gated', title: 'Gated', href: '#/gated', order: 1, visibleOn: () => Promise.reject(new Error('boom')) },
    ];

    nav.update(placards, {} as any);
    await new Promise(r => setTimeout(r, 50));

    const links = nav.shadowRoot?.querySelectorAll('a.nav__link');
    expect(links?.length).toBe(1);
  });

  it('async visibleOn: late resolution after re-render does not add stale items', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    let resolveGuard: (v: boolean) => void;
    const guardPromise = new Promise<boolean>(r => { resolveGuard = r; });

    const placards1: Placard[] = [
      { name: 'stale', title: 'Stale', href: '#/stale', order: 0, visibleOn: () => guardPromise },
    ];
    nav.update(placards1, {} as any);
    await new Promise(r => setTimeout(r, 20));

    const placards2: Placard[] = [
      { name: 'fresh', title: 'Fresh', href: '#/fresh', order: 0 },
    ];
    nav.update(placards2, {} as any);
    await new Promise(r => setTimeout(r, 20));

    resolveGuard!(true);
    await new Promise(r => setTimeout(r, 50));

    const links = nav.shadowRoot?.querySelectorAll('a.nav__link');
    expect(links?.length).toBe(1);
    expect(links?.[0].textContent).toContain('Fresh');
  });

  it('should render registry icon names as SVGs', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    nav.update([{ name: 'files', title: 'Files', icon: 'folder', order: 0 }]);
    await new Promise(resolve => setTimeout(resolve, 50));

    const icon = nav.shadowRoot?.querySelector('.nav__icon');
    expect(icon?.querySelector('svg')).toBeTruthy();
    expect(icon?.textContent?.trim()).not.toBe('folder');
  });

  it('should still render emoji icons as text', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');

    nav.update([{ name: 'home', title: 'Home', icon: '🏠', order: 0 }]);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(nav.shadowRoot?.querySelector('.nav__icon')?.textContent).toBe('🏠');
  });
});
