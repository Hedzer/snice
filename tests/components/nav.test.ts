import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './test-utils';
import '../../components/nav/snice-nav';
import type { SniceNavElement } from '../../components/nav/snice-nav.types';
import type { Placard } from '../../src/types';

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
});
