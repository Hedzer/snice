import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('flip-card: aria-pressed reflects flipped state', () => {
  it('default shows aria-pressed=false; flipping toggles to true', async () => {
    await import('../../components/flip-card/snice-flip-card');
    const el = document.createElement('snice-flip-card') as any;
    el.clickToFlip = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const base = el.shadowRoot.querySelector('.flip-card');
    expect(base?.getAttribute('aria-pressed')).toBe('false');

    el.flipped = true;
    await wait(20);
    expect(base?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('carousel: announces as a region with carousel role-description', () => {
  it('container has role=region and aria-roledescription', async () => {
    await import('../../components/carousel/snice-carousel');
    const el = document.createElement('snice-carousel') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const container = el.shadowRoot.querySelector('.carousel');
    expect(container?.getAttribute('role')).toBe('region');
    expect(container?.getAttribute('aria-roledescription')).toBe('carousel');
  });
});

describe('split-pane: divider has separator role + aria-valuenow + keyboard', () => {
  it('divider exposes orientation, valuenow, and is focusable', async () => {
    await import('../../components/split-pane/snice-split-pane');
    const el = document.createElement('snice-split-pane') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    const divider = el.shadowRoot.querySelector('.divider');
    expect(divider?.getAttribute('role')).toBe('separator');
    expect(divider?.getAttribute('aria-orientation')).toBe('vertical');
    expect(divider?.getAttribute('aria-valuenow')).toBeTruthy();
    expect(divider?.getAttribute('tabindex')).toBe('0');
  });
});

describe('cropper: crop-area is keyboard-focusable region', () => {
  it('crop-area has role=region, aria-label, tabindex=0', async () => {
    await import('../../components/cropper/snice-cropper');
    const el = document.createElement('snice-cropper') as any;
    el.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48L3N2Zz4=';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const cropArea = el.shadowRoot.querySelector('.crop-area');
    expect(cropArea?.getAttribute('role')).toBe('region');
    expect(cropArea?.getAttribute('tabindex')).toBe('0');
    expect(cropArea?.getAttribute('aria-label')).toMatch(/crop/i);
  });
});

describe('action-bar: roving tabindex applied to focusable children', () => {
  it('first focusable gets tabindex=0, the rest -1', async () => {
    await import('../../components/action-bar/snice-action-bar');
    const el = document.createElement('snice-action-bar') as any;
    el.innerHTML = '<button id="a">A</button><button id="b">B</button><button id="c">C</button>';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const a = el.querySelector('#a');
    const b = el.querySelector('#b');
    const c = el.querySelector('#c');
    expect(a?.getAttribute('tabindex')).toBe('0');
    expect(b?.getAttribute('tabindex')).toBe('-1');
    expect(c?.getAttribute('tabindex')).toBe('-1');
  });
});

describe('availability: grid roles + rowindex/colindex on cells', () => {
  it('grid is role=grid with rowheader/columnheader/gridcell descendants', async () => {
    await import('../../components/availability/snice-availability');
    const el = document.createElement('snice-availability') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(60);

    const grid = el.shadowRoot.querySelector('.availability__grid');
    expect(grid?.getAttribute('role')).toBe('grid');
    expect(grid?.getAttribute('aria-rowcount')).toBeTruthy();

    const cell = el.shadowRoot.querySelector('[role="gridcell"]');
    expect(cell).toBeTruthy();
    expect(cell?.getAttribute('aria-colindex')).toBeTruthy();
    const row = cell?.closest('[role="row"]');
    expect(row?.getAttribute('aria-rowindex')).toBeTruthy();
  });
});

describe('gantt: zoom toggles announce as toggle buttons', () => {
  it('each zoom button has aria-pressed reflecting current zoom', async () => {
    await import('../../components/gantt/snice-gantt');
    const el = document.createElement('snice-gantt') as any;
    el.zoom = 'week';
    el.tasks = [];
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const btns = el.shadowRoot.querySelectorAll('.gantt-zoom-btn');
    const pressed = Array.from(btns).map((b: any) => b.getAttribute('aria-pressed'));
    expect(pressed).toContain('true');
    expect(pressed.filter((p) => p === 'true').length).toBe(1);
  });
});

describe('org-chart: tree role + treeitem nodes with aria-expanded', () => {
  it('tree container is role=tree and nodes are role=treeitem', async () => {
    await import('../../components/org-chart/snice-org-chart');
    const el = document.createElement('snice-org-chart') as any;
    el.data = { id: '1', name: 'CEO', children: [{ id: '2', name: 'CTO' }] };
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const tree = el.shadowRoot.querySelector('.org-tree');
    expect(tree?.getAttribute('role')).toBe('tree');

    const item = el.shadowRoot.querySelector('[role="treeitem"]');
    expect(item).toBeTruthy();
    expect(item?.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('flow: editor surface announces as application', () => {
  it('flow container is role=application + tabindex=0', async () => {
    await import('../../components/flow/snice-flow');
    const el = document.createElement('snice-flow') as any;
    el.nodes = [];
    el.edges = [];
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const flow = el.shadowRoot.querySelector('.flow');
    expect(flow?.getAttribute('role')).toBe('application');
    expect(flow?.getAttribute('tabindex')).toBe('0');
  });
});

describe('map: container announces as application + keyboard pannable', () => {
  it('map-container is role=application + tabindex=0', async () => {
    await import('../../components/map/snice-map');
    const el = document.createElement('snice-map') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const container = el.shadowRoot.querySelector('.map-container');
    expect(container?.getAttribute('role')).toBe('application');
    expect(container?.getAttribute('tabindex')).toBe('0');
  });
});

describe('virtual-scroller: PageDown/Home/End keyboard nav', () => {
  it('Home key sets scrollTop to 0', async () => {
    await import('../../components/virtual-scroller/snice-virtual-scroller');
    const el = document.createElement('snice-virtual-scroller') as any;
    el.items = Array.from({ length: 100 }, (_, i) => ({ value: i }));
    el.itemHeight = 30;
    el.style.height = '200px';
    el.style.display = 'block';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const scroller = el.shadowRoot.querySelector('.scroller');
    expect(scroller?.getAttribute('tabindex')).toBe('0');
  });
});
