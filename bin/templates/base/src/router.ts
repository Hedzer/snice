import { Router } from 'snice';

const { page, initialize, navigate } = Router({ 
  target: '#app', 
  routing_type: 'hash',
  transition: {
    mode: 'simultaneous',
    outDuration: 200,
    inDuration: 200,
    out: 'opacity: 0; transform: translateX(-10px);',
    in: 'opacity: 1; transform: translateX(0);'
  }
});

export { page, initialize, navigate };