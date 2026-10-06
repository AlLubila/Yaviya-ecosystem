import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { catalog, createCatalog } from '../catalog/catalog.js';

test('local catalogue retains eight products, order, prices and fields', async () => {
  const products = await catalog.listProducts();
  assert.deepEqual(products.map(p => p.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(products.map(p => p.price), [35000, 18500, 28000, 42000, 45000, 15000, 8500, 55000]);
  for (const product of products) {
    assert.deepEqual(Object.keys(product), ['id', 'name', 'shop', 'price', 'tag', 'category', 'image']);
  }
  products[0].price = 0;
  products.pop();
  assert.equal((await catalog.listProducts()).length, 8);
  assert.equal((await catalog.listProducts())[0].price, 35000);
});

test('an asynchronous source can replace local data; errors propagate', async () => {
  const item = { id: 10, name: 'API', shop: 'Shop', price: 1, tag: 'Nouveau', category: 'Mode', image: '/api.jpg' };
  const remote = createCatalog({ listProducts: async () => [item] });
  assert.deepEqual(await remote.listProducts(), [item]);
  assert.notEqual((await remote.listProducts())[0], item);
  const error = new Error('API unavailable');
  await assert.rejects(createCatalog({ listProducts: async () => { throw error; } }).listProducts(), error);
});

// Minimal DOM fixture: execute the actual storefront handlers, without dependencies.
function element(dataset = {}) {
  const classes = new Set();
  return {
    dataset, innerHTML: '', textContent: '', attributes: {}, handlers: {},
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); return force; }
    },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolled = true; },
    reset() { this.resetCalled = true; },
    fire(type, extra = {}) { this.handlers[type]({ target: this, currentTarget: this, preventDefault() {}, ...extra }); }
  };
}

async function storefront(source = catalog) {
  const nodes = new Map();
  const tabs = ['Tous', 'Nouveau', 'Populaire'].map(tab => element({ tab }));
  const filters = ['Mode', 'Beauté', 'Maison', 'Tech'].map(filter => element({ filter }));
  const get = selector => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  };
  const document = { querySelector: get, querySelectorAll: selector => selector === '[data-tab]' ? tabs : filters };
  const js = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  // Inject the real repository at the module boundary; keep await and all UI code intact.
  const code = js.replace("import { catalog } from './catalog/catalog.js';", '');
  await runInNewContext(`(async () => { ${code} })()`, { document, catalog: source, Intl, setTimeout() {} });
  const ids = () => [...get('#productGrid').innerHTML.matchAll(/data-id="(\d+)"/g)].map(m => Number(m[1]));
  const clickProduct = (id, action) => {
    const card = element({ id: String(id) });
    const button = element();
    get('#productGrid').fire('click', { target: { closest: selector => selector === '.product-card' ? card : selector === action ? button : null } });
    return button;
  };
  return { get, tabs, filters, ids, clickProduct };
}

test('search, tabs and categories retain their original combinations and reset rules', async () => {
  const { get, tabs, filters, ids } = await storefront();
  assert.deepEqual(ids(), [1, 2, 3, 4, 5, 6, 7, 8]);
  tabs[1].fire('click'); assert.deepEqual(ids(), [1, 3, 5, 7]);
  tabs[2].fire('click'); assert.deepEqual(ids(), [2, 4, 6, 8]);
  for (const [index, expected] of [[0, [1, 5]], [1, [2, 7]], [2, [3, 6]], [3, [4, 8]]]) {
    filters[index].fire('click'); assert.deepEqual(ids(), expected);
  }
  const search = get('#searchInput');
  search.fire('input', { target: { value: '  KIN TECH  ' } });
  assert.deepEqual(ids(), [4, 8]);
  filters[0].fire('click'); assert.deepEqual(ids(), []);
  search.fire('input', { target: { value: 'Sac' } }); assert.deepEqual(ids(), [1]);
  search.fire('input', { target: { value: 'absent' } });
  assert.equal(get('#productGrid').innerHTML, '<p>Aucun produit ne correspond à votre recherche.</p>');
  search.fire('input', { target: { value: '' } }); assert.equal(ids().length, 8);
});

test('cart keeps duplicate additions, one-at-a-time removal, totals and drawer behavior', async () => {
  const { get, clickProduct } = await storefront();
  const money = value => `${new Intl.NumberFormat('fr-FR').format(value)} FC`;
  assert.equal(get('.cart-count').textContent, 0);
  clickProduct(1, '.quick-add'); clickProduct(1, '.quick-add'); clickProduct(7, '.quick-add');
  assert.equal(get('.cart-count').textContent, 3);
  assert.equal(get('.cart-total strong').textContent, money(78500));
  assert.equal(get('.toast').textContent, 'Savon naturel au miel ajouté au panier');
  const remove = id => get('.cart-items').fire('click', { target: { closest: () => ({ dataset: { id: String(id) } }) } });
  remove(1); assert.equal(get('.cart-count').textContent, 2);
  assert.equal(get('.cart-total strong').textContent, money(43500));
  remove(1); remove(7); assert.equal(get('.cart-count').textContent, 0);
  assert.equal(get('.cart-total strong').textContent, money(0));
  assert.match(get('.cart-items').innerHTML, /Votre panier est vide/);
  get('#cartButton').fire('click'); assert.equal(get('.cart-drawer').attributes['aria-hidden'], 'false');
  get('.overlay').fire('click'); assert.equal(get('.cart-drawer').attributes['aria-hidden'], 'true');
  const heart = clickProduct(1, '.heart'); assert.equal(heart.textContent, '♥');
  assert.equal(heart.classList.contains('active'), true);
});

test('storefront loads a replacement asynchronous catalogue', async () => {
  const remote = createCatalog({ listProducts: async () => [{ id: 42, name: 'API Product', shop: 'API Shop', price: 100, tag: 'Nouveau', category: 'Mode', image: '/42.jpg' }] });
  const { ids, clickProduct, get } = await storefront(remote);
  assert.deepEqual(ids(), [42]);
  clickProduct(42, '.quick-add');
  assert.equal(get('.cart-count').textContent, 1);
  assert.equal(get('.cart-total strong').textContent, '100 FC');
});
