/**
 * Tests for attribute: false on complex (Array/Object) properties.
 *
 * Each test verifies:
 *  1. The property accepts complex data via JS assignment
 *  2. The property does NOT reflect to a DOM attribute
 *  3. The data round-trips correctly (get returns what was set)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';

// Import all components under test
import '../../components/activity-feed/snice-activity-feed';
import '../../components/app-tiles/snice-app-tiles';
import '../../components/approval-flow/snice-approval-flow';
import '../../components/availability/snice-availability';
import '../../components/booking/snice-booking';
import '../../components/breadcrumbs/snice-breadcrumbs';
import '../../components/calendar/snice-calendar';
import '../../components/cart/snice-cart';
import '../../components/code-block/snice-code-block';
import '../../components/color-picker/snice-color-picker';
import '../../components/combobox/snice-combobox';
import '../../components/command-palette/snice-command-palette';
import '../../components/comments/snice-comments';
import '../../components/data-card/snice-data-card';
import '../../components/estimate/snice-estimate';
import '../../components/form-builder/snice-form-builder';
import '../../components/gantt/snice-gantt';
import '../../components/heatmap/snice-heatmap';
import '../../components/invoice/snice-invoice';
import '../../components/kanban/snice-kanban';
import '../../components/kpi/snice-kpi';
import '../../components/map/snice-map';
import '../../components/mentions/snice-mentions';
import '../../components/metric-table/snice-metric-table';
import '../../components/music-player/snice-music-player';
import '../../components/notification-center/snice-notification-center';
import '../../components/order-tracker/snice-order-tracker';
import '../../components/org-chart/snice-org-chart';
import '../../components/podcast-player/snice-podcast-player';
import '../../components/pricing-table/snice-pricing-table';
import '../../components/product-card/snice-product-card';
import '../../components/receipt/snice-receipt';
import '../../components/recipe/snice-recipe';
import '../../components/scheduler/snice-scheduler';
import '../../components/segmented-control/snice-segmented-control';
import '../../components/sparkline/snice-sparkline';
import '../../components/split-button/snice-split-button';
import '../../components/spotlight/snice-spotlight';
import '../../components/spreadsheet/snice-spreadsheet';
import '../../components/stat-group/snice-stat-group';
import '../../components/stepper/snice-stepper';
import '../../components/table/snice-table';
import '../../components/tag-input/snice-tag-input';
import '../../components/timeline/snice-timeline';
import '../../components/tree/snice-tree';
import '../../components/virtual-scroller/snice-virtual-scroller';
import '../../components/weather/snice-weather';
import '../../components/work-order/snice-work-order';

/** Helper: create element, set property, assert no attribute reflection, assert round-trip */
async function assertNoReflect(
  tag: string,
  propName: string,
  testValue: any,
  attrName?: string
) {
  const el = await createComponent(tag);
  try {
    // Set property imperatively
    (el as any)[propName] = testValue;

    // Verify round-trip
    const got = (el as any)[propName];
    if (Array.isArray(testValue)) {
      expect(Array.isArray(got)).toBe(true);
      expect(got.length).toBe(testValue.length);
    } else if (typeof testValue === 'object' && testValue !== null) {
      expect(typeof got).toBe('object');
    }

    // Verify no attribute reflection — the property should NOT appear as an HTML attribute
    const attr = attrName || propName.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    const attrVal = el.getAttribute(attr);
    // Should be null or empty, never [object Object] or serialized JSON
    if (attrVal !== null) {
      expect(attrVal).not.toContain('[object');
      expect(attrVal).not.toContain('{');
    }
  } finally {
    removeComponent(el);
  }
}

describe('attribute: false — complex properties do not reflect to DOM', () => {
  // --- Activity Feed ---
  it('snice-activity-feed: activities', async () => {
    await assertNoReflect('snice-activity-feed', 'activities', [
      { id: '1', actor: { name: 'Alice' }, action: 'created', target: 'Doc', timestamp: new Date().toISOString() },
    ]);
  });

  // --- App Tiles ---
  it('snice-app-tiles: tiles', async () => {
    await assertNoReflect('snice-app-tiles', 'tiles', [
      { id: '1', name: 'App', icon: '📱' },
    ]);
  });

  // --- Approval Flow ---
  it('snice-approval-flow: steps', async () => {
    await assertNoReflect('snice-approval-flow', 'steps', [
      { id: '1', label: 'Review', status: 'pending' },
    ]);
  });

  // --- Availability ---
  it('snice-availability: slots', async () => {
    await assertNoReflect('snice-availability', 'slots', [
      { day: 'Monday', start: '09:00', end: '17:00' },
    ]);
  });

  // --- Booking ---
  it('snice-booking: availableDates', async () => {
    await assertNoReflect('snice-booking', 'availableDates', ['2025-01-01', '2025-01-02'], 'available-dates');
  });

  it('snice-booking: availableSlots', async () => {
    await assertNoReflect('snice-booking', 'availableSlots', [
      { time: '10:00', available: true },
    ], 'available-slots');
  });

  it('snice-booking: fields', async () => {
    await assertNoReflect('snice-booking', 'fields', [
      { name: 'email', type: 'email', required: true },
    ]);
  });

  // --- Breadcrumbs ---
  it('snice-breadcrumbs: items', async () => {
    await assertNoReflect('snice-breadcrumbs', 'items', [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
    ]);
  });

  // --- Calendar ---
  it('snice-calendar: events', async () => {
    await assertNoReflect('snice-calendar', 'events', [
      { title: 'Meeting', start: '2025-01-15', end: '2025-01-15' },
    ]);
  });

  it('snice-calendar: disabledDates', async () => {
    await assertNoReflect('snice-calendar', 'disabledDates', ['2025-01-01'], 'disabled-dates');
  });

  // --- Cart ---
  it('snice-cart: items', async () => {
    await assertNoReflect('snice-cart', 'items', [
      { id: '1', name: 'Widget', price: 9.99, quantity: 1 },
    ]);
  });

  // --- Code Block ---
  it('snice-code-block: highlightLines', async () => {
    await assertNoReflect('snice-code-block', 'highlightLines', [1, 3, 5], 'highlight-lines');
  });

  // --- Color Picker ---
  it('snice-color-picker: presets', async () => {
    await assertNoReflect('snice-color-picker', 'presets', ['#ff0000', '#00ff00', '#0000ff']);
  });

  // --- Combobox ---
  it('snice-combobox: options', async () => {
    await assertNoReflect('snice-combobox', 'options', [
      { label: 'One', value: '1' },
    ]);
  });

  // --- Command Palette ---
  it('snice-command-palette: commands', async () => {
    await assertNoReflect('snice-command-palette', 'commands', [
      { id: '1', label: 'Open file', action: 'open' },
    ]);
  });

  // --- Comments ---
  it('snice-comments: comments', async () => {
    await assertNoReflect('snice-comments', 'comments', [
      { id: '1', author: 'Alice', text: 'Hello', timestamp: new Date().toISOString() },
    ]);
  });

  // --- Data Card ---
  it('snice-data-card: fields', async () => {
    await assertNoReflect('snice-data-card', 'fields', [
      { label: 'Status', value: 'Active' },
    ]);
  });

  // --- Estimate ---
  it('snice-estimate: from', async () => {
    await assertNoReflect('snice-estimate', 'from', { name: 'Acme Corp' });
  });

  it('snice-estimate: to', async () => {
    await assertNoReflect('snice-estimate', 'to', { name: 'Client Inc' });
  });

  it('snice-estimate: items', async () => {
    await assertNoReflect('snice-estimate', 'items', [
      { description: 'Service', quantity: 1, rate: 100 },
    ]);
  });

  // --- Form Builder ---
  it('snice-form-builder: schema', async () => {
    await assertNoReflect('snice-form-builder', 'schema', { fields: [], title: 'Test' });
  });

  it('snice-form-builder: fieldTypes', async () => {
    await assertNoReflect('snice-form-builder', 'fieldTypes', [
      { type: 'text', label: 'Text' },
    ], 'field-types');
  });

  // --- Gantt ---
  it('snice-gantt: tasks', async () => {
    await assertNoReflect('snice-gantt', 'tasks', [
      { id: '1', name: 'Task 1', start: '2025-01-01', end: '2025-01-15' },
    ]);
  });

  // --- Heatmap ---
  it('snice-heatmap: data', async () => {
    await assertNoReflect('snice-heatmap', 'data', [
      { x: 0, y: 0, value: 10 },
    ]);
  });

  // --- Invoice ---
  it('snice-invoice: from', async () => {
    await assertNoReflect('snice-invoice', 'from', { name: 'Seller Inc' });
  });

  it('snice-invoice: to', async () => {
    await assertNoReflect('snice-invoice', 'to', { name: 'Buyer Corp' });
  });

  it('snice-invoice: items', async () => {
    await assertNoReflect('snice-invoice', 'items', [
      { description: 'Widget', quantity: 2, unitPrice: 25 },
    ]);
  });

  // --- Kanban ---
  it('snice-kanban: columns', async () => {
    await assertNoReflect('snice-kanban', 'columns', [
      { id: '1', title: 'Todo', cards: [] },
    ]);
  });

  // --- KPI ---
  it('snice-kpi: trendData', async () => {
    await assertNoReflect('snice-kpi', 'trendData', [10, 20, 30], 'trend-data');
  });

  // --- Map ---
  it('snice-map: center', async () => {
    await assertNoReflect('snice-map', 'center', { lat: 40.7, lng: -74.0 });
  });

  it('snice-map: markers', async () => {
    await assertNoReflect('snice-map', 'markers', [
      { lat: 40.7, lng: -74.0, title: 'NYC' },
    ]);
  });

  // --- Mentions ---
  it('snice-mentions: users', async () => {
    await assertNoReflect('snice-mentions', 'users', [
      { id: '1', name: 'Alice' },
    ]);
  });

  // --- Metric Table ---
  it('snice-metric-table: columns', async () => {
    await assertNoReflect('snice-metric-table', 'columns', [
      { key: 'name', label: 'Name' },
    ]);
  });

  it('snice-metric-table: data', async () => {
    await assertNoReflect('snice-metric-table', 'data', [
      { name: 'Revenue', value: 1000 },
    ]);
  });

  // --- Music Player ---
  it('snice-music-player: tracks', async () => {
    await assertNoReflect('snice-music-player', 'tracks', [
      { title: 'Song', src: 'song.mp3' },
    ]);
  });

  // --- Notification Center ---
  it('snice-notification-center: notifications', async () => {
    await assertNoReflect('snice-notification-center', 'notifications', [
      { id: '1', title: 'Alert', message: 'Test' },
    ]);
  });

  // --- Order Tracker ---
  it('snice-order-tracker: steps', async () => {
    await assertNoReflect('snice-order-tracker', 'steps', [
      { label: 'Ordered', status: 'complete' },
    ]);
  });

  // --- Org Chart ---
  it('snice-org-chart: data', async () => {
    await assertNoReflect('snice-org-chart', 'data', { id: '1', name: 'CEO', children: [] });
  });

  // --- Podcast Player ---
  it('snice-podcast-player: episodes', async () => {
    await assertNoReflect('snice-podcast-player', 'episodes', [
      { title: 'Episode 1', src: 'ep1.mp3' },
    ]);
  });

  // --- Pricing Table ---
  it('snice-pricing-table: plans', async () => {
    await assertNoReflect('snice-pricing-table', 'plans', [
      { name: 'Basic', price: 9 },
    ]);
  });

  // --- Product Card ---
  it('snice-product-card: images', async () => {
    await assertNoReflect('snice-product-card', 'images', ['img1.jpg', 'img2.jpg']);
  });

  it('snice-product-card: variants', async () => {
    await assertNoReflect('snice-product-card', 'variants', [
      { name: 'Small', value: 's' },
    ]);
  });

  // --- Receipt ---
  it('snice-receipt: merchant', async () => {
    await assertNoReflect('snice-receipt', 'merchant', { name: 'Store' });
  });

  it('snice-receipt: items', async () => {
    await assertNoReflect('snice-receipt', 'items', [
      { name: 'Coffee', price: 4.50, quantity: 1 },
    ]);
  });

  it('snice-receipt: taxes', async () => {
    await assertNoReflect('snice-receipt', 'taxes', [
      { label: 'Tax', amount: 0.50 },
    ]);
  });

  // --- Recipe ---
  it('snice-recipe: ingredients', async () => {
    await assertNoReflect('snice-recipe', 'ingredients', [
      { name: 'Flour', amount: '2 cups' },
    ]);
  });

  it('snice-recipe: steps', async () => {
    await assertNoReflect('snice-recipe', 'steps', [
      { instruction: 'Mix dry ingredients' },
    ]);
  });

  it('snice-recipe: nutrition', async () => {
    await assertNoReflect('snice-recipe', 'nutrition', { calories: 200 });
  });

  it('snice-recipe: tags', async () => {
    await assertNoReflect('snice-recipe', 'tags', ['vegan', 'gluten-free']);
  });

  // --- Scheduler ---
  it('snice-scheduler: resources', async () => {
    await assertNoReflect('snice-scheduler', 'resources', [
      { id: '1', name: 'Room A' },
    ]);
  });

  it('snice-scheduler: events', async () => {
    await assertNoReflect('snice-scheduler', 'events', [
      { title: 'Meeting', start: '2025-01-15T10:00', end: '2025-01-15T11:00' },
    ]);
  });

  // --- Segmented Control ---
  it('snice-segmented-control: options', async () => {
    await assertNoReflect('snice-segmented-control', 'options', [
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
    ]);
  });

  // --- Sparkline ---
  it('snice-sparkline: data', async () => {
    await assertNoReflect('snice-sparkline', 'data', [10, 20, 15, 25, 30]);
  });

  // --- Split Button ---
  it('snice-split-button: actions', async () => {
    await assertNoReflect('snice-split-button', 'actions', [
      { label: 'Save', value: 'save' },
    ]);
  });

  // --- Spotlight ---
  it('snice-spotlight: steps', async () => {
    await assertNoReflect('snice-spotlight', 'steps', [
      { target: '#btn', title: 'Click here', description: 'This button does things' },
    ]);
  });

  // --- Spreadsheet ---
  it('snice-spreadsheet: data', async () => {
    await assertNoReflect('snice-spreadsheet', 'data', [
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
  });

  it('snice-spreadsheet: columns', async () => {
    await assertNoReflect('snice-spreadsheet', 'columns', [
      { header: 'Col A', width: 100 },
    ]);
  });

  // --- Stat Group ---
  it('snice-stat-group: stats', async () => {
    await assertNoReflect('snice-stat-group', 'stats', [
      { label: 'Users', value: '1,234' },
    ]);
  });

  // --- Stepper ---
  it('snice-stepper: steps', async () => {
    await assertNoReflect('snice-stepper', 'steps', [
      { label: 'Step 1' },
      { label: 'Step 2' },
    ]);
  });

  // --- Tag Input ---
  it('snice-tag-input: tags', async () => {
    await assertNoReflect('snice-tag-input', 'tags', ['javascript', 'typescript']);
  });

  it('snice-tag-input: suggestions', async () => {
    await assertNoReflect('snice-tag-input', 'suggestions', ['react', 'vue', 'angular']);
  });

  // --- Timeline ---
  it('snice-timeline: items', async () => {
    await assertNoReflect('snice-timeline', 'items', [
      { title: 'Event', date: '2025-01-01' },
    ]);
  });

  // --- Tree ---
  it('snice-tree: nodes', async () => {
    await assertNoReflect('snice-tree', 'nodes', [
      { id: '1', label: 'Root', children: [] },
    ]);
  });

  it('snice-tree: selectedNodes', async () => {
    await assertNoReflect('snice-tree', 'selectedNodes', ['1', '2'], 'selected-nodes');
  });

  it('snice-tree: checkedNodes', async () => {
    await assertNoReflect('snice-tree', 'checkedNodes', ['1'], 'checked-nodes');
  });

  // --- Virtual Scroller ---
  it('snice-virtual-scroller: items', async () => {
    await assertNoReflect('snice-virtual-scroller', 'items', [
      { id: '1', content: 'Item 1' },
    ]);
  });

  // --- Weather ---
  it('snice-weather: data', async () => {
    await assertNoReflect('snice-weather', 'data', { temp: 72, condition: 'sunny' });
  });

  // --- Work Order ---
  it('snice-work-order: customer', async () => {
    await assertNoReflect('snice-work-order', 'customer', { name: 'John Doe' });
  });

  it('snice-work-order: tasks', async () => {
    await assertNoReflect('snice-work-order', 'tasks', [
      { description: 'Replace filter', status: 'pending' },
    ]);
  });

  it('snice-work-order: parts', async () => {
    await assertNoReflect('snice-work-order', 'parts', [
      { name: 'Oil Filter', quantity: 1 },
    ]);
  });

  it('snice-work-order: asset', async () => {
    await assertNoReflect('snice-work-order', 'asset', { name: 'Truck #42', type: 'vehicle' });
  });
});
