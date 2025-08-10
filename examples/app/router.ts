import { Router } from '../../src/router';

const { page, initialize, navigate } = Router({ 
  target: '#app', 
  routing_type: 'hash' 
});

export { page, initialize, navigate };