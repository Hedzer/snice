import { Router } from 'snice';
import { fetcher } from './fetcher';
import { appContext } from './context';

const { page, initialize, navigate } = Router({
  target: '#app',
  type: 'hash',
  layout: 'snice-layout',
  fetcher,
  context: appContext
});

export { page, initialize, navigate };
