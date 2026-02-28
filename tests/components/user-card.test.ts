import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll } from './test-utils';
import '../../components/user-card/snice-user-card';
import type { SniceUserCardElement } from '../../components/user-card/snice-user-card.types';

describe('snice-user-card', () => {
  let card: SniceUserCardElement;

  afterEach(() => {
    if (card) {
      removeComponent(card as HTMLElement);
    }
  });

  it('should render user card element', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card');
    expect(card).toBeTruthy();
  });

  it('should have default card variant', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card');
    expect(card.variant).toBe('card');
  });

  it('should have default offline status', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card');
    expect(card.status).toBe('offline');
  });

  it('should display the name', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', { name: 'John Doe' });
    const nameEl = queryShadow(card as HTMLElement, '.user-card-name');
    expect(nameEl?.textContent).toContain('John Doe');
  });

  it('should display initials when no avatar', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', { name: 'John Doe' });
    const fallback = queryShadow(card as HTMLElement, '.user-card-avatar-fallback');
    expect(fallback?.textContent?.trim()).toBe('JD');
  });

  it('should display avatar image when provided', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    });
    const img = queryShadow(card as HTMLElement, '.user-card-avatar') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img?.src).toContain('avatar.jpg');
  });

  it('should display role and company', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      role: 'Engineer',
      company: 'Acme'
    });
    const roleEl = queryShadow(card as HTMLElement, '.user-card-role');
    expect(roleEl?.textContent).toContain('Engineer');
    expect(roleEl?.textContent).toContain('Acme');
  });

  it('should display role without company', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      role: 'Engineer'
    });
    const roleEl = queryShadow(card as HTMLElement, '.user-card-role');
    expect(roleEl?.textContent?.trim()).toBe('Engineer');
  });

  it('should display email contact', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    const link = queryShadow(card as HTMLElement, '.user-card-contact-link') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link?.href).toContain('mailto:john@example.com');
  });

  it('should display phone contact', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      phone: '+1-555-0123'
    });
    const link = queryShadow(card as HTMLElement, '.user-card-contact-link') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link?.href).toContain('tel:');
  });

  it('should display location', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      location: 'San Francisco, CA'
    });
    const text = queryShadow(card as HTMLElement, '.user-card-contact-text');
    expect(text?.textContent).toContain('San Francisco, CA');
  });

  it('should show status indicator', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      status: 'online'
    });
    const status = queryShadow(card as HTMLElement, '.user-card-status');
    expect(status).toBeTruthy();
  });

  it('should support horizontal variant', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      variant: 'horizontal'
    });
    expect(card.variant).toBe('horizontal');
  });

  it('should support compact variant', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', {
      name: 'John Doe',
      variant: 'compact'
    });
    expect(card.variant).toBe('compact');
  });

  it('should render social links', async () => {
    card = document.createElement('snice-user-card') as SniceUserCardElement;
    card.name = 'John Doe';
    card.social = [
      { platform: 'github', url: 'https://github.com/john' },
      { platform: 'twitter', url: 'https://twitter.com/john' }
    ];
    document.body.appendChild(card);
    await (card as any).ready;

    const socialLinks = queryShadowAll(card as HTMLElement, '.user-card-social-link');
    expect(socialLinks.length).toBe(2);
  });

  it('should dispatch social-click event when social link clicked', async () => {
    card = document.createElement('snice-user-card') as SniceUserCardElement;
    card.name = 'John Doe';
    card.social = [
      { platform: 'github', url: 'https://github.com/john' }
    ];
    document.body.appendChild(card);
    await (card as any).ready;

    let eventDetail: any = null;
    card.addEventListener('social-click', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const socialLink = queryShadow(card as HTMLElement, '.user-card-social-link') as HTMLElement;
    socialLink?.click();

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.platform).toBe('github');
    expect(eventDetail.url).toBe('https://github.com/john');
  });

  it('should handle single-word name initials', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card', { name: 'Alice' });
    const fallback = queryShadow(card as HTMLElement, '.user-card-avatar-fallback');
    expect(fallback?.textContent?.trim()).toBe('A');
  });

  it('should handle empty name gracefully', async () => {
    card = await createComponent<SniceUserCardElement>('snice-user-card');
    const fallback = queryShadow(card as HTMLElement, '.user-card-avatar-fallback');
    expect(fallback?.textContent?.trim()).toBe('');
  });

  it('should support all status values', async () => {
    for (const status of ['online', 'away', 'offline', 'busy']) {
      const el = await createComponent<SniceUserCardElement>('snice-user-card', {
        name: 'Test',
        status
      });
      expect(el.status).toBe(status);
      removeComponent(el as HTMLElement);
    }
    // Create a dummy for afterEach cleanup
    card = await createComponent<SniceUserCardElement>('snice-user-card');
  });
});
