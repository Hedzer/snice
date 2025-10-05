import { Router } from 'snice';

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'snice-layout',
  transition: {
    mode: 'simultaneous',
    outDuration: 200,
    inDuration: 200,
    out: 'opacity: 0;',
    in: 'opacity: 1;'
  }
});

export { page, initialize, navigate };