import { controller, respond } from 'snice';
import type { Product } from '../types/store';
import { getAllProducts, getProductById, getProductsByCategory, searchProducts, getCategories } from '../services/products';

@controller('product-controller')
class ProductController {
  element!: HTMLElement;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @respond('fetch-products')
  handleFetchProducts(payload: { category?: string; search?: string }): Product[] {
    if (payload.search) return searchProducts(payload.search);
    if (payload.category) return getProductsByCategory(payload.category);
    return getAllProducts();
  }

  @respond('fetch-product')
  handleFetchProduct(payload: { id: string }): Product | undefined {
    return getProductById(payload.id);
  }

  @respond('fetch-categories')
  handleFetchCategories(): string[] {
    return getCategories();
  }
}

export { ProductController };
