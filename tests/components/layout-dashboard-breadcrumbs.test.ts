import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-dashboard';
import type { SniceLayoutDashboard } from '../../packages/components/src/layout/snice-layout-dashboard';
import type { Placard } from '../../packages/core/src/types/placard';

describe('snice-layout-dashboard breadcrumbs', () => {
  let layout: SniceLayoutDashboard;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  it('breadcrumbs use placard.href instead of deriving from name', async () => {
    layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
    await wait(10);

    const placards: Placard[] = [
      { name: 'home', title: 'Home', href: '/custom-home' },
      { name: 'settings', title: 'Settings', href: '#/settings-page', parent: 'home' },
    ];

    layout.update({} as any, placards, 'settings', {});
    await wait(20);

    const toolbar = layout.shadowRoot?.querySelector('.toolbar');
    expect(toolbar).toBeTruthy();
    const html = toolbar!.innerHTML || toolbar!.textContent || '';
    expect(html).toContain('/custom-home');
    expect(html).toContain('#/settings-page');
    expect(html).not.toContain('#/home');
    expect(html).not.toContain('#/settings"');
  });

  it('breadcrumbs render empty href when placard lacks href', async () => {
    layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
    await wait(10);

    const placards: Placard[] = [
      { name: 'orphan', title: 'Orphan' },
    ];

    layout.update({} as any, placards, 'orphan', {});
    await wait(20);

    const toolbar = layout.shadowRoot?.querySelector('.toolbar');
    const html = toolbar!.innerHTML || toolbar!.textContent || '';
    expect(html).toContain('"href":""');
  });
});
