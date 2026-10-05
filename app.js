import { catalog } from './catalog/catalog.js';

const products = await catalog.listProducts();

const money = value => `${new Intl.NumberFormat('fr-FR').format(value)} FC`;
let cart = [];
let activeFilter = 'Tous';
let searchTerm = '';
const productGrid = document.querySelector('#productGrid');

function renderProducts() {
  const filtered = products.filter(p => (activeFilter === 'Tous' || p.tag === activeFilter || p.category === activeFilter) && `${p.name} ${p.shop}`.toLowerCase().includes(searchTerm));
  productGrid.innerHTML = filtered.length ? filtered.map(p => `<article class="product-card" data-id="${p.id}"><div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="product-badge">${p.tag}</span><button class="heart" aria-label="Ajouter ${p.name} aux favoris">♡</button><button class="quick-add">Ajouter au panier</button></div><div class="product-info"><small>${p.shop}</small><h3>${p.name}</h3><div class="price-row"><span class="price">${money(p.price)}</span><span class="rating">★★★★★ <i>4,8</i></span></div></div></article>`).join('') : '<p>Aucun produit ne correspond à votre recherche.</p>';
}

function openCart(open = true) { document.querySelector('.cart-drawer').classList.toggle('open', open); document.querySelector('.overlay').classList.toggle('open', open); document.querySelector('.cart-drawer').setAttribute('aria-hidden', String(!open)); }
function showToast(message) { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
function renderCart() {
  const wrap = document.querySelector('.cart-items');
  wrap.innerHTML = cart.length ? cart.map(p => `<div class="cart-item"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${money(p.price)}</small></div><button class="remove-item" data-id="${p.id}" aria-label="Retirer ${p.name}">×</button></div>`).join('') : '<div class="empty-cart"><span>🛍️</span><h3>Votre panier est vide</h3><p>Les pépites locales que vous aimez vous attendent.</p></div>';
  document.querySelector('.cart-count').textContent = cart.length;
  document.querySelector('.cart-total strong').textContent = money(cart.reduce((sum, p) => sum + p.price, 0));
}

productGrid.addEventListener('click', event => {
  const card = event.target.closest('.product-card'); if (!card) return;
  const product = products.find(p => p.id === Number(card.dataset.id));
  if (event.target.closest('.heart')) { event.target.closest('.heart').classList.toggle('active'); event.target.closest('.heart').textContent = event.target.closest('.heart').classList.contains('active') ? '♥' : '♡'; }
  if (event.target.closest('.quick-add')) { cart.push(product); renderCart(); showToast(`${product.name} ajouté au panier`); }
});
document.querySelector('.cart-items').addEventListener('click', event => { const remove = event.target.closest('.remove-item'); if (remove) { cart.splice(cart.findIndex(p => p.id === Number(remove.dataset.id)), 1); renderCart(); } });
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active')); button.classList.add('active'); activeFilter = button.dataset.tab; renderProducts(); }));
document.querySelectorAll('[data-filter]').forEach(link => link.addEventListener('click', () => { activeFilter = link.dataset.filter; renderProducts(); }));
document.querySelector('.search-toggle').addEventListener('click', () => { document.querySelector('.search-panel').classList.add('open'); document.querySelector('.search-panel').setAttribute('aria-hidden', 'false'); document.querySelector('#searchInput').focus(); });
document.querySelector('.search-close').addEventListener('click', () => document.querySelector('.search-panel').classList.remove('open'));
document.querySelector('#searchForm').addEventListener('submit', event => event.preventDefault());
document.querySelector('#searchInput').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); activeFilter = 'Tous'; renderProducts(); document.querySelector('#nouveautes').scrollIntoView({ behavior: 'smooth' }); });
document.querySelector('#cartButton').addEventListener('click', () => openCart());
document.querySelector('.cart-close').addEventListener('click', () => openCart(false)); document.querySelector('.overlay').addEventListener('click', () => openCart(false));
document.querySelector('.menu-toggle').addEventListener('click', event => { const nav = document.querySelector('.site-header nav'); nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(nav.classList.contains('open'))); });
document.querySelector('#newsletterForm').addEventListener('submit', event => { event.preventDefault(); showToast('Bienvenue chez YAVIYA ! Votre réduction arrive bientôt.'); event.target.reset(); });
document.querySelector('#countryButton').addEventListener('click', () => showToast('Le marché RDC est sélectionné'));
document.querySelector('#moreProducts').addEventListener('click', () => showToast('Vous avez vu toute la sélection du moment'));
renderProducts(); renderCart();
