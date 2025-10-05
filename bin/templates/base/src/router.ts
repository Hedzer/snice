import { Router } from 'snice';

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'snice-layout',
});

export { page, initialize, navigate };