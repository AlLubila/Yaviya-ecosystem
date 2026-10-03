const products = [
  { id: 1, name: 'Sac artisanal Mobali', shop: 'Atelier Kivu', price: 35000, tag: 'Nouveau', category: 'Mode', image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?auto=format&fit=crop&q=80&w=800' },
  { id: 2, name: 'Huile de beauté Ngai', shop: 'Moyo Botanics', price: 18500, tag: 'Populaire', category: 'Beauté', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800' },
  { id: 3, name: 'Panier tressé Lukaya', shop: 'Mains de Kin', price: 28000, tag: 'Nouveau', category: 'Maison', image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=800' },
  { id: 4, name: 'Écouteurs sans fil K01', shop: 'Kin Tech', price: 42000, tag: 'Populaire', category: 'Tech', image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&q=80&w=800' },
  { id: 5, name: 'Chemise imprimée Sango', shop: 'Kongo Studio', price: 45000, tag: 'Nouveau', category: 'Mode', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=800' },
  { id: 6, name: 'Bougie parfumée Bonobo', shop: 'Maison Lelo', price: 15000, tag: 'Populaire', category: 'Maison', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800' },
  { id: 7, name: 'Savon naturel au miel', shop: 'Kivu Nature', price: 8500, tag: 'Nouveau', category: 'Beauté', image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=800' },
  { id: 8, name: 'Enceinte nomade Mini', shop: 'Kin Tech', price: 55000, tag: 'Populaire', category: 'Tech', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800' }
];

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
