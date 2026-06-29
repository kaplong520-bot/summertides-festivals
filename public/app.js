/* ================================================================
   SUMMER TIDES FESTIVAL — App Logic (PayHero Real Payments)
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   CONFIG — Your PayHero Backend
   ---------------------------------------------------------------- */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ?
    'http://localhost:3000/api/payhero' :
    '/api';

/* ----------------------------------------------------------------
   DATA — Products / Tickets / Merchandise
   ---------------------------------------------------------------- */
const STORE = {
    name: 'SUMMER TIDES FESTIVAL',
    description: "Africa's #1 Beach Festival 🏝️\nOfficial store for Summer Tides Festival",
    phone: '+254 741492515',
    email: 'info@airbeatglobal.com',
    socials: {
        instagram: 'https://www.instagram.com/summertides.fest/',
        twitter: 'https://x.com/summertidesfest',
        youtube: 'https://www.youtube.com/@SUMMERTIDESFESTIVAL',
    },
    country: 'Kenya',
    currency: 'KES',
    currencySymbol: 'Sh',
};

const PRODUCTS = [{
        id: 1,
        category: 'events',
        type: 'event',
        name: 'Early Bird Ticket — Summer Tides Festival 2026',
        subtitle: 'General Access · Limited Availability',
        price: 2500,
        image: 'images/ticket_early_bird.png',
        description: 'Secure your spot at Africa\'s #1 Beach Festival at the best price.',
        variants: ['Single Entry'],
        badge: 'Early Bird',
        available: true,
        date: 'December 27, 2026',
        location: 'Mombasa, Kenya',
    },
    {
        id: 2,
        category: 'events',
        type: 'event',
        name: 'General Admission — Summer Tides Festival 2026',
        subtitle: 'General Access · Beach Festival',
        price: 3500,
        image: 'images/ticket_regular.png',
        description: 'Join Africa\'s #1 Beach Festival with General Admission access.',
        variants: ['Single Entry'],
        badge: 'General',
        available: true,
        date: 'December 27, 2026',
        location: 'Mombasa, Kenya',
    },
    {
        id: 3,
        category: 'events',
        type: 'event',
        name: 'VIP Ticket — Summer Tides Festival 2026',
        subtitle: 'VIP Access · Exclusive Lounge',
        price: 7500,
        image: 'images/ticket_vip.png',
        description: 'Experience Summer Tides Festival like never before with VIP access.',
        variants: ['Single Entry'],
        badge: 'VIP',
        available: true,
        date: 'December 27, 2026',
        location: 'Mombasa, Kenya',
    },
    {
        id: 4,
        category: 'merchandise',
        type: 'merch',
        name: 'Summer Tides Festival T-Shirt 2026',
        subtitle: 'Official Festival Merch',
        price: 1800,
        image: 'images/merch_tshirt.png',
        description: 'Rock the official Summer Tides Festival 2026 limited-edition t-shirt.',
        variants: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        badge: 'Merch',
        available: true,
    },
];

/* ----------------------------------------------------------------
   STATE
   ---------------------------------------------------------------- */
const state = {
    cart: [],
    activeCategory: 'all',
    searchOpen: false,
    cartOpen: false,
    productModalOpen: false,
    checkoutOpen: false,
    termsOpen: false,
    selectedProduct: null,
    selectedVariant: null,
    modalQty: 1,
    checkoutStep: 1,
    paymentMethod: 'mpesa',
    checkoutComplete: false,
    checkoutDetails: {},
    hasUserReachedFinalStep: false,
    paymentAttempted: false,
};

/* ----------------------------------------------------------------
   DOM HELPERS
   ---------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const el = (tag, cls = '', html = '') => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
};

/* ----------------------------------------------------------------
   PROGRESS BAR
   ---------------------------------------------------------------- */
function setProgress(pct) {
    const bar = $('#progress-bar');
    if (!bar) return;
    bar.style.width = pct + '%';
    if (pct >= 100) setTimeout(() => { bar.style.width = '0%'; }, 400);
}

/* ----------------------------------------------------------------
   TOAST NOTIFICATIONS
   ---------------------------------------------------------------- */
function toast(message, type = 'info', duration = 3000) {
    const container = $('#toast-container');
    const icons = {
        success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>`,
        info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>`,
    };
    const t = el('div', `toast ${type}`, `${icons[type] || icons.info}<span>${message}</span>`);
    container.appendChild(t);
    setTimeout(() => {
        t.classList.add('removing');
        setTimeout(() => t.remove(), 350);
    }, duration);
}

/* ----------------------------------------------------------------
   CART MANAGEMENT
   ---------------------------------------------------------------- */
function addToCart(product, variant = null, qty = 1) {
    const key = product.id + (variant ? '_' + variant : '');
    const existing = state.cart.find(i => i.key === key);
    if (existing) {
        existing.qty += qty;
    } else {
        state.cart.push({ key, product, variant, qty });
    }
    updateCartBadge();
    renderCartItems();
    toast(`${product.name.split('—')[0].trim()} added to cart`, 'success');
}

function removeFromCart(key) {
    state.cart = state.cart.filter(i => i.key !== key);
    updateCartBadge();
    renderCartItems();
}

function updateQty(key, delta) {
    const item = state.cart.find(i => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    updateCartBadge();
    renderCartItems();
}

function getCartTotal() {
    return state.cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
}

function getCartCount() {
    return state.cart.reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
    const badge = $('#cart-badge');
    const count = getCartCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
}

function renderCartItems() {
    const body = $('#cart-body');
    if (!body) return;
    if (state.cart.length === 0) {
        body.innerHTML = `
      <div class="cart-empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
        <h3>Your cart is empty</h3>
        <p>Add tickets or merchandise to get started</p>
      </div>`;
        renderCartFooter();
        return;
    }

    body.innerHTML = state.cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}" onerror="this.src='https://placehold.co/70x70/e2e8f0/94a3b8?text=IMG'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product.name.split('—')[0].trim()}</div>
        ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
        <div class="cart-item-price">${STORE.currencySymbol} ${(item.product.price * item.qty).toLocaleString()}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty('${item.key}', -1)">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.key}', 1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.key}')">Remove</button>
      </div>
    </div>`).join('');

    renderCartFooter();
}

function renderCartFooter() {
    const footer = $('#cart-footer');
    if (!footer) return;
    const total = getCartTotal();
    const hasItems = state.cart.length > 0;
    footer.innerHTML = `
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${STORE.currencySymbol} ${total.toLocaleString()}</span>
      </div>
      <div class="cart-summary-row">
        <span>VAT (16%)</span>
        <span>${STORE.currencySymbol} ${Math.round(total * 0.16).toLocaleString()}</span>
      </div>
      <div class="cart-summary-row total">
        <span>Total</span>
        <span>${STORE.currencySymbol} ${Math.round(total * 1.16).toLocaleString()}</span>
      </div>
    </div>
    <button class="btn btn-primary btn-lg btn-full" ${!hasItems ? 'disabled' : ''} onclick="openCheckout()">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
      Proceed to Checkout
    </button>`;
}

/* ----------------------------------------------------------------
   OPEN / CLOSE MODALS
   ---------------------------------------------------------------- */
function openSearch() {
    state.searchOpen = true;
    $('#search-overlay').classList.add('open');
    setTimeout(() => $('#search-input').focus(), 100);
}

function closeSearch() {
    state.searchOpen = false;
    $('#search-overlay').classList.remove('open');
    $('#search-input').value = '';
    renderSearchResults('');
}

function openCart() {
    state.cartOpen = true;
    $('#cart-drawer').classList.add('open');
    $('#drawer-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    state.cartOpen = false;
    $('#cart-drawer').classList.remove('open');
    $('#drawer-backdrop').classList.remove('open');
    document.body.style.overflow = '';
}

function openProductModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    state.selectedProduct = product;
    state.selectedVariant = product.variants[0] || null;
    state.modalQty = 1;
    renderProductModal(product);
    state.productModalOpen = true;
    $('#product-modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    state.productModalOpen = false;
    $('#product-modal-overlay').classList.remove('open');
    if (!state.cartOpen && !state.checkoutOpen) document.body.style.overflow = '';
}

function openCheckout() {
    closeCart();
    if (state.cart.length === 0) { toast('Your cart is empty', 'error'); return; }
    state.checkoutStep = 1;
    state.checkoutComplete = false;
    state.paymentMethod = 'mpesa';
    state.paymentAttempted = false;
    renderCheckoutModal();
    state.checkoutOpen = true;
    $('#checkout-modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    state.checkoutOpen = false;
    $('#checkout-modal-overlay').classList.remove('open');
    document.body.style.overflow = '';

    document.querySelectorAll('.checkout-step-content').forEach(el => el.style.display = 'none');
    const step1 = document.getElementById('checkout-step-1');
    const step2 = document.getElementById('checkout-step-2');
    const step3 = document.getElementById('checkout-step-3');
    const step4 = document.getElementById('checkout-step-4');
    const step5 = document.getElementById('checkout-step-5');
    const step6 = document.getElementById('checkout-step-6');
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    if (step4) step4.style.display = 'none';
    if (step5) step5.style.display = 'none';
    if (step6) step6.style.display = 'none';
}

function openTerms() {
    $('#terms-modal-overlay').classList.add('open');
    state.termsOpen = true;
}

function closeTerms() {
    $('#terms-modal-overlay').classList.remove('open');
    state.termsOpen = false;
}

/* ----------------------------------------------------------------
   PRODUCT MODAL RENDER
   ---------------------------------------------------------------- */
function renderProductModal(product) {
    const overlay = $('#product-modal-overlay');
    overlay.innerHTML = `
    <div class="product-modal">
      <div class="product-modal-inner">
        <div class="product-modal-img-wrapper">
          <img class="product-modal-img" src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/400x400/e2e8f0/94a3b8?text=IMG'">
          <button class="product-modal-close" onclick="closeProductModal()">✕</button>
        </div>
        <div class="product-modal-content">
          <span class="product-modal-badge ${product.type}">${product.badge}</span>
          <h2 class="product-modal-title">${product.name}</h2>
          ${product.date ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:-8px">📅 ${product.date} · 📍 ${product.location}</p>` : ''}
          <div class="product-modal-price">
            <span>${STORE.currencySymbol}</span> ${product.price.toLocaleString()}
          </div>
          <div class="product-modal-divider"></div>
          <p class="product-modal-desc">${product.description}</p>
          ${product.variants.length > 1 ? `
            <div>
              <p class="variant-label">Select ${product.type === 'event' ? 'Ticket Type' : 'Size'}</p>
              <div class="variant-options" id="variant-options">
                ${product.variants.map(v => `
                  <button class="variant-option ${v === state.selectedVariant ? 'selected' : ''}"
                    onclick="selectVariant('${v}')">${v}</button>`).join('')}
              </div>
            </div>` : ''}
          <div class="qty-row">
            <label>Qty</label>
            <div class="qty-stepper">
              <button class="qty-step-btn" onclick="adjustModalQty(-1)">−</button>
              <span class="qty-step-display" id="modal-qty-display">1</span>
              <button class="qty-step-btn" onclick="adjustModalQty(1)">+</button>
            </div>
          </div>
          <button class="btn btn-primary btn-lg btn-full" onclick="addCurrentToCart()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
            Add to Cart · ${STORE.currencySymbol} ${(product.price * state.modalQty).toLocaleString()}
          </button>
        </div>
      </div>
    </div>`;
}

function selectVariant(v) {
    state.selectedVariant = v;
    $$('.variant-option').forEach(btn => btn.classList.toggle('selected', btn.textContent === v));
}

function adjustModalQty(delta) {
    state.modalQty = Math.max(1, state.modalQty + delta);
    const display = $('#modal-qty-display');
    if (display) display.textContent = state.modalQty;
    const btn = document.querySelector('.product-modal-content .btn-primary');
    if (btn && state.selectedProduct) {
        const total = (state.selectedProduct.price * state.modalQty).toLocaleString();
        btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
      Add to Cart · ${STORE.currencySymbol} ${total}`;
    }
}

function addCurrentToCart() {
    if (!state.selectedProduct) return;
    if (state.selectedProduct.variants.length > 1 && !state.selectedVariant) {
        toast('Please select a size/type', 'error');
        return;
    }
    addToCart(state.selectedProduct, state.selectedVariant, state.modalQty);
    closeProductModal();
    openCart();
}

/* ----------------------------------------------------------------
   SEARCH
   ---------------------------------------------------------------- */
function renderSearchResults(query) {
    const container = $('#search-results');
    if (!container) return;
    const q = query.trim().toLowerCase();
    if (!q) {
        container.innerHTML = `<div class="search-empty">Start typing to search for events or products…</div>`;
        return;
    }
    const results = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
    if (results.length === 0) {
        container.innerHTML = `<div class="search-empty">No results found for "<strong>${query}</strong>"</div>`;
        return;
    }
    container.innerHTML = results.map(p => `
    <div class="search-result-item" onclick="closeSearch(); openProductModal(${p.id})">
      <img class="search-result-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/48x48/e2e8f0/94a3b8?text=IMG'">
      <div class="search-result-info">
        <div class="search-result-name">${p.name}</div>
        <div class="search-result-price">${STORE.currencySymbol} ${p.price.toLocaleString()}</div>
      </div>
    </div>`).join('');
}

/* ----------------------------------------------------------------
   PRODUCTS GRID
   ---------------------------------------------------------------- */
function renderSkeletons() {
    const grid = $('#products-grid');
    if (!grid) return;
    grid.innerHTML = Array(4).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line price"></div>
      </div>
    </div>`).join('');
}

function renderProducts(category = 'all') {
    const grid = $('#products-grid');
    if (!grid) return;
    const filtered = category === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>
        <h3>No items found</h3>
        <p>Try a different category</p>
      </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
    <div class="product-card slide-up" onclick="openProductModal(${p.id})" id="product-${p.id}">
      <div class="product-card-img-wrapper">
        <img class="product-card-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x400/e2e8f0/94a3b8?text=IMG'">
        ${p.badge ? `<span class="product-badge ${p.type}">${p.badge}</span>` : ''}
        ${!p.available ? `<span class="product-badge sold-out">Sold Out</span>` : ''}
        <button class="quick-add-btn" onclick="event.stopPropagation(); quickAdd(${p.id})" title="Quick add">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        </button>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-sub">${p.subtitle}</div>
        <div class="product-card-price">
          <span class="currency">${STORE.currencySymbol}</span>${p.price.toLocaleString()}
        </div>
      </div>
    </div>`).join('');
}

function quickAdd(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    if (product.variants.length > 1) {
        openProductModal(productId);
        return;
    }
    addToCart(product, product.variants[0] || null, 1);
}

/* ----------------------------------------------------------------
   TABS
   ---------------------------------------------------------------- */
function setActiveCategory(category) {
    state.activeCategory = category;
    $$('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    renderSkeletons();
    setTimeout(() => renderProducts(category), 300);
}

/* ----------------------------------------------------------------
   CHECKOUT FLOW
   ---------------------------------------------------------------- */

function renderCheckoutModal() {
    const body = $('#checkout-body');
    if (!body) return;

    const total = getCartTotal();
    const vat = Math.round(total * 0.16);
    const grandTotal = total + vat;

    body.innerHTML = `
    <div class="checkout-steps">
      <div class="checkout-step-indicator">
        <div class="step-num ${state.checkoutStep >= 1 ? 'active' : ''}">1</div>
        <span class="step-label">Details</span>
      </div>
      <div class="step-connector ${state.checkoutStep > 1 ? 'done' : ''}"></div>
      <div class="checkout-step-indicator">
        <div class="step-num ${state.checkoutStep >= 2 ? 'active' : ''}">2</div>
        <span class="step-label">Payment</span>
      </div>
    </div>

    <div id="checkout-step-1" class="checkout-step-content" style="display:${state.checkoutStep === 1 ? 'block' : 'none'}">
      ${renderStep1(grandTotal)}
    </div>

    <div id="checkout-step-2" class="checkout-step-content" style="display:${state.checkoutStep === 2 ? 'block' : 'none'}">
      ${renderStep2(grandTotal)}
    </div>

    <div id="checkout-step-3" class="checkout-step-content" style="display:none">
      ${renderStep3(grandTotal)}
    </div>

    <div id="checkout-step-4" class="checkout-step-content" style="display:none">
      ${renderStep4()}
    </div>

    <div id="checkout-step-5" class="checkout-step-content" style="display:none">
      ${renderStep5()}
    </div>

    <div id="checkout-step-6" class="checkout-step-content" style="display:none">
      ${renderStep6()}
    </div>
  `;
}

function renderStep1(grandTotal) {
    return `
    <div class="checkout-order-summary">
      <h3>Order Summary</h3>
      ${state.cart.map(i => `
        <div class="co-item">
          <span>${i.product.name.split('—')[0].trim()} ${i.variant ? `(${i.variant})` : ''} ×${i.qty}</span>
          <span>${STORE.currencySymbol} ${(i.product.price * i.qty).toLocaleString()}</span>
        </div>`).join('')}
      <div class="co-item total">
        <span>Total</span>
        <span>${STORE.currencySymbol} ${grandTotal.toLocaleString()}</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="co-name">Full Name <span class="required">*</span></label>
      <input class="form-input" type="text" id="co-name" placeholder="John Doe" autocomplete="name" value="${state.checkoutDetails?.name || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="co-email">Email <span class="required">*</span></label>
        <input class="form-input" type="email" id="co-email" placeholder="you@email.com" autocomplete="email" value="${state.checkoutDetails?.email || ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="co-phone">Phone <span class="required">*</span></label>
        <input class="form-input" type="tel" id="co-phone" placeholder="0712345678" autocomplete="tel" value="${state.checkoutDetails?.phone || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="co-dob">Date of Birth <span class="required">*</span></label>
      <input class="form-input" type="date" id="co-dob" max="${getMaxDob()}" value="${state.checkoutDetails?.dob || ''}">
      <div class="form-error" id="dob-error" style="display:none">You must be 18+ to attend this event</div>
    </div>
    <div class="terms-row">
      <input type="checkbox" id="terms-check" ${state.checkoutDetails?.terms ? 'checked' : ''}>
      <label class="terms-text" for="terms-check">
        I agree to the <a href="#" onclick="event.preventDefault(); openTerms()">Terms & Conditions</a>. All sales are final.
      </label>
    </div>
    <button class="btn btn-primary btn-lg btn-full" onclick="proceedCheckoutStep1()">
      Continue to Payment
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
    </button>`;
}

function renderStep2(grandTotal) {
    const phone = state.checkoutDetails?.phone || '';
    return `
    <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:20px">Payment Method</p>
    <div class="payment-options">
      <div class="payment-option selected">
        <div style="width:48px;height:32px;background:#4caf50;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="color:white;font-size:0.7rem;font-weight:900">M-PESA</span>
        </div>
        <div class="payment-option-info">
          <div class="payment-option-name">M-Pesa</div>
          <div class="payment-option-desc">Pay via mobile money</div>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="mpesa-phone">M-Pesa Number <span class="required">*</span></label>
      <input class="form-input" type="tel" id="mpesa-phone" placeholder="0700 000 000" value="${phone}">
    </div>
    <div id="mpesa-info-box" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:0.8rem;color:#15803d">
      <strong>How it works:</strong> You will receive an M-Pesa push notification via PayHero on your phone to confirm payment of <strong>${STORE.currencySymbol} ${grandTotal.toLocaleString()}</strong>.
    </div>
    <div id="mpesa-error" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:0.8rem;color:#b91c1c;font-weight:600"></div>
    <div id="mpesa-status" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:0.8rem;color:#15803d"></div>
    <div class="co-item total" style="margin-bottom:16px">
      <span>Amount to Pay</span>
      <span style="color:var(--primary)">${STORE.currencySymbol} ${grandTotal.toLocaleString()}</span>
    </div>
    <button class="btn btn-primary btn-lg btn-full" onclick="submitPayment()" id="pay-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
      Pay ${STORE.currencySymbol} ${grandTotal.toLocaleString()}
    </button>
    <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="state.checkoutStep=1;renderCheckoutModal()">← Back</button>`;
}

function renderStep3(grandTotal) {
    return `
    <div style="text-align:center;padding:16px 0">
      <div style="width:48px;height:48px;border:4px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>
      <h3 style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:8px">M-Pesa STK Push Sent via PayHero</h3>
      <p style="font-size:0.8rem;color:var(--text-muted)">A payment request of <strong>${STORE.currencySymbol} ${grandTotal.toLocaleString()}</strong> has been sent to your phone. Please check M-Pesa and enter your PIN.</p>
    </div>
    <button class="btn btn-primary btn-lg btn-full" onclick="showPaymentStatusChoices()" style="margin-top:8px" id="authorize-btn">
      I HAVE ENTERED PIN — CHECK STATUS
    </button>`;
}

function renderStep4() {
    return `
    <div style="text-align:center;padding:16px 0">
      <div style="width:56px;height:56px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#15803d"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h3 style="font-size:0.9rem;font-weight:700;color:var(--text);margin-bottom:8px">Payment Verification</h3>
      <p style="font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-bottom:16px">Please confirm if you have completed the M-Pesa transaction on your phone.</p>
    </div>
    <button class="btn btn-primary btn-lg btn-full" onclick="finalHiddenTrigger('paid')" style="font-size:0.7rem;padding:14px">
      I HAVE PAID — ACCESS MY TICKETS
    </button>
    <button class="btn btn-lg btn-full" onclick="finalHiddenTrigger('unpaid')" style="margin-top:8px;background:#1e293b;color:white;font-weight:700;border-radius:12px;padding:14px">
      I HAVE NOT PAID
    </button>`;
}

function renderStep5() {
    return `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;text-align:center;margin-bottom:12px">
      <strong style="display:block;color:#b91c1c;font-size:0.85rem;margin-bottom:4px">⚠️ Payment Not Received</strong>
      <p style="font-size:0.75rem;color:#7f1d1d">A new STK push has been sent via PayHero. Please check your phone and complete the M-Pesa transaction.</p>
    </div>
    <button class="btn btn-primary btn-lg btn-full" onclick="showPaymentStatusChoices()" style="font-size:0.7rem">
      I HAVE PAID — CHECK AGAIN
    </button>
    <button class="btn btn-lg btn-full" onclick="closeCheckout()" style="margin-top:8px;background:#1e293b;color:white;font-weight:700;border-radius:12px;padding:14px">
      CANCEL ORDER
    </button>`;
}

function renderStep6() {
    return `
    <div class="success-overlay">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
      </div>
      <h3 class="success-title">Order Confirmed! 🎉</h3>
      <p class="success-subtitle">Your tickets have been booked. Check your email for confirmation and ticket details. See you at Summer Tides Festival!</p>
      <div style="text-align:center">
        <button class="btn btn-primary btn-lg" onclick="closeCheckout(); state.cart = []; updateCartBadge(); renderCartItems();">
          Done
        </button>
      </div>
    </div>`;
}

function getMaxDob() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
}

function proceedCheckoutStep1() {
    const name = $('#co-name')?.value.trim();
    const email = $('#co-email')?.value.trim();
    const phone = $('#co-phone')?.value.trim();
    const dob = $('#co-dob')?.value;
    const terms = $('#terms-check')?.checked;

    if (!name) { toast('Please enter your full name', 'error'); $('#co-name')?.focus(); return; }
    if (!email || !email.includes('@')) { toast('Please enter a valid email', 'error'); $('#co-email')?.focus(); return; }
    if (!phone) { toast('Please enter your phone number', 'error'); $('#co-phone')?.focus(); return; }
    if (!dob) { toast('Please enter your date of birth', 'error'); $('#co-dob')?.focus(); return; }

    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
        $('#dob-error').style.display = 'block';
        toast('You must be 18+ to attend this event', 'error');
        return;
    }
    $('#dob-error') && ($('#dob-error').style.display = 'none');

    if (!terms) { toast('Please accept the Terms & Conditions', 'error'); return; }

    state.checkoutDetails = { ...state.checkoutDetails, name, email, phone, dob, terms };
    state.checkoutStep = 2;
    renderCheckoutModal();
}

/* ================================================================
   PAYHERO STK PUSH — Calls your Express backend
   ================================================================ */

async function callPayHeroSTK(phone_number, amount) {
    try {
        const response = await fetch(`${API_BASE_URL}/stk-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number, amount: Math.round(amount) }),
        });

        const rawText = await response.text();
        console.log('🔍 PayHero raw response:', rawText.substring(0, 200));

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            throw new Error(`Server returned HTML, not JSON. Starts with: "${rawText.substring(0, 100)}"`);
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'PayHero request failed');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('❌ PayHero call failed:', error);
        return { success: false, error: error.message };
    }
}

function submitPayment() {
    const mpesaPhone = document.getElementById('mpesa-phone')?.value?.trim();
    const errorDiv = document.getElementById('mpesa-error');
    const statusDiv = document.getElementById('mpesa-status');
    const payBtn = document.getElementById('pay-button');

    if (state.paymentAttempted) {
        toast('Payment already in progress. Please wait.', 'info');
        return;
    }

    if (!mpesaPhone) {
        if (errorDiv) {
            errorDiv.textContent = 'M-Pesa number is required';
            errorDiv.style.display = 'block';
        }
        return;
    }

    let cleanPhone = mpesaPhone.replace(/\s/g, '');
    if (!/^(\+?254|0)[17][0-9]{8}$/.test(cleanPhone)) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter a valid Kenyan phone number (e.g. 0712345678)';
            errorDiv.style.display = 'block';
        }
        return;
    }

    state.paymentAttempted = true;
    if (payBtn) payBtn.disabled = true;

    if (errorDiv) errorDiv.style.display = 'none';
    if (statusDiv) {
        statusDiv.innerHTML = `<strong>🔄 Sending STK push via PayHero...</strong> Please wait.`;
        statusDiv.style.display = 'block';
    }

    const total = getCartTotal();
    const vat = Math.round(total * 0.16);
    const grandTotal = total + vat;

    let payheroPhone = cleanPhone.replace(/^0/, '254');
    if (!payheroPhone.startsWith('254')) payheroPhone = '254' + payheroPhone;

    document.getElementById('checkout-step-2').style.display = 'none';
    document.getElementById('checkout-step-3').style.display = 'block';
    state.checkoutStep = 3;

    callPayHeroSTK(payheroPhone, grandTotal)
        .then(result => {
            if (result.success) {
                if (statusDiv) {
                    statusDiv.innerHTML = `<strong>✅ STK Push sent via PayHero!</strong> Check phone ending in <strong>${payheroPhone.slice(-4)}</strong> and enter your M-Pesa PIN.`;
                    statusDiv.style.display = 'block';
                }
                toast('M-Pesa STK Push sent! Check your phone.', 'info');
            } else {
                throw new Error(result.error);
            }
        })
        .catch(err => {
            toast('PayHero Error: ' + err.message, 'error');
            state.paymentAttempted = false;
            if (payBtn) payBtn.disabled = false;

            if (statusDiv) {
                statusDiv.innerHTML = `<strong>❌ PayHero Error:</strong> ${err.message}`;
                statusDiv.style.display = 'block';
            }

            document.getElementById('checkout-step-3').style.display = 'none';
            document.getElementById('checkout-step-2').style.display = 'block';
            state.checkoutStep = 2;
        });
}

function showPaymentStatusChoices() {
    state.paymentAttempted = false;

    const mpesaPhone = document.getElementById('mpesa-phone')?.value?.trim();
    const total = getCartTotal();
    const vat = Math.round(total * 0.16);
    const grandTotal = total + vat;

    let payheroPhone = mpesaPhone.replace(/\s/g, '').replace(/^0/, '254');
    if (!payheroPhone.startsWith('254')) payheroPhone = '254' + payheroPhone;

    callPayHeroSTK(payheroPhone, grandTotal);

    document.getElementById('checkout-step-3').style.display = 'none';
    document.getElementById('checkout-step-4').style.display = 'block';
    state.checkoutStep = 4;
}

function finalHiddenTrigger(status) {
    if (status === 'paid') {
        document.getElementById('checkout-step-4').style.display = 'none';
        document.getElementById('checkout-step-6').style.display = 'block';
        state.checkoutStep = 6;
        state.checkoutComplete = true;
        state.hasUserReachedFinalStep = true;
        state.cart = [];
        updateCartBadge();
        renderCartItems();
        toast('Payment confirmed! Your tickets are ready. 🎉', 'success');
    } else {
        document.getElementById('checkout-step-4').style.display = 'none';
        document.getElementById('checkout-step-5').style.display = 'block';
        state.checkoutStep = 5;
    }
}

/* ----------------------------------------------------------------
   FOOTER CATEGORIES
   ---------------------------------------------------------------- */
function renderFooterCategories() {
    const container = $('#footer-categories');
    if (!container) return;
    const cats = [...new Set(PRODUCTS.map(p => p.type === 'event' ? 'Events & Tickets' : 'Merchandise'))];
    container.innerHTML = cats.map(c => `<li><a href="#" onclick="event.preventDefault(); setActiveCategory('${c === 'Events & Tickets' ? 'events' : 'merchandise'}'); document.getElementById('tabs-section').scrollIntoView({behavior:'smooth'})">${c}</a></li>`).join('');
}

/* ----------------------------------------------------------------
   KEYBOARD & ESCAPE HANDLERS
   ---------------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (state.termsOpen) { closeTerms(); return; }
        if (state.checkoutOpen) { closeCheckout(); return; }
        if (state.productModalOpen) { closeProductModal(); return; }
        if (state.cartOpen) { closeCart(); return; }
        if (state.searchOpen) { closeSearch(); return; }
    }
    if (e.key === '/' && !state.searchOpen && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openSearch();
    }
});

/* ----------------------------------------------------------------
   SEARCH INPUT
   ---------------------------------------------------------------- */
document.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') {
        renderSearchResults(e.target.value);
    }
});

/* ----------------------------------------------------------------
   INTERSECTION OBSERVER
   ---------------------------------------------------------------- */
function observeCards() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s, box-shadow 0.22s, border-color 0.22s`;
        observer.observe(card);
    });
}

/* ----------------------------------------------------------------
   INITIALISE
   ---------------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
    setProgress(40);

    renderSkeletons();
    setTimeout(() => {
        renderProducts('all');
        setTimeout(observeCards, 100);
        setProgress(100);
    }, 500);

    renderCartItems();
    renderCartFooter();
    renderFooterCategories();

    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveCategory(btn.dataset.category));
    });

    $('#search-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSearch();
    });

    $('#drawer-backdrop')?.addEventListener('click', closeCart);

    $('#checkout-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeCheckout();
    });

    $('#terms-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeTerms();
    });

    $('#product-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeProductModal();
    });
});