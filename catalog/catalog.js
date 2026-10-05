import { products } from './products.js';

/**
 * A source supplies listProducts(): Product[] | Promise<Product[]>.
 * Product: { id: number, name, shop, price: number, tag, category, image }.
 * Sources own transport and mapping; the storefront owns filters and cart state.
 */
export function createCatalog(source) {
  return {
    async listProducts() {
      const items = await source.listProducts();
      // Keep UI/cart mutations separate from the source's data.
      return items.map(product => ({ ...product }));
    }
  };
}

const localSource = { listProducts: () => products };
export const catalog = createCatalog(localSource);
