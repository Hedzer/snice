import { Router } from 'snice';
import { fetcher } from './fetcher';
import { getStoredUser } from './services/auth';
import { loadCart, getCartTotal, getCartCount } from './services/cart';
import type { StoreAppContext } from './types/store';

const cart = loadCart();

const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',
  layout: 'store-layout',
  fetcher,
  context: {
    user: getStoredUser(),
    cart,
    cartTotal: getCartTotal(cart),
    cartCount: getCartCount(cart),
  } as StoreAppContext,
});

export { page, navigate, initialize };
export type { StoreAppContext };
