import { Router } from '../../src/router';

const { page, initialize, navigate } = Router({ 
  target: '#app', 
  type: 'hash',
  layout: 'app-layout',
  transition: {
    mode: 'simultaneous',
    outDuration: 200,
    inDuration: 200,
    out: 'opacity: 0;',
    in: 'opacity: 1;'
  }
});

export { page, initialize, navigate };