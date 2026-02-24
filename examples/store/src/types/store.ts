import type { AppContext as SniceAppContext } from 'snice';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface StoreAppContext extends SniceAppContext {
  user: User | null;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}
