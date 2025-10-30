import { Router } from 'snice';

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'snice-layout-sidebar',
});

export { page, initialize, navigate };
