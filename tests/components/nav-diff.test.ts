import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './test-utils';
import '../../components/nav/snice-nav';
import type { SniceNavElement } from '../../components/nav/snice-nav.types';
import type { Placard } from '../../src/types';

// Blindspot: the current implementation does `shadowRoot.innerHTML = ''` on
// every update(), so every tree is rebuilt even when only the active route
// changes. That's what the user sees as a "flash". These tests assert that
// unchanged DOM nodes keep their identity across renders.

describe('snice-nav differential rendering (no flash)', () => {
  let nav: SniceNavElement;
  afterEach(() => { if (nav) removeComponent(nav as HTMLElement); });

  const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));

  it('route change: existing link nodes are reused (not recreated)', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    const placards: Placard[] = [
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ];
    nav.update(placards, undefined, 'home');
    await wait();

    const firstLinks = Array.from(nav.shadowRoot!.querySelectorAll('a.nav__link'));
    expect(firstLinks.length).toBe(2);

    nav.update(placards, undefined, 'about');
    await wait();

    const secondLinks = Array.from(nav.shadowRoot!.querySelectorAll('a.nav__link'));
    expect(secondLinks.length).toBe(2);
    expect(secondLinks[0]).toBe(firstLinks[0]);
    expect(secondLinks[1]).toBe(firstLinks[1]);

    expect(secondLinks[0].classList.contains('nav__link--active')).toBe(false);
    expect(secondLinks[1].classList.contains('nav__link--active')).toBe(true);
    expect(secondLinks[0].getAttribute('aria-current')).toBe(null);
    expect(secondLinks[1].getAttribute('aria-current')).toBe('page');
  });

  it('no-op update: <nav> element identity preserved', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    const placards: Placard[] = [
      { name: 'a', title: 'A', order: 0 },
      { name: 'b', title: 'B', order: 1 },
    ];
    nav.update(placards, undefined, 'a');
    await wait();

    const firstNav = nav.shadowRoot!.querySelector('nav');
    nav.update(placards, undefined, 'a');
    await wait();
    const secondNav = nav.shadowRoot!.querySelector('nav');

    expect(secondNav).toBe(firstNav);
  });

  it('adding a placard: pre-existing link nodes are reused', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ]);
    await wait();
    const homeBefore = nav.shadowRoot!.querySelector('a.nav__link')!;

    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
      { name: 'contact', title: 'Contact', order: 2 },
    ]);
    await wait();

    const links = nav.shadowRoot!.querySelectorAll('a.nav__link');
    expect(links.length).toBe(3);
    expect(links[0]).toBe(homeBefore);
    expect(links[2].textContent).toContain('Contact');
  });

  it('removing a placard: remaining link nodes are reused', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
      { name: 'contact', title: 'Contact', order: 2 },
    ]);
    await wait();
    const [, aboutBefore] = Array.from(nav.shadowRoot!.querySelectorAll('a.nav__link'));

    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
    ]);
    await wait();

    const links = nav.shadowRoot!.querySelectorAll('a.nav__link');
    expect(links.length).toBe(2);
    expect(links[1]).toBe(aboutBefore);
  });

  it('reorder: link nodes move with their placard, not re-created', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([
      { name: 'a', title: 'A', order: 0 },
      { name: 'b', title: 'B', order: 1 },
    ]);
    await wait();
    const [aBefore, bBefore] = Array.from(nav.shadowRoot!.querySelectorAll('a.nav__link'));

    nav.update([
      { name: 'a', title: 'A', order: 1 },
      { name: 'b', title: 'B', order: 0 },
    ]);
    await wait();
    const after = Array.from(nav.shadowRoot!.querySelectorAll('a.nav__link'));

    // B is now first, A second — but they're the SAME nodes as before
    expect(after[0]).toBe(bBefore);
    expect(after[1]).toBe(aBefore);
  });

  it('title change: label text updates in place, same <span> node', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([{ name: 'home', title: 'Home', order: 0 }]);
    await wait();
    const labelBefore = nav.shadowRoot!.querySelector('.nav__label')!;
    expect(labelBefore.textContent).toBe('Home');

    nav.update([{ name: 'home', title: 'Dashboard', order: 0 }]);
    await wait();
    const labelAfter = nav.shadowRoot!.querySelector('.nav__label')!;
    expect(labelAfter).toBe(labelBefore);
    expect(labelAfter.textContent).toBe('Dashboard');
  });

  it('href change: attribute updates in place, same <a> node', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([{ name: 'home', title: 'Home', href: '/a', order: 0 }]);
    await wait();
    const linkBefore = nav.shadowRoot!.querySelector('a.nav__link')!;
    expect(linkBefore.getAttribute('href')).toBe('/a');

    nav.update([{ name: 'home', title: 'Home', href: '/b', order: 0 }]);
    await wait();
    const linkAfter = nav.shadowRoot!.querySelector('a.nav__link')!;
    expect(linkAfter).toBe(linkBefore);
    expect(linkAfter.getAttribute('href')).toBe('/b');
  });

  it('icon change between text and image: element type swaps', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.update([{ name: 'home', title: 'Home', icon: '🏠', order: 0 }]);
    await wait();
    expect(nav.shadowRoot!.querySelector('span.nav__icon')).toBeTruthy();
    expect(nav.shadowRoot!.querySelector('img.nav__icon')).toBeNull();

    nav.update([{ name: 'home', title: 'Home', icon: 'https://x.test/img.png', order: 0 }]);
    await wait();
    expect(nav.shadowRoot!.querySelector('img.nav__icon')).toBeTruthy();
    expect(nav.shadowRoot!.querySelector('span.nav__icon')).toBeNull();
  });

  it('hierarchical: parent item node preserved when child changes', async () => {
    nav = await createComponent<SniceNavElement>('snice-nav');
    nav.variant = 'hierarchical';
    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
      { name: 'team', title: 'Team', parent: 'about', order: 0 },
    ]);
    await wait();
    const aboutLinkBefore = Array.from(
      nav.shadowRoot!.querySelectorAll('.nav__group > a.nav__link')
    ).find(a => a.textContent?.includes('About'))!;

    nav.update([
      { name: 'home', title: 'Home', order: 0 },
      { name: 'about', title: 'About', order: 1 },
      { name: 'team', title: 'Team', parent: 'about', order: 0 },
      { name: 'careers', title: 'Careers', parent: 'about', order: 1 },
    ]);
    await wait();
    const aboutLinkAfter = Array.from(
      nav.shadowRoot!.querySelectorAll('.nav__group > a.nav__link')
    ).find(a => a.textContent?.includes('About'))!;

    expect(aboutLinkAfter).toBe(aboutLinkBefore);
    const submenuItems = nav.shadowRoot!.querySelectorAll('.nav__submenu .nav__item');
    expect(submenuItems.length).toBe(2);
  });
});
